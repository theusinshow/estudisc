import type { XpSummary } from "@/db/repositories/xp-repository";
import { answeredQuestions, studyDayKey } from "@/features/progress/study-days";
import type { DueReview } from "@/db/repositories/review-repository";
import type { MistakeRecord } from "@/db/repositories/mistake-repository";
import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";
import type { GamificationPersistenceState } from "@/db/repositories/gamification-repository";
import { isIndependentQuestionSuccess, QUESTION_SUCCESS_REASON } from "./study-rewards";

export type RankSummary = Readonly<{
  label: string;
  currentXp: number;
  startsAt: number;
  nextRankAt: number | null;
  nextLabel: string | null;
  explanation: string;
}>;

export type BadgeSummary = Readonly<{
  id: string;
  label: string;
  criteria: string;
  earned: boolean;
  awardedAt: Date | null;
  current: number;
  target: number;
  unit: string;
  href: string;
  category: "practice" | "memory" | "rhythm" | "comeback" | "legacy";
}>;

export type MissionSummary = Readonly<{
  id: string;
  label: string;
  criteria: string;
  status: "available" | "complete";
  href: string;
  current: number;
  target: number;
  unit: string;
  completedAt: Date | null;
  persistedAt: Date | null;
}>;

export type StudyWeek = Readonly<{
  startsOn: string;
  activeDays: number;
  targetDays: number;
  days: ReadonlyArray<Readonly<{ date: string; label: string; active: boolean; today: boolean; future: boolean }>>;
}>;

export type GamificationSummary = Readonly<{
  rank: RankSummary;
  badges: BadgeSummary[];
  missions: MissionSummary[];
  week: StudyWeek;
}>;

const rankThresholds = [
  { label: "Explorador", xp: 0 },
  { label: "Em movimento", xp: 60 },
  { label: "Ritmo de estudo", xp: 140 },
  { label: "Foco em ação", xp: 300 }
] as const;

/** Subject codes of the IFSC track (Concept id prefix) and the difficulties that read as exam level. */
const STUDY_SUBJECTS: readonly string[] = ["MAT", "POR", "CIE", "GH"];
const EXAM_LEVELS: readonly string[] = ["ifsc", "challenge"];

export function buildGamificationSummary({ xp, dueReviews, mistakes, evidence = [], now = new Date(), timeZone = "America/Sao_Paulo" }: Readonly<{
  xp: XpSummary;
  dueReviews: readonly DueReview[];
  mistakes: readonly MistakeRecord[];
  evidence?: readonly ConceptEvidenceRecord[];
  now?: Date;
  timeZone?: string;
}>): GamificationSummary {
  // The shared study-day rule: each answered Attempt once (see progress/study-days).
  const answers = answeredQuestions(evidence, now);
  const independent = answers.filter(item => isIndependentQuestionSuccess(item.conditions));
  const solved = new Set(independent.map(item => item.conditions.questionId)).size;
  const reviews = new Set(evidence.filter(item =>
    item.attemptId && item.createdAt <= now && ["question_result", "assessment_result"].includes(item.type) &&
    isIndependentQuestionSuccess(item.conditions) && item.conditions.delayedRetrieval === true
  ).map(item => item.attemptId)).size;
  const failedAt = new Map<string, number>();
  const corrected = new Set<string>();
  for (const answer of answers) {
    const questionId = String(answer.conditions.questionId);
    if (answer.conditions.outcome === "failed") failedAt.set(questionId, answer.createdAt.getTime());
    if (isIndependentQuestionSuccess(answer.conditions) && failedAt.has(questionId) && failedAt.get(questionId)! <= answer.createdAt.getTime()) corrected.add(questionId);
  }
  // 2026-10-18 achievements: the same records as above, read per Concept (an answer can touch several subjects).
  const independentRows = evidence.filter(item => item.attemptId && item.createdAt <= now && ["question_result", "assessment_result"].includes(item.type) && isIndependentQuestionSuccess(item.conditions));
  const subjects = new Set(independentRows.map(item => item.conceptStableId.split(".")[0]).filter(code => STUDY_SUBJECTS.includes(code))).size;
  const simulados = new Set(evidence.filter(item => item.type === "assessment_result" && item.createdAt <= now && typeof item.conditions.assessmentId === "string").map(item => String(item.conditions.assessmentId))).size;
  const examLevel = new Set(independent.filter(item => EXAM_LEVELS.includes(String(item.conditions.difficulty))).map(item => item.conditions.questionId)).size;
  const week = buildStudyWeek(answers.map(item => item.createdAt), now, timeZone);
  const allStudyDays = new Set(answers.map(item => dateKey(item.createdAt, timeZone))).size;
  const legacySuccess = xp.transactions.some(item => item.amount > 0 && ["code_activity_passed", "debug_activity_passed", QUESTION_SUCCESS_REASON].includes(item.reason));
  const badge = (id: string, label: string, criteria: string, current: number, target: number, unit: string, category: BadgeSummary["category"], href = "/"): BadgeSummary => ({
    id, label, criteria, current: Math.min(current, target), target, unit, category, href, earned: current >= target, awardedAt: null
  });
  const badges = [
    badge("first-submit", "Saiu do zero", "Acerte sua primeira questão sem dica nem solução aberta. Seu primeiro acerto no Lab também vale.", solved > 0 || legacySuccess ? 1 : 0, 1, "acerto", "practice"),
    badge("study-practice-five", "Pegou o embalo", "Acerte 5 questões diferentes sem dica nem solução aberta.", solved, 5, "questões", "practice"),
    badge("study-practice-twenty", "Bagagem de estudo", "Acerte 20 questões diferentes sem dica nem solução aberta.", solved, 20, "questões", "practice"),
    badge("study-practice-fifty", "Cinquentinha", "Acerte 50 questões diferentes sem dica nem solução aberta.", solved, 50, "questões", "practice"),
    badge("exam-level-five", "Nível prova", "Acerte 5 questões diferentes de nível IFSC ou desafio, sem dica nem solução aberta.", examLevel, 5, "questões", "practice"),
    badge("study-all-subjects", "Volta pelo edital", "Acerte, sem dica nem solução aberta, pelo menos uma questão de cada matéria: Matemática, Português, Ciências e Geografia e História.", subjects, STUDY_SUBJECTS.length, "matérias", "practice", "/tracks"),
    badge("first-simulado", "Primeiro simulado", "Termine um simulado com suas respostas registradas.", simulados, 1, "simulado", "practice", "/assessments"),
    badge("returned-stronger", "Ficou na memória", "Depois de pelo menos 24 horas, acerte uma questão de um conceito já estudado, sem dica nem solução aberta.", reviews, 1, "revisão", "memory", "/review"),
    badge("returned-stronger-five", "Memória de elefante", "Acerte 5 revisões feitas depois de pelo menos 24 horas, sem dica nem solução aberta.", reviews, 5, "revisões", "memory", "/review"),
    badge("study-comeback", "Virou o jogo", "Errou uma questão? Acerte essa mesma questão depois, sem dica nem solução aberta.", corrected.size, 1, "virada", "comeback"),
    badge("study-comeback-three", "Virada tripla", "Acerte, sem dica nem solução aberta, 3 questões que você tinha errado.", corrected.size, 3, "viradas", "comeback", "/mistakes"),
    badge("study-steady-three", "No seu ritmo", "Responda questões em 3 dias diferentes. Eles não precisam ser seguidos; errar também conta como prática.", allStudyDays, 3, "dias", "rhythm"),
    badge("study-steady-ten", "Dez dias de estudo", "Responda questões em 10 dias diferentes. Eles não precisam ser seguidos; errar também conta como prática.", allStudyDays, 10, "dias", "rhythm")
  ];
  // Keep programming achievements identifiable; never relabel Debugger as study evidence.
  if (xp.transactions.some(item => item.reason === "debug_activity_passed")) {
    badges.push(badge("debugger", "Debugger · Lab", "Conquista do histórico de programação: aprovar uma atividade de debug.", 1, 1, "atividade", "legacy", "/tracks"));
  }
  const mission = (id: string, label: string, criteria: string, current: number, target: number, unit: string, href: string): MissionSummary => ({
    id, label, criteria, current: Math.min(current, target), target, unit, href,
    status: current >= target ? "complete" : "available", completedAt: null, persistedAt: null
  });
  return {
    rank: calculateRank(xp.totalXp), badges, week,
    missions: [
      mission("study-start", "Dar o primeiro passo", "Responda uma questão. Tentar já é começar.", answers.length, 1, "resposta", "/"),
      mission("study-practice-five", "Pegar o embalo", "Busque 5 acertos em questões diferentes, sem abrir dicas ou soluções.", solved, 5, "questões", "/"),
      mission("study-retrieval", "Guardar na memória", dueReviews.length ? "Há conceitos para revisitar. Faça uma nova tentativa sem ajuda." : "Volte a um conceito depois de 24 horas e tente uma questão sem ajuda.", reviews, 1, "revisão", "/review"),
      mission("study-comeback", "Transformar erro em aprendizado", mistakes.some(item => item.status === "active") ? "Use seus erros para escolher o que praticar e acerte novamente sem ajuda." : "Quando errar, revise o raciocínio e tente a mesma questão de novo sem ajuda.", corrected.size, 1, "virada", "/mistakes"),
      mission(`study-week:${week.startsOn}`, "Estudar em 3 dias nesta semana", "Uma questão respondida em cada dia já conta. Escolha os dias que cabem na sua rotina.", week.activeDays, week.targetDays, "dias", "/")
    ]
  };
}

export function attachGamificationPersistence(summary: GamificationSummary, persistence: GamificationPersistenceState): GamificationSummary {
  const awards = new Map(persistence.badgeAwards.map(award => [award.badgeId, award]));
  const progress = new Map(persistence.missionProgress.map(mission => [mission.missionId, mission]));
  const badges = summary.badges.map(badge => ({ ...badge, earned: badge.earned || awards.has(badge.id), awardedAt: awards.get(badge.id)?.createdAt ?? null }));
  for (const award of persistence.badgeAwards) {
    if (badges.some(badge => badge.id === award.badgeId)) continue;
    badges.push({ id: award.badgeId, label: award.label, criteria: award.criteriaSnapshot, earned: true, awardedAt: award.createdAt, current: 1, target: 1, unit: "conquista", category: "legacy", href: "/tracks" });
  }
  return {
    ...summary, badges,
    missions: summary.missions.map(mission => ({ ...mission, completedAt: progress.get(mission.id)?.completedAt ?? null, persistedAt: progress.get(mission.id)?.updatedAt ?? null }))
  };
}

export function calculateRank(totalXp: number): RankSummary {
  const current = [...rankThresholds].reverse().find(rank => totalXp >= rank.xp) ?? rankThresholds[0];
  const next = rankThresholds.find(rank => rank.xp > totalXp);
  return { label: current.label, currentXp: totalXp, startsAt: current.xp, nextRankAt: next?.xp ?? null, nextLabel: next?.label ?? null, explanation: "XP reconhece sua prática. O que você aprendeu aparece no Progresso." };
}

const dateKey = studyDayKey;

function buildStudyWeek(dates: readonly Date[], now: Date, timeZone: string): StudyWeek {
  const today = dateKey(now, timeZone);
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const active = new Set(dates.map(date => dateKey(date, timeZone)));
  const days = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((label, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, label, active: active.has(key), today: key === today, future: key > today };
  });
  return { startsOn: days[0].date, activeDays: days.filter(day => day.active).length, targetDays: 3, days };
}

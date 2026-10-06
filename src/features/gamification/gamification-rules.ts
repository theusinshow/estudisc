import type { XpSummary } from "@/db/repositories/xp-repository";
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

export function buildGamificationSummary({ xp, dueReviews, mistakes, evidence = [], now = new Date(), timeZone = "America/Sao_Paulo" }: Readonly<{
  xp: XpSummary;
  dueReviews: readonly DueReview[];
  mistakes: readonly MistakeRecord[];
  evidence?: readonly ConceptEvidenceRecord[];
  now?: Date;
  timeZone?: string;
}>): GamificationSummary {
  // One answer can emit evidence for several Concepts. Count the Attempt once.
  // Neither self-ratings nor diagnostic seed evidence constitute answered questions.
  const answers = [...new Map(evidence.filter(item =>
    item.attemptId && typeof item.conditions.questionId === "string" &&
    ["question_result", "assessment_result"].includes(item.type) &&
    ["passed", "failed"].includes(String(item.conditions.outcome)) && item.createdAt <= now
  ).map(item => [item.attemptId!, item])).values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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
    badge("returned-stronger", "Ficou na memória", "Depois de pelo menos 24 horas, acerte uma questão de um conceito já estudado, sem dica nem solução aberta.", reviews, 1, "revisão", "memory", "/review"),
    badge("study-comeback", "Virou o jogo", "Errou uma questão? Acerte essa mesma questão depois, sem dica nem solução aberta.", corrected.size, 1, "virada", "comeback"),
    badge("study-steady-three", "No seu ritmo", "Responda questões em 3 dias diferentes. Eles não precisam ser seguidos; errar também conta como prática.", allStudyDays, 3, "dias", "rhythm")
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

function calculateRank(totalXp: number): RankSummary {
  const current = [...rankThresholds].reverse().find(rank => totalXp >= rank.xp) ?? rankThresholds[0];
  const next = rankThresholds.find(rank => rank.xp > totalXp);
  return { label: current.label, currentXp: totalXp, startsAt: current.xp, nextRankAt: next?.xp ?? null, nextLabel: next?.label ?? null, explanation: "XP reconhece sua prática. O que você aprendeu aparece no Progresso." };
}

function dateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

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

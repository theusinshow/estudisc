import type { Question } from "@/features/questions/contracts";
import type { SessionItem } from "./contracts";
import type { PlannerCandidate, PlannerPhase } from "./planner-policy";

export type AdaptiveActivity = { stableId: string; prompt: string; orderIndex: number; config: { questionId: string; questionVersion: number; hints: string[] }; question: Question; independentSuccess: boolean; failedBefore: boolean };
export type AdaptiveLesson = { id: string; trackId: string; version: number; title: string; subjectCode: string; estimatedMinutes: number; conceptIds: string[]; levels: number[]; importance: number; dueDays: number; due: boolean; mistake: boolean; prerequisitesReady: boolean; phase: PlannerPhase; objectives: string[]; sourceIds: string[]; checkpointIds: string[]; independentQa: boolean; officialMappingVerified: boolean; activities: AdaptiveActivity[] };
export const adaptiveQuestionMinutes = { foundation: 3, direct: 4, applied: 5, ifsc: 6, challenge: 8 } as const;

export function adaptiveChoice(lesson: AdaptiveLesson, budgetMinutes: number, subjectLimit = budgetMinutes): { candidate: PlannerCandidate; item: SessionItem } | null {
  const budget = Math.min(budgetMinutes, subjectLimit);
  const caveats = [
    ...(!lesson.independentQa ? ["Não há registro completo de QA independente para esta versão."] : []),
    ...(!lesson.officialMappingVerified ? ["O mapeamento curricular oficial não foi certificado."] : []),
    ...(!lesson.objectives.length ? ["Os objetivos editoriais desta versão estão incompletos."] : [])
  ];
  const fullReady = lesson.independentQa && lesson.objectives.length > 0 && lesson.sourceIds.length > 0 && lesson.checkpointIds.length > 0 && lesson.checkpointIds.every(id => lesson.activities.some(activity => activity.question.id === id)) && lesson.conceptIds.length > 0 && lesson.conceptIds.every(id => new Set(lesson.activities.filter(activity => activity.question.conceptIds.includes(id)).map(activity => activity.question.id)).size >= 2);
  const remaining = lesson.activities.filter(activity => lesson.due || !activity.independentSuccess)
    .sort((a, b) => Number(a.failedBefore) - Number(b.failedBefore) || a.orderIndex - b.orderIndex || (a.stableId < b.stableId ? -1 : 1));
  if (!remaining.length || budget < 5) return null;
  const fullMinutes = Math.max(lesson.estimatedMinutes, 2 + remaining.reduce((sum, activity) => sum + adaptiveQuestionMinutes[activity.question.difficulty], 0));
  const learn = !lesson.due && !lesson.mistake && lesson.levels.every(level => level < 2) && fullReady && lesson.prerequisitesReady && fullMinutes <= budget && lesson.phase !== "EXAM_PREP";
  const kind = lesson.due ? "review" : lesson.mistake ? "remediation" : learn ? "learn" : "practice";
  let minutes = 2;
  const selected: AdaptiveActivity[] = [];
  const seen = new Set<string>();
  for (const activity of remaining) {
    const cost = adaptiveQuestionMinutes[activity.question.difficulty];
    if (seen.has(activity.question.id) || minutes + cost > budget) continue;
    selected.push(activity); seen.add(activity.question.id); minutes += cost;
  }
  if (!selected.length) return null;
  if (learn) minutes = fullMinutes;
  const reason = kind === "review" ? "A revisão deste conceito está prevista para agora." : kind === "remediation" ? "Há um erro ativo neste conceito; pratique uma questão diferente quando disponível." : kind === "learn" ? "Esta versão tem os registros editoriais exigidos, pré-requisitos disponíveis e cabe no tempo escolhido." : lesson.prerequisitesReady ? "Prática independente que cabe no tempo escolhido; questões respondidas corretamente sem ajuda ficam para a revisão." : "Prática inicial para fortalecer conceitos antes de avançar para a aula completa.";
  const conceptIds = [...new Set(selected.flatMap(activity => activity.question.conceptIds))].sort();
  const item: SessionItem = { lessonId: lesson.id, trackId: lesson.trackId, version: lesson.version, title: lesson.title, subjectCode: lesson.subjectCode, minutes,
    intent: kind, reason, caveats, conceptIds, delivery: learn ? "lesson" : "questions", activityIds: selected.map(activity => activity.stableId),
    questions: selected.map(activity => ({ id: activity.question.id, version: activity.question.version })),
    activitySnapshots: selected.map(({ stableId, prompt, orderIndex, config }) => ({ stableId, prompt, orderIndex, type: "question", config })) };
  return { item, candidate: { id: JSON.stringify([lesson.trackId, lesson.id, lesson.version]), subjectCode: lesson.subjectCode, kind, minutes, importance: lesson.importance,
    weakness: lesson.levels.length ? 1 - lesson.levels.reduce((sum, level) => sum + level, 0) / lesson.levels.length / 5 : 1,
    dueDays: lesson.dueDays, requiredPrerequisitesReady: lesson.prerequisitesReady, plannerReady: kind !== "learn" || Boolean(fullReady), reserved: false,
    questionKeys: selected.map(activity => activity.question.id), phase: lesson.phase } };
}

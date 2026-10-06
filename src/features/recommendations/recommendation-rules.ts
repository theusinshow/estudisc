import { candidatePriority } from "@/features/study-sessions/planner-policy";
import type { RecommendationLesson } from "./lesson-candidates";
import type { DueReview } from "@/db/repositories/review-repository";
import type { MistakeRecord } from "@/db/repositories/mistake-repository";
import type { TrackListItem } from "@/db/repositories/catalog-repository";
import type { ProjectSummary } from "@/db/repositories/project-repository";

export type Recommendation = Readonly<{
  id: string;
  kind: "review" | "mistake" | "continue" | "project";
  title: string;
  reason: string;
  href: string;
  priority: number;
}>;

export function buildRecommendations({
  dueReviews,
  mistakes,
  tracks,
  projects = [], sessions = [], lessons = [], masteryLevels = {}, cooling = []
}: Readonly<{
  dueReviews: readonly DueReview[];
  mistakes: readonly MistakeRecord[];
  tracks: readonly TrackListItem[];
  projects?: readonly ProjectSummary[];
  sessions?: readonly { id: string; status: string }[];
  lessons?: readonly RecommendationLesson[];
  masteryLevels?: Readonly<Record<string, number>>;
  cooling?: readonly { stableId: string; title: string; retention: number }[];
}>): Recommendation[] {
  const recommendations: Recommendation[] = [];
  for (const session of sessions.filter(row => row.status === "ACTIVE")) recommendations.push({ id: `session:${session.id}`, kind: "continue", title: "Retomar sessão em andamento", reason: "Esta sessão já foi iniciada e mantém suas questões e respostas registradas.", href: `/study/${session.id}`, priority: 0 });
  for (const concept of cooling.filter(c => !dueReviews.some(review => review.conceptStableId === c.stableId))) recommendations.push({ id: `weak:${concept.stableId}`, kind: "review", title: `Revisar ${concept.title}`, reason: "A retenção estimada caiu; uma recuperação espaçada ajuda a consolidar este conceito.", href: `/concepts/${concept.stableId}`, priority: 20 });


  for (const review of dueReviews) {
    recommendations.push({
      id: `review:${review.conceptStableId}`,
      kind: "review",
      title: `Revisar ${review.conceptTitle}`,
      reason: review.reason,
      href: "/review",
      priority: 10
    });
  }

  for (const mistake of mistakes.filter((entry) => entry.status === "active")) {
    recommendations.push({
      id: `mistake:${mistake.id}`,
      kind: "mistake",
      title: `Corrigir ${mistake.conceptTitle}`,
      reason: mistake.summary,
      href: "/mistakes",
      priority: 20
    });
  }

  for (const lesson of lessons.filter(row => row.activityCount > row.passed)) {
    const missing = lesson.prerequisiteIds.filter(id => (masteryLevels[id] ?? 0) < 2);
    if (missing.length) {
      recommendations.push({ id: `prerequisite:${lesson.id}`, kind: "review", title: "Fortalecer um pré-requisito", reason: `A aula ${lesson.title} depende de conhecimento que ainda precisa de prática e evidência.`, href: `/concepts/${missing.sort()[0]}`, priority: 40 });
      continue;
    }
    const priority = candidatePriority({ id: lesson.id, subjectCode: lesson.subjectCode, kind: "learn", minutes: lesson.estimatedMinutes, importance: lesson.importance, weakness: 1 - lesson.passed / Math.max(1, lesson.activityCount), dueDays: 0, requiredPrerequisitesReady: true, plannerReady: true, reserved: false }, "FOUNDATION", {});
    recommendations.push({ id: `lesson:${lesson.id}`, kind: "continue", title: `${lesson.attempted ? "Retomar" : "Estudar"} ${lesson.title}`, reason: lesson.attempted ? "Esta aula tem tentativas registradas e atividades que ainda faltam concluir." : "Próximo conteúdo publicado com pré-requisitos disponíveis, ordenado pela política determinística do planner.", href: `/lessons/${lesson.id}`, priority: lesson.attempted ? 30 : 50 - Math.min(9, priority / 10) });
  }
  if (!lessons.length) for (const track of [...tracks].sort((a, b) => a.stableId.localeCompare(b.stableId))) recommendations.push({ id: `continue:${track.stableId}`, kind: "continue", title: `Continuar ${track.title}`, reason: "Abra o conteúdo disponível; ainda não há uma aula específica com dados suficientes para priorizar.", href: `/tracks/${track.stableId}`, priority: 50 });

  for (const project of projects.filter(
    (entry) => entry.status === "active" && entry.conceptCount + entry.activityCount > 0
  )) {
    recommendations.push({
      id: `project:${project.stableId}`,
      kind: "project",
      title: `Aplicar em ${project.title}`,
      reason: `${project.conceptCount} conceito(s) e ${project.activityCount} atividade(s) ligados ao projeto. Use como prática aplicada após a sequência principal.`,
      href: "/projects",
      priority: 80
    });
  }

  return recommendations.sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

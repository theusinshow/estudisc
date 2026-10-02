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
  projects = []
}: Readonly<{
  dueReviews: readonly DueReview[];
  mistakes: readonly MistakeRecord[];
  tracks: readonly TrackListItem[];
  projects?: readonly ProjectSummary[];
}>): Recommendation[] {
  const recommendations: Recommendation[] = [];

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

  const firstTrack = tracks[0];

  if (firstTrack) {
    recommendations.push({
      id: `continue:${firstTrack.stableId}`,
      kind: "continue",
      title: `Continuar ${firstTrack.title}`,
      reason: "Retome a trilha pela próxima aula que falta concluir.",
      href: `/tracks/${firstTrack.stableId}`,
      priority: 30
    });
  }

  for (const project of projects.filter(
    (entry) => entry.status === "active" && entry.conceptCount + entry.activityCount > 0
  )) {
    recommendations.push({
      id: `project:${project.stableId}`,
      kind: "project",
      title: `Aplicar em ${project.title}`,
      reason: `${project.conceptCount} conceito(s) e ${project.activityCount} atividade(s) ligados ao projeto. Use como prática aplicada após a sequência principal.`,
      href: "/projects",
      priority: 40
    });
  }

  return recommendations.sort((left, right) => left.priority - right.priority || left.title.localeCompare(right.title));
}

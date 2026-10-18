import { getOwnerProfile } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { getRecommendationInputs } from "@/features/recommendations/api";
import { buildRecommendations } from "@/features/recommendations/recommendation-rules";
import { listRecommendationLessons } from "@/features/recommendations/lesson-candidates";
import { getProgressOverview } from "@/features/progress/api";
import { getStudyFlow } from "@/features/study-flow/api";

/** One request-scoped coordinator; reviews/mistakes/catalog/projects are each fetched once. */
export async function getTodayDashboard(now = new Date()) {
  const profile = await getOwnerProfile();
  // ADR 0072: Today follows the continuous lesson flow; open sessions and practice blocks are not study paths here.
  const [flow, inputs, progress, lessons] = await Promise.all([
    getStudyFlow(profile.ownerId), getRecommendationInputs(profile), getProgressOverview(now),
    getDatabaseUrl() ? listRecommendationLessons(profile.ownerId) : Promise.resolve([])
  ]);
  const masteryLevels = Object.fromEntries(progress.ladder.flatMap(rung => rung.concepts.map(concept => [concept.stableId, rung.level])));
  const recommendations = buildRecommendations({ ...inputs, lessons, masteryLevels, cooling: progress.cooling }).slice(0, 4);
  return { recommendations, nextAction: recommendations[0], queue: recommendations.slice(1), dueReviews: inputs.dueReviews, mistakes: inputs.mistakes, progress, week: progress.week, flow };
}

import { getOwnerProfile } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { getRecommendationInputs } from "@/features/recommendations/api";
import { buildRecommendations } from "@/features/recommendations/recommendation-rules";
import { listRecommendationLessons } from "@/features/recommendations/lesson-candidates";
import { getProgressOverview } from "@/features/progress/api";
import { studySessionRepository } from "@/features/study-sessions/api";

/** One request-scoped coordinator; reviews/mistakes/catalog/projects are each fetched once. */
export async function getTodayDashboard(now = new Date()) {
  const profile = await getOwnerProfile();
  const [inputs, progress, sessions, lessons] = await Promise.all([
    getRecommendationInputs(profile), getProgressOverview(now),
    getDatabaseUrl() ? studySessionRepository().list(profile.ownerId) : Promise.resolve([]),
    getDatabaseUrl() ? listRecommendationLessons(profile.ownerId) : Promise.resolve([])
  ]);
  const masteryLevels = Object.fromEntries(progress.ladder.flatMap(rung => rung.concepts.map(concept => [concept.stableId, rung.level])));
  const recommendations = buildRecommendations({ ...inputs, sessions, lessons, masteryLevels, cooling: progress.cooling });
  return { recommendations, nextAction: recommendations[0], queue: recommendations.slice(1), dueReviews: inputs.dueReviews, mistakes: inputs.mistakes, sessions, progress, week: progress.week };
}

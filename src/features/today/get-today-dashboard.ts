import { getOwnerProfile } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { getRecommendationInputs } from "@/features/recommendations/api";
import { buildRecommendations } from "@/features/recommendations/recommendation-rules";
import { listRecommendationLessons } from "@/features/recommendations/lesson-candidates";
import { getProgressOverview } from "@/features/progress/api";
import { studySessionRepository } from "@/features/study-sessions/api";
import { studyPlanRepository } from "@/features/study-sessions/routine-api";
import { getFeatureFlags } from "@/lib/feature-flags";

/** One request-scoped coordinator; reviews/mistakes/catalog/projects are each fetched once. */
export async function getTodayDashboard(now = new Date()) {
  const profile = await getOwnerProfile();
  const plannerEnabled = getFeatureFlags().FEATURE_STUDY_PLANNER;
  const [inputs, progress, sessions, lessons] = await Promise.all([
    getRecommendationInputs(profile), getProgressOverview(now),
    getDatabaseUrl() ? (plannerEnabled ? studySessionRepository().planningFacts(profile.ownerId, now) : studySessionRepository().list(profile.ownerId)) : Promise.resolve([]),
    getDatabaseUrl() ? listRecommendationLessons(profile.ownerId) : Promise.resolve([])
  ]);
  const routine = getDatabaseUrl() && plannerEnabled ? await studyPlanRepository().getState(profile.ownerId, now, {
    subjectCodes: [...new Set(lessons.map(lesson => lesson.subjectCode))].sort(), sessions
  }) : null;
  const masteryLevels = Object.fromEntries(progress.ladder.flatMap(rung => rung.concepts.map(concept => [concept.stableId, rung.level])));
  const recommendations = buildRecommendations({ ...inputs, sessions, lessons, masteryLevels, cooling: progress.cooling }).slice(0, 4);
  return { recommendations, nextAction: recommendations[0], queue: recommendations.slice(1), dueReviews: inputs.dueReviews, mistakes: inputs.mistakes, sessions, progress, week: progress.week, routine };
}

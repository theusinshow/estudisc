import "server-only";
import { getDatabaseUrl } from "@/db/connection";
import { getMemoryStore } from "@/db/repositories/memory-store";
import { loadMemoryStudyFlow, StudyFlowRepository } from "@/db/repositories/study-flow-repository";
import { chooseNextLessons } from "./next-lesson";

export async function getStudyFlow(ownerId: string) {
  const url = getDatabaseUrl();
  if (!url) return chooseNextLessons([], { completedLessonIds: [], inProgress: [], answeredQuestionIds: [] });
  const { lessons, progress } = url === "memory://local" ? loadMemoryStudyFlow(getMemoryStore(), ownerId) : await new StudyFlowRepository().load(ownerId);
  return chooseNextLessons(lessons, progress);
}

import "server-only";
import { getDatabaseUrl } from "@/db/connection";
import { LessonResumeRepository } from "@/db/repositories/lesson-resume-repository";
import { MemoryLessonResumeRepository } from "@/db/repositories/memory-lesson-resume-repository";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getOwnerId } from "@/features/auth/owner";
import { ResumeUnavailableError } from "./resume-policy";
import type { ResumeScope } from "./resume-contracts";
export const lessonResumeRepository = () => getDatabaseUrl() === "memory://local" ? new MemoryLessonResumeRepository() : new LessonResumeRepository();
export async function getLessonResume(scope: ResumeScope | undefined) {
  if (!getFeatureFlags().FEATURE_INTERACTIVE_LESSONS || !scope) return null;
  try { return await lessonResumeRepository().get(await getOwnerId(), scope); }
  catch (error) { if (error instanceof ResumeUnavailableError) return null; throw error; }
}

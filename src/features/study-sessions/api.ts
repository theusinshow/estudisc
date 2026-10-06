import { getDatabaseUrl } from "@/db/connection";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { MemoryStudySessionRepository } from "@/db/repositories/memory-study-session-repository";
import { getFeatureFlags } from "@/lib/feature-flags";
export function studySessionRepository(){const routineEnabled=getFeatureFlags().FEATURE_STUDY_PLANNER;return getDatabaseUrl()==="memory://local"?new MemoryStudySessionRepository(undefined,routineEnabled):new StudySessionRepository(undefined,routineEnabled);}

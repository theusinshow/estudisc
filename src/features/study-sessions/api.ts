import { getDatabaseUrl } from "@/db/connection";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { MemoryStudySessionRepository } from "@/db/repositories/memory-study-session-repository";
import { getFeatureFlags } from "@/lib/feature-flags";
export function studySessionRepository(){const flags=getFeatureFlags();return getDatabaseUrl()==="memory://local"?new MemoryStudySessionRepository(undefined,flags.FEATURE_STUDY_PLANNER,flags.FEATURE_ADAPTIVE_SESSION):new StudySessionRepository(undefined,flags.FEATURE_STUDY_PLANNER,flags.FEATURE_ADAPTIVE_SESSION);}

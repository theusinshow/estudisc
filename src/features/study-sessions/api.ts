import { getDatabaseUrl } from "@/db/connection";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { MemoryStudySessionRepository } from "@/db/repositories/memory-study-session-repository";
// ADR 0072: the product only starts practice blocks; the engine's routine and adaptive planning modes stay off.
export function studySessionRepository(){return getDatabaseUrl()==="memory://local"?new MemoryStudySessionRepository():new StudySessionRepository();}

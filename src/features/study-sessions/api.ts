import { getDatabaseUrl } from "@/db/connection";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { MemoryStudySessionRepository } from "@/db/repositories/memory-study-session-repository";
// ADR 0072: sessions are practice blocks; the time-budget planner and the weekly routine were removed.
export function studySessionRepository(){return getDatabaseUrl()==="memory://local"?new MemoryStudySessionRepository():new StudySessionRepository();}

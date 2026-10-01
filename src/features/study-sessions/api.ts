import { getDatabaseUrl } from "@/db/connection";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { MemoryStudySessionRepository } from "@/db/repositories/memory-study-session-repository";
export function studySessionRepository(){return getDatabaseUrl()==="memory://local"?new MemoryStudySessionRepository():new StudySessionRepository();}

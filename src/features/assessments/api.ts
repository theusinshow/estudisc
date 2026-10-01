import { getDatabaseUrl } from "@/db/connection";
import { AssessmentRepository } from "@/db/repositories/assessment-repository";
import { MemoryAssessmentRepository } from "@/db/repositories/memory-assessment-repository";
export function assessmentRepository(){return getDatabaseUrl()==="memory://local"?new MemoryAssessmentRepository():new AssessmentRepository();}
export type AssessmentView=NonNullable<Awaited<ReturnType<AssessmentRepository["view"]>>>;

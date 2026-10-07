import { getDatabaseUrl } from "@/db/connection";
import { StudyPlanRepository } from "@/db/repositories/study-plan-repository";
import { MemoryStudyPlanRepository } from "@/db/repositories/memory-study-plan-repository";

export function studyPlanRepository() {
  return getDatabaseUrl() === "memory://local" ? new MemoryStudyPlanRepository() : new StudyPlanRepository();
}

import { getDatabaseUrl } from "@/db/connection";
import { withCatalogRepository,type LessonDetail } from "@/db/repositories/catalog-repository";
import { MemoryCatalogRepository } from "@/db/repositories/memory-store";
import { getOwnerProfile } from "@/features/auth/owner";

export async function getLesson(stableId: string,version?:number,trackId?:string):Promise<LessonDetail|null> {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryCatalogRepository().getLesson(stableId,version,trackId);
  }

  const lesson=await withCatalogRepository((repository) => repository.getLesson(stableId,version,trackId));
  if(lesson?.metadata?.kind&&(lesson.metadata.status!=="published"||!lesson.metadata.qaReleaseId)&&(await getOwnerProfile()).role!=="ADMIN")return null;
  return lesson;
}

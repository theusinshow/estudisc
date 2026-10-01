import { getDatabaseUrl } from "@/db/connection";
import { withCatalogRepository } from "@/db/repositories/catalog-repository";
import { MemoryCatalogRepository } from "@/db/repositories/memory-store";

export async function getLesson(stableId: string,version?:number) {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryCatalogRepository().getLesson(stableId);
  }

  return withCatalogRepository((repository) => repository.getLesson(stableId,version));
}

import { getDatabaseUrl } from "@/db/connection";
import { withCatalogRepository } from "@/db/repositories/catalog-repository";
import { MemoryCatalogRepository } from "@/db/repositories/memory-store";
import { getOwnerId } from "@/features/auth/owner";
import { KnowledgeMapRepository,MemoryKnowledgeMapRepository } from "@/db/repositories/knowledge-map-repository";

export async function getKnowledgeMapSnapshot(){return (getDatabaseUrl()==="memory://local"?new MemoryKnowledgeMapRepository():new KnowledgeMapRepository()).get(await getOwnerId());}

export async function listKnowledgeMapConcepts() {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryCatalogRepository().listKnowledgeMapConcepts();
  }

  return withCatalogRepository((repository) => repository.listKnowledgeMapConcepts());
}

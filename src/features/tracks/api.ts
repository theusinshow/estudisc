import { getDatabaseUrl } from "@/db/connection";
import { withCatalogRepository } from "@/db/repositories/catalog-repository";
import { MemoryCatalogRepository } from "@/db/repositories/memory-store";
import { getOwnerProfile } from "@/features/auth/owner";

export async function listTracks() {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryCatalogRepository().listTracks();
  }

  const student=(await getOwnerProfile()).role==="STUDENT";
  return withCatalogRepository((repository) => repository.listTracks(student));
}

export async function getTrack(stableId: string) {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryCatalogRepository().getTrack(stableId);
  }

  const student=(await getOwnerProfile()).role==="STUDENT";
  return withCatalogRepository((repository) => repository.getTrack(stableId,student));
}

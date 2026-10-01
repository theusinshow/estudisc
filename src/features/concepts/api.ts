import { getOwnerId } from "@/features/auth/owner";
import { ConceptEvidenceRepository } from "@/db/repositories/concept-evidence-repository";
import { getDatabaseUrl } from "@/db/connection";
import { withCatalogRepository } from "@/db/repositories/catalog-repository";
import { MemoryCatalogRepository, MemoryConceptEvidenceRepository } from "@/db/repositories/memory-store";
import { calculateVersionedMastery } from "@/features/mastery/mastery-policy-v2";

export async function getConcept(stableId: string) {
  if (getDatabaseUrl() === "memory://local") {
    const concept = await new MemoryCatalogRepository().getConcept(stableId);

    if (!concept) {
      return null;
    }

    const evidence = await new MemoryConceptEvidenceRepository().listForConcept(await getOwnerId(), stableId);
    return {
      ...concept,
      mastery: calculateVersionedMastery(evidence)
    };
  }

  return withCatalogRepository(async (repository) => {
    const concept = await repository.getConcept(stableId);

    if (!concept) {
      return null;
    }

    const evidence = await new ConceptEvidenceRepository().listForConcept(await getOwnerId(), stableId);
    return {
      ...concept,
      mastery: calculateVersionedMastery(evidence)
    };
  });
}


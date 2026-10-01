export type CoverageState = "UNMAPPED" | "MAPPED" | "COVERED" | "VALIDATED";

export type ConceptCoverage = Readonly<{
  conceptId: string;
  published: boolean;
  plannerReady: boolean;
  qaApproved: boolean;
}>;

export function deriveRequirementCoverage(mappedConceptIds: readonly string[], content: readonly ConceptCoverage[], mappingValidated: boolean): CoverageState {
  if (mappedConceptIds.length === 0) return "UNMAPPED";
  const byConcept = new Map(content.map(item => [item.conceptId, item]));
  const covered = mappedConceptIds.every(id => {
    const fact = byConcept.get(id);
    return fact?.published && fact.plannerReady && fact.qaApproved;
  });
  if (!covered) return "MAPPED";
  return mappingValidated ? "VALIDATED" : "COVERED";
}

export function summarizeCurriculum(requirements: readonly { id: string; state: CoverageState }[], sourceScopeVerified: boolean) {
  const counts: Record<CoverageState, number> = { UNMAPPED: 0, MAPPED: 0, COVERED: 0, VALIDATED: 0 };
  for (const requirement of requirements) counts[requirement.state]++;
  return {
    total: requirements.length,
    counts,
    mappedPercent: requirements.length ? Math.round(100 * (requirements.length - counts.UNMAPPED) / requirements.length) : 0,
    validatedPercent: requirements.length ? Math.round(100 * counts.VALIDATED / requirements.length) : 0,
    complete: sourceScopeVerified && requirements.length > 0 && counts.VALIDATED === requirements.length,
    sourceScopeVerified
  };
}

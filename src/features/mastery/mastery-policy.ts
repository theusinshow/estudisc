import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";

export const MASTERY_POLICY_VERSION = "mastery.v1";

export const masteryStateLabels = {
  unseen: "Não visto",
  introduced: "Introduzido",
  understood: "Entendido",
  practicing: "Praticando",
  strong: "Forte",
  mastered: "Dominado"
} as const;

export type MasteryState = keyof typeof masteryStateLabels;

export type ConceptMastery = Readonly<{
  state: MasteryState;
  level: 0 | 1 | 2 | 3 | 4 | 5;
  label: (typeof masteryStateLabels)[MasteryState];
  policyVersion: typeof MASTERY_POLICY_VERSION;
  evidenceCount: number;
  totalStrength: number;
  reasons: string[];
}>;

type MasteryEvidence = Pick<ConceptEvidenceRecord, "type" | "strength" | "conditions">;

export function calculateConceptMastery(evidence: readonly MasteryEvidence[]): ConceptMastery {
  const totalStrength = evidence.reduce((total, item) => total + Math.max(0, item.strength), 0);
  const passedEvidence = evidence.filter((item) => item.conditions.outcome === "passed");
  const distinctEvidenceTypes = new Set(evidence.map((item) => item.type));
  const hasDelayedReview = passedEvidence.some((item) => item.type === "delayed_review_result");
  const hasTransferEvidence = passedEvidence.some((item) =>
    ["project_application", "application_in_new_context", "transfer_application"].includes(item.type)
  );

  if (evidence.length === 0) {
    return buildMastery("unseen", totalStrength, evidence.length, [
      "Nenhuma evidência registrada para este conceito."
    ]);
  }

  if (hasDelayedReview && hasTransferEvidence && totalStrength >= 8 && evidence.length >= 3) {
    return buildMastery("mastered", totalStrength, evidence.length, [
      "Há revisão espaçada e aplicação em novo contexto.",
      "A evidência acumulada atingiu o limiar de domínio."
    ]);
  }

  if (hasDelayedReview && totalStrength >= 6 && distinctEvidenceTypes.size >= 2) {
    return buildMastery("strong", totalStrength, evidence.length, [
      "Há revisão espaçada aprovada.",
      "A evidência vem de mais de um tipo de atividade."
    ]);
  }

  if (passedEvidence.length >= 2 || (totalStrength >= 4 && distinctEvidenceTypes.size >= 2)) {
    return buildMastery("practicing", totalStrength, evidence.length, [
      "Há prática suficiente para acompanhar progresso.",
      "Ainda falta revisão espaçada ou transferência para domínio completo."
    ]);
  }

  if (passedEvidence.length >= 1 || totalStrength >= 2) {
    return buildMastery("understood", totalStrength, evidence.length, [
      "Há pelo menos uma evidência aprovada.",
      "Uma evidência imediata não pode marcar o conceito como Mastered."
    ]);
  }

  return buildMastery("introduced", totalStrength, evidence.length, [
    "O conceito já apareceu em uma tentativa ou interação.",
    "Ainda não há evidência aprovada suficiente para compreensão."
  ]);
}

function buildMastery(
  state: MasteryState,
  totalStrength: number,
  evidenceCount: number,
  reasons: string[]
): ConceptMastery {
  const level = stateToLevel(state);

  return {
    state,
    level,
    label: masteryStateLabels[state],
    policyVersion: MASTERY_POLICY_VERSION,
    evidenceCount,
    totalStrength,
    reasons
  };
}

function stateToLevel(state: MasteryState): ConceptMastery["level"] {
  switch (state) {
    case "mastered":
      return 5;
    case "strong":
      return 4;
    case "practicing":
      return 3;
    case "understood":
      return 2;
    case "introduced":
      return 1;
    case "unseen":
      return 0;
  }
}

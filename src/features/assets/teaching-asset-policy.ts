import { inspectFigureSource } from "@/features/lessons/blocks/block-schemas";
import type { AssetLicenseStatus, TeachingAssetMetadata } from "./teaching-asset-contracts";

export type TeachingAssetCandidate = { licenseStatus: AssetLicenseStatus; license: string; attribution: string; verifiedAt?: string; src?: string; altTextDraft: string; teachingAsset?: TeachingAssetMetadata };
export function teachingAssetReadiness(candidate: TeachingAssetCandidate) {
  const reasons: string[] = [], metadata = candidate.teachingAsset;
  if (candidate.licenseStatus !== "APPROVED_EMBED") reasons.push(`license:${candidate.licenseStatus}`);
  if (!candidate.verifiedAt) reasons.push("verification:missing");
  if (!candidate.license.trim() || !candidate.attribution.trim()) reasons.push("attribution:missing");
  if (!candidate.src) reasons.push("production:missing");
  else if (inspectFigureSource(candidate.src)) reasons.push("figure:invalid");
  if (metadata?.exposure === "protected" || metadata?.protectedQuestionAssetId) reasons.push("exposure:protected");
  const embedEligible = reasons.length === 0;
  const reuseReasons = [...reasons];
  if (!metadata) reuseReasons.push("metadata:missing");
  else {
    if (!metadata.reusable) reuseReasons.push("reuse:not_requested");
    if (metadata.exposure !== "teaching") reuseReasons.push("exposure:not_teaching");
    if (candidate.altTextDraft.trim().length < 12) reuseReasons.push("alt:incomplete");
    if (!metadata.rightsEvidence.trim()) reuseReasons.push("rights_evidence:missing");
  }
  const reusable = reuseReasons.length === 0;
  return { embedEligible, reusable, interactiveReady: reusable && metadata?.interactiveReady === true && Boolean(metadata.longDescription.trim()), reasons: reuseReasons };
}

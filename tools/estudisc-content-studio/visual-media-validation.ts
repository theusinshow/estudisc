import type { ImageCandidate } from "./contracts";
import { createHash } from "node:crypto";

type VisualBlock = { id: string; type: string; payload: Record<string, unknown> };
type Issue = { code: string; path: string; message: string };
export const visualMediaTypes = new Set(["figure", "hotspot", "map"]);
export function validateVisualMedia(block: VisualBlock, candidates: readonly ImageCandidate[]): Issue[] {
  if (!visualMediaTypes.has(block.type)) return [];
  const issues: Issue[] = [], fail = (code: string, message: string) => issues.push({ code, path: block.id, message });
  const secondary = block.type === "figure" && typeof block.payload.comparison === "object" && block.payload.comparison !== null ? block.payload.comparison as Record<string, unknown> : undefined;
  const sources = [{ src: block.payload.src, alt: block.payload.alt, credit: block.payload.credit }, ...(secondary ? [{ src: secondary.src, alt: secondary.alt, credit: secondary.credit ?? block.payload.credit }] : [])];
  if (candidates.length !== new Set(sources.map(source => source.src)).size) fail("media_reference", "Visual block needs exactly its produced, licensed media candidates");
  for (const source of sources) {
    const matching = candidates.filter(candidate => candidate.src === source.src);
    if (matching.length !== 1 || matching[0].licenseStatus !== "APPROVED_EMBED") fail("media_reference", "Every embedded visual source needs a produced APPROVED_EMBED candidate");
    if (!source.alt || !source.credit) fail("media_accessibility", "Every embedded source needs alt text and attribution");
    if (matching.length === 1) {
      const candidate = matching[0];
      if (source.credit !== candidate.attribution) fail("media_attribution", "Visual credit must preserve each candidate attribution");
      if (candidate.teachingAsset?.exposure === "protected" || candidate.teachingAsset?.protectedQuestionAssetId) fail("protected_media", "Protected Question media cannot become lesson teaching figures");
      if (candidate.teachingAsset?.contentHash && candidate.src && createHash("sha256").update(Buffer.from(candidate.src.slice(candidate.src.indexOf(",") + 1), "base64")).digest("hex") !== candidate.teachingAsset.contentHash) fail("media_hash", "Visual source differs from its pinned asset content hash");
    }
  }
  return issues;
}

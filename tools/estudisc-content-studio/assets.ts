import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { mediaPackSchema, type ImageCandidate } from "./contracts";
import type { Studio } from "./workspace";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { teachingAssetReadiness } from "@/features/assets/teaching-asset-policy";
import { inspectFigureSource } from "@/features/lessons/blocks/block-schemas";

const hash = (input: string | Buffer) => createHash("sha256").update(input).digest("hex");
const policyFiles = ["src/features/assets/teaching-asset-contracts.ts", "src/features/assets/teaching-asset-policy.ts", "src/features/lessons/blocks/block-schemas.ts", "tools/estudisc-content-studio/contracts.ts", "tools/estudisc-content-studio/assets.ts", "tools/estudisc-content-studio/visual-media-validation.ts", "tools/estudisc-content-studio/MEDIA-POLICY.md"];
export const assetReferenceSchema = z.object({ id: z.string().min(1).max(400), version: z.number().int().positive(), contentHash: z.string().regex(/^[a-f0-9]{64}$/), metadataHash: z.string().regex(/^[a-f0-9]{64}$/), sourceHash: z.string().regex(/^[a-f0-9]{64}$/), policyHash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export type AssetReference = z.infer<typeof assetReferenceSchema>;
export type TeachingAssetEntry = AssetReference & { jobId: string; candidateId: string; title: string; type: string; subjectCodes: string[]; conceptIds: string[]; tags: string[]; sourceType: string; sourceUrl?: string; sourceOrganization: string; author?: string; license: string; attribution: string; licenseStatus: ImageCandidate["licenseStatus"]; verifiedAt?: string; alt: string; width?: number; height?: number; longDescription?: string; embedEligible: boolean; reusable: boolean; interactiveReady: boolean; reasons: string[] };
export function teachingAssetInventory(studio: Studio) {
  const policyHash = hashCanonicalJson(Object.fromEntries(policyFiles.map(file => [file, hash(readFileSync(join(studio.root, file)))])));
  const entries: TeachingAssetEntry[] = [], issues: { jobId: string; code: string }[] = [];
  for (const job of studio.list().sort((a, b) => a.jobId < b.jobId ? -1 : a.jobId > b.jobId ? 1 : 0)) {
    const file = join(studio.dir(job.jobId), "research/media-pack.json");
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, "utf8"), sourceHash = hash(raw);
    let parsed: ReturnType<typeof mediaPackSchema.safeParse>;
    try { parsed = mediaPackSchema.safeParse(JSON.parse(raw)); } catch { issues.push({ jobId: job.jobId, code: "invalid_media_json" }); continue; }
    if (!parsed.success) { issues.push({ jobId: job.jobId, code: "invalid_media_contract" }); continue; }
    if (new Set(parsed.data.images.map(candidate => candidate.id)).size !== parsed.data.images.length) { issues.push({ jobId: job.jobId, code: "duplicate_media_identity" }); continue; }
    for (const candidate of parsed.data.images) {
      const metadata = candidate.teachingAsset, readiness = teachingAssetReadiness(candidate);
      const contentHash = candidate.src && !inspectFigureSource(candidate.src) ? hash(Buffer.from(candidate.src.slice(candidate.src.indexOf(",") + 1), "base64")) : hash(candidate.src ?? "");
      if (metadata?.contentHash && metadata.contentHash !== contentHash) { readiness.embedEligible = false; readiness.reusable = false; readiness.interactiveReady = false; readiness.reasons.push("content_hash:mismatch"); }
      entries.push({ id: JSON.stringify([job.jobId, candidate.id]), jobId: job.jobId, candidateId: candidate.id, version: metadata?.version ?? 1, contentHash, metadataHash: hashCanonicalJson(candidate), sourceHash, policyHash,
        title: candidate.title, type: metadata?.type ?? "image", subjectCodes: metadata?.subjectCodes ?? [], conceptIds: metadata?.conceptIds ?? [], tags: metadata?.tags ?? [], sourceType: candidate.sourceType, sourceUrl: candidate.sourceUrl, sourceOrganization: candidate.sourceOrganization, author: candidate.author, license: candidate.license, attribution: candidate.attribution, licenseStatus: candidate.licenseStatus, verifiedAt: candidate.verifiedAt, alt: candidate.altTextDraft, width: metadata?.width, height: metadata?.height, longDescription: metadata?.longDescription, ...readiness });
    }
  }
  return { schemaVersion: 1, policyHash, entries, issues };
}
export function searchTeachingAssets(entries: readonly TeachingAssetEntry[], options: { query?: string; subject?: string; concept?: string; type?: string; reuseOnly?: boolean; limit?: number } = {}) {
  const query = options.query?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  return entries.filter(entry => (!options.subject || entry.subjectCodes.includes(options.subject)) && (!options.concept || entry.conceptIds.includes(options.concept)) && (!options.type || entry.type === options.type) && (!options.reuseOnly || entry.reusable) && (!query || `${entry.title} ${entry.tags.join(" ")} ${entry.alt}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(query))).slice(0, Math.max(1, Math.min(20, options.limit ?? 20)));
}
export function referenceForTeachingAsset(entry: AssetReference): AssetReference {
  return { id: entry.id, version: entry.version, contentHash: entry.contentHash, metadataHash: entry.metadataHash, sourceHash: entry.sourceHash, policyHash: entry.policyHash };
}
/** Source/hash/rights are re-read; the index never serves stale or protected bytes. No writes/publication. */
export function resolveTeachingAsset(studio: Studio, input: AssetReference) {
  const ref = assetReferenceSchema.parse(input), inventory = teachingAssetInventory(studio);
  const entry = inventory.entries.find(entry => entry.id === ref.id && entry.version === ref.version);
  if (!entry?.reusable || ["contentHash", "metadataHash", "sourceHash", "policyHash"].some(key => entry[key as keyof AssetReference] !== ref[key as keyof AssetReference])) throw new Error("Teaching asset reference unavailable or stale");
  const raw = readFileSync(join(studio.dir(entry.jobId), "research/media-pack.json"), "utf8");
  if (hash(raw) !== ref.sourceHash) throw new Error("Teaching asset source changed during selection");
  const media = mediaPackSchema.parse(JSON.parse(raw));
  const candidate = media.images.find(candidate => candidate.id === entry.candidateId)!;
  if (hashCanonicalJson(candidate) !== ref.metadataHash || !teachingAssetReadiness(candidate).reusable) throw new Error("Teaching asset changed during selection");
  return { reference: ref, candidate };
}

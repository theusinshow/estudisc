import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, it } from "vitest";
import { imageCandidateSchema, mediaPackSchema } from "../../tools/estudisc-content-studio/contracts";
import { Studio, atomicJson } from "../../tools/estudisc-content-studio/workspace";
import { referenceForTeachingAsset, resolveTeachingAsset, searchTeachingAssets, teachingAssetInventory } from "../../tools/estudisc-content-studio/assets";
import { validateVisualMedia } from "../../tools/estudisc-content-studio/visual-media-validation";
import { teachingAssetReadiness } from "@/features/assets/teaching-asset-policy";
import { figure, comparison } from "../fixtures/interactive-blocks";

const legacy = { id: "fixture-image", title: "Ilustração de validação", sourceType: "HUMAN_CREATED" as const, sourceOrganization: "Fixture local", license: "Fixture owned", attribution: "Fixture local", licenseStatus: "APPROVED_EMBED" as const, recommendedUse: "Validar figura", altTextDraft: figure.alt, verifiedAt: "2026-10-07T00:00:00Z", src: figure.src };
const candidate = { ...legacy, teachingAsset: { version: 1, type: "diagram" as const, subjectCodes: ["MAT"], conceptIds: ["MAT.FRACTION.MEANING"], tags: ["ilustração"], width: 240, height: 160, longDescription: figure.longDescription, reusable: true, interactiveReady: true, rightsEvidence: "Fictional fixture ownership record", exposure: "teaching" as const } };
it("keeps legacy candidate parsing exact and does not infer permission from production or approval alone", () => {
  expect(imageCandidateSchema.parse(legacy)).toEqual(legacy);
  expect(teachingAssetReadiness(legacy)).toMatchObject({ embedEligible: true, reusable: false, interactiveReady: false });
  expect(teachingAssetReadiness(candidate)).toMatchObject({ embedEligible: true, reusable: true, interactiveReady: true });
  for (const licenseStatus of ["UNKNOWN", "LINK_ONLY", "REQUIRES_REVIEW", "REJECTED"] as const) expect(teachingAssetReadiness({ ...candidate, licenseStatus }).reusable).toBe(false);
  expect(teachingAssetReadiness({ ...candidate, src: undefined }).reusable).toBe(false);
  expect(teachingAssetReadiness({ ...candidate, teachingAsset: { ...candidate.teachingAsset, protectedQuestionAssetId: crypto.randomUUID() } }).reusable).toBe(false);
});
it("binds metadata-only search/selection to actual bytes, source rights and policy hashes", () => {
  const root = process.cwd(), tempRoot = join(root, ".local/teaching-assets"); mkdirSync(tempRoot, { recursive: true });
  const workspace = mkdtempSync(join(tempRoot, "case-")), studio = new Studio(root, relative(root, workspace)); studio.init("CIE-06");
  const mediaFile = join(studio.dir("CIE-06"), "research/media-pack.json");
  atomicJson(mediaFile, { images: [candidate], videos: [], books: [] });
  const inventory = teachingAssetInventory(studio), entry = inventory.entries[0];
  expect(entry.reusable).toBe(true); expect(JSON.stringify(inventory)).not.toContain(figure.src);
  expect(entry.contentHash).toBe(createHash("sha256").update(Buffer.from(figure.src.split(",")[1], "base64")).digest("hex"));
  expect(searchTeachingAssets(inventory.entries, { query: "ilustracao", subject: "MAT", concept: "MAT.FRACTION.MEANING", reuseOnly: true })).toHaveLength(1);
  expect(resolveTeachingAsset(studio, referenceForTeachingAsset(entry)).candidate.src).toBe(figure.src);
  atomicJson(mediaFile, { images: [{ ...candidate, licenseStatus: "REQUIRES_REVIEW" }], videos: [], books: [] });
  const withdrawn = teachingAssetInventory(studio).entries[0];
  expect(withdrawn.contentHash).toBe(entry.contentHash); expect(withdrawn.metadataHash).not.toBe(entry.metadataHash);
  expect(withdrawn.reusable).toBe(false); expect(() => resolveTeachingAsset(studio, referenceForTeachingAsset(entry))).toThrow("unavailable or stale");
  atomicJson(mediaFile, { images: [candidate, candidate], videos: [], books: [] });
  expect(teachingAssetInventory(studio).issues[0].code).toBe("duplicate_media_identity");
});
it("requires separate produced rights/attribution for both comparison images and hotspot/map", () => {
  const second = { ...legacy, id: "second", src: comparison.comparison.src, attribution: "Second fixture" };
  const composite = { id: "comparison", type: "figure", payload: { ...comparison, credit: legacy.attribution, comparison: { ...comparison.comparison, credit: second.attribution } } };
  expect(validateVisualMedia(composite, [legacy, second])).toEqual([]);
  expect(validateVisualMedia(composite, [legacy, { ...second, licenseStatus: "LINK_ONLY" }]).some(issue => issue.code === "media_reference")).toBe(true);
  expect(validateVisualMedia({ ...composite, type: "hotspot", payload: { ...figure, credit: legacy.attribution } }, [{ ...legacy, licenseStatus: "UNKNOWN" }]).some(issue => issue.code === "media_reference")).toBe(true);
  expect(validateVisualMedia({ ...composite, type: "map", payload: { ...figure, credit: legacy.attribution } }, [{ ...candidate, teachingAsset: { ...candidate.teachingAsset, exposure: "protected" } }]).some(issue => issue.code === "protected_media")).toBe(true);
  expect(mediaPackSchema.safeParse({ images: [candidate], videos: [], books: [] }).success).toBe(true);
});

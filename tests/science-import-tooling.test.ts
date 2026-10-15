import { describe, expect, it } from "vitest";
import { BATCHES, PILOT, editorialPackSchema, mediaAssetsSchema } from "../tools/science-import/contracts";
import { buildSciencePack, loadInputs, sha256, validateConceptMap } from "../tools/science-import/mapper";
import { buildCriticalSciencePack } from "../tools/science-import/critical-cleanup";
import { MAX_TRACK_PACK_BYTES } from "../src/features/import/application/import-request";
import { readFileSync } from "node:fs";
import { hashCanonicalJson } from "../src/lib/canonical-json";
import { SCIENCE_DRAFT_PACK, SCIENCE_MEDIA_ASSETS } from "../tools/science-import/paths";

describe("Science draft import infrastructure", () => {
  it("pins the cleaned forty-lesson snapshot without publishing Questions or losing import compatibility", () => {
    const bytes = readFileSync(SCIENCE_DRAFT_PACK);
    expect(sha256(bytes)).toBe("8f7446fd3eca1150e26d15f7f9a7b7f41bc196303a7974582638c85cff4c403a");
    expect(bytes.byteLength).toBeLessThanOrEqual(MAX_TRACK_PACK_BYTES);
    const pack = JSON.parse(bytes.toString("utf8"));
    expect(hashCanonicalJson(pack)).toBe("83bc36270957427f7d84748a6688ac7f39e6e7ec382fcef4a0fe91ceb2ad883a");
    const lessons = pack.track.modules.flatMap((entry: { lessons: { id: string; status: string }[] }) => entry.lessons);
    expect(lessons.map((lesson: { id: string }) => lesson.id).sort()).toEqual(Array.from({ length: 40 }, (_, index) => `CIE-${String(index + 1).padStart(2, "0")}`));
    expect(lessons.every((lesson: { status: string }) => lesson.status === "draft")).toBe(true);
    expect(pack.questions).toHaveLength(320);
    expect(pack.questions.every((question: { status: string }) => question.status === "draft")).toBe(true);
  });
  it("covers all40source lessons once across user batch boundaries with a compatible final pack", () => {
    const ids = [...PILOT, ...BATCHES.flat()];
    expect(new Set(ids).size).toBe(40);
    expect(BATCHES[3]).toContain("CIE-32");
    const result = buildSciencePack(process.cwd(), ids, 6);
    expect(result.byteLength).toBeLessThanOrEqual(MAX_TRACK_PACK_BYTES);
    expect(hashCanonicalJson(JSON.parse(JSON.stringify(result.pack)))).toBe(result.contentHash);
    expect(result.pack.questions).toHaveLength(320);
    expect(result.pack.track.modules[0].lessons.every(lesson => lesson.status === "draft")).toBe(true);
    expect(result.pack.questions.every(question => question.status === "draft" && question.provenance.type === "generated")).toBe(true);
    expect(result.pack.curriculumRequirements).toEqual([]);
    expect(result.pack.conceptPrerequisites).toEqual([]);
  });
  it("fails unknown source fields and requires every canonical Concept disposition", () => {
    const inputs = loadInputs(process.cwd());
    expect(() => editorialPackSchema.parse({ ...inputs.packs[0].pack, ignored: "must not silently disappear" })).toThrow();
    const ids = inputs.packs.flatMap(row => row.pack.lesson.concepts.map(concept => concept.id));
    const existing = JSON.parse(readFileSync(".estudisc-agent-context/EXISTING-CONCEPTS.json", "utf8")) as { id: string }[];
    const existingIds = new Set(existing.map(row => row.id));
    expect(() => validateConceptMap(inputs.conceptMap, ids, existingIds)).not.toThrow();
    expect(() => validateConceptMap({ ...inputs.conceptMap, entries: inputs.conceptMap.entries.slice(1) }, ids, existingIds)).toThrow();
    const first = inputs.conceptMap.entries[0];
    expect(() => validateConceptMap({ ...inputs.conceptMap, entries: [{ ...first, disposition: "intentional_new" }, ...inputs.conceptMap.entries.slice(1)] }, ids, existingIds)).toThrow();
  });
  it("versions the cleaned source snapshot while preserving Questions and figure metadata", () => {
    const ids = [...PILOT, ...BATCHES.flat()];
    const before = buildSciencePack(process.cwd(), ids, 6).pack;
    const media = mediaAssetsSchema.parse(JSON.parse(readFileSync(SCIENCE_MEDIA_ASSETS, "utf8")));
    expect(media.assets).toHaveLength(13);
    const result = buildCriticalSciencePack();
    expect(result.byteLength).toBeLessThanOrEqual(MAX_TRACK_PACK_BYTES);
    expect(result.pack.version).toBe(8);
    expect(result.pack.questions).toEqual(before.questions);
    const lessons = result.pack.track.modules[0].lessons;
    const figures = lessons.filter(lesson => lesson.blocks.some(block => block.type === "figure"));
    expect(figures).toHaveLength(13);
    for (const lesson of lessons) {
      const original = before.track.modules[0].lessons.find(candidate => candidate.id === lesson.id)!;
      expect(lesson.version).toBe(lesson.blocks.some(block => block.type === "figure") ? 4 : 3);
      expect(lesson.blocks.length).toBeLessThanOrEqual(original.blocks.length);
      expect(lesson.blocks.every(block => {
        if (block.type === "figure") return true;
        const editorial = block.payload.editorial as { type?: string } | undefined;
        return !["IMAGE_REQUEST", "DETERMINISTIC_COMPONENT_REQUEST"].includes(String(editorial?.type));
      })).toBe(true);
    }
    for (const figure of figures.flatMap(lesson => lesson.blocks.filter(block => block.type === "figure"))) {
      const editorial = figure.payload.editorial as { omittedBriefing?: Record<string, unknown> };
      expect(editorial.omittedBriefing).toMatchObject({ factualReviewStatus: "PENDING", visualReviewStatus: "PENDING" });
      expect(editorial.omittedBriefing?.sourceRequest).toBeTruthy();
    }
    expect(result.pack.track.metadata.scienceIntegration).toMatchObject({
      sourceLessonVersion: 2,
      runtimeMediaLessonVersions: Object.fromEntries(figures.map(lesson => [lesson.id, 4]))
    });
  });
});

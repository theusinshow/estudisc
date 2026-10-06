import { describe, expect, it } from "vitest";
import { BATCHES, PILOT, editorialPackSchema, mediaAssetsSchema } from "../tools/science-import/contracts";
import { buildSciencePack, loadInputs, sha256, validateConceptMap } from "../tools/science-import/mapper";
import { MAX_TRACK_PACK_BYTES } from "../src/features/import/application/import-request";
import { readFileSync } from "node:fs";
import { hashCanonicalJson } from "../src/lib/canonical-json";
import { SCIENCE_DRAFT_PACK, SCIENCE_MEDIA_ASSETS } from "../tools/science-import/paths";

describe("Science draft import infrastructure", () => {
  it("preserves the sealed forty-lesson snapshot without publishing Questions or losing import compatibility", () => {
    const bytes = readFileSync(SCIENCE_DRAFT_PACK);
    expect(sha256(bytes)).toBe("a44180849db02d397efc4da100267889ae5132c39218ea2184e2966ceb3b91e2");
    expect(bytes.byteLength).toBeLessThanOrEqual(MAX_TRACK_PACK_BYTES);
    const pack = JSON.parse(bytes.toString("utf8"));
    expect(hashCanonicalJson(pack)).toBe("722f1deeb98c55cb121f988931596830a68c5bd4ab15fcf7754f49ebe574bc27");
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
  it("versions only media-changed lessons while preserving all Questions and unchanged lesson content", () => {
    const ids = [...PILOT, ...BATCHES.flat()];
    const before = buildSciencePack(process.cwd(), ids, 6).pack;
    const media = mediaAssetsSchema.parse(JSON.parse(readFileSync(SCIENCE_MEDIA_ASSETS, "utf8")));
    const result = buildSciencePack(process.cwd(), ids, 7, undefined, media);
    expect(result.byteLength + 1).toBeLessThanOrEqual(MAX_TRACK_PACK_BYTES);
    expect(result.pack.questions).toEqual(before.questions);
    const changed = result.pack.track.modules[0].lessons.filter(lesson => lesson.blocks.some(block => block.type === "figure"));
    expect(changed).toHaveLength(13);
    for (const lesson of result.pack.track.modules[0].lessons) {
      const original = before.track.modules[0].lessons.find(candidate => candidate.id === lesson.id)!;
      if (!changed.includes(lesson)) expect(lesson).toEqual(original);
      else {
        expect(lesson.version).toBe(3);
        expect({ ...lesson, version: 2, blocks: original.blocks }).toEqual(original);
      }
    }
    expect(result.pack.track.metadata.scienceIntegration).toMatchObject({ sourceLessonVersion: 2, runtimeMediaLessonVersions: Object.fromEntries(changed.map(lesson => [lesson.id, 3])) });
  });
});

import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { Studio } from "../../tools/estudisc-content-studio/workspace";
import { loadBlueprintCorpus, blueprintSources } from "../../tools/estudisc-content-studio/blueprint-sources";
import { createLessonBlueprint, blueprintReport, teachingWordCount } from "../../tools/estudisc-content-studio/blueprint-policy";
import { runBlueprintPipeline } from "../../tools/estudisc-content-studio/blueprints";
import { lessonBlueprintSchema } from "../../tools/estudisc-content-studio/blueprint-contracts";

const root = process.cwd(), corpus = loadBlueprintCorpus(root);
const hashes = { corpusHash: "a".repeat(64), dependencyHash: "b".repeat(64), policyHash: "c".repeat(64), assetHash: "d".repeat(64) };
const now = "2026-10-07T12:00:00Z";
const original = corpus[0].pack.track.modules[0].lessons[0];

describe("local UNREVIEWED lesson blueprints", () => {
  it("extracts each of 132 exact audited versions without teaching payloads, Question answers or bytes", () => {
    const results = corpus.flatMap(({ pack }) => pack.track.modules.flatMap(m => m.lessons.map(l => createLessonBlueprint(pack, m.subjectCode, l, hashes, [], now))));
    expect(results).toHaveLength(132);
    expect(new Set(results.map(b => hashCanonicalJson(b.identity))).size).toBe(132);
    expect(results.every(b => b.reviewState === "UNREVIEWED" && b.commonMistakes.length === 0 && b.summary.sourceStatus === "draft")).toBe(true);
    expect(results.filter(b => b.learningGoal === null)).toHaveLength(113);
    const exported = JSON.stringify(results);
    expect(exported).not.toMatch(/data:image|"payload"|"answer"|"choices"|"config"/);
    const report = blueprintReport(results);
    expect(report.lessons).toBe(132);
    expect(report.missingObjectives).toBe(113);
    expect(Object.values(report.levels).reduce((n, v) => n + v, 0)).toBe(132);
    expect(report.exceptions.every(e => e.reasons.length > 0)).toBe(true);
    expect(blueprintReport(results)).toEqual(report);
  });

  it("keeps missing goals explicit, classifies accent-insensitively and reports invalid prerequisites", () => {
    for (const title of ["Frações", "Expressões algébricas", "Contagem"]) {
      const explicit = { ...original, title, concepts: original.concepts.map(c => ({ ...c, title })), objectives: ["Explorar o exemplo escrito"] };
      const proposal = createLessonBlueprint(corpus[0].pack, "MAT", explicit, hashes, [], now);
      expect(proposal.recommendedBlocks).toContain("numeric-explorer"); expect(proposal.reviewState).toBe("UNREVIEWED");
    }
    const pack = structuredClone(corpus[0].pack), lesson = structuredClone(original);
    lesson.title = "Porcentagem e proporção"; lesson.objectives = [];
    let result = createLessonBlueprint(pack, "MAT", lesson, hashes, [], now);
    expect(result).toMatchObject({ learningGoal: null, confidence: 0.60, needsDeepReview: true, archetypes: ["numeric"], recommendedBlocks: ["numeric-explorer", "worked-example"] });
    lesson.objectives = ["Calcular porcentagens"];
    result = createLessonBlueprint(pack, "MAT", lesson, hashes, [], now);
    expect(result).toMatchObject({ confidence: 0.90, needsDeepReview: false, reviewState: "UNREVIEWED" });
    lesson.prerequisiteConceptIds.push("unresolved-fixture");
    result = createLessonBlueprint(pack, "MAT", lesson, hashes, [], now);
    expect(result.reviewReasons).toContain("unresolved_prerequisite_reference");
    const conceptId = lesson.concepts[0].id;
    pack.conceptPrerequisites.push({ conceptId, prerequisiteConceptId: conceptId, strength: "required" });
    expect(createLessonBlueprint(pack, "MAT", lesson, hashes, [], now).reviewReasons).toContain("prerequisite_cycle");
    expect(lessonBlueprintSchema.safeParse({ ...result, reviewState: "APPROVED" }).success).toBe(false);
  });

  it("invalidates source, corpus, mappings, implementation policy and asset rights independently", () => {
    const base = createLessonBlueprint(corpus[0].pack, "MAT", original, hashes, [], now);
    for (const key of ["corpusHash", "dependencyHash", "policyHash", "assetHash"] as const) {
      const changed = createLessonBlueprint(corpus[0].pack, "MAT", original, { ...hashes, [key]: "e".repeat(64) }, [], now);
      expect(changed.inputHash, key).not.toBe(base.inputHash);
      expect(changed.sourceHash, key).toBe(base.sourceHash);
    }
    const changedLesson = structuredClone(original); changedLesson.title += " revised";
    expect(createLessonBlueprint(corpus[0].pack, "MAT", changedLesson, hashes, [], now).sourceHash).not.toBe(base.sourceHash);
    const countLesson = structuredClone(original);
    countLesson.blocks = [{ id: "fixture", type: "note", schemaVersion: 1, conceptIds: [], payload: { content: "Três palavras aqui", answer: "not counted", src: "data:image/svg+xml;base64,secret", config: { text: "not counted" } } }];
    expect(teachingWordCount(countLesson)).toBe(3);
  });

  it("skips actual unchanged artifacts, preserves timestamps and repairs corrupted or invented review state", () => {
    mkdirSync(join(root, ".local"), { recursive: true });
    const workspace = mkdtempSync(join(root, ".local/blueprint-tests-"));
    const studio = new Studio(root, workspace);
    const first = runBlueprintPipeline(studio, now);
    expect(first.generated).toBe(132); expect(first.skipped).toBe(0);
    const second = runBlueprintPipeline(studio, "2026-10-08T12:00:00Z");
    expect(second.generated).toBe(0); expect(second.skipped).toBe(132);
    expect(second.index).toEqual(first.index);
    const file = join(first.directory, first.index.items[0].path);
    const before = JSON.parse(readFileSync(file, "utf8"));
    expect(before.generatedAt).toBe(now);
    writeFileSync(file, JSON.stringify({ ...before, reviewState: "APPROVED" }));
    const repaired = runBlueprintPipeline(studio, "2026-10-09T12:00:00Z");
    expect(repaired.generated).toBe(1); expect(repaired.skipped).toBe(131);
    expect(JSON.parse(readFileSync(file, "utf8")).reviewState).toBe("UNREVIEWED");
    writeFileSync(file, "{broken");
    expect(runBlueprintPipeline(studio, now).generated).toBe(1);
    expect(existsSync(join(first.directory, "report.json"))).toBe(true);
    studio.init("CIE-06");
    const mediaFile = join(studio.dir("CIE-06"), "research/media-pack.json");
    const media = JSON.parse(readFileSync(join(root, "tools/estudisc-content-studio/fixtures/CIE-06/research/media-pack.json"), "utf8"));
    writeFileSync(mediaFile, JSON.stringify(media));
    const withAssets = runBlueprintPipeline(studio, now);
    expect(withAssets.generated).toBe(132);
    expect(withAssets.index.assetHash).not.toBe(first.index.assetHash);
    expect(existsSync(file)).toBe(true); // Previous versioned generations are retained.
    expect(runBlueprintPipeline(studio, now).skipped).toBe(132);
    media.images[0].licenseStatus = "REJECTED";
    writeFileSync(mediaFile, JSON.stringify(media));
    const withdrawn = runBlueprintPipeline(studio, now);
    expect(withdrawn.generated).toBe(132);
    expect(withdrawn.index.assetHash).not.toBe(withAssets.index.assetHash);
  });

  it("fails closed when an audited source changes rather than silently treating new content as published", () => {
    mkdirSync(join(root, ".local"), { recursive: true });
    const fixtureRoot = mkdtempSync(join(root, ".local/blueprint-source-tests-"));
    const path = join(fixtureRoot, blueprintSources[0].path);
    mkdirSync(join(path, ".."), { recursive: true });
    const changed = structuredClone(corpus[0].pack); changed.track.title += " changed";
    writeFileSync(path, JSON.stringify(changed));
    expect(() => loadBlueprintCorpus(fixtureRoot)).toThrow("differs from audited import");
    expect(() => runBlueprintPipeline(new Studio(root, "public/blueprint-fixture"), now)).toThrow("ignored authoring workspace");
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { conceptMapSchema, sourceLibrarySchema } from "./contracts";
import { buildEditorialPack, readJson, sha256, type EditorialInputs, type EditorialProfile, type ProjectedPack } from "./mapper";

export const PORTUGUESE_SOURCE = "packs/drafts/ifsc-2027-portuguese/source";
export const PORTUGUESE_MAP = ".estudisc-agent-context/portuguese/CONCEPT-MAP.json";
export const PORTUGUESE_PILOT = ["POR-01", "POR-08", "POR-11", "POR-13", "POR-16", "POR-17", "POR-19", "POR-23"];
export const PORTUGUESE_BATCHES = Array.from({ length: 4 }, (_, batch) => Array.from({ length: 6 }, (_, index) => `POR-${String(batch * 6 + index + 1).padStart(2, "0")}`));
export const PORTUGUESE_PROFILE: EditorialProfile = { trackId: "ifsc-2027-portuguese", trackTitle: "IFSC 2027 - Língua Portuguesa", moduleId: "por", moduleTitle: "Língua Portuguesa", subjectCode: "POR", packId: "vecta.ifsc-2027.portuguese.local-v1", contentVersion: 2, questionVersion: 1, editorialSourceVersion: 1, generationRunId: "vecta.portuguese.editorial-v1", officialSourceId: "POR-SRC-001", metadataKey: "portugueseIntegration", sourceMetadataKey: "portugueseEditorialSource", estimatedMinutesIsIntegrationDefault: false };
const text = z.string().min(1);
const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("HOOK"), title: text, content: text }).strict(),
  z.object({ type: z.literal("LEARNING_GOALS"), items: z.array(text).min(1) }).strict(),
  z.object({ type: z.literal("KEY_TERMS"), items: z.array(z.object({ term: text, conceptRef: text }).strict()).min(1) }).strict(),
  z.object({ type: z.literal("EXPLANATION"), title: text, paragraphs: z.array(text).min(1) }).strict(),
  z.object({ type: z.literal("MISCONCEPTION_CHECK"), items: z.array(z.object({ claim: text, status: z.literal("INCORRECT"), instruction: text }).strict()).min(1) }).strict(),
  z.object({ type: z.literal("WORKED_EXAMPLE"), stimulus: text, analysis: text }).strict(),
  z.object({ type: z.literal("ACTIVE_LEARNING"), title: text, steps: z.array(text).min(1), evidence: text }).strict(),
  z.object({ type: z.literal("IFSC_STRATEGY"), content: text }).strict(),
  z.object({ type: z.literal("SUMMARY"), items: z.array(text).min(1) }).strict(),
  z.object({ type: z.literal("EXIT_TICKET"), prompt: text }).strict()
]);
const conceptSchema = z.object({ editorialConceptId: text, lessonId: text, name: text, masteryTarget: text, status: z.literal("EDITORIAL") }).strict();
export const portuguesePackSchema = z.object({
  lesson: z.object({ id: z.string().regex(/^POR-\d{2}$/), subject: z.literal("POR"), title: text, module: text, priority: z.enum(["P0", "P1", "P2"]), status: z.literal("IMPORT_READY"), estimatedMinutes: z.number().int().positive(), masteryTarget: text, sourceRefs: z.array(text), conceptRefs: z.array(text).length(6), blocks: z.array(blockSchema).min(1), media: z.object({ deterministicAssetRefs: z.array(text), antigravityRefs: z.array(text), authenticMediaRefs: z.array(text) }).strict() }).strict(),
  questions: z.array(z.object({ id: text, lessonId: text, type: z.literal("MCQ"), stimulus: text.optional(), stem: text, options: z.array(z.object({ id: z.enum(["A", "B", "C", "D", "E"]), text }).strict()).length(5), correctOption: z.enum(["A", "B", "C", "D", "E"]), explanation: text, difficulty: z.enum(["foundation", "direct", "applied", "ifsc"]), cognitiveOperation: z.enum(["recognize", "understand", "discriminate", "analyze", "apply", "evaluate", "diagnose_error", "analyze_context"]), concepts: z.array(text).min(1), targetedError: text, provenance: z.literal("VECTA_ORIGINAL") }).strict()).length(8),
  concepts: z.array(conceptSchema).length(6),
  qa: z.object({ lessonId: text, status: z.literal("PASS"), checks: z.object({ sourceRefsResolve: z.boolean(), questionCount: z.literal(8), eachQuestionHasFiveOptions: z.boolean(), originalCoreContent: z.boolean() }).strict(), editorialCautions: z.array(text) }).strict()
}).strict();
const conceptsSchema = z.object({ count: z.literal(144), concepts: z.array(conceptSchema).length(144) }).strict();
export type PortuguesePack = z.infer<typeof portuguesePackSchema>;

export function loadPortugueseInputs(root: string) {
  const sourceRoot = resolve(root, PORTUGUESE_SOURCE);
  const concepts = conceptsSchema.parse(readJson(resolve(sourceRoot, "PORTUGUESE-CONCEPTS.json"))).concepts;
  const originals = Array.from({ length: 24 }, (_, index) => {
    const lessonId = `POR-${String(index + 1).padStart(2, "0")}`;
    const bytes = readFileSync(resolve(sourceRoot, `workspace/${lessonId}/approved/pack.json`));
    const original = portuguesePackSchema.parse(JSON.parse(bytes.toString("utf8")));
    assert.equal(original.lesson.id, lessonId);
    const targets = concepts.filter(concept => concept.lessonId === lessonId);
    assert.deepEqual(original.concepts, targets, "Pack Concepts differ from source registry");
    assert.deepEqual(targets.map(concept => concept.editorialConceptId), original.lesson.conceptRefs);
    for (const question of original.questions) {
      assert.equal(question.lessonId, lessonId);
      assert.deepEqual(new Set(question.options.map(option => option.id)), new Set(["A", "B", "C", "D", "E"]));
      assert.equal(question.options.filter(option => option.id === question.correctOption).length, 1);
      assert(question.concepts.every(id => original.lesson.conceptRefs.includes(id)), `Unknown Concept in ${question.id}`);
    }
    const pack: ProjectedPack = {
      lesson: { title: original.lesson.title, estimatedMinutes: original.lesson.estimatedMinutes, concepts: targets.map(concept => ({ id: concept.editorialConceptId, name: concept.name, masteryTarget: concept.masteryTarget })), sourceRefs: original.lesson.sourceRefs, mediaRefs: [], blocks: original.lesson.blocks.map((block, index) => {
        const paragraphs: string[] = [];
        if ("content" in block) paragraphs.push(block.content);
        if ("paragraphs" in block) paragraphs.push(...block.paragraphs);
        if ("stimulus" in block) paragraphs.push(block.stimulus, block.analysis);
        if ("prompt" in block) paragraphs.push(block.prompt);
        if ("steps" in block) paragraphs.push(...block.steps, block.evidence);
        if ("items" in block) for (const item of block.items) {
          if (typeof item === "string") paragraphs.push(item);
          else if ("term" in item) { assert(original.lesson.conceptRefs.includes(item.conceptRef)); paragraphs.push(item.term); }
          else paragraphs.push(item.claim, item.status, item.instruction);
        }
        return { id: `${lessonId}-B${String(index + 1).padStart(2, "0")}`, type: block.type === "SUMMARY" ? "SUMMARY" as const : block.type === "WORKED_EXAMPLE" ? "WORKED_EXAMPLE" as const : "EXPLANATION" as const, title: "title" in block ? block.title : ({ LEARNING_GOALS: "Objetivos de aprendizagem", KEY_TERMS: "Termos essenciais", MISCONCEPTION_CHECK: "Verificação de concepções", WORKED_EXAMPLE: "Exemplo comentado", IFSC_STRATEGY: "Estratégia para o IFSC", SUMMARY: "Resumo", EXIT_TICKET: "Verificação de aprendizagem" } as Record<string, string>)[block.type], content: paragraphs.join("\n\n") };
      }) },
      questions: original.questions.map(question => ({ id: question.id, type: "MULTIPLE_CHOICE_SINGLE", stem: question.stimulus ? `${question.stimulus}\n\n${question.stem}` : question.stem, options: question.options.map(option => ({ key: option.id, text: option.text })), correctOption: question.correctOption, explanation: question.explanation, difficulty: question.difficulty.toUpperCase() as "FOUNDATION" | "DIRECT" | "APPLIED" | "IFSC", cognitiveOperation: ({ recognize: "UNDERSTAND", understand: "UNDERSTAND", discriminate: "ANALYZE", analyze: "ANALYZE", apply: "APPLY", evaluate: "EVALUATE", diagnose_error: "ANALYZE", analyze_context: "ANALYZE" } as const)[question.cognitiveOperation], conceptIds: question.concepts, targetedError: question.targetedError, provenance: "ORIGINAL_VECTA_GROUNDED_V2" }))
    };
    return { lessonId, sourceHash: sha256(bytes), pack, original };
  });
  const inputs: EditorialInputs = { sourceRoot, packs: originals, library: sourceLibrarySchema.parse(readJson(resolve(sourceRoot, "PORTUGUESE-SOURCE-LIBRARY.json"))), conceptMap: conceptMapSchema.parse(readJson(resolve(root, PORTUGUESE_MAP))) };
  return { inputs, originals, concepts };
}
export function buildPortuguesePack(root: string, lessonIds: string[], snapshotVersion: number) {
  const { inputs, originals, concepts } = loadPortugueseInputs(root);
  const result = buildEditorialPack(root, lessonIds, snapshotVersion, inputs, PORTUGUESE_PROFILE);
  // Hash original editorial blocks, preserving their original types and complete sidecar records.
  for (const lesson of result.pack.track.modules[0].lessons) {
    const original = originals.find(row => row.lessonId === lesson.id)!.original;
    lesson.blocks.forEach((block, index) => { block.payload.editorial = { id: block.id, type: original.lesson.blocks[index].type, sourceHash: hashCanonicalJson(original.lesson.blocks[index]) }; });
  }
  // Final hash must describe the exact adapted candidate, including original block pointers.
  return { ...result, contentHash: hashCanonicalJson(result.pack), byteLength: Buffer.byteLength(JSON.stringify(result.pack)), originals, concepts };
}

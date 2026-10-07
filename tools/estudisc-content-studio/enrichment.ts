import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import type { TrackPackV2 } from "@/features/import/application/track-pack-v2-schema";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { Studio, atomicJson } from "./workspace";
import { categories, lessonSchema } from "./contracts";
import { enrichmentRecipeSchema } from "./enrichment-contracts";
import { lessonBlueprintSchema, type LessonBlueprint } from "./blueprint-contracts";
import { runBlueprintPipeline } from "./blueprints";
import { loadBlueprintCorpus } from "./blueprint-sources";
import { directPublicationSchema } from "@/features/content-qa/direct-publication";
import { socialReleasePolicy, socialPublicationReason } from "./social-release-policy";

const policyFiles = ["tools/estudisc-content-studio/enrichment.ts", "tools/estudisc-content-studio/enrichment-contracts.ts", "tools/estudisc-content-studio/social-release-policy.ts", "docs/ADR/0048-social-project-direct-release.md", "src/features/content-qa/direct-publication.ts", "tools/estudisc-content-studio/ENRICHMENT-PREVIEW-POLICY.md", "tools/estudisc-content-studio/contracts.ts", "src/features/questions/contracts.ts", "src/features/activities/application/question-reference.ts", "src/features/lessons/blocks/numeric-explorer-schema.ts", "src/features/lessons/blocks/numeric-explorer.tsx", "src/features/lessons/blocks/lesson-block-renderer.tsx", "src/features/lessons/interaction-state.ts", "src/features/lessons/interaction-policy.ts"];

/** Pure construction of an isolated review candidate, never a reviewed/import-ready artifact. */
export function createEnrichmentPreview(pack: TrackPackV2, inputBlueprint: LessonBlueprint, inputRecipe: unknown) {
  const recipe = enrichmentRecipeSchema.parse(inputRecipe), blueprint = lessonBlueprintSchema.parse(inputBlueprint);
  if (hashCanonicalJson(recipe.identity) !== hashCanonicalJson(blueprint.identity) || pack.track.id !== recipe.identity.trackId || pack.version !== recipe.identity.trackVersion) throw new Error("Enrichment identity differs from actual source/blueprint");
  const moduleRecord = pack.track.modules.find(m => m.lessons.some(l => l.id === recipe.identity.lessonId && l.version === recipe.identity.lessonVersion));
  const source = moduleRecord?.lessons.find(l => l.id === recipe.identity.lessonId && l.version === recipe.identity.lessonVersion);
  if (!source || !moduleRecord || hashCanonicalJson(source) !== recipe.sourceLessonHash) throw new Error("Enrichment source lesson hash/version changed");
  if (blueprint.sourceHash !== hashCanonicalJson({ identity: recipe.identity, subjectCode: moduleRecord.subjectCode, lesson: source })) throw new Error("Blueprint is not bound to the actual source lesson");
  if (recipe.newVersion !== source.version + 1) throw new Error("Use the next immutable lesson version");
  const ids = new Set(pack.track.modules.flatMap(m => m.lessons.flatMap(l => [l.id, ...l.concepts.map(c => c.id), ...l.blocks.map(b => b.id), ...l.activities.map(a => a.id)])));
  pack.questions.forEach(q => ids.add(q.id));
  const newBlocks = recipe.additions.map(addition => {
    const anchor = source.blocks.find(b => b.id === addition.afterBlockId);
    if (!anchor || hashCanonicalJson(anchor) !== addition.sourceBlockHash || typeof anchor.payload.content !== "string" || !anchor.payload.content.includes(addition.sourceQuote)) throw new Error("Enrichment source anchor/quote changed");
    if (!source.objectives.includes(addition.objective) || !source.concepts.some(c => c.id === addition.conceptId) || !anchor.conceptIds.includes(addition.conceptId)) throw new Error("Enrichment objective/Concept must exist in the authored source anchor");
    if (!blueprint.recommendedBlocks.includes(addition.type)) throw new Error("Interaction not proposed by the current blueprint");
    if (ids.has(addition.newBlockId)) throw new Error("Enrichment block identity collision");
    ids.add(addition.newBlockId);
    const parameters = addition.parameters;
    const computed = "mode" in parameters ? parameters.slope * parameters.initial + parameters.intercept : parameters.initialValue * parameters.initialPercentage / 100;
    if (Math.abs(computed - addition.expectedInitialResult) > 1e-9) throw new Error("Expected initial result disagrees with existing numeric calculation");
    const provenance = anchor.payload.contentStudio;
    return { id: addition.newBlockId, schemaVersion: 1, type: addition.type, conceptIds: [addition.conceptId], payload: { ...addition.parameters,
      contentStudio: { ...(provenance && typeof provenance === "object" ? structuredClone(provenance) : {}), enrichment: { purpose: addition.purpose, sourceBlockId: anchor.id, sourceBlockHash: addition.sourceBlockHash, objective: addition.objective, recipeHash: hashCanonicalJson(recipe), reviewStatus: "community_feedback_pending" } } } };
  });
  const original = structuredClone(source);
  const lesson = lessonSchema.parse({ ...original, version: recipe.newVersion, status: "draft",
    blocks: original.blocks.flatMap(block => [block, ...newBlocks.filter((_, index) => recipe.additions[index].afterBlockId === block.id)]) });
  const questionIds = [...new Set([...source.exitTicketQuestionIds, ...source.activities.flatMap(a => a.questionId ? [a.questionId] : [])])];
  const questionReferences = questionIds.map(id => {
    const question = pack.questions.find(q => q.id === id);
    if (!question) throw new Error("Source Question reference unresolved");
    return { id, version: question.version, hash: hashCanonicalJson(question) };
  });
  return { recipe, lesson, newBlocks, questionReferences, sourceLessonHash: recipe.sourceLessonHash, blueprintHash: hashCanonicalJson(blueprint),
    blueprintInputHash: blueprint.inputHash, recipeHash: hashCanonicalJson(recipe), previewHash: hashCanonicalJson(lesson), questionHash: hashCanonicalJson(questionReferences) };
}

export function prepareEnrichmentPreview(studio: Studio, inputRecipe: unknown) {
  const recipe = enrichmentRecipeSchema.parse(inputRecipe);
  const workspace = relative(studio.root, studio.workspace).replaceAll("\\", "/");
  if (!workspace.startsWith(".local/") && workspace !== "tools/estudisc-content-studio/workspace" && !workspace.startsWith("tools/estudisc-content-studio/workspace/")) throw new Error("Enrichment previews require an ignored authoring workspace");
  const pipeline = runBlueprintPipeline(studio);
  const entry = pipeline.index.items.find(item => hashCanonicalJson(item.identity) === hashCanonicalJson(recipe.identity));
  if (!entry) throw new Error("Enrichment lesson version is not in the current blueprint inventory");
  const blueprint = lessonBlueprintSchema.parse(JSON.parse(readFileSync(join(pipeline.directory, entry.path), "utf8")));
  if (hashCanonicalJson(blueprint) !== entry.blueprintHash) throw new Error("Blueprint changed during preview preparation");
  const corpus = loadBlueprintCorpus(studio.root), source = corpus.find(s => s.pack.track.id === recipe.identity.trackId)!;
  const preview = createEnrichmentPreview(source.pack, blueprint, recipe);
  const policyHash = hashCanonicalJson(Object.fromEntries([...policyFiles, "docs/ADR/0050-source-bound-linear-enrichment.md", "docs/ADR/0051-explicit-discrete-linear-input.md", "src/features/lessons/blocks/linear-explorer.tsx", "src/features/lessons/use-interaction-state.ts"].map(file => [file, createHash("sha256").update(readFileSync(join(studio.root, file))).digest("hex")])));
  const inputHashes = { sourceLesson: preview.sourceLessonHash, sourcePack: source.canonicalHash, blueprint: preview.blueprintHash, blueprintInputs: preview.blueprintInputHash, recipe: preview.recipeHash, questions: preview.questionHash, preview: preview.previewHash, policy: policyHash, assets: pipeline.index.assetHash };
  const key = hashCanonicalJson(inputHashes), rootDirectory = studio.dir("enrichment-previews");
  if (existsSync(join(rootDirectory, "state.json"))) throw new Error("Enrichment directory conflicts with a Studio job");
  const directory = join(rootDirectory, key);
  const reviewRequest = { schemaVersion: 1, gate: "ADMIN_DIRECT_AUTHORIZED", blueprintReviewState: blueprint.reviewState, identity: recipe.identity, proposedVersion: recipe.newVersion, authorId: recipe.authorId,
    inputHashes, dimensions: categories, sourcePath: source.path, sourceCaveats: blueprint.summary.caveats,
    expectations: ["Validate the source/interaction technically, preserve Questions and disclose actual source/rights/mapping caveats", "Activate through existing authenticated Admin Direct after compatible targeted import; community feedback supplies product/content review", "Do not fabricate independent QA or replace the published original in place"],
    releasePolicy: socialReleasePolicy, independentQaRecorded: false,
    publicationRequest: { action: "publish_lessons_direct", ...directPublicationSchema.parse({ lessons: [{ lessonId: recipe.identity.lessonId, version: recipe.newVersion }], reason: socialPublicationReason }) },
    noFabricatedEditorialApproval: true, noImportOrPublication: false, newMedia: false, evidence: "exploration_only_no_Attempt_or_mastery" };
  let written = 0;
  for (const [name, value] of [["preview.lesson.json", preview.lesson], ["recipe.json", recipe], ["release-request.json", reviewRequest], ["references.json", preview.questionReferences]] as const) {
    const file = join(directory, name), content = JSON.stringify(value, null, 2) + "\n";
    if (!existsSync(file) || readFileSync(file, "utf8") !== content) { atomicJson(file, value); written++; }
  }
  return { directory, written, key, reviewRequest, preview };
}

import { loadBlueprintCorpus } from "../../tools/estudisc-content-studio/blueprint-sources";
import { createLessonBlueprint } from "../../tools/estudisc-content-studio/blueprint-policy";
import { createEnrichmentPreview } from "../../tools/estudisc-content-studio/enrichment";
import defaultRecipe from "../../tools/estudisc-content-studio/recipes/percentage-calculation.v1.json";
import { enrichmentRecipeSchema } from "../../tools/estudisc-content-studio/enrichment-contracts";

/** Disposable memory harness only. Published fixture flags never certify the real draft proposal. */
export function enrichmentPreviewFixture(inputRecipe: unknown = defaultRecipe) {
  const recipe = enrichmentRecipeSchema.parse(inputRecipe);
  const input = loadBlueprintCorpus(process.cwd())[0].pack;
  const moduleRecord = input.track.modules.find(m => m.lessons.some(l => l.id === recipe.identity.lessonId))!;
  const source = moduleRecord.lessons.find(l => l.id === recipe.identity.lessonId)!;
  const hashes = { corpusHash: "a".repeat(64), dependencyHash: "b".repeat(64), policyHash: "c".repeat(64), assetHash: "d".repeat(64) };
  const blueprint = createLessonBlueprint(input, moduleRecord.subjectCode, source, hashes, [], "2026-10-07T12:00:00Z");
  const preview = createEnrichmentPreview(input, blueprint, recipe);
  const pack = structuredClone(input);
  const suffix = `${recipe.identity.lessonId.toLowerCase()}-v${recipe.newVersion}`;
  pack.packId = `estudisc.enrichment.fixture.${suffix}`; pack.track.id = `enrichment-preview-fixture-${suffix}`;
  pack.track.modules.find(m => m.id === moduleRecord.id)!.lessons.splice(moduleRecord.lessons.indexOf(source), 1, preview.lesson);
  for (const moduleDefinition of pack.track.modules) for (const lesson of moduleDefinition.lessons) {
    const pilot = lesson.id === recipe.identity.lessonId;
    lesson.id = pilot ? `ENRICHMENT-PREVIEW-${recipe.identity.lessonId}-V${recipe.newVersion}` : `${lesson.id}-enrichment-${suffix}`;
    lesson.blocks.forEach(block => { block.id += `-enrichment-${suffix}`; });
    lesson.activities.forEach(activity => { activity.id += `-enrichment-${suffix}`; });
    lesson.status = pilot ? "published" : "draft";
    if (pilot) lesson.title = "Fixture — prévia de porcentagem";
  }
  pack.questions.forEach(question => { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; });
  return pack;
}

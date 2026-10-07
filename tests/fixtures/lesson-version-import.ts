import { hashCanonicalJson } from "@/lib/canonical-json";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { loadBlueprintCorpus } from "../../tools/estudisc-content-studio/blueprint-sources";
import { createLessonBlueprint } from "../../tools/estudisc-content-studio/blueprint-policy";
import { createEnrichmentPreview } from "../../tools/estudisc-content-studio/enrichment";
import sourceRecipe from "../../tools/estudisc-content-studio/recipes/percentage-calculation.v1.json";

/** Private disposable test context; never a production corpus import or editorial approval. */
export function lessonVersionFixture(published = false) {
  const context = structuredClone(loadBlueprintCorpus(process.cwd())[0].pack);
  context.packId = "estudisc.targeted-version.fixture"; context.track.id = "targeted-version-fixture";
  context.track.modules = context.track.modules.filter(m => m.id === "mat");
  context.track.modules[0].lessons = context.track.modules[0].lessons.filter(l => ["MAT-PREREQ", "MAT-07"].includes(l.id));
  const ids = new Set(context.track.modules[0].lessons.flatMap(l => l.concepts.map(c => c.id)));
  const questionIds = new Set(context.track.modules[0].lessons.flatMap(l => [...l.exitTicketQuestionIds, ...l.activities.flatMap(a => a.questionId ? [a.questionId] : [])]));
  context.questions = context.questions.filter(q => questionIds.has(q.id));
  context.curriculumRequirements = context.curriculumRequirements.filter(r => r.mappedConceptIds.every(id => ids.has(id)));
  context.conceptPrerequisites = context.conceptPrerequisites.filter(p => ids.has(p.conceptId) && ids.has(p.prerequisiteConceptId));
  const base = context.track.modules[0].lessons.find(l => l.id === "MAT-07")!;
  if (published) { base.status = "published"; context.questions.forEach(q => { q.status = "published"; }); }
  const recipe = structuredClone(sourceRecipe);
  recipe.identity.trackId = context.track.id; recipe.sourceLessonHash = hashCanonicalJson(base);
  const h = "0".repeat(64);
  const blueprint = createLessonBlueprint(context, "MAT", base, { corpusHash: h, dependencyHash: h, policyHash: h, assetHash: h }, [], "2026-10-07T12:00:00Z");
  const candidate = createEnrichmentPreview(context, blueprint, recipe);
  const packet = lessonVersionPackSchema.parse({ schema: "caderno.lesson.v2", packId: "estudisc.targeted-version.mat07-v5", version: 1, authorId: "fixture-author",
    target: { trackId: context.track.id, trackVersion: context.version, moduleId: "mat", lessonId: base.id, baseVersion: base.version, baseHash: hashCanonicalJson(base) }, lesson: candidate.lesson, questionReferences: candidate.questionReferences });
  return { context, base, packet };
}

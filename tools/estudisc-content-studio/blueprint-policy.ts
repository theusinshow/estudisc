import type { TrackPackV2 } from "@/features/import/application/track-pack-v2-schema";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { referenceForTeachingAsset, type TeachingAssetEntry } from "./assets";
import { lessonBlueprintSchema, type BlueprintHashes, type LessonBlueprint } from "./blueprint-contracts";

type Lesson = TrackPackV2["track"]["modules"][number]["lessons"][number];
const rules = [
  { name: "spatial", pattern: /\b(mapa|localiz|territor|bioma|relevo|espaco geograf)/, blocks: ["map", "matching"], visual: ["map"], missing: ["map:approved-point-configuration"] },
  { name: "chronological", pattern: /\b(tempo histor|cronolog|periodo|revoluc|independen|coloniz|idade media)/, blocks: ["timeline"], visual: ["timeline"], missing: ["timeline:approved-ordered-items"] },
  { name: "numeric", pattern: /\b(porcent|percent|propor|razao|funcao|equacao|fracao|fracoes|expressao algebr|expressoes algebr|contagem|medida|area|volume)/, blocks: ["numeric-explorer", "worked-example"], visual: ["diagram"], missing: ["numeric-explorer:approved-model-configuration"] },
  { name: "process", pattern: /\b(ciclo|processo|transform|digest|respir|fotossint|reproduc)/, blocks: ["guided-steps", "ordering"], visual: ["process-diagram"], missing: ["guided-steps:approved-process-steps"] },
  { name: "classification", pattern: /\b(classific|genero|classes|substantiv|adjetiv|verbo|reino|mistura)/, blocks: ["classification", "matching"], visual: [], missing: [] },
  { name: "interpretation", pattern: /\b(interpret|leitura|texto|argument|inferenc|coesao|coerenc)/, blocks: ["text-highlight", "guided-steps"], visual: [], missing: [] },
  { name: "comparison", pattern: /\b(compar|diferenc|contraste)/, blocks: ["matching"], visual: ["comparison-figure"], missing: [] }
] as const;
const unique = (values: readonly string[]) => [...new Set(values)].sort();
function plain(text: string) { return text.replace(/<[^>]*>/g, " ").replace(/data:[^\s]+/g, " "); }
/** Count authored teaching strings only. Never inspect Question content, image bytes or answer/config keys. */
export function teachingWordCount(lesson: Lesson) {
  const keys = ["title", "content", "text", "prompt", "explanation", "longDescription", "caption", "label", "items"];
  const text: string[] = [];
  function collect(value: unknown, depth: number) {
    if (depth > 4) return;
    if (typeof value === "string") text.push(plain(value));
    else if (Array.isArray(value)) value.forEach(item => collect(item, depth + 1));
    else if (value && typeof value === "object") for (const key of keys) if (key in value) collect((value as Record<string, unknown>)[key], depth + 1);
  }
  for (const block of lesson.blocks) for (const key of keys) collect(block.payload[key], 0);
  return text.join(" ").match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

export function createLessonBlueprint(pack: TrackPackV2, subjectCode: string, lesson: Lesson, hashes: BlueprintHashes, assets: readonly TeachingAssetEntry[], generatedAt: string): LessonBlueprint {
  const identity = { trackId: pack.track.id, trackVersion: pack.version, lessonId: lesson.id, lessonVersion: lesson.version };
  const sourceHash = hashCanonicalJson({ identity, subjectCode, lesson });
  const inputHash = hashCanonicalJson({ identity, sourceHash, ...hashes, blueprintVersion: 1, policyVersion: "blueprint.v1" });
  const search = `${lesson.title} ${lesson.concepts.map(c => c.title).join(" ")} ${lesson.objectives.join(" ")}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matched = rules.filter(rule => rule.pattern.test(search));
  const conceptIds = lesson.concepts.map(c => c.id);
  const known = new Set(pack.track.modules.flatMap(m => m.lessons.flatMap(l => l.concepts.map(c => c.id))));
  const prerequisites = unique([...lesson.prerequisiteConceptIds, ...pack.conceptPrerequisites.filter(p => conceptIds.includes(p.conceptId)).map(p => p.prerequisiteConceptId)]);
  const edges = new Map<string, string[]>();
  for (const edge of pack.conceptPrerequisites) edges.set(edge.conceptId, [...(edges.get(edge.conceptId) ?? []), edge.prerequisiteConceptId]);
  const done = new Set<string>(), visiting = new Set<string>();
  function cycle(id: string): boolean {
    if (visiting.has(id)) return true;
    if (done.has(id)) return false;
    visiting.add(id);
    if ((edges.get(id) ?? []).some(cycle)) return true;
    visiting.delete(id); done.add(id); return false;
  }
  const reviewReasons: string[] = [];
  if (!lesson.objectives.length) reviewReasons.push("missing_explicit_objectives");
  if (!matched.length) reviewReasons.push("no_specific_archetype_rule");
  if (prerequisites.some(id => !known.has(id))) reviewReasons.push("unresolved_prerequisite_reference");
  if (conceptIds.some(cycle)) reviewReasons.push("prerequisite_cycle");
  const confidenceReasons = [lesson.objectives.length ? "explicit_objectives:+0.25" : "missing_objectives:cap_0.60", matched.length ? "title_concept_rule_match:+0.20" : "generic_explanation_only", "base:0.45", "heuristic_confidence_not_pedagogical_certification"];
  let confidence = 0.45 + (lesson.objectives.length ? 0.25 : 0) + (matched.length ? 0.20 : 0);
  if (!lesson.objectives.length) confidence = Math.min(0.60, confidence);
  if (reviewReasons.some(reason => reason.includes("prerequisite"))) confidence = Math.min(0.60, confidence);
  confidence = Math.round(confidence * 100) / 100;
  if (confidence < 0.70) reviewReasons.push("confidence_below_0.70");
  const caveats = ["local_import_status_is_not_live_release_status", "historical_publication_does_not_certify_pedagogy_rights_or_planner_readiness", "word_count_is_whitelisted_teaching_text_only", "common_mistakes_not_inferred"];
  if (!pack.track.metadata.sourceScopeVerified) caveats.push("source_scope_not_verified");
  if (!lesson.sourceIds.length) caveats.push("missing_lesson_sources");
  if (lesson.sourceIds.some(id => !pack.sources.some(s => s.id === id))) caveats.push("unresolved_lesson_source");
  const recommendedBlocks = unique(matched.length ? matched.flatMap(rule => [...rule.blocks]) : ["guided-steps", "worked-example"]);
  return lessonBlueprintSchema.parse({ schemaVersion: 1, blueprintVersion: 1, policyVersion: "blueprint.v1", identity, sourceHash, ...hashes, inputHash, generatedAt, reviewState: "UNREVIEWED",
    summary: { title: lesson.title, subjectCode, concepts: lesson.concepts.map(({ id, title }) => ({ id, title })), objectives: lesson.objectives, existingBlocks: unique(lesson.blocks.map(b => b.type)), existingActivities: unique(lesson.activities.map(a => a.type)), blockCount: lesson.blocks.length, activityCount: lesson.activities.length, wordCount: teachingWordCount(lesson), sourceIds: lesson.sourceIds, sourceStatus: lesson.status, publicationBasis: "historical-audited-import", caveats },
    learningGoal: lesson.objectives.length ? lesson.objectives.join("; ") : null, commonMistakes: [], archetypes: matched.length ? matched.map(rule => rule.name) : ["explanation"], recommendedBlocks,
    visualNeeds: unique(matched.flatMap(rule => [...rule.visual])), componentNeeds: unique(matched.flatMap(rule => [...rule.missing])), interactionLevel: matched.length ? 2 : 1,
    confidence, confidenceReasons, needsDeepReview: reviewReasons.length > 0, reviewReasons,
    assetCandidates: assets.filter(asset => asset.reusable && asset.subjectCodes.includes(subjectCode) && asset.conceptIds.some(id => conceptIds.includes(id))).map(referenceForTeachingAsset)
  });
}

export function blueprintReport(blueprints: readonly LessonBlueprint[]) {
  function frequencies(values: string[]) { return Object.fromEntries(unique(values).map(value => [value, values.filter(v => v === value).length])); }
  return { schemaVersion: 1, policyVersion: "blueprint.v1", lessons: blueprints.length, reviewState: "UNREVIEWED", levels: frequencies(blueprints.map(b => String(b.interactionLevel))),
    clusters: Object.fromEntries(unique(blueprints.flatMap(b => b.archetypes)).map(name => [name, blueprints.filter(b => b.archetypes.includes(name)).map(b => b.identity)])),
    interactionFrequency: frequencies(blueprints.flatMap(b => b.recommendedBlocks)), assetNeeds: frequencies(blueprints.flatMap(b => b.visualNeeds)), componentNeeds: frequencies(blueprints.flatMap(b => b.componentNeeds)),
    reusableComponentOpportunities: frequencies(blueprints.flatMap(b => b.recommendedBlocks)), missingObjectives: blueprints.filter(b => !b.summary.objectives.length).length,
    reusableAssetMatches: blueprints.reduce((n, b) => n + b.assetCandidates.length, 0), needsDeepReview: blueprints.filter(b => b.needsDeepReview).length,
    exceptions: blueprints.filter(b => b.needsDeepReview).map(b => ({ identity: b.identity, title: b.summary.title, confidence: b.confidence, reasons: b.reviewReasons, suggestedRouting: "Terra only for specific unresolved pedagogical decisions; missing author metadata requires human source review first" })),
    caveats: ["Candidates only; no blueprint is reviewed or approved", "No Question stems/answers, reserved assets, lesson payloads or media bytes exported", "No import, publication, mastery, planner or review changes"] };
}

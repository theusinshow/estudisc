import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { validateTrackPack } from "@/features/import/application/track-pack-validation";
import { MAX_TRACK_PACK_BYTES } from "@/features/import/application/import-request";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { catalogSchema, lessonGenerationRequestSchema, sourcePackSchema, mediaPackSchema, lessonArchitectureSchema, lessonSchema, questionSetSchema, unsupportedComponentsSchema, type Catalog, type LessonGenerationRequest } from "./contracts";
import { toEstudiscPack, type DraftArtifacts } from "./adapter";
import { validateVisualMedia, visualMediaTypes } from "./visual-media-validation";

export type Issue = { code: string; path: string; message: string };
export type ValidationResult = { ok: boolean; issues: Issue[]; artifacts?: DraftArtifacts };
export function readJson(path: string): unknown { return JSON.parse(readFileSync(path, "utf8")); }

export function requestIssues(request: LessonGenerationRequest, catalog: Catalog): Issue[] {
  const issues: Issue[] = [];
  const fail = (path: string, message: string) => issues.push({ code: "invalid_reference", path, message });
  const moduleDefinition = catalog.modules.find(m => m.id === request.moduleId);
  if (!moduleDefinition || moduleDefinition.subjectCode !== request.subjectCode) fail("request.moduleId", "Unknown/mismatched module or subject");
  const concepts = new Set(catalog.modules.flatMap(m => m.lessons.flatMap(l => l.concepts.map(c => c.id))));
  for (const id of [...request.conceptIds, ...request.prerequisiteConceptIds]) if (!concepts.has(id)) fail("request.conceptIds", `Unknown Concept ${id}`);
  for (const p of catalog.prerequisites.filter(p => p.strength === "required" && request.conceptIds.includes(p.conceptId))) if (![...request.conceptIds, ...request.prerequisiteConceptIds].includes(p.prerequisiteConceptId)) fail("request.prerequisiteConceptIds", `Missing required prerequisite ${p.prerequisiteConceptId}`);
  for (const id of request.curriculumRequirementIds) {
    const requirement = catalog.requirements.find(r => r.id === id);
    if (!requirement || requirement.subjectCode !== request.subjectCode || !requirement.mappedConceptIds.some(c => request.conceptIds.includes(c))) fail("request.curriculumRequirementIds", `Unknown/misaligned requirement ${id}`);
  }
  const existing = catalog.modules.flatMap(m => m.lessons).find(l => l.id === request.lessonId);
  if (existing && request.lessonVersion <= existing.version) fail("request.lessonVersion", "Use a new immutable lesson version");
  return issues;
}

export function validateJob(dir: string, stage: "research" | "author" = "author"): ValidationResult {
  const issues: Issue[] = [];
  const fail = (code: string, path: string, message: string) => issues.push({ code, path, message });
  function parse<S extends z.ZodType>(path: string, schema: S): z.output<S> | undefined {
    try {
      const result = schema.safeParse(readJson(join(dir, path)));
      if (result.success) return result.data;
      result.error.issues.forEach(i => fail("invalid_schema", `${path}:${i.path.join(".")}`, i.message));
    } catch (error) { fail("missing_or_invalid_file", path, String(error)); }
  }
  const request = parse("request.json", lessonGenerationRequestSchema);
  const catalog = parse("catalog.json", catalogSchema);
  const sources = parse("research/source-pack.json", sourcePackSchema);
  const media = parse("research/media-pack.json", mediaPackSchema);
  const notes = join(dir, "research/research-notes.md");
  if (!existsSync(notes) || !readFileSync(notes, "utf8").trim()) fail("missing_notes", "research/research-notes.md", "Research notes required");
  if (!request || !catalog || !sources || !media) return { ok: false, issues };
  issues.push(...requestIssues(request, catalog));
  const unique = (values: string[], path: string) => { if (new Set(values).size !== values.length) fail("duplicate_id", path, "Duplicate IDs"); };
  unique(sources.sources.map(s => s.content.id), "research.sources");
  unique(sources.assertions.map(s => s.id), "research.assertions");
  unique(sources.unresolved.map(s => s.id), "research.unresolved");
  unique([...media.images, ...media.videos, ...media.books].map(m => m.id), "research.media");
  const sourceIds = new Set([...catalog.sources.map(s => s.id), ...sources.sources.map(s => s.content.id)]);
  const mediaIds = new Set([...media.images, ...media.videos, ...media.books].map(m => m.id));
  const refs = (values: string[], valid: Set<string>, path: string) => values.forEach(id => { if (!valid.has(id)) fail("invalid_reference", path, `Unknown reference ${id}`); });
  for (const source of sources.sources) {
    if (source.content.id === `src-studio-${request.jobId}-v${request.lessonVersion}`) fail("reserved_author_source", "research.sources", "Studio author-source ID is reserved for the adapter");
    if (!request.demo && source.content.metadata.demo === true) fail("demo_content", "research.sources", "DEMO sources cannot enter a real lesson job");
    if (source.content.type === "official_exam" || source.content.metadata.protected === true || source.content.metadata.reservedForAssessment === true) fail("protected_source", "research.sources", "Official exam ingestion belongs to the private official bank, never lesson generation");
    const existing = catalog.sources.find(s => s.id === source.content.id);
    if (existing && hashCanonicalJson(existing) !== hashCanonicalJson(source.content)) fail("source_conflict", "research.sources", "Cannot redefine catalog source");
    if (typeof source.content.locator.url === "string" && source.url !== source.content.locator.url) fail("source_url_conflict", "research.sources", "Source wrapper URL must match canonical locator URL");
  }
  for (const assertion of sources.assertions) {
    refs(assertion.sourceIds, sourceIds, "research.assertions");
    if (assertion.kind === "FACT" && !assertion.sourceIds.length) fail("untraced_fact", "research.assertions", "FACT requires source IDs");
  }
  for (const video of media.videos) refs(video.conceptIds, new Set(request.conceptIds), "research.videos");
  if (stage === "research") return { ok: !issues.length, issues };
  const lesson = parse("author/lesson.json", lessonSchema);
  const questions = parse("author/questions.json", questionSetSchema);
  const architecture = parse("author/lesson-architecture.json", lessonArchitectureSchema);
  const unsupported = parse("author/unsupported-components.json", unsupportedComponentsSchema);
  if (!lesson || !questions || !architecture || !unsupported) return { ok: false, issues };
  for (const item of sources.unresolved.filter(i => i.blocking)) fail("research_required", "research.unresolved", item.message);
  if (lesson.id !== request.lessonId || lesson.version !== request.lessonVersion || lesson.status !== "draft") fail("lesson_identity", "author.lesson", "Match request lesson ID/version and keep status draft");
  if (JSON.stringify([...lesson.concepts.map(c => c.id)].sort()) !== JSON.stringify([...request.conceptIds].sort())) fail("concept_scope", "author.lesson.concepts", "Teach exactly the requested Concepts; change scope explicitly in a new job");
  if (JSON.stringify([...lesson.prerequisiteConceptIds].sort()) !== JSON.stringify([...request.prerequisiteConceptIds].sort())) fail("prerequisite_scope", "author.lesson.prerequisites", "Preserve requested prerequisites");
  refs(lesson.sourceIds, sourceIds, "author.lesson.sourceIds");
  for (const q of questions.questions) {
    const previous = catalog.historicalQuestions.find(item => item.id === q.id);
    if (previous && q.version <= previous.version) fail("question_version", `questions.${q.id}`, "Existing Question ID requires a new immutable version");
    if (q.provenance.type === "official_exam" || q.assets.length || q.exposurePolicy.reservedForAssessment || q.exposurePolicy.unlockAt || q.status !== "draft") fail("official_provenance_misuse", `questions.${q.id}`, "Author only draft, unreserved Questions without private official assets");
    if (q.provenance.type === "generated" && !q.provenance.generationRunId) fail("missing_author_run", `questions.${q.id}`, "Generated Question requires generationRunId");
    if (q.provenance.type === "derived") {
      const original = catalog.historicalQuestions.find(item => item.id === q.provenance.derivedFromQuestionId);
      if (!original || original.reserved || original.status === "annulled") fail("protected_derivation", `questions.${q.id}`, "Unknown/reserved/annulled original cannot inform lesson generation");
    }
    if (q.subjectCode !== request.subjectCode) fail("question_subject", `questions.${q.id}`, "Question subject must match request");
    refs(q.conceptIds, new Set(request.conceptIds), `questions.${q.id}.conceptIds`);
    refs(q.sourceIds, sourceIds, `questions.${q.id}.sourceIds`);
    if (!q.explanation) fail("missing_solution", `questions.${q.id}`, "Authored full solution required");
  }
  unique(questions.questions.map(q => q.id), "author.questions");
  const targets = new Set([...lesson.blocks, ...lesson.activities, ...questions.questions].map(b => b.id));
  unique(architecture.sequence.map(s => s.id), "architecture.sequence");
  unique(architecture.provenance.map(p => p.targetId), "architecture.provenance");
  const factualSources = new Set(sources.sources.filter(s => s.verification === "VERIFIED" && s.content.type !== "ai_generated").map(s => s.content.id));
  for (const p of architecture.provenance) {
    refs([p.targetId], targets, "architecture.provenance.targetId");
    refs(p.sourceIds, sourceIds, "architecture.provenance.sourceIds");
    refs(p.mediaIds, mediaIds, "architecture.provenance.mediaIds");
    if (p.factual && (!p.sourceIds.length || p.sourceIds.some(id => !factualSources.has(id)))) fail("unverified_fact", p.targetId, "Factual content requires verified evidence in Source Pack");
    for (const id of p.mediaIds) {
      const image = media.images.find(m => m.id === id);
      if (image && lesson.blocks.some(b => b.id === p.targetId && visualMediaTypes.has(b.type)) && image.licenseStatus !== "APPROVED_EMBED") fail("media_license", p.targetId, "Embedded image must be APPROVED_EMBED");
      if (image && !["APPROVED_EMBED", "LINK_ONLY"].includes(image.licenseStatus)) fail("unreviewed_media", p.targetId, "Selected image must be cleared for embedding or link-only use; other states remain candidates");
      if (media.videos.find(v => v.id === id)?.status !== undefined && media.videos.find(v => v.id === id)?.status !== "RECOMMENDED") fail("unverified_video", p.targetId, "Selected video must be verified/recommended");
    }
    const question = questions.questions.find(q => q.id === p.targetId);
    if (question && p.sourceIds.some(id => !question.sourceIds.includes(id))) fail("question_provenance", p.targetId, "Question sourceIds must retain its architecture evidence references");
  }
  for (const seq of architecture.sequence) { refs(seq.targetIds, targets, "architecture.sequence"); refs(seq.sourceIds, sourceIds, "architecture.sequence.sources"); refs(seq.mediaIds, mediaIds, "architecture.sequence.media"); }
  for (const target of targets) {
    if (!architecture.sequence.some(s => s.targetIds.includes(target))) fail("missing_architecture", target, "Every rendered block/activity/Question needs a sequence entry");
    if (!architecture.provenance.some(p => p.targetId === target)) fail("missing_provenance", target, "Every target needs provenance (factual false permitted for learner prompts)");
  }
  for (const block of lesson.blocks) {
    if (typeof block.payload.type === "string" && block.payload.type !== block.type && block.type !== "timeline") fail("payload_type", block.id, "Payload type must match renderer type");
    if (visualMediaTypes.has(block.type)) {
      const p = architecture.provenance.find(p => p.targetId === block.id);
      const candidates = media.images.filter(m => p?.mediaIds.includes(m.id));
      issues.push(...validateVisualMedia(block, candidates));
    }
  }
  for (const activity of lesson.activities.filter(a => a.type === "question")) {
    const result = questionReferenceSchema.safeParse({ ...activity.config, questionId: activity.questionId });
    if (!result.success || result.data.questionVersion !== questions.questions.find(q => q.id === activity.questionId)?.version) fail("question_version", activity.id, "Question config must pin existing questionVersion and at most three hints");
  }
  if (request.exitTicketRequired && (!lesson.exitTicketQuestionIds.length || !architecture.sequence.some(s => s.phase === "EXIT_TICKET"))) fail("missing_exit_ticket", "author.lesson", "Exit Ticket required");
  for (const id of lesson.exitTicketQuestionIds) {
    const activity = lesson.activities.find(a => a.questionId === id && a.config.phase === "exit_ticket");
    if (!activity) fail("exit_activity", id, "Exit ticket needs a rendered question activity with phase exit_ticket");
    if (!architecture.sequence.some(s => s.phase === "EXIT_TICKET" && (s.targetIds.includes(id) || Boolean(activity && s.targetIds.includes(activity.id))))) fail("exit_sequence", id, "Exit Ticket phase must reference its rendered activity or Question");
  }
  for (const item of unsupported.requests) if (item.type === "GENERATED_IMAGE_REQUEST") refs(item.conceptIds, new Set(request.conceptIds), "unsupported.requests");
  const artifacts = { request, catalog, sources, media, architecture, lesson, questions };
  try {
    const pack = toEstudiscPack(artifacts);
    const runtime = validateTrackPack(pack);
    if (!runtime.ok) issues.push(...runtime.issues);
    if (Buffer.byteLength(JSON.stringify(pack)) > MAX_TRACK_PACK_BYTES) fail("pack_size", "pack", "Pack exceeds the Estudisc 2 MiB Track Pack request limit");
  } catch (e) { fail("adapter_schema", "pack", String(e)); }
  return { ok: !issues.length, issues, artifacts };
}

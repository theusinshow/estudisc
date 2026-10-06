import { trackPackV2Schema, type TrackPackV2 } from "@/features/import/application/track-pack-v2-schema";
import type { Catalog, LessonGenerationRequest, Lesson, QuestionSet, SourcePack, MediaPack, LessonArchitecture } from "./contracts";

export type DraftArtifacts = { request: LessonGenerationRequest; catalog: Catalog; sources: SourcePack; media: MediaPack; architecture: LessonArchitecture; lesson: Lesson; questions: QuestionSet };

/** Preview-scoped Pack. Editorial approval never becomes runtime approval. */
export function toEstudiscPack(a: DraftArtifacts): TrackPackV2 {
  const concepts = a.catalog.modules.flatMap(m => m.lessons.flatMap(l => l.concepts));
  const included = new Set(a.lesson.concepts.map(c => c.id));
  const prerequisites = a.request.prerequisiteConceptIds.filter(id => !included.has(id));
  const support = prerequisites.length ? [{
    id: `studio-context-${a.request.jobId}`, version: 1, title: "Contexto de pré-requisitos — inventário sem ensino", kind: "compact" as const,
    estimatedMinutes: 1, status: "draft" as const, concepts: prerequisites.map(id => concepts.find(c => c.id === id)!),
    prerequisiteConceptIds: [], objectives: [], sourceIds: [], exitTicketQuestionIds: [], blocks: [], activities: []
  }] : [];
  support.flatMap(l => l.concepts).forEach(c => included.add(c.id));
  const requirements = a.catalog.requirements.filter(r => a.request.curriculumRequirementIds.includes(r.id) && r.mappedConceptIds.every(id => included.has(id)));
  const sourceMap = new Map(a.catalog.sources.map(s => [s.id, s]));
  for (const source of a.sources.sources) sourceMap.set(source.content.id, source.content);
  const runId = `studio-${a.request.jobId}-v${a.request.lessonVersion}`;
  const authorSourceId = `src-${runId}`;
  sourceMap.set(authorSourceId, { id: authorSourceId, type: "ai_generated", title: a.request.namespace === "estudisc" ? "Estudisc Content Studio — editorial draft" : "VECTA Content Studio — editorial draft", locator: {}, metadata: { authorRunId: runId, reviewStatus: "pending_human_publication_review" } });
  const selectedMedia = new Set(a.architecture.provenance.flatMap(p => p.mediaIds));
  const recommendations = {
    images: a.media.images.filter(m => selectedMedia.has(m.id)).map(({ src, ...metadata }) => { void src; return metadata; }),
    videos: a.media.videos.filter(m => selectedMedia.has(m.id)), books: a.media.books.filter(m => selectedMedia.has(m.id))
  };
  const blocks = a.lesson.blocks.map(block => {
    const provenance = a.architecture.provenance.find(p => p.targetId === block.id)!;
    return { ...block, payload: { ...block.payload, contentStudio: { sourceIds: provenance.sourceIds, mediaIds: provenance.mediaIds } } };
  });
  return trackPackV2Schema.parse({
    schema: "caderno.track.v2", packId: `${a.request.namespace ?? "vecta"}.studio.${a.request.jobId.toLowerCase()}`, version: a.request.packVersion, language: "pt-BR",
    sources: [sourceMap.get(authorSourceId)!, ...[...sourceMap.values()].filter(s => s.id !== authorSourceId)], curriculumRequirements: requirements, conceptPrerequisites: a.catalog.prerequisites.filter(p => included.has(p.conceptId) && included.has(p.prerequisiteConceptId)),
    questions: a.questions.questions.map(q => ({ ...q, status: "draft" })),
    track: { id: `studio-${a.request.jobId}`, title: `${a.request.demo ? "DEMO / NOT PRODUCTION CONTENT — " : "Prévia editorial — "}${a.request.title}`,
      metadata: { contentStudio: { jobId: a.request.jobId, demo: a.request.demo, previewOnly: true, sourceScopeVerified: a.catalog.sourceScopeVerified,
        curriculumRequirementIds: a.request.curriculumRequirementIds, omittedRequirementIds: a.request.curriculumRequirementIds.filter(id => !requirements.some(r => r.id === id)),
        missingTeachingLessonIds: support.map(l => l.id), provenance: a.architecture.provenance, media: recommendations } },
      modules: [{ id: a.request.moduleId, title: a.catalog.modules.find(m => m.id === a.request.moduleId)!.title, subjectCode: a.request.subjectCode,
        lessons: [...support, { ...a.lesson, blocks, status: "draft", sourceIds: [...new Set([...a.lesson.sourceIds, ...a.architecture.provenance.flatMap(p => p.sourceIds), authorSourceId])] }] }]
    }
  });
}

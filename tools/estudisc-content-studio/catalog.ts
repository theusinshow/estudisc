import { readFileSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { catalogSchema, lessonGenerationRequestSchema, type Catalog } from "./contracts";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";

/** Pin only curriculum context; never copy official stimuli, answers, assets or source PDFs. */
export function loadCatalog(root: string): Catalog {
  const local = resolve(root, ".local/ifsc-official/track.source-pack.v2.json");
  const file = existsSync(local) ? local : resolve(root, "packs/seeds/ifsc-2027.golden.track.v2.json");
  const raw = readFileSync(file, "utf8");
  const pack = trackPackV2Schema.parse(JSON.parse(raw));
  return catalogSchema.parse({
    origin: relative(root, file).replaceAll("\\", "/"), sha256: createHash("sha256").update(raw).digest("hex"),
    sourceScopeVerified: pack.track.metadata.sourceScopeVerified === true,
    track: { id: pack.track.id, title: pack.track.title },
    modules: pack.track.modules.map(m => ({ ...m, lessons: m.lessons.map(l => ({ ...l, blocks: [], activities: [], exitTicketQuestionIds: [], sourceIds: l.sourceIds.filter(id => pack.sources.some(s => s.id === id && s.type === "official_curriculum")), status: "draft" })) })),
    requirements: pack.curriculumRequirements.map(({ status, ...r }) => { void status; return r; }), prerequisites: pack.conceptPrerequisites,
    sources: pack.sources.filter(s => s.type === "official_curriculum"),
    historicalQuestions: pack.questions.map(q => ({ id: q.id, version: q.version, subjectCode: q.subjectCode, examId: q.provenance.examId, officialNumber: q.provenance.officialNumber,
      difficulty: q.difficulty, cognitiveOperations: q.cognitiveOperations, provenance: q.provenance.type, reserved: q.exposurePolicy.reservedForAssessment || Boolean(q.exposurePolicy.unlockAt), status: q.status, conceptIds: q.conceptIds }))
  });
}

export function defaultRequest(jobId: string, catalog: Catalog) {
  const moduleDefinition = catalog.modules.find(m => m.lessons.some(l => l.id === jobId));
  const lesson = moduleDefinition?.lessons.find(l => l.id === jobId);
  if (!moduleDefinition || !lesson) throw new Error(`Lesson ${jobId} not in catalog; provide --request PATH with existing Concept and requirement IDs.`);
  const conceptIds = lesson.concepts.map(c => c.id);
  return lessonGenerationRequestSchema.parse({
    schemaVersion: 1, jobId, lessonId: lesson.id, title: lesson.title, subjectCode: moduleDefinition.subjectCode, moduleId: moduleDefinition.id,
    conceptIds, prerequisiteConceptIds: [...new Set([...lesson.prerequisiteConceptIds, ...catalog.prerequisites.filter(p => conceptIds.includes(p.conceptId) && !conceptIds.includes(p.prerequisiteConceptId)).map(p => p.prerequisiteConceptId)])],
    curriculumRequirementIds: catalog.requirements.filter(r => r.mappedConceptIds.some(id => conceptIds.includes(id))).map(r => r.id),
    objectives: lesson.objectives.length ? lesson.objectives : lesson.concepts.map(c => c.title),
    target: "IFSC Integrado; current official mappings require human verification", audience: "9º ano do Ensino Fundamental",
    exitTicketRequired: true, maxRevisions: 3, lessonVersion: lesson.version + 1, packVersion: 1, demo: false
  });
}

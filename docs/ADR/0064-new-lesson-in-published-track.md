# ADR 0064 — New lesson in an imported, published Track version

Status: Accepted
Date: 2026-10-16

## Context

Nine new lessons (MAT-19..22, CIE-41, POR-25, POR-26, GH-50, GH-51) must join Track versions that are already imported and published. The only targeted path, `caderno.lesson.v2` (ADRs 0029, 0062, 0063), creates the next version of an existing lesson. A full Track re-import would create a new Track version and touch every lesson. Published versions, Attempts and ConceptEvidence must stay untouched.

## Decision

A sibling schema `caderno.lesson-new.v1` appends one lesson to an existing module of an imported Track version. We use a separate schema, not a `target.newLesson` flag, because the lesson-version contract always has a base (`baseVersion`, `baseHash`, `questionReferences`), and a new lesson has none. A flag would make every base field conditional.

Pack: `{ schema, packId, version, authorId, target: { trackId, trackVersion, moduleId }, lesson, questions, sources }`.

The policy (`resolveNewLessonContext`) checks the pack against the newest imported v2 snapshot of the target Track version:

- The module exists in that context. The lesson id exists nowhere in the context, and in the repository nowhere in the database. The lesson is version 1, `draft`, and has objectives and an exit ticket.
- Every lesson Concept is new: its id is not in the context or in the `concepts` table. Existing Concepts can only appear as `prerequisiteConceptIds`. A Track snapshot holds each Concept in one lesson only, so the new lesson cannot list an existing Concept.
- Blocks use only the existing text renderers (`text`, `concept`, `note`, `worked-example`, `warning`, `summary`, `example`), through the same `validateTextBlock` rules as enrichment. No media, prediction, explorer or assessment blocks.
- Every Question is new: version 1, `draft`, non-official provenance, not reserved for assessment, the module's subject, only the lesson's Concepts. The shared Question schema validates each one. Every Activity is a `question` Activity bound to one of these Questions at version 1. Every Question is used by an Activity or the exit ticket. The lesson never references existing Questions.
- Sources have new ids. The projection must pass `validateTrackPackV2Semantics`.

The projection is the context with the lesson appended at the end of its module, plus the new Questions and sources, and `track.metadata.newLessonImport = { packet, sourceManifestHash }`. A full Track import refuses it (`projection_only`), just like lesson-version projections.

Persistence (`executeNewLesson`) runs in one transaction under the Track row lock. It writes:

- the `pack_imports` snapshot (same lazy-loading shape);
- the lesson row (`draft`, `orderIndex` = the module's max + 1);
- Concepts and `lesson_concepts`;
- sources and `track_concept_settings` through the curriculum foundation. No requirement mapping or prerequisite edge is created;
- Question versions through `DrizzleQuestionRepository.importVersions`;
- blocks;
- `question` Activities that reuse an existing question `evaluatorVersion` of the Track;
- `content_releases` for each Question and the lesson.

Re-running the same pack returns `already_imported`. A different pack for the same receipt or identities is refused.

Publication is the unchanged Admin Direct `publishLessonsDirect`. The bundle resolver finds the lesson in the snapshot and publishes its Questions with it. After publication the new lesson is an ordinary base for later `caderno.lesson.v2` enrichment, and the continuous study flow orders it after the module's earlier lessons.

`POST /api/import/lesson` (and its preview) sends `caderno.lesson-new.v1` bodies to this path. The disposable memory store applies the same policy.

`tools/estudisc-content-studio/new-lesson-from-authoring.ts` converts one authored lesson file into this pack. The converter:

- puts the stimulus at the start of the stem;
- keeps the shared difficulty enum;
- sets `generated` provenance with a `generationRunId`;
- derives the answer from the single correct choice;
- turns free-text error labels into `targetsError: "unknown"`;
- uses difficulty-based default cognitive operations;
- keeps the edital item only as an unverified author claim in the Studio source metadata.

## Consequences

- New lessons can join a live Track without a new Track version. Earlier lessons, Questions, Attempts and evidence stay untouched.
- Publication does not certify the edital mapping or planner readiness. No official curriculum requirement is mapped automatically.
- Each import adds a snapshot, so importing several lessons in sequence works without a client-held context. Each pack is checked against the newest snapshot at import time.
- Existing Concepts cannot be taught as primary Concepts of the new lesson; that would need a shared-Concept contract.

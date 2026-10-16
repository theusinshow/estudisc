# ADR 0066 — Answer-sheet assessments for past exams

Status: Accepted
Date: 2026-10-16

## Context

Students want to take complete past IFSC Integrated exams (2022.1–2026.2, 11 editions including the 2024.1 Itajaí variant) under exam conditions. The verified catalog (`packs/past-exams/ifsc-integrado-2022-2026.catalog.json`) has, for each edition:

- metadata;
- the definitive answer key;
- annulled items;
- official IFSC URLs.

It has no question content.

The editions use 20, 24 or 28 items, and their subject layouts differ from the current four-area pattern. Only four editions exist in the private official bank. Re-hosting booklets raises third-party rights questions.

The Assessment Engine (doc 09) is the only engine: AGENTS.md forbids parallel assessment engines. Its existing kinds require versioned Questions, and `FULL_SIMULATION`/`OFFICIAL_EXAM` require 28 items with seven per area.

## Decision

Add the assessment kind `PAST_EXAM_SHEET` to the existing engine.

- **Template:** `pastExamSheetTemplateSchema` contains:
  - positions 1..N, with N ∈ {20, 24, 28};
  - a key per position, `A–E` or `ANNULLED`;
  - optional subject ranges;
  - official links, which must point to the `www.ifsc.edu.br` host;
  - catalog provenance (dataset, verification date, canonical hash, transcription note, Admin Direct publication reason).

  The 28-item, seven-per-area and Question-reference rules remain unchanged for every other kind.
- **Snapshot:** the snapshot freezes positions, subjects, exam identity, duration and template version. It never contains keys. Scoring reads keys from the frozen template row (`instance.templateId`) on the server.
- **Responses:** answers go to the sibling table `assessment_sheet_responses`, with primary key `(instance_id, position)` and CHECK `answer` ∈ A–E or null. `assessment_responses` cannot hold them: its composite primary key includes `question_version_id`.
- **Shared lifecycle:** sheets reuse the engine's shared parts:
  - `assessment_templates` (immutable versions, content-hash conflict);
  - `assessment_instances` (one ACTIVE instance per owner, idempotent start keys, deadline);
  - transactional idempotent `finalize`;
  - the `assessment_finalized` study event.
- **No learning evidence:** a sheet finalization creates no Attempt, ConceptEvidence, review schedule or mistake. There is no Question/Concept mapping, so there is nothing truthful to attribute. The finalized instance with its result is the immutable attempt record.
- **Exam mode:** sheet instances use `mode: "EXAM"`. While one is ACTIVE, the existing EXAM guards block tutor, practice and targeted sessions.
- **Rights:** booklets and official keys are links only, with no re-hosting, embedding or extraction. Keys and the official answer-key link reach the student only after the owner's instance is FINALIZED.
- **Reservation:** ADR 0023 is unchanged. 2026.1 and 2026.2 carry `availableAt` from `packs/past-exams/releases.json` (currently 2026-11-09 and 2026-11-22, following `docs/ifsc/16-IMPLEMENTATION-PLAN.md`). Start is refused server-side before that date, and the student DTO omits their links.
- **Scoring:** annulled items leave the denominator and a blank counts as incorrect. The UI states that this training criterion is not the official classification rule.

## Consequences

- `/past-exams` lists editions and `/assessments/[id]` renders an answer sheet for this kind. `/assessments` excludes sheet templates and history.
- Every reader of `assessment_instances.snapshot` must accept the sheet shape. For example, question-asset authorization skips sheet snapshots.
- Answer keys are a third-party transcription. Mitigations:
  - a cross-check against the private official bank when it is present (2025.1–2026.2);
  - a visible conflict notice;
  - errata through new template versions.

## Future bridge

When an edition's official Questions are imported, an optional `position → {questionId, version}` mapping can let that edition emit evidence through the normal Question path. That would need its own ADR. The page and the student flow would not change.

## Rejected alternatives

- A separate past-exam module/repository: it would duplicate timer, resume, finalization and history, and it violates the single-engine rule.
- Importing full official Questions now: 7 of 11 editions would need transcription, and third-party rights for texts and images are unresolved.
- Making `assessment_responses.question_version_id` nullable: that requires replacing its primary key on a shared table.

## Implementation constraints

- The key never appears in snapshots, lists or the view of a non-finalized instance.
- A reserved template cannot start before `availableAt`, including via direct API calls.
- Release dates are configuration (`releases.json` → template `availableAt`), never code.

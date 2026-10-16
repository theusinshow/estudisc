# ADR 0063 — Lesson-bound Question versions in lesson-version imports

Status: Accepted
Date: 2026-10-15

## Context

Lesson-version imports (ADR 0062) keep every Activity and every Question reference identical. Content work now needs new Question versions: reordered choices to balance answer letters, a missing value added to a stem, Portuguese and History-Geography questions rewritten with a stimulus, and new numeric Science questions. Questions are shared, versioned and immutable once published. Attempts and frozen study sessions point to exact versions. Each import snapshot keeps one version per Question id, and the lesson bundle resolver looks Questions up by id.

## Decision

`caderno.lesson.v2` gains an optional `questionVersions` list (up to 200 Question objects).

- Each entry is either a **new version** of a Question the base lesson references (`version` = current + 1) or a **new Question** (`version` = 1, unused id).
- Every entry is `draft`, has non-official provenance (`generated`, `human` or `derived`), is not reserved for assessment, uses only Concepts of the lesson, and passes the shared Question schema.
- A new version is allowed only if no other lesson in the import context references that Question id. One context can then keep one version per id without moving another lesson to a version it was not authored for.
- Lesson Activities may change only by binding an existing Activity to the new version of its own Question, or by appending a new `question` Activity for a new Question. Activity ids, types and prompts stay the same, and nothing is removed.
- `questionReferences` must list each final reference with its exact version and hash.
- The repository stores the new versions as drafts inside the same transaction and registers their releases. The existing Admin Direct publication then publishes the lesson and its new Question versions together. Re-running the same pack is idempotent; a different pack for the same identities is refused.

Earlier versions, Attempts, evidence and frozen session snapshots are untouched: they keep pointing to the versions they recorded.

## Consequences

- Phases 1–3 of the lesson correction plan can publish Question changes through the reviewed import path, with provenance kept.
- Questions shared by several lessons still cannot get a new version through this path. A future shared-Question release would need snapshots that hold more than one version per id.
- Official exam Questions never enter through this path.

## Amendment 2026-10-16: interactive Questions

Appended Questions may use any shared Question type, including `ordering`, `classification` and `matching`, evaluated by `question.v1`. `tools/estudisc-content-studio/interaction-batch.ts` turns plain authored interactions (labels only) into such Questions and lesson versions; it shows ordering items in a deterministic scrambled order that never equals the answer, so no item is pre-solved. Covered by `tests/unit/interaction-batch.test.ts` and `tests/integration/lesson-interaction-import.test.ts`.

# ADR 0062 — Correction versions for published lessons

Status: Accepted
Date: 2026-10-15

## Context

Published lesson versions are immutable (ADR 0029). The only path to a new version, `caderno.lesson.v2` lesson-version import, is append-only: every retained block must be byte-identical and at least one block must be added. That suits enrichments, but content fixes (internal editorial text shown to students, unmarked misconceptions, English enums) must edit or remove published blocks. Rebuilding lessons from the cleaned packs would drop the 51 enrichments already live, because production lessons are source + enrichment.

## Decision

`caderno.lesson.v2` gains an optional `corrections` object: a reason (10–500 chars) and a list of `{ blockId, action: "replace" | "remove", baseBlockHash }`.

- Each listed block must exist in the published base with exactly `baseBlockHash`. Otherwise the import is refused, so no concurrent change is overwritten.
- `replace` keeps the block id, type and Concepts, must change the block, and must pass the existing non-assessed text renderer schemas.
- `remove` drops the block.
- Every other block and every lesson field must stay identical. Activities and Question references are unchanged, and additions follow the existing enrichment rules.
- Without `corrections`, the append-only behaviour is unchanged.

The result is the next draft version, stored by the existing repository and published through the existing Admin Direct engine with an audit event. The previous version stays readable and immutable.

## Consequences

- Cleanups reach students as new versions on top of the published (enriched) version, keeping enrichments, attempts and evidence untouched.
- New Question versions (reordered choices, edited stems) are still out of scope. They need the separate Question/lesson-binding contract.
- Enrichment recipes bind to the frozen pre-cleanup sources in `packs/history/pre-phase1-20261015/`.

## Validation

`tests/unit/lesson-correction-policy.test.ts` covers replace, remove, unlisted change, stale hash, type change, no-op and append-only compatibility. `tests/integration/lesson-correction-import.test.ts` runs import plus Admin Direct publication on a migrated database.

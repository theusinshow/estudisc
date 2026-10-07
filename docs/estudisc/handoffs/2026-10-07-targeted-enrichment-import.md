# MODEL HANDOFF — Targeted enrichment import

Resolved in the current authorized session (2026-10-07): [targeted implementation/acceptance](../TARGETED-LESSON-IMPORT.md), ADR 0049. No model switch or additional agent. Historical escalation text below no longer blocks implementation or requests user editorial review; protected deployment and actual authenticated activation are the current next steps.

MODEL ESCALATION REQUIRED — new targeted persisted import contract; Terra implementation, not a human editorial review.

Routing: Terra recommended for this new persisted import contract (risk HIGH). No model switch/additional agent was performed.

## Current task and authorization

Activate MAT-07 v5 after engineering QA. The owner explicitly authorized direct releases for this social project on 2026-10-07: community/user feedback replaces human/independent editorial approval. ADR 0048, AGENTS/AUTONOMY. Do not ask Matheus to review; use existing Admin Direct with actual authenticated ADMIN actor/reason, never invented QA.

## Established architecture and files

- `tools/estudisc-content-studio/enrichment.ts`: source/blueprint/recipe/Question/policy/asset-bound candidate, ADMIN_DIRECT_AUTHORIZED metadata and existing direct-publication request. One existing percentage explorer after E03 (16% of 275 = 44). Current CLI regenerates the complete policy-bound generation; no source mutations.
- `tools/estudisc-content-studio/recipes/percentage-calculation.v1.json`: stable MAT-07 v4 → v5, exact source hashes/objective/Concept. Preserve 14 old blocks, 18 activities and twelve Question identities/versions/record hashes.
- `src/db/repositories/track-import-repository.ts:47`: applyTrackPack inserts a new Track aggregate, using Pack version as Track version. No targeted append to an existing collection is provided here. Re-importing the complete original collection is forbidden by AGENTS; a parallel studio Track is not the desired production target.
- `src/features/import/application/lesson-pack-schema.ts`: caderno.lesson.v1 uses the legacy lesson contract; the enriched source is v2 with shared Questions/prerequisites. Do not silently force it into v1 or redefine caderno.track.v2.
- `src/features/import/application/track-pack-v2-schema.ts`, `track-pack-v2-validation.ts`, `track-import-service.ts`: current full-aggregate contracts/validation/idempotent import.
- `src/db/repositories/content-qa/publication-service.ts:44`, `src/features/content-qa/direct-publication.ts`, `/api/admin/content-qa`: existing authenticated direct publication of explicit lesson/version targets and audit events; preserve this path.

## Why this is a technical decision

A targeted new lesson version must attach to the correct existing Track/module while resolving already-published shared Concept/Question versions and preserving old rows, frozen sessions/resume, idempotence, transaction ownership and current selection. Changing those persisted relationships/contracts is structural engineering, not an editorial approval. Do not reuse a full Track import as a shortcut, duplicate the collection, mutate a published version or republish existing 132 lessons/1,144 Questions.

## Changes already made / status

Owner rule recorded; preview release metadata and valid Admin Direct request no longer demand editorial approval. No actual production deployment/import/publication, data migration, real-secret handling or external write. Source/hash-bound engineering preview is concrete and prior app/runtime/evidence engines are unchanged. Final current acceptance is recorded in PLANS/PROJECT_STATUS and the direct-release report; prior checkpoint `86b85f9` had 355 full tests/three optional PG skips, 46 default E2E/18 gated skips and two focused on-browser passes.

## Exact next prompt

Implement the smallest compatible targeted v2 lesson-version import for the existing Estudisc Track/module, using the current core modules and an ADR if a new durable contract is required. First define identity/version/idempotence, existing Concept/Question resolution, append-only preservation and transaction boundaries. Use MAT-07 v5 as the sole pilot; preserve all current published rows/Questions, old lesson accessibility, frozen sessions/resume and actual audit modes. Add source/owner/version/conflict/rollback/idempotence integration tests, including real database harness when available. Complete engineering gates, then activate via existing authenticated Admin Direct under ADR 0048 without another editorial/human approval. No corpus-wide import, duplicate Track, fabricated QA, strong-AI bulk content or unrelated scope expansion. State exact deployment/migration prerequisites and do not claim production success before actual operations succeed.

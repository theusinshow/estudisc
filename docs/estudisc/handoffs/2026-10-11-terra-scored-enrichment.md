# MODEL HANDOFF — Terra scored enrichment

RESUME CHECKPOINT: isolated checkout `.local/lesson-evolution-finish-20261011`, base accepted main0e2a986 from PR23; READY public alias and actual narrow/mobile/desktop checks verified. Full522 tests,76 browser tests, eight required CI checks green. Post-release docs are retained as a safe local checkpoint; the original main worktree still contains Claude's unrelated changes. Resume here, do not stash/reset/switch the shared tree blindly.

MODEL ESCALATION REQUIRED

## Current task

Finish Phase9 lesson evolution with independently scored retrieval, starting with circle measures in MAT-16 v4. User explicitly confirmed on 2026-10-11: keep Terra for this contract. No new Questions, grading/evidence rules or persisted authoring contract were implemented by this continuation.

## Why Terra / risk HIGH

The current targeted importer deliberately retains every source field, Activity, Concept and exact Question ref/hash. New assessed practice requires a compatible append path for immutable shared Questions and a new lesson binding, with atomic publication/conflict/idempotence, provenance/reservation/owner boundaries and frozen-session compatibility. This is a persisted domain/contract decision, not escalation for the number of lessons. No high-risk production transformation or Sol High review is presently justified.

## Established architecture and constraints

- Reuse the modular monolith, shared Question/evaluator/Attempt pipeline and existing registered educational renderers. Prediction/classification block feedback is exploratory, not an official Attempt or canonical mastery evidence.
- Keep all existing published versions/refs unchanged; Concept remains the atomic mastery target. Attempts immutable, evidence/events append-only, frozen session composition retained. No reserved official assets in practice/training/public static paths.
- Existing source-goal recipe v2 preserves absent original goals and unmapped examples, labels derived goals/mappings as proposals and uses exact source quotes. It does not permit arbitrary new answer keys or additional official Questions.
- Standing social-project authorization permits technically validated Admin Direct release with real actors/reasons. No independent editorial/user release gate, fabricated review, or new permission question. Source/rights/official-mapping caveats remain factual.

## Current content / work already completed

All 132 lesson identities remain available. Actual read-only marker audit now finds 58 latest published identities with explicit additive enrichment metadata: MAT19/19, CIE16/40, POR23/24, GH0/49. The other 74 lack that marker; this does not establish missing base content or certify pedagogical adequacy. Original goals remain absent in the 113 non-math source lessons; proposed UI goals do not fabricate original metadata.

This continuation published MAT-PREREQ v5; MAT-01/02/03/09/10/12/14/15 v3; twenty Portuguese v3 source-quoted explorations (all except already-live POR-02/03/13 and unresolved-source POR-14). Original rows/Questions/history and private backups were preserved. Raw persisted counts: Questions/versions1,284 each, Attempts120, evidence141, events146; do not conflate raw historic totals with the 1,144 published curriculum Questions. POR-14 remains published v2, with an unresolved local/current-source hash mismatch; do not reuse its local snapshot blindly.

Frontend PR22 (`59a4f9e`) is live. MAT-03's deployed typed-grid defect was rechecked and its existing draft published without rewrite/re-import. A separate isolated checkout adds only a Question min-content/wrapping fix and real POR-04/POR-15 320/375/1440 px regression; it preserves Claude's original shared-tree edits. Its final release details are recorded in the linked acceptance receipt once verified. Do not assume a branch/deploy is ready without that evidence.

## Relevant files

- `src/features/import/application/lesson-version-policy.ts`, `lesson-version-contracts.ts`: current exact retention/envelope.
- `src/db/repositories/lesson-version-import.ts`, `track-import-repository.ts`, `content-qa/publication-service.ts`: reuse transaction/import/publication paths.
- `src/features/questions/contracts.ts`, `src/features/activities/application/question-reference.ts`: versioned shared Question/evidence authority.
- Existing `/api/generation/lesson/import`, `/api/generation/manual/compile`, `/api/import/track` and targeted `/api/import/lesson` paths: inspect actual constraints before inventing another route/registry.
- ADR0020/0033/0048/0049/0058 and `docs/estudisc/handoffs/2026-10-10-scored-enrichment-contract.md`: durable invariants and prior bounded investigation.
- `docs/estudisc/OPERATIONS-FACTORIZATION-RELEASE-2026-10-11.md`, `PORTUGUESE-READING-RELEASE-2026-10-11.md`, `PORTUGUESE-LANGUAGE-RELEASE-2026-10-11.md`: actual data releases and tests/backups.
- `PLANS.md`, `PROJECT_STATUS.md`, `docs/estudisc/IMPLEMENTATION-PLAN.md`: current next action; Phase15 remains deferred.

## Tests/status

Current isolated suite: 522 PASS, three configured optional real-PostgreSQL SKIP. Lint/typecheck/packs/build pass. Focused source-goal/import suite24 PASS; exact author/source/ref preview/import/publication checks and preservation comparisons pass for both ten-lesson batches. Full browser/release and post-fix production acceptance are tracked in the code receipt. No scored production response or student impersonation was used for validation.

## Exact next prompt

> Use Terra to finish Estudisc's scored-enrichment contract, starting only with a few original circle-measure retrieval Questions for MAT-16 v4. Read this compact handoff and the current plan/status/release receipt, then inspect the existing targeted/track/generated authoring import and shared Question/publication modules. Choose the smallest compatible immutable append path for new, truthfully provenanced Questions and their new lesson binding; preserve every old ref/version, source field, frozen session, owner/reservation boundary and append-only Attempt/evidence record. Define the versioned authoring contract, ADR, atomicity/idempotence/conflict/publication behavior and compatibility fixtures before implementation. Do not weaken v2 retention guards, re-import the corpus, create parallel engines, or disguise exploratory block checks as official practice. User confirmed Terra for this decision and already authorizes technically validated Admin Direct releases without independent editorial review. After a precise bounded contract is established, leave routine implementation/test/content tasks for economical execution; classify the remaining 74 source cases individually instead of forcing prediction into all of them. Preserve the original shared-tree frontend work; resume from the isolated accepted checkpoint when its receipt is complete.

# Targeted lesson-version import — Phase 9

Date: 2026-10-07. Base `fd692a8`. Decision: [ADR 0049](../ADR/0049-targeted-lesson-version-import.md). Social/community standing release authorization: ADR 0048. The technical handoff is implemented in the current session/model/effort; no additional agent or simulated independent review.

Local acceptance complete; actual current/prior/source/export hashes are in [evidence](TARGETED-LESSON-IMPORT-EVIDENCE.json).

## Implemented behavior

`caderno.lesson.v2` targets exact Track stable ID/version, module, lesson/base version/hash, one next-version draft and existing Question ID/version/hash references. Initial operation adds source-Concept numeric exploration while retaining every old field/block/Activity/Question reference. No new media, sources, Concept/Question versions or assessment/evidence rules. Old v1/Track Pack schemas remain intact; receipt versions are bounded to database integer range.

Existing ADMIN import UI recognizes the packet, previews it through `/api/import/lesson/preview` and appends through `/api/import/lesson`. Source edits/stale hashes/foreign scope, wrong Question versions/hashes/availability, collisions/global-version reuse, changed Activities/Concepts and unsafe additions fail closed. Both endpoints retain the existing authenticated ADMIN guard and 2 MiB bounds; STUDENT writes return 403. UI says the new version was imported as draft, preserves recoverable errors and does not imply publication or editorial approval.

SQL locks the existing Track, rechecks receipt/source/reference facts, inserts a receipt, one Lesson, its block/Activity/Concept links and one draft release atomically. Original Track/module/lesson/block/Activity/Question rows and all learner state remain unchanged. Activity configuration/evaluator/order is copied exactly from verified stored source rows. No DDL, backfill or production migration. Idempotent replay returns already_imported; conflict and injected mid-write failure roll back all new data. Timestamp assignment after locking avoids transaction-start reordering of context snapshots.

The receipt stores a private materialized Track-v2 read context plus the targeted packet metadata. This supports existing bundle/publication/planner readers without importing the rest of the collection or creating another Track. Old manifests remain available for frozen/historical versions; these projections are rejected by ordinary Track import. Replay their original targeted packet, not their projected Track snapshot. Current Student reads retain the latest published version until the draft is actually published. ADMIN previews the draft; `/lessons/MAT-07?version=4` continues to open the older version. Catalog counts select one lesson version and do not double-count Activities. Disposable memory descriptors retain Track scope when module stable IDs collide across fixtures.

## Pilot/export

```text
pnpm estudisc-content enrichment-export --request tools/estudisc-content-studio/recipes/percentage-calculation.v1.json
```

Produces an ignored `lesson-version.pack.json` from the current validated source/blueprint/recipe generation. MAT-07 v4 → v5, one existing percentage explorer after E03 (16% of 275 = 44), original fourteen blocks/eighteen Activities/twelve shared Questions retained. Repeated export compares exact output and skips unchanged bytes. Activation uses the already-prepared existing `publish_lessons_direct` request and real authenticated ADMIN actor/reason under standing authorization, no human/editorial approval wait. Import and publication remain separate real operations, so a failed activation leaves a draft with the published original still available.

For reproducible CI, Mathematics now has an exact-byte canonical repository mirror: 847,538 bytes, raw SHA 2eb7f1a8bc41500fc73727377815c2c95cfc57e849edc115e06cf63983dba5a2, canonical SHA bcf7c8ffa90dea94bcfaa4b52494fe291de6d22a8a6133fa33bcf06eb18af056. It contains only previously published generated/unreserved teaching Questions (240, zero Question assets); this is source availability, not re-import/publication. Original ignored audit bytes and all other canonical sources remain unchanged. Tests create their own ignored workspace parent rather than relying on previous local runs.

## Engineering verification

- Focused migration-backed PGlite/memory/API tests: actual existing Admin Direct engine publishes v5 with no editorial QA rows, original rows/Question hashes unchanged, v4 accessible, Student current published fallback, catalog counts, forged/stale references and 32-bit bounds rejected, actual DB trigger-induced mid-write failure rolled back and retry/idempotence accepted.
- Browser fixture: existing import UI previews/appends once, collection contains one lesson link, ADMIN draft renders the numeric explorer, duplicate replay is unchanged and conflicts reject. Disposable fixtures do not certify real editorial approval or production activation.
- Local full tests: 361 PASS / three optional real-PostgreSQL SKIP. No disposable real PostgreSQL URL/container was available; PGlite uses the complete checked-in migration set. Cross-process real-PG lock behavior is supported by SQL Track locking and unique constraints; it is not falsely claimed as a live concurrency test.
- Initial full E2E exposed unscoped memory descriptors mixing equal module IDs from different Tracks; actual Track scope was added and the full rerun passed 48/no failure, with 18 intentional gated skips. Final post-change validation/remote release receipts are recorded below once complete.

Exact local acceptance commands:

- `pnpm test` — 361 PASS / three optional real-PostgreSQL SKIP (118 passed files/three skipped).
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm packs:verify` — PASS; initial test-helper name and Next reserved-variable lint failures fixed before acceptance.
- `pnpm exec vitest run tests/integration/lesson-version-import.test.ts tests/unit/lesson-version-route.test.ts tests/unit/enrichment-preview.test.tsx` — ten PASS; full suite and scoped checks also cover clean ignored-workspace creation.
- `pnpm test:e2e` — 48 PASS / 18 gated SKIP, fresh serial chromium/mobile servers, DATABASE_URL=memory://local and Today/planner/interactive/adaptive flags explicitly false. `pnpm test:e2e tests/e2e/lesson-version-import.spec.ts` — two PASS/no SKIP including old-version URL after current changes.
- `pnpm estudisc-content enrichment-export --request tools/estudisc-content-studio/recipes/percentage-calculation.v1.json` twice — current source-bound packet created, then unchanged SKIP; canonical packet SHA 95a5462ef090b8bacf61e08c070e8fe1dc14403f99fc77e768bc746e697b57dc. No Question bodies copied into this targeted packet.
- Impeccable `detect --json` over changed importer hook/result and lesson page — []; actual mobile/desktop result screenshots inspected. Approved DS unchanged. `pnpm exec tsx .local/targeted-import/verify-evidence.mjs` — 26 current code/test hashes, 59 actual prior comparisons, twelve unchanged source documents/four original corpus/media inputs, exact new mirror/twelve Question refs, current export and links; `git diff --check` PASS. Generated Next/type/token churn restored.

## Deployment/activation status

Actual code release completed: [PR #3](https://github.com/theusinshow/estudisc/pull/3) merged as 7bbab0d; all eight protected checks passed on the PR and [main CI](https://github.com/theusinshow/estudisc/actions/runs/37656992679). Vercel deployment dpl_D5zF6QE7j3hVbVWsgAaQhgeT4vcV is READY, build logs identify main commit 7bbab0d, and the existing vecta-three.vercel.app alias resolves to that deployment. Public smoke: login HTTP 200/Estudisc title; unauthenticated targeted preview HTTP 401, preserving authentication. [Release receipt](TARGETED-LESSON-RELEASE.json).

Actual content activation remains pending the requested authenticated ADMIN session. No new lesson was imported/published in production, no migration executed, and no raw app credential/cookie/secret read. The prepared packet and existing Admin Direct request are ready; no Matheus/independent editorial review is required. The checkpoint-era paragraphs below are historical context, not current deployment status.

Not yet deployed/imported/published in production at this checkpoint. Existing Vercel/GitHub CLI authorization is available; production feature env names have no newly enabled flags, and this importer needs no new production table. GitHub main requires eight engineering checks (including administrators); no human PR-review requirement is configured. Release must use those actual checks.

Production content activation needs a real authenticated ADMIN session; session readiness was requested while engineering/release work continues. No raw password, cookie or production secret was read. Do not mint fake QA/Actor identities or bypass the application's ADMIN authentication. Existing 132 published lessons/1,144 Questions are preserved.

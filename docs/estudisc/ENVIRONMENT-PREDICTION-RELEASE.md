# Source-defined environmental and evolution predictions — 2026-10-10

CIE-21 v3, CIE-23 v3, CIE-35 v3 are LIVE through the actual authenticated ADMIN and existing Admin Direct publisher. One source-defined proposed-goal prediction per lesson reuses the exact original worked scenario/observation/explanation, existing Concept and accepted recipe v2. Original missing goals/links remain absent; no independent editorial review or official mapping is fabricated.

| Lesson | Version | Actual publication UTC | Retained Question refs |
| --- | --- | --- | --- |
| CIE-21 | 2 → 3 | 2026-10-10T21:47:07.251Z | 8 |
| CIE-23 | 2 → 3 | 2026-10-10T21:48:10.576Z | 8 |
| CIE-35 | 2 → 3 | 2026-10-10T21:48:54.673Z | 8 |

Actual fresh source/author hashes matched. Each preview returned 200/ready with exact canonical hash, import 201/imported and publication 200 with one newly published lesson. SQL audits confirm published/admin_direct, actual author match and zero editorial reviews. Before/after fingerprints for all old payloads/blocks/Activities and Question/user-state tables match after every publication and after reader checks; 132 identities remain. No corpus re-import, assessed response or canonical engine change occurred.

All actual mobile readers show the goal, correct named region, associated field label and empty response without overflow/unavailable data. Representative focus, 1440 px desktop and private bounded visual inspection passed. No Observe/answer response was submitted. 18 focused tests across three files, focused lint/typecheck/packs/diff passed. Runtime source unchanged; full combined acceptance is recorded after the continuous batches.

Complete private target backup/archive verified: SHA-256 7dfcaa4e817a1eb76784074f56a2b1a8dbb05a11564311a3a4be5c4b27fb7bb3. Raw contexts/real author IDs, individual packets/private transport bundle, inventories, snapshots and dump remain ignored/private. The transport bundle is read locally; each normal lesson packet is previewed/imported separately by the existing server routes, never submitted as a new Pack schema.

## Commands

~~~text
pnpm exec tsx .local/database-migration/private/environment-batch-20261010/prepare.ts
pnpm exec vitest run tests/unit/science-prediction-recipes.test.tsx tests/unit/source-goal-enrichment.test.tsx tests/integration/source-goal-version-import.test.ts
pnpm exec eslint tests/unit/science-prediction-recipes.test.tsx
pnpm typecheck
pnpm packs:verify
node .local/database-migration/private/environment-batch-20261010/checkpoint.mjs before
node .local/database-migration/private/environment-batch-20261010/checkpoint.mjs after-cie21
node .local/database-migration/private/environment-batch-20261010/checkpoint.mjs after-cie23
node .local/database-migration/private/environment-batch-20261010/checkpoint.mjs after-cie35
node .local/database-migration/private/environment-batch-20261010/checkpoint.mjs after-reader
.local/postgresql-client/bin/pg_dump.exe --dbname=service=estudisc-final --format=custom --file=.local/database-migration/private/environment-batch-20261010/post-batch.dump
.local/postgresql-client/bin/pg_restore.exe --list .local/database-migration/private/environment-batch-20261010/post-batch.dump
git diff --check
~~~

Continue the next bounded source-supported batch; exclude already-live/stale versions and do not force this interaction on unsupported source scenarios. Broader enrichment remains partial.

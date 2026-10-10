# Source-defined science predictions — 2026-10-10

CIE-01 v3, CIE-02 v3 and CIE-04 v3 are LIVE on https://vecta-three.vercel.app through the actual authenticated ADMIN and existing Admin Direct publisher. The standing social-project authorization is recorded as the reason. No independent editorial review is claimed.

Each adds one non-assessed prediction using the unchanged worked scenario, observation and explanation, with an explicit proposed goal and proposed existing-Concept link:

| Lesson | Proposed exploration | Preserved conclusion |
| --- | --- | --- |
| CIE-01 | Distance versus displacement in a return trip | 200 m travelled; final displacement zero |
| CIE-02 | Effect of an inclined plane | Longer path with less lifting force in the original scenario |
| CIE-04 | Convection in heated water | Movement of fluid portions; convection |

These reuse accepted ADR 0058, recipe v2 and the existing prediction renderer/resume/fallback. Original absent objectives and worked-block Concept links remain absent. Source rights and official mappings are not certified by publication. CIE-06 was excluded after actual production showed v3 rather than the audited local v2; no stale candidate was applied.

## Acceptance

Actual authoring context for all three was published v2 with matching local source hashes and actual author IDs. Each preview was 200/ready with exact canonical content hash; each targeted import was 201/imported; each direct publication was 200 with exactly one newly published lesson. SQL audits verify published/admin_direct, actual author match and zero independent editorial reviews.

Read-only before/after fingerprints were compared after each publication and again after reader checks: historical v2 payloads/blocks/Activities, Questions/version rows, all 106 Attempts, 127 ConceptEvidence and 129 StudyEvents unchanged. All 132 lesson identities remain; no corpus re-import, official answer submission, mastery or score changes. The checker compares normalized serialized SQL results to its JSON baseline; its initial driver-result prototype mismatch was corrected before proceeding, without changing production data.

All three actual mobile readers at 375 px show the proposed-goal label and correctly named prediction region with no horizontal overflow or unavailable-data message. CIE-04 was also checked at 1440 px; its response has the associated label “Sua previsão”, accepts focus and remains empty, and Observe remains disabled until a response. A private bounded mobile screenshot was inspected. No production prediction response was saved for testing.

## Validation commands

```text
pnpm exec tsx .local/source-goal-enrichment/prepare-next.ts
pnpm exec vitest run tests/unit/science-prediction-recipes.test.tsx tests/unit/source-goal-enrichment.test.tsx tests/integration/source-goal-version-import.test.ts
pnpm exec eslint tests/unit/science-prediction-recipes.test.tsx
pnpm typecheck
pnpm packs:verify
node .local/database-migration/private/prediction-batch-20261010/checkpoint.mjs before
node .local/database-migration/private/prediction-batch-20261010/checkpoint.mjs after-cie01
node .local/database-migration/private/prediction-batch-20261010/checkpoint.mjs after-cie02
node .local/database-migration/private/prediction-batch-20261010/checkpoint.mjs after-cie04
node .local/database-migration/private/prediction-batch-20261010/checkpoint.mjs after-reader
.local/postgresql-client/bin/pg_dump.exe --dbname=service=estudisc-final --format=custom --file=.local/database-migration/private/prediction-batch-20261010/post-batch.dump
.local/postgresql-client/bin/pg_restore.exe --list .local/database-migration/private/prediction-batch-20261010/post-batch.dump
git diff --check
```

Focused tests: seven PASS across three files, including real migrated SQL import/direct-publication preservation. Focused lint, typecheck, packs and diff passed. Initial test typing of the numeric/prediction payload union was repaired by parsing the actual prediction schema, then tests/checks passed. Application runtime code is unchanged; prior full app acceptance remains applicable. Publication used authenticated `/api/admin/authoring-context`, `/api/import/lesson/preview`, `/api/import/lesson` and `/api/admin/content-qa`.

The machine-readable companion receipt records actual hashes, audits, reader checks and private complete backup verification. Raw contexts, actual author IDs, packets, SQL inventories, browser snapshots and backup remain ignored/private. Recipes commit only the technical placeholder author; production packets use the real authenticated author.

## Remaining work

Software through Phase 14 is delivered; whole-corpus enrichment remains partial. Continue compact source selection for additional specified recipes, excluding all already-live versions. CIE-06 and source examples lacking a supported explanatory bridge need targeted current-source examination before any candidate; do not invent original goals/mappings or fill coverage with unjustified interactions.

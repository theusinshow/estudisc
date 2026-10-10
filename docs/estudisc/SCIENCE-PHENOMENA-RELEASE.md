# Energy transformation and condensation — 2026-10-10

CIE-05 v3 and CIE-08 v3 are LIVE on https://vecta-three.vercel.app through the actual authenticated ADMIN and existing Admin Direct publisher, following the completed geometry complement. Each adds one source-derived proposed-goal prediction using the exact original worked example: energy transformation/conservation in a LED lamp; condensation on the outside of a cold glass.

The original absent objectives and original worked-block Concept links remain absent. The new goal/link is explicitly proposed, uses an existing lesson Concept and is marked source-derived. There is no fabricated experiment, independent editorial review or official mapping. The original observation/explanation is quoted exactly; the interaction records no official Attempt, ConceptEvidence or mastery.

## Actual acceptance

- Fresh authoring contexts are latest published v2, with exact local source hashes and actual author bindings. Current CIE-07 v3 is excluded rather than using its historical local v2.
- Both previews return 200/ready with matching canonical content hash; targeted imports return 201/imported; actual Admin Direct publications return 200 and exactly one newly published lesson each.
- SQL audits show published/admin_direct, actual author match and zero editorial reviews. CIE-05 published at 21:07:18.185Z; CIE-08 at 21:08:09.199Z.
- All historical payloads, blocks/Activities, all Question/version rows, 106 Attempts, 127 ConceptEvidence and 129 StudyEvents retain exact before/after fingerprints after each activation and after reader verification. All 132 identities remain; eight exact Question refs per lesson are retained.
- Actual 375 px readers show proposed goals and named prediction regions with associated “Sua previsão” labels, empty responses, no horizontal overflow or unavailable-data message. CIE-08 focus and a private bounded visual inspection pass; its 1440 px reader also passes. No response/Observe action was submitted for testing.
- Nine focused tests across three files, focused lint, typecheck and packs pass. The existing accepted recipe v2, parser, importer, renderer, response/resume and fallback are unchanged.
- Final combined acceptance after both geometry/phenomena increments: `pnpm lint` PASS; `pnpm test` 455 PASS / three optional real-PostgreSQL SKIP, 143 passed files. Current typecheck/packs already passed. Actual mobile/desktop verification covered the new content; no runtime source change justified repeating unchanged full build/browser suites.
- Updated complete private target backup and archive list parse pass (328 lines). SHA-256: `7f37830a844e125240df5992acffd4aa53efce97df1208a214848fd36efda845`.

## Commands

```text
pnpm exec tsx .local/database-migration/private/science-phenomena-20261010/prepare.ts
pnpm exec vitest run tests/unit/science-prediction-recipes.test.tsx tests/unit/source-goal-enrichment.test.tsx tests/integration/source-goal-version-import.test.ts
pnpm exec eslint tests/unit/science-prediction-recipes.test.tsx
pnpm typecheck
pnpm packs:verify
node .local/database-migration/private/science-phenomena-20261010/checkpoint.mjs before
node .local/database-migration/private/science-phenomena-20261010/checkpoint.mjs after-cie05
node .local/database-migration/private/science-phenomena-20261010/checkpoint.mjs after-cie08
node .local/database-migration/private/science-phenomena-20261010/checkpoint.mjs after-reader
.local/postgresql-client/bin/pg_dump.exe --dbname=service=estudisc-final --format=custom --file=.local/database-migration/private/science-phenomena-20261010/post-batch.dump
.local/postgresql-client/bin/pg_restore.exe --list .local/database-migration/private/science-phenomena-20261010/post-batch.dump
pnpm lint
pnpm test
git diff --check
```

Authenticated production operations use the existing authoring-context, lesson-preview/import and content-qa routes. Raw contexts/actual author IDs, packets, inventories, browser snapshots and backups stay private and ignored. No source-code deployment, corpus re-import, Question rewrite, assessed answer or canonical-engine change occurred.

## Continuation

Software through Phase 14 is delivered; remaining corpus enrichment remains partial. Continue compact source/interaction selection for remaining identities, excluding now-live versions and using current sources rather than stale local copies. Prefer the interaction supported by the learning scenario; do not force prediction everywhere to produce a coverage count. Generic GH examples and any new assessed-Question attachment require their precise existing-contract analysis before implementation. The owner's social release policy still supplies direct-release authorization after engineering checks.

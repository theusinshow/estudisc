# Geometry teaching complement — 2026-10-10

MAT-16 v4 and MAT-17 v4 are LIVE on https://vecta-three.vercel.app through authenticated Admin Direct, with the actual social-project authorization recorded and zero fabricated independent reviews.

MAT-16 adds six blocks: circumference/diameter/radius explanation, a solved circumference problem, circular-area explanation, a solved area/contour comparison, the existing linear explorer configured for circumference, and a units/scaling check. MAT-17 adds one solved rectangular-prism problem using internal length, width and height, with capacity conversion. These address the teaching complements found in the current-edital audit.

The text and situations are original authored additions. Only standard mathematical facts/formulas were checked against [OpenStax Prealgebra 2e, Appendix C](https://openstax.org/books/prealgebra-2e/pages/c-geometric-formulas); no book wording, exercises, diagrams or other assets were copied or licensed as reusable. This does not certify an official mapping or original author intent. The explorer explicitly fixes π approximately to 3.14, computes approximate circumference only and distinguishes it from quadratic area growth.

## Actual acceptance

- Fresh actual ADMIN authoring contexts were latest published v3, with exact retained source hashes; each candidate adds the next immutable v4 using the existing authoring builder/importer, without a schema/renderer/engine change.
- Actual previews returned 200/ready with matching canonical packet hashes; imports returned 201/imported; direct publications returned 200, exactly one newly published lesson each.
- SQL audits confirm published/admin_direct, actual author match and zero editorial reviews. MAT-16 published at 20:58:25.575Z; MAT-17 at 20:59:29.060Z.
- Historical v2/v3 payloads, blocks and Activities, all Question/version rows, 106 Attempts, 127 ConceptEvidence and 129 StudyEvents retain exact before/after fingerprints after each publication and after reader checks. All 132 identities remain; the 29 MAT-16 and 14 MAT-17 Question references are unchanged.
- Actual 375 px mobile and 1440 px desktop readers show the new examples and explorer without horizontal overflow or unavailable-data messages. The mobile explorer has labelled number/slider controls, accepts focus and displays `31,4 cm` for radius 5. A private viewport screenshot was inspected. The first element-screenshot attempt timed out waiting for layout stability; a viewport capture after explicit positioning succeeded. A repeated “Ver tudo” click was unnecessary after the reader retained its whole-lesson mode; actual content verification passed.
- Nine focused tests across four files, focused lint, typecheck, packs and diff passed. Tests independently check decimal/rational results, linear circumference versus quadratic area, units, source/Question retention, compatible import, renderer and enhancement-off fallback. Runtime code is unchanged; earlier full application acceptance remains historical applicable evidence.
- Final combined follow-up after the subsequent phenomena increment: full `pnpm lint` PASS and `pnpm test` 455 PASS / three optional real-PostgreSQL SKIP. Current typecheck/packs also passed; actual new-content browser verification remains recorded above.
- Full private updated target backup and archive listing passed (328 lines). SHA-256: `743ce5426f634b3567ea0424538799f3260ef506e43a69236f5b8c32c4ade6c3`.

No corpus re-import, old version retirement/rewrite, new assessment Question, official answer submission or learner-state test response occurred. The new practice consists of worked examples and exploration; it does not claim additional scored-question coverage. Existing Concept IDs/objectives and deterministic engines remain authoritative.

## Commands and production operations

```text
pnpm exec tsx .local/database-migration/private/geometry-batch-20261010/prepare.ts
pnpm exec vitest run tests/unit/geometry-supplements.test.tsx tests/unit/authoring-source-policy.test.ts tests/unit/lesson-version-route.test.ts tests/integration/source-goal-version-import.test.ts
pnpm exec eslint tests/unit/geometry-supplements.test.tsx
pnpm typecheck
pnpm packs:verify
node .local/database-migration/private/geometry-batch-20261010/checkpoint.mjs before
node .local/database-migration/private/geometry-batch-20261010/checkpoint.mjs after-mat16
node .local/database-migration/private/geometry-batch-20261010/checkpoint.mjs after-mat17
node .local/database-migration/private/geometry-batch-20261010/checkpoint.mjs after-reader
.local/postgresql-client/bin/pg_dump.exe --dbname=service=estudisc-final --format=custom --file=.local/database-migration/private/geometry-batch-20261010/post-batch.dump
.local/postgresql-client/bin/pg_restore.exe --list .local/database-migration/private/geometry-batch-20261010/post-batch.dump
git diff --check
```

Authenticated browser operations used `/api/admin/authoring-context`, `/api/import/lesson/preview`, `/api/import/lesson` and `/api/admin/content-qa`. Actual author IDs, contexts, packets, inventories and backups stay private/ignored. Public reusable supplement definitions and fixture tests carry no private author/credential data. Initial local shell quoting while preparing the ignored checkpoint helper failed before any production mutation; a file-based helper corrected it and the baseline was captured before import.

## Continuation

Continue with bounded source-defined phenomena in CIE-05 and CIE-08, after fresh actual source/author validation and using the accepted recipe v2. Actual latest inventory has CIE-07 v3, so its local v2 is excluded. Broader enrichment remains partial; scored circular-measure retrieval may be a later explicitly specified Question-bank increment and must not alter existing refs via this append-only importer.

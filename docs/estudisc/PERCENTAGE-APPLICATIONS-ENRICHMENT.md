# MAT-08 — source-defined percentage applications

This bounded Phase 9 increment appends MAT-08 v3 from published v2 through ADR 0049's existing targeted importer and ADR 0048's authorized Admin Direct path. It does not repeat the MAT-07 pilot or re-import the corpus. Actual production evidence is recorded in `PERCENTAGE-APPLICATIONS-RELEASE.json` after activation.

| Source example | Existing goal / Concept | Exploration | Meaning of result |
|---|---|---|---|
| E01 | Aumentos e descontos sucessivos / MAT.PCT.SUCCESSIVE | 10% of 280 = 28 | Second discount, applied to the increased price; final price remains 252 |
| E02 | Encontrar o valor original / MAT.PCT.REVERSE | 18% of 300 = 54 | Check the recovered original price: 300 − 54 = 246 |
| E04 | Juros simples / MAT.INTEREST.SIMPLE | 1.6% of 1250 = 20 | Monthly interest; eight periods give interest 160 and total 1410 |

The explorer displays the percentage part. It does not claim to calculate the final price, recover an original price automatically, or compound interest. The unchanged worked example immediately preceding each explorer supplies this distinction. This uses the existing percentage-only recipe and renderer; no new formula/evaluator, arbitrary code, registry, asset, dependency, feature flag or migration is introduced. Existing text inputs work with the production interactive feature flag off; enhanced range/resume is a separate rollout.

All thirteen original blocks, fifteen Activities, ten immutable shared Question references, goals, Concepts, prerequisites, exit ticket, sources and caveats remain intact. Only the next lesson version and three source-anchored exploratory blocks are added. Exploration creates no official Attempt or mastery evidence. Old v2 remains available explicitly and published; no original record is rewritten.

Reproduce the artifact with:

```text
pnpm estudisc-content enrichment-export --request tools/estudisc-content-studio/recipes/percentage-applications.v1.json
```

Export validates exact source lesson/block/quote hashes, authored goals and Concept links, current blueprint recommendation, strict schema, source bank reference hashes and next version. A second export is stable. Original fields/blocks/Activities are compared in full locally, and arithmetic is checked against the complete authored examples. Existing meaningful rejection, permission, immutable-version and migration-backed publication tests remain applicable; unchanged target/dependency hashes are recorded with the actual prior acceptance evidence.

Local engineering commands: `pnpm lint`, `pnpm typecheck`, `pnpm packs:verify`, `pnpm test`, `pnpm build`, `pnpm test:e2e`; focused `pnpm exec vitest run tests/unit/enrichment-preview.test.tsx tests/unit/lesson-blueprints.test.ts tests/unit/lesson-version-route.test.ts tests/integration/lesson-version-import.test.ts`. Focused fifteen PASS; full 361 PASS/three optional real PostgreSQL SKIP; serial browser 48 PASS/eighteen gated SKIP; lint/typecheck/build/packs PASS. Migrated PGlite coverage is separate and explicit. Production HTML/output/history/Question checks passed; live keyboard automation was not verified because Orca snapshot failed and focus did not move. All six inputs remained unchanged. Existing unchanged-component desktop/mobile interaction E2E passed; no production keyboard success is inferred.

Publication does not certify official mapping, rights or planner readiness. Blueprint metadata remains UNREVIEWED, source caveats remain visible and no independent QA is fabricated. Actual authenticated Admin Direct records supply the actor/reason; user feedback follows launch. No raw credentials/cookies or private learner data are exported. Browser checks never submit learner answers; ordinary lesson reads can record exposure events.

Next: extend compatible source-bound recipes to existing bounded linear models and verify their production interaction rollout before broader domain batches. Do not force unrelated mathematics into percentage controls; missing authored goals and ambiguous pedagogical cases remain explicit exceptions.

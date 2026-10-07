# Phase 9 — Source-bound enrichment review preparation

Date: 2026-10-07. Base checkpoint: `f950593`. Decision: [ADR 0047](../ADR/0047-source-bound-enrichment-review-previews.md). Policy: [ENRICHMENT-PREVIEW-POLICY.md](../../tools/estudisc-content-studio/ENRICHMENT-PREVIEW-POLICY.md). Review-preparation increment accepted locally; exact hashes are in [evidence](ENRICHMENT-PREVIEW-EVIDENCE.json). Reviewed/batch enrichment remains pending.

## Concrete pilot

Recipe: [percentage-calculation.v1.json](../../tools/estudisc-content-studio/recipes/percentage-calculation.v1.json). Existing MAT-07 v4 objective “Calcular a parte percentual”, Concept MAT.PCT.CALCULATE, authored E03 quote “Calcule 16% de 275.” Initial existing explorer values 275 / 16 yield 44. One new exploratory block is placed immediately after E03 in an isolated v5 draft candidate. No new image, Question, assessment, formula engine, canonical Attempt or evidence effect.

Preserve stable lesson identity, all 14 original blocks, 18 Activities, objectives/sources/prerequisites/exit-tickets and twelve shared Question IDs/versions/record hashes. Original published bytes remain untouched. Original lesson/Activity teaching content is present only in the ignored local review candidate; shared Question records/answers/assets remain in the source and only their IDs/version/hashes appear in the references sidecar. Historical source rights/mapping/readiness caveats remain visible; publication is not independent review.

CLI:

```text
pnpm estudisc-content enrichment-preview --request tools/estudisc-content-studio/recipes/percentage-calculation.v1.json
```

Outputs under ignored Studio `enrichment-previews/<complete-input-hash>/`: recipe.json, preview.lesson.json, references.json and review-request.json. Request explicitly lists the existing seven Studio dimensions, exact input hashes, author identity, current blueprint UNREVIEWED state and REVIEW_REQUIRED gate. It contains no reviewer assignment, approval, certification or import-ready Pack. Existing independent Studio ownership/review/approval/export workflow remains authoritative; this tool has no promotion/import/publication command.

## Validation and cache

The recipe pins exact source lesson/block/quote, existing goal/Concept/placement, supported existing percentage schema, next version and initial arithmetic. Current genuine blueprint must bind the same source and recommend the existing block. Unknown/invented/changed content, colliding IDs, unsupported arbitrary models, false initial results and version rollback fail closed. Complete source, blueprint, recipe, referenced Question, candidate, policy and current asset hashes bind the review request; previous generations are retained. Recompute outputs and compare exact bytes; unchanged files skip, tampered/corrupt/invented approval data is overwritten with the pending review request.

Focused `pnpm exec vitest run tests/unit/enrichment-preview.test.tsx tests/unit/lesson-blueprints.test.ts tests/unit/teaching-assets.test.ts tests/unit/content-studio.test.ts` — 42 PASS. Tests cover actual source preservation, all twelve record hashes, existing Pack validation/renderer, wrong goal/Concept/quote/hash/identity/model/calculation/collision/version rejection, deep-copy isolation and real output-cache/forged-review repair.

Browser QA passed in both chromium/mobile-chrome with existing foundation/interactive flags true and adaptive false: initial 44, changed values yielding 60, keyboard range yielding 60.3, invalid-range feedback, widths 320/390/1280 without horizontal overflow, native keyboard focus/visible style, targets at least 44px, reduced motion and zero official submission requests. Default/off views also passed. Twelve actual isolated-component screenshots are under ignored `.local/enrichment-preview/on/` and `off/`; mobile and desktop screenshots were inspected, with no visual/style changes required.

Final commands:

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm packs:verify` — PASS.
- `pnpm test` — 355 PASS / 3 optional real-PostgreSQL SKIP (116 passed files/three skipped). After the schema-export correction, the focused four-file suite above passed all 42 again; typecheck/schema export and changed-target ESLint passed.
- `pnpm test:e2e` — 46 PASS / 18 gated SKIP, fresh serial chromium/mobile-chrome servers (23 PASS/nine SKIP each), `DATABASE_URL=memory://local`, planner/Today/interactive/adaptive flags explicitly false.
- `pnpm test:e2e tests/e2e/enrichment-preview.spec.ts` — two PASS/no SKIP, planner/Today/interactive true, adaptive false, same disposable memory harness.
- `pnpm estudisc-content enrichment-preview --request tools/estudisc-content-studio/recipes/percentage-calculation.v1.json` twice — four files written, then zero written, actual MAT-07 v5/one added block/twelve retained references/REVIEW_REQUIRED.
- `pnpm estudisc-content schemas`; `pnpm exec eslint tools/estudisc-content-studio/cli.ts`; `pnpm exec eslint tools/estudisc-content-studio/enrichment-contracts.ts tests/unit/enrichment-preview.test.tsx tests/e2e/enrichment-preview.spec.ts` — PASS.
- `pnpm exec tsx .local/enrichment-preview/verify-evidence.mjs` — seven current hashes, 52 actual unique prior accepted comparisons, twelve unchanged source documents, four actual media inputs/four corpus sources, actual output/screenshot hashes and retained content/reference checks. `git diff --check` PASS; generated Next/type/token churn restored. Runtime/engines/auth/storage/Pack schemas/dependencies/corpus remain unchanged.

The initial browser assertion incorrectly required outline and then sampled focus style before the existing short CSS transition settled. A diagnostic confirmed native focus was already correct while computed background/shadow still reflected the previous frame; polling the real blur/focus styles fixed the test. Approved CSS remains unchanged. JSON Schema export initially rejected the internal `mode: undefined` field; the recipe now projects only the two existing approved percentage parameter fields, with a meaningful schema-export regression check.

## Remaining review boundary

All actual blueprints/candidates remain UNREVIEWED/REVIEW_REQUIRED. No Studio job, reviewer claim or approval record is automatically created. Structural/arithmetic/SSR/browser QA is engineering validation, not independent factual/pedagogical/rights approval. Integrate the exact pilot into the existing Studio review ownership/workflow, then review its blueprint and whole lesson with actual source evidence in all seven dimensions; carry forward factual evidence only with real reviewed artifact/dependency receipts. Missing objectives on the other 113 source lessons remain unresolved. Precise pedagogical exceptions use Terra; no bulk full-lesson transfer, model change or additional agents in this increment. No reviewed batches/import/production publication are claimed.

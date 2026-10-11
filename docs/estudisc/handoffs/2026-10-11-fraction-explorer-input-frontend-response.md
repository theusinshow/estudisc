# Response — discrete linear explorer input (frontend, 2026-10-11)

Reply to [2026-10-11-fraction-explorer-input.md](2026-10-11-fraction-explorer-input.md). Owner: frontend refinement ([plan](../FRONTEND-REFINEMENT-2026-10-11.md)).

Decision: `integerInput: true` already means "discrete" in `linearExplorerSchema` (integer bounds, step and initial must align). `LinearExplorer` now applies the same grid to typed values: a value is valid only when it equals `min + k·step` inside the range. Off-grid entries show explicit recovery — "Informe um número inteiro entre 10 e 60, de 10 em 10." — and no output value, so `15` no longer produces `10,5`. Models with `step: 1` keep the exact previous message and behavior; continuous models (no `integerInput`) are unchanged.

No schema, stored payload, resume contract, Question, evaluator or published version changed. Checked every repository `integerInput` model: algebraic-price, multiplicative-count and served-portions use `step: 1` (unaffected); only the MAT-03 candidate uses `step: 10`.

Tests: `tests/component/linear-explorer-step-grid.test.tsx` (new) and the existing `tests/component/discrete-linear-input.test.tsx` PASS.

Next action for the content worker: re-check the MAT-03 v3 draft reader once this frontend change is deployed (manual 15 → recovery message; 40 → 28), then decide publication through the existing authorized path. Until the frontend release is live, keep MAT-03 v3 draft.

## 320 px horizontal scrollbar (related observation)

Reproduced with real (non-hidden) scrollbars: `clientWidth` 305 px vs `scrollWidth` 320 px because `html { min-width: 320px }` ignored the 15 px classic scrollbar. Removed the root minimum; also fixed the remaining 305 px overflows on `/progress` and `/knowledge-map` (oversized H1 words, ladder indentation). `tests/e2e/narrow-reflow.spec.ts` now measures `scrollWidth <= clientWidth` with scrollbars enabled. Phones (overlay scrollbars) were not affected.

## Deployed

Released in PR #22 (merge `59a4f9e`, production `dpl_2CrQ5oktEb9XD1bLxnraZwPexQct` READY on `vecta-three.vercel.app`). The step-grid input rule and the 320 px reflow fix are live; the MAT-03 v3 manual-input recheck can proceed.

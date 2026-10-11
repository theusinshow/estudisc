# Operations, factorization and fraction release — 2026-10-11

LIVE through authenticated Admin Direct: MAT-01 v3 adds a worked example of equal-priority division/multiplication; MAT-12 v3 adds common-factor extraction with a negative term and a zero check. Existing goals/Concepts, all original fields/blocks/Activities and 26 Question references remain exact. Data templates: `tools/estudisc-content-studio/teaching-complements/operations-factorization.json`. These are original source-derived teaching complements, not original source quotations, assessed Questions or independent editorial approvals. No Pack schema, renderer, grading/mastery/evidence or reserved content contract was changed.

Both previews returned 200/ready with exact hashes, imports 201, and publication 200 with two new releases. Actual draft readers displayed the expected administrative unpublished disclosure. Published mobile readers at 375 px fit scrollWidth/clientWidth 360/360; MAT-12 desktop at 1440 px fits 1425/1425. Screenshots were inspected. The new shared notation renderer has both visual and original-source spans; text assertions must remove `.math-visual` from a clone to compare exact authored text rather than concatenating both representations. This was a verification correction, not a source-content error.

Five focused tests PASS: exact source retention/Question hash rejection for both templates, arithmetic operation order, factorization property including zero, and existing compatible import integration. Initial property test exposed JavaScript `Object.is(+0,-0)` rather than a mathematical difference; numeric equality now treats both as zero. Targeted lint and pinned packs PASS. Private read-only before/after checks preserve existing lesson identities (132), 1,284 Question/version rows, 120 Attempts, 141 evidence records, 146 events and all frozen session compositions. Exact original row hashes are retained; publication actors/modes are authentic, with zero fabricated editorial reviews.

## Fraction input exception closed

Frontend owner released PR #22 separately. A fresh read of the Vercel production target confirmed READY deployment `dpl_2CrQ5oktEb9XD1bLxnraZwPexQct`, SHA `59a4f9ed93b1b2e8e43196ee9ab62d186a26bf82`. Actual MAT-03 v3 draft reader rejects typed 15 with “de 10 em 10”, accepts 40 with numerator 28 and slider 40, and fits scrollWidth/clientWidth 305/305 at viewport 320 px. Thirteen focused recipe/input tests PASS. The existing imported draft, its author and Question refs, original blocks/Activities and prior row hashes were checked; it was not re-imported, rewritten or regenerated.

MAT-03 v3 is now LIVE through actual Admin Direct, one new publication. A fresh published reader shows initial 30 → 21 and no administrative unpublished disclosure. Final read-only audit preserves history. Publishing an existing draft legitimately changes only lesson metadata `status` and `qaReleaseId`: the private checkpoint reverses exactly those two fields and requires the original full row MD5 plus actual actor/mode audit. The initial raw-row check reported this expected transition; the corrected check passes without excluding the draft's content from preservation.

## Exact validation and backups

- `pnpm exec vitest run tests/unit/operations-factorization-teaching.test.ts tests/integration/source-goal-version-import.test.ts` — 5 PASS.
- `pnpm exec eslint tests/unit/operations-factorization-teaching.test.ts` — PASS.
- `pnpm packs:verify` — PASS.
- `pnpm exec tsx .local/database-migration/private/math-operations-factorization-20261011/prepare.mts` — actual source/author/hash/ref binding PASS.
- `node .local/database-migration/private/math-operations-factorization-20261011/checkpoint.mjs before` (then `after-import`, `after-publication`, `final`) — PASS.
- `pnpm exec vitest run tests/component/discrete-linear-input.test.tsx tests/component/linear-explorer-step-grid.test.tsx tests/unit/source-bound-linear-batch-20261011.test.ts` — 13 PASS.
- `node .local/database-migration/private/fraction-release-20261011/checkpoint.mjs before` and `final` — PASS, with the exact publication metadata transition rule described above.
- `vercel api /v9/projects/lab-estudisc --scope theusinshows-projects` — current production READY/SHA confirmed; output kept private.
- Private `pg_dump.exe --dbname=service=estudisc-final --format=custom --file=<private batch path>` and `pg_restore.exe --list <private batch path>` completed before and after each release. Operation/factorization pre SHA256: `d7624dc34fcc7a601f31ee1d14a9b8fd210687a22739d5b394d7a7dc78e3a7ff`; post: `3128dfce2c7444c481024f6e058e1b193342d61c9ad3375303b424e3aeb7cd8e`. That post-backup is the immediately preceding fraction-release backup; fraction post: `cbf37e6b0df6929491fa8d39ceed8e906888d4a2dccc8f3ca66ba77f5a0ec981`.

Private API, reader, checkpoint and backup receipts: `.local/database-migration/private/math-operations-factorization-20261011/` and `.local/database-migration/private/fraction-release-20261011/`. No student impersonation or scored submissions. Old console CSP/style warnings are not claimed resolved by this content work. No combined app build/E2E was run against the concurrently edited tree; frontend release acceptance belongs to its owner. This worker did not edit/stage/deploy the frontend or commit real actor data/secrets.

NEXT ACTION: integrate only isolated content contributions and these receipts with the frontend owner's final status/changelog checkpoint. Continue source-bound curriculum complements under existing contracts. New scored-Question/lesson bindings remain the separate engineering handoff `docs/estudisc/handoffs/2026-10-10-scored-enrichment-contract.md`; no editorial/user approval gate remains for this released batch.

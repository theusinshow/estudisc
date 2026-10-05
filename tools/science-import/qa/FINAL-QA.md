# Science final QA — draft IMPORT_READY

Independent structural/render/import QA passed on 2026-10-05. No editorial rereview, research, scientific approval, source rewrite or publication.

Final persisted media pack: `.local/science-integration/media/science.pack.json`; canonical hash `722f1deeb98c55cb121f988931596830a68c5bd4ab15fcf7754f49ebe574bc27`, raw SHA-256 `a44180849db02d397efc4da100267889ae5132c39218ea2184e2966ceb3b91e2`, 1,046,767 disk bytes. Seven cumulative snapshots imported idempotently. Latest snapshot 7 contains 40 draft lessons, 320 resolved shared Questions/activities, 240 resolved Concepts, 538 blocks and 13 figures. The 24 explicit pending notes comprise 11 deterministic components and all 13 illustration requests.

Only the 13 figure lessons use runtime v3; 27 lessons remain v2. Source packs and all 320 Questions remain v2, with the runtime version map explicit in metadata and sidecar. Direct database queries confirmed all 40 historical v2 lessons and their 538 original blocks remain exact. Zero duplicate Question identity/version pairs, zero orphan Question/Concept or lesson/Concept joins, and zero attempts/study events/ConceptEvidence.

All 620 source files remain unchanged. Mathematics/full IFSC baseline preservation hashes match before/after every stage and current database: `1657bbe89d5a12e4c5acabcfd0e22a4aed6fad50e0eac52915350b67a8f02558`. Preserved sections: 2 pack manifests, 2 tracks, 31 lessons, 585 blocks, 430 activities, 380 baseline Questions and 9 canonical Concept definitions. Total persisted Question versions: 380 baseline + 320 Science = 700.

Exact commands and results:

- `$env:SCIENCE_QA_PACK='.local/science-integration/media/science.pack.json'; pnpm exec vitest run tests/science-qa-render.test.tsx tests/science-qa-import.test.ts` — 2 files / 4 tests passed on the repaired final pack. Checks exact source/sidecar strings, answers, provenance conversion, cognitive operation, difficulty, mapped Concepts, core SSR/evaluator/draft exposure and disposable baseline preservation. Figure descriptions are compared per exact paragraph/line break inside the matching figure disclosure.
- `pnpm exec tsx tools/science-import/qa/persistent-receipt-audit.ts` — 7 receipts passed, none pending; saved pack hashes, counts, idempotence/draft/state flags and consistent preservation hashes verified. Report: `.local/science-integration/qa/persistent-receipt-audit.json`.
- `pnpm exec tsx tools/science-import/qa/persistent-db-audit.ts --worker-closed` — passed after root confirmed Worker connections closed. Existing owned PGlite database audited in `BEGIN READ ONLY`; no migrations/imports/data mutations. Report: `.local/science-integration/qa/persistent-db-audit.json`. Initial invocation hit a CJS top-level-await transform error before opening the DB; script wrapped in async main and rerun successfully.
- `pnpm exec eslint tools/science-import/qa/persistent-db-audit.ts` — passed after that local script repair. Other owned QA files passed targeted ESLint during their increments.

Root final acceptance evidence: `pnpm lint`, `pnpm typecheck`, `pnpm test` (228 passed / 3 skipped) and `pnpm build` passed after the version delta. Final Science mobile smoke passed all eight pilot lessons at 344px with actual core SSR/app CSS, radio keyboard controls and no overflow. Full serial `pnpm test:e2e`: 22 passed / 14 known failures, zero new failure names versus the actual prior baseline; both Science preview project smokes passed. Broader application release gate remains FAIL. Draft Science technical IMPORT_READY does not claim full application acceptance.

Limits: static SSR previews do not prove hydration/authenticated routes; draft exposure is separately checked by the existing core gate. Human editorial/figure/official mapping/prerequisite review remains pending. Forty stale upstream manifest hashes stay visible. Nothing published or deployed. Root owns CURRENT/NEXT and final repository status.

## Portable committed snapshot verification (2026-10-05)

The exact current Pack, editorial sidecar,620original source files and13SVGs are now tracked in `packs/drafts/ifsc-2027-science/`. Raw Pack SHA256 remains `a44180849db02d397efc4da100267889ae5132c39218ea2184e2966ceb3b91e2`; no original source/media bytes were changed. Git attributes preserve sealed bytes, and existing Week1 seed SVG line endings match the immutable release. Defaults use tracked inputs; ignored Mathematics inputs are additionally audited only when present. No public catalog entry or database is committed.

Exact staged candidate exported with `git checkout-index --all --force --prefix=.local/science-push-candidate/`; candidate commands/results:

- `pnpm install --frozen-lockfile`: PASS.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: PASS.
- `pnpm test`:180passed/3skipped (71files passed/3skipped).
- `pnpm exec vitest run tests/unit/ifsc-week-pack.test.ts tests/science-import-tooling.test.ts tests/science-qa-import.test.ts tests/science-qa-render.test.tsx`:9passed.
- `$env:DATABASE_URL='memory://local'; pnpm test:e2e`:17passed/19failed. Checkout exports during this run restarted the owned development server; the run remains unaccepted, and zero new regressions is not claimed. Both Science mobile/keyboard preview projects passed. Log `.local/science-push-e2e.log`; focused accessibility/Science recheck `.local/science-push-e2e-focused.log`.
- `git diff --cached --check`:PASS; all620source files and13SVGs independently match original/index/export byte-for-byte.

Root read-only checks rerun: `pnpm exec tsx tools/science-import/qa/persistent-db-audit.ts --worker-closed`, `pnpm exec tsx tools/science-import/qa/persistent-receipt-audit.ts`, `node tools/science-import/qa/source-audit.mjs`:PASS with40original stale manifest hash findings retained. Reports `.local/science-push-db-audit.log`, `.local/science-push-receipts.log`, `.local/science-push-source-audit.log`.

The user subsequently authorized publication of all forty lessons and stated review is complete. This is a real user decision, not independent agent approval. Actual authenticated production import/publication and readback remain a separate operation; do not infer publication from this committed draft snapshot.

Final portable browser recheck: `$env:DATABASE_URL='memory://local'; pnpm exec playwright test tests/e2e/accessibility.spec.ts tests/e2e/science-qa-mobile.spec.ts`:4passed/2failed. Both Science previews and both skip-link checks passed; accessibility route navigation timed out in both projects. Full application gate remains FAIL; these two additional navigation failures are unresolved and are not claimed to be baseline.

Snapshot commit `faba15c` pushed successfully to origin/main. User-authorized production publication is pending ADMIN login at https://vecta-three.vercel.app/auth/signin?callbackUrl=%2Fadmin%2Freview; no actual production import/publication has occurred.

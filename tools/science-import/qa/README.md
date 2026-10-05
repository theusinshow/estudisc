# Science source QA

Run `node tools/science-import/qa/source-audit.mjs` from the repository root. Optional positional arguments override source directory and report path. The source package is read only.

The deterministic report records every source-file SHA-256, canonical JSON hashes for lessons/questions/Concepts/blocks, IDs, answer keys, concept links, source metadata, prerequisite fields, and media queues. Counts and structural references are checked across all 40 lessons. No scientific research, editorial approval, or prose rewrites are performed.

`source-baseline.json` is the fidelity baseline for later import QA. Forty stale manifest hashes are reported explicitly; they do not invalidate preserved editorial source. Other structural failures exit nonzero. Source editorial status strings are recorded as supplied and do not authorize publication.

Focused validation: `node tools/science-import/qa/source-audit.mjs` and `pnpm exec eslint tools/science-import/qa/source-audit.mjs`.

Independent adapted-pack QA: `pnpm exec vitest run tests/science-qa-render.test.tsx tests/science-qa-import.test.ts`. Defaults to `.local/science-integration/batch5/science.pack.json`; set `SCIENCE_QA_PACK` to another cumulative snapshot or the pilot to reuse the same checks. All 620 pinned source files must remain unchanged. Exact raw editorial packs remain in the sidecar; runtime block identities carry canonical sorted JSON hashes. Source sentences already contained in another rendered paragraph may appear once; every distinct exact source educational string must remain present. No blocks may disappear.

Mobile smoke: `pnpm exec playwright test tests/e2e/science-qa-mobile.spec.ts --project=mobile-chrome`. The existing serial owned E2E harness generates private static previews from actual core lesson/question renderers, the existing app CSS and design tokens, and the lesson page/step wrapper classes. It checks all eight pilot lessons at 344px, no horizontal overflow, all 40 radio choices per lesson, native keyboard selection, figure alt text and text-description disclosures. This checks static SSR layout/semantics; it does not simulate application hydration or prove authenticated draft-route authorization. The core Question exposure checks separately reject every draft for training/review/assessment.

Manual figure/scientific approval remains human work; see `MOBILE-CHECKLIST.md`. Root owns full final acceptance and persistent import receipts.

`preservation-audit.ts` captures normalized baseline database hashes through an already-owned PGlite connection. Call after approved full IFSC/Mathematics baseline imports and before Science, then call again after import and pass both snapshots to `assertPreservation`. All nine reused canonical Concepts must already exist. The core CLI writes `preservation-audit.json`; the QA import test independently proves the helper against full IFSC + Mathematics + all40 Science on a disposable migrated database.

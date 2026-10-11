# Lesson evolution acceptance — 2026-10-11

This checkpoint integrates dedicated content recipes/tests/actual release receipts and a bounded Question layout fix from the isolated `fix/lesson-question-reflow-20261011` checkout based on frontend release59a4f9e. The original shared worktree and Claude's uncommitted frontend/generated files remain untouched. Production content releases are separate authenticated data operations; no corpus re-import or locally traced deployment is used.

Narrow defect reproduced with actual Portuguese content: POR-04 Question card overflow at 320 px with classic scrollbars, POR-15 long choice token at 375 px, and POR-24 long compound terms in stems. Existing grid min-content sizes made the cards/forms grow beyond the lesson column. Set the shared interaction/form/fieldset track to minmax(0,1fr), minimum width zero, and allow oversized authored terms to wrap. No hidden-overflow workaround, text rewrite, token/color/typography change, grading/evidence/schema change or new engine. Regression checks authored POR-04/15/24 at 320/375/1440 px, unclipped content, radio focus and56 px answer targets. The prior release failed the real-content test; contained-card-only fix also exposed inner form overflow, which the final rule addresses.

Content now includes nine mathematics continuations and twenty Portuguese source-quoted explorations with authentic Admin Direct records. Exact source/ref/author binding, original fields/blocks/Activities/Questions, published old versions and frozen study histories were preserved. Community feedback remains pending; proposed goals/mappings remain distinct from absent original metadata and no independent editorial review is fabricated. Current marker inventory:58/132 latest identities (MAT19, CIE16, POR23, GH0); absence of a marker is not missing base content or depth certification. [Mathematics receipt](OPERATIONS-FACTORIZATION-RELEASE-2026-10-11.md), [reading receipt](PORTUGUESE-READING-RELEASE-2026-10-11.md), [language receipt](PORTUGUESE-LANGUAGE-RELEASE-2026-10-11.md).

Exact local commands/results:

- `pnpm install --frozen-lockfile` in the isolated checkout — PASS, unchanged lockfile. Initial dependency junction was rejected by pnpm's no-TTY purge guard; only the verified junction was removed, preserving shared dependencies, then installed normally.
- `pnpm lint` and `pnpm typecheck` — PASS. Initial test-only payload-union access was corrected with a checked property guard; focused twenty-case source suite rerun PASS.
- `pnpm test --reporter=dot` —522 PASS, three configured optional real-PostgreSQL SKIP;151 passed files. Latest full log remains private/ignored.
- `pnpm packs:verify` — PASS, pinned corpus unchanged.
- `pnpm build` — PASS. Existing broad filesystem tracing warnings in Studio assets persist; deploy only the Git-backed release, never local private files/build output.
- `pnpm test:e2e` —76 PASS/38 configured feature-gated SKIP across serial Chromium/mobile-Chrome projects, owned memory harness/port3210. Repeated after adding the long-term wrapping case; no all-flags or physical-device acceptance is claimed.
- `pnpm exec playwright test tests/e2e/lesson-question-reflow.spec.ts --project=chromium` — new real-content baseline fails, final containment/wrapping fix passes; final POR-24 case is additionally verified before commit.
- `pnpm exec eslint tests/e2e/lesson-question-reflow.spec.ts tests/unit/portuguese-reading-enrichment.test.ts` — PASS.
- Impeccable context read once; mechanical detector on the initial containment CSS returned `[]`. Canonical DS overrides aesthetic defaults; no redesign or unrequested polish. Subsequent wrapping follows the same measured defect and existing tokens.

The new regression is included in `pnpm test:e2e:critical`, so the protected release checks execute it. Protected PR/required checks/merge/READY alias and actual post-deploy POR-04/15/24 readers remain to verify before reporting the code change LIVE. Language reader layout checks await this fix; published data/immutability checks already passed. Original CSP console warnings are not claimed resolved.

MODEL ESCALATION REQUIRED: user explicitly confirmed Terra for the new scored-Question/lesson-binding contract. [Compact current handoff and exact prompt](handoffs/2026-10-11-terra-scored-enrichment.md). Software through Phase14 is delivered; broad Phase9 content work is partial and Phase15 deferred. NEXT ACTION: finish protected narrow-Question release and post-deploy checks, then Terra defines the assessed append contract before further scored implementation.

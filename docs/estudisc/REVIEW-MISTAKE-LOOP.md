# Owned review and factual mistake practice

Contract: [ADR 0052](../ADR/0052-owned-targeted-review-and-mistake-observations.md). Uses the existing session composer, immutable Question snapshots, help-aware Question grader and review.v2. No scheduling/priority/mastery weight changes, schema migration or new learning engine.

`FEATURE_SMART_MISTAKES` enables 10/15-minute Quick Review from actually due owned Concepts and practice from owned active mistakes. Alternate practice excludes the original Question identity across all versions. Foreign/stale records, active EXAM contexts, reserved/unavailable Questions and no eligible alternate fail closed; existing ACTIVE membership stays frozen after validating the target.

Mistake groups report distinct Attempts, active/resolved records and recurrence per atomic Concept. They do not infer a cause from an incorrect answer. A student explicitly selects one of seven perception labels and can add a note. The owned, idempotent report is an append-only StudyEvent with `basis: student_report` and `canonicalEvidence: false`; conflicting mutation reuse fails. Original mistakes stay available, and a correct alternate does not silently erase them.

Explanation links use existing Concept/lesson content. Canonical evidence comes only from actual shared Question submissions. The optional reflection does not change scores, mastery, evidence or review schedules. Flag off retains the existing pages; learning has no AI dependency.

Mobile focus stays within study forms so navigation cannot reappear between touchend and click. New controls are disabled before hydration, field widths remain usable at 320px, and errors preserve a retry path. The local loop checks actual submissions, an attributed reflection and a different Question, plus keyboard/touch and original history.

Local acceptance: focused 31 PASS; full `pnpm test` 390 PASS/three optional real-PostgreSQL SKIP; `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm packs:verify` PASS. Full serial `pnpm test:e2e` 54 PASS/twenty intentionally gated SKIP. `FEATURE_SMART_MISTAKES=true pnpm test:e2e tests/e2e/review-mistake-loop.spec.ts` two PASS/two intentional flag-off SKIP, exercising actual initial and alternate UI answers plus reflection on desktop/mobile. Corrected desktop/320px visuals and overflow checks passed; scoped Impeccable detector returned `[]`.

The non-secret production rollout variable `FEATURE_SMART_MISTAKES=true` has been added through the existing Vercel project; it takes effect in the next production deployment. Protected CI, deployment and actual learner-view/API acceptance receipts remain pending. No production Question answer, content re-import or database migration was performed for this feature.

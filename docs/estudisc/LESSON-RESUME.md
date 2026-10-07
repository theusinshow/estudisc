# Estudisc — Phase 5 scoped lesson resume

Date: 2026-10-06. Base: `4557014`. The user authorized continuous local implementation; no model switch, additional agents, independent architectural review, production migration or publication is claimed.

## Behavior and compatibility

[ADR 0043](../ADR/0043-owner-scoped-lesson-resume.md) adds mutable user state separate from imported content and append-only Attempts/evidence. [Migration 0020](../../src/db/migrations/0020_giant_grey_gargoyle.sql) creates one empty lesson_resumes table. It has been applied only by disposable SQL tests, never to production.

FEATURE_INTERACTIVE_LESSONS defaults off. Enabled existing LessonSteps/Stepper/Question registry stores owner/track/lesson-version/standalone-or-session scope, stable step ID, explicit completion display state, expanded view, bounded unsent shared Question responses and visible-page elapsed seconds. Session reads/writes require owned ACTIVE frozen membership; standalone scopes require a published version. Draft activity/Question/version/type is checked against canonical content. No canonical answers, mastery, scores, XP or arbitrary provider state in the snapshot. No Pack-schema change or alternate renderer.

Revision checks under the existing owner lock reject stale writes. Mutation identity and content hash make identical retry idempotent; changed retry conflicts. Client saves are serialized/debounced, with explicit save/retry and visible status. A newer tab stops autosave and offers reload. Navigation attempts a bounded keepalive flush; only meaningful state changes or explicit save create revisions. Idle clock ticks/clean exits do not produce continuous writes or self-conflicts. Payload limit is 60,000 UTF-8 bytes; snapshot data is capped at 48,000 bytes/50 drafts.

Stable step IDs recover removed positions to the first valid step with a visible explanation. Completed position is a separate boolean, avoiding collision with a legitimate `completed` content ID. New draft versions do not receive a published version's saved state. Legacy hash navigation remains when the scoped provider is absent; versions never migrate implicitly.

Pending drafts retain their submission UUID and base canonical Attempt identity. After reload, a draft is used only if its base still matches and it has not already been submitted. Canonical Question views restore the actual answer, outcome and assistance. Help/solution state and grades never come from resume JSON; the existing submission evaluator alone appends Attempts/evidence. Wrong-shaped external draft/canonical responses recover safely in the shared UI. Planning, stepping, display completion and resume saving create no evidence.

Visible-page elapsed time is an estimate saved at interaction/manual-save boundaries and excludes background intervals. It is distinct from Phase 4 wall time, active engagement, official assessment time and scored learning. Abrupt offline/process termination can prevent unsaved state reaching the server; save status/retry exposes that limit. Resume/routine preferences are not added to the legacy backup Pack. Typed state for additional interactive blocks is implemented with their Phase 6 schema contracts; Programming Lab keeps its existing enhancement path.

## Validation

- `pnpm db:generate` — generated additive migration 0020 and metadata; existing SQL unchanged.
- `pnpm exec vitest run tests/component/lesson-resume-provider.test.tsx tests/unit/lesson-resume.test.ts tests/integration/lesson-resume.test.ts` — 8 PASS: owner/context/version separation, actual snapshot membership/type, optimistic conflict/idempotence, no evidence, new draft-version isolation, stable steps, stale draft suppression, idle/no-repeat and dirty navigation flush.
- `pnpm exec vitest run tests/component/question-resume.test.tsx tests/component/lesson-resume-provider.test.tsx tests/unit/lesson-resume.test.ts tests/integration/lesson-resume.test.ts` — 10 PASS. Additional cases restore actual revealed assistance together with a draft and recover a wrong-shaped canonical ordering response. No synthetic submission is produced by these display states.
- `pnpm exec vitest run tests/unit/lesson-resume.test.ts tests/integration/lesson-resume.test.ts tests/integration/adaptive-sessions.test.ts tests/integration/golden-questions.test.ts tests/component/golden-lessons.test.tsx` — 20 PASS before lifecycle additions, also covered in the full suite.
- All-on `pnpm test:e2e tests/e2e/lesson-resume.spec.ts tests/e2e/adaptive-session.spec.ts` — 10 PASS, five per fresh desktop/mobile server: step/expanded/draft reload, canonical answer/hint reload, offline retry, two-tab conflict, Focus and factual session completion. Widths 320/360/390/430/1280; 44px controls; reduced motion. Screenshots/assertions synchronize after viewport paint; screenshot caret injection is disabled to avoid test-induced hydration mutation.
- Final `pnpm lint` PASS; `pnpm test` 329 PASS / 3 optional real-PostgreSQL SKIP; `pnpm packs:verify` PASS (one catalog Pack).
- Final default `pnpm test:e2e` — 42 PASS / 16 intentional flag-gated SKIP (21/8 per fresh browser server).
- Foundation/interactive on, adaptive off: `pnpm test:e2e tests/e2e/foundation-evolution.spec.ts tests/e2e/routine-planner.spec.ts tests/e2e/lesson-resume.spec.ts` — 16 PASS, eight per browser, including the actual 60,000-byte body guard and top-of-page mobile/desktop captures.
- `pnpm build` and final `pnpm typecheck` PASS. Impeccable `detect --json --target src/features/lessons/resume-provider.tsx` reports no findings; `git diff --check` PASS.
- `node .local/lesson-resume/verify-evidence.mjs` PASS: 30 current implementation/test/migration hashes, 28 actual prior Phase 4 comparisons, 12 unchanged source files, unchanged corpus/assets/historical SQL and journal entries, additive migration only. [Evidence](LESSON-RESUME-EVIDENCE.json); prior receipts remain historical and were not rewritten. Local logs/screenshots are ignored artifacts; no remote CI or production acceptance is claimed.

All E2E used DATABASE_URL=memory://local. FEATURE_STUDY_PLANNER / FEATURE_NEW_TODAY / FEATURE_INTERACTIVE_LESSONS were false for default and true for both on suites. FEATURE_ADAPTIVE_SESSION was true only for the combined adaptive/resume suite; false for default/foundation. Canonical runner creates fresh serial servers per browser project.

Corrected test fixtures: original generated source Pack is version 2; an attempted different version-2 draft import correctly conflicted and now uses the next Pack version. The initial Question locator omitted the `Z` from the canonical stem and now reads the fixture text. A browser test exposed a real clean-exit elapsed save racing a reload; idle/non-repeat lifecycle fixtures verify the fix. A first width assertion sampled before viewport paint; capture/geometry now use the rendered state rather than suppressing overflow.

## Continuation

This increment is accepted locally. NEXT ACTION: local checkpoint, then Phase 6 typed interactive blocks and their resume/evaluation/touch/keyboard contracts through the existing registries. Keep 132 lessons / 1,144 Questions unchanged; no production migration/deployment/publication without explicit authorization.

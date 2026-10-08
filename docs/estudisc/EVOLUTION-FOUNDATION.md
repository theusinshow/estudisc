# Evolution foundation — implementation and verification

2026-10-08 production delta: foundation/Today/planner/Focus paths are now active after protected final software release, exact additive-table activation and authenticated page/control verification. [Actual final receipt](FINAL-EVOLUTION-RELEASE.json). The original dated implementation/default-off/local-only statements below remain historical evidence.

Date: 2026-10-06. Base: local audit checkpoint `50cfae4`. User authorized implementation after the initial audit. This report covers the first Phase 0/1/2 increment, not the complete architecture pack.

Implemented:

- Central Zod-validated rollout flags in `src/lib/feature-flags.ts`, integrated with existing server configuration. All nine default off; blank is off; only literal `true`/`false` is accepted. Four currently expose UI paths; reserved flags do not implement future engines.
- `FEATURE_STUDY_PLANNER`: real Hoje/Plano/Aprender/Revisar/Progresso navigation, existing secondary/account destinations in a topbar Sheet, and `/plan` with existing session preparation/history. Existing four-item navigation is the off path. Profile is read once and validated; permissions remain server-owned.
- `FEATURE_INTERACTIVE_LESSONS`: same AppShell in Focus for lessons and ACTIVE sessions. `FEATURE_REAL_EXAM`: Focus for ACTIVE assessments. Global navigation is removed; main, skip link and explicit exit remain. Exit only navigates; existing session/scoring/Attempt/evidence behavior stays authoritative.
- Native Dialog/Sheet with title, modal background, bounded scroll, explicit keyboard wrapping, Escape and trigger return; accessible manually activated Tabs for prepared/completed sessions. Component Registry documents real consumers; unused wrappers/libraries were not installed.
- `FEATURE_NEW_TODAY`: next action/reason precedes session preparation, then real session snapshots, attention, queue and week. StudyActionCard supports the six requested variants plus the existing project path; optional counts/estimates are displayed only when supplied. Existing read coordinator/recommendation ordering is unchanged.
- ADR 0040 and canonical DS screen/index/component documentation reconcile navigation and retain 4.0.0 token values. Section/Step remains the existing runtime projection; no Pack schema or data migration.

To preview locally, set only the desired flags in the launching shell; no secret or `.env` edit is needed:

```powershell
$env:FEATURE_STUDY_PLANNER = 'true'
$env:FEATURE_NEW_TODAY = 'true'
$env:FEATURE_INTERACTIVE_LESSONS = 'true'
$env:FEATURE_REAL_EXAM = 'true'
pnpm dev
```

This is a preview instruction, not a production rollout. Disable flags to restore previous entry paths; stored sessions/versions/history remain unchanged.

Verification commands and current evidence (logs in ignored `.local/evolution-foundation/`):

| Exact command | Result |
|---|---|
| `pnpm exec vitest run tests/unit/feature-flags.test.ts tests/unit/env.test.ts tests/component/app-shell.test.tsx` | PASS: 13 tests in initial shell increment |
| `pnpm exec vitest run tests/unit/feature-flags.test.ts tests/unit/env.test.ts tests/component/app-shell.test.tsx tests/component/foundation-controls.test.tsx tests/component/study-action-card.test.tsx tests/unit/today-dashboard.test.ts` | Initial 21 PASS / 2 FAIL: jsdom did not implement showModal; fixed test-only native dialog stubs |
| `pnpm exec vitest run tests/component/foundation-controls.test.tsx tests/component/app-shell.test.tsx tests/component/study-action-card.test.tsx` | PASS: 8 tests after fixture repair |
| `pnpm lint` | PASS, including final rerun after modal focus fix |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS: 275 tests / 3 optional PostgreSQL SKIP |
| `pnpm packs:verify` | PASS: one catalog entry; corpus test separately protects all 132/1,144 IDs and bytes |
| `$env:DATABASE_URL='memory://local'; pnpm build` | PASS |
| `node .local/evolution-foundation/browser-qa.mjs` | PASS: 320/360/390/430/1280, next action in viewport, 44px nav targets, sheet focus/Escape/return, keyboard tabs, persisted session/Focus exit, reduced motion, zero browser errors |
| `C:/Users/Matheus/.agents/skills/impeccable/scripts/impeccable.cmd detect --json src/components/layout/app-shell.tsx src/components/layout/primary-nav.tsx src/components/ui/dialog.tsx src/components/ui/tabs.tsx src/features/today src/app/plan src/styles/application/shell.css src/styles/today.css` | PASS: `[]` findings |
| `node .local/evolution-foundation/verify-records.mjs` | PASS: 17 handoff hashes, 25 local links, 12 original source files unchanged |
| `git diff --check` | PASS |

Browser QA initially caught native Tab escaping to browser chrome after the last link; explicit first/last wrapping fixed it and the bounded confirmation passed. Mobile/desktop/screenshots were inspected together; incumbent identity was preserved. Token colors/contrast remain the previously approved canonical pairs; this is not a new full manual screen-reader audit.

Final E2E commands:

```powershell
$env:DATABASE_URL='memory://local'; $env:FEATURE_STUDY_PLANNER='false'; $env:FEATURE_NEW_TODAY='false'; $env:FEATURE_INTERACTIVE_LESSONS='false'; $env:FEATURE_REAL_EXAM='false'; pnpm test:e2e
$env:DATABASE_URL='memory://local'; $env:FEATURE_STUDY_PLANNER='true'; $env:FEATURE_NEW_TODAY='true'; $env:FEATURE_INTERACTIVE_LESSONS='true'; $env:FEATURE_REAL_EXAM='true'; pnpm test:e2e tests/e2e/foundation-evolution.spec.ts
```

Default/off: PASS 38 existing tests, 4 intentional flagged skips (19 PASS / 2 SKIP per project). Flagged suite/on: PASS 4 tests, no skips/failures (2 per project). No existing test was removed. Playwright remained one worker with fresh desktop/mobile processes on disposable memory state. The off/on suites are separate because old navigation expectations intentionally describe the previous rollout path.

The ad hoc visual QA server printed Auth.js UntrustedHost warnings because its launch omitted the local trust-host setting; it did not exercise real authenticated sessions. The canonical E2E harness explicitly sets AUTH_TRUST_HOST and its auth suite passed. No auth/security policy was changed to suppress those warnings. Full manual screen-reader review and opt-in real-PostgreSQL concurrency remain limitations.

After checks, restore only verified tool-generated next-env and token-CSS changes. Final acceptance is for this coherent foundation increment; routine-dependent and later-phase criteria remain pending. No external/production release is claimed.

Remaining scope: weekly availability/modes/overrides/rebalance/onboarding; routine-dependent day-off/completed-day states; general persisted block resume/learning purpose/evidence; further interactions/assets/blueprints/enrichment; Review/Mistakes/AI/graph/new exam navigation/Admin. No published content, production state or domain policy was changed by this increment. See the [Terra handoff](handoffs/2026-10-06-planner-routine-terra.md).

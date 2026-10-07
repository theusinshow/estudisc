# Phase 3 — Weekly routine implementation

Date: 2026-10-06. Base: `605b777`. The user answered the pending model-routing choice with “pode seguir”, authorizing this session to resolve and implement the Phase 3 contract. No model switch or additional agent. [ADR 0041](../ADR/0041-weekly-study-routine-and-checked-previews.md) records the durable decisions.

Implemented under `FEATURE_STUDY_PLANNER` (default off):

- Owner-scoped weekly routine: valid IANA timezone, seven days, optional suggested hours, selected generic subjects, priorities and Automatic/Assisted/Manual allocation.
- Weighted fair allocation in 15-minute blocks matching the current session minimum, with a visible smaller remainder. Automatic balances equally, Assisted uses explicit priorities, Manual respects assigned time. Dated focus/overrides and completed-session planned minutes inform the remaining week. Past days produce no task debt.
- Review target included within subject time; simulation time reservation. A full simulation reservation is distinct from completed study time. A reduced override that cannot fit the complete reservation produces a warning and does not fabricate a partial exam.
- Owner-bound, server-derived preview; 15-minute expiry; routine revision plus local-date/subject/session dependency hash; explicit transactional apply and idempotent retries. Only apply saves settings and appends one actual configuration event. Old previews cannot overwrite newer settings.
- SQL and memory persistence share schemas/policy. Migration `0019_rainy_shooting_star.sql` adds two empty user-state tables, checks, owner FKs and an index; no content or historic learner-data transformation.
- Existing planner supports cumulative subject/time limits with snapshot policy `planner.v1+routine.v1`; priority weights remain unchanged. New planning/PLANNED start respects current routine. An already ACTIVE snapshot remains resumable. Failed replanning leaves an existing prepared session intact.
- `/plan`: days → time → priorities → preview onboarding, saved week/routine view, explicit overrides/focus/manual editing, loading/empty/error recovery. Saved unavailable subjects remain visible for explicit removal instead of trapping the editor in a hidden invalid selection.
- Today shares existing recent session and subject facts with the routine read model, including uncapped relevant weekly completions. It displays genuine no-routine/day-off/budget-used/simulation-reserved states and uses the evaluated routine date. Existing Progresso retains its historical calendar; saving a routine does not count as a study day or emit mastery evidence/XP.

Constraints/limitations:

- Published subject presence is a routine choice, not certification of planner readiness, rights, official mapping or independent editorial review. Existing question/prerequisite/exposure gates remain; new readiness semantics belong to Phase 4.
- Current sessions accept 15/30/60. Smaller time/remainders are displayed honestly and cannot force a 15-minute session into insufficient time; Adaptive Session 10/20/30/45 remains next.
- Completed-session item minutes are declared planning facts, rounded up conservatively when fractional; they are not measured elapsed time or proof of mastery. ACTIVE composition, Attempts, evidence and published versions remain unchanged.
- Routine settings are not yet part of the existing export/restore Pack; the UI discloses this. No Pack schema was changed.
- PGlite verifies disposable SQL migration/transaction parity and conflict behavior. The opt-in real-PostgreSQL suite is not a substitute we silently ran against production; actual concurrency/deployment acceptance remains a separate gate.
- Feature off restores legacy entry/selection paths and retains readable routine/snapshot data. Production migration, deployment or flag activation was not performed.

Verification logs live in ignored `.local/weekly-routine/`. Exact commands:

| Command | Result |
|---|---|
| `pnpm db:generate` | PASS: additive migration 0019 only |
| `pnpm exec vitest run tests/unit/routine-policy.test.ts tests/unit/planner-policy.test.ts` | PASS: 9 tests, then expanded focused checks |
| `pnpm exec vitest run tests/integration/study-plan-repository.test.ts tests/unit/routine-policy.test.ts` | PASS after correctly simulating publication in the disposable SQL fixture; an import alone remains draft |
| `pnpm exec vitest run tests/unit/routine-session-constraints.test.ts tests/unit/routine-policy.test.ts tests/integration/study-plan-repository.test.ts` | PASS: filtering/budgets, isolation, idempotence, stale/expired preview, ACTIVE preservation |
| `pnpm exec vitest run tests/component/routine-planner.test.tsx tests/unit/study-plan-route.test.ts tests/unit/today-dashboard.test.ts tests/integration/study-plan-repository.test.ts` | PASS: UI preview/apply and validated private API |
| `pnpm exec vitest run tests/integration/study-plan-repository.test.ts` | PASS: final 4 SQL/memory cases including failed-replan preservation |
| `pnpm exec vitest run tests/unit/progress-overview.test.ts` | PASS: routine configuration excluded from study-day activity |
| `pnpm lint` / `pnpm typecheck` | PASS after final fixes |
| `pnpm test` | PASS: 299 tests, 3 optional real-PostgreSQL SKIP |
| `$env:DATABASE_URL='memory://local'; pnpm build` | PASS after final fixes |
| `pnpm packs:verify` | PASS; corpus identity/hash test protects 132 lessons / 1,144 Questions |
| `node .local/weekly-routine/browser-qa.mjs` | PASS: 320/360/390/430/1280, preview not saved, reload, day off, server budget, 44px targets, zero page errors |
| `node .local/weekly-routine/confirm-visual.mjs` | PASS: bounded mobile/desktop top-of-page confirmation, hierarchy and no horizontal overflow |
| Impeccable `detect --json` on routine component/week/Plan/CSS targets | PASS: no findings |

E2E commands:

```powershell
$env:DATABASE_URL='memory://local'; $env:FEATURE_STUDY_PLANNER='false'; $env:FEATURE_NEW_TODAY='false'; $env:FEATURE_INTERACTIVE_LESSONS='false'; $env:FEATURE_REAL_EXAM='false'; pnpm test:e2e
$env:DATABASE_URL='memory://local'; $env:FEATURE_STUDY_PLANNER='true'; $env:FEATURE_NEW_TODAY='true'; $env:FEATURE_INTERACTIVE_LESSONS='true'; $env:FEATURE_REAL_EXAM='true'; pnpm test:e2e tests/e2e/foundation-evolution.spec.ts tests/e2e/routine-planner.spec.ts
```

Off/default run: 38 PASS, 10 intentional gated skips (19/5 per project). On run initially failed because the test used exact label-text matching for a nested native select; the accessibility tree correctly exposed combobox “Modo”. The locator was corrected to its semantic role. Desktop then passed 5 cases; one combined runner exited 1 before printing a mobile launch result. Direct `pnpm exec playwright test tests/e2e/foundation-evolution.spec.ts tests/e2e/routine-planner.spec.ts --project=mobile-chrome --output=test-results/mobile-chrome` with the same four flags on passed 5/5. The serial runner now surfaces actual child startup errors/signals; final canonical on-run result must be recorded before acceptance.

Final canonical on-run: PASS, 10 cases / no skips or failures (5 desktop + 5 mobile), including the serial runner's diagnostics change. Final off/default confirmation: PASS, 38 existing cases / 10 intentional gated skips (19/5 per project). No existing test was removed. No remote CI/production success is claimed. [Current evidence](WEEKLY-ROUTINE-EVIDENCE.json) pins 41 implementation/test hashes and compares all 17 actual prior handoff hashes rather than assuming unchanged QA. All 12 source-pack files and previous SQL migrations remain unchanged; corpus preservation tests pass.

Final documentation checks: `node .local/weekly-routine/verify-evidence.mjs` PASS (41 current hashes, 17 prior comparisons, 12 unchanged source files, 50 links and unchanged previous SQL); `git diff --check` PASS. Actual prior foundation/audit receipts remain historical and were not rewritten to simulate fresh review.

The local audit helper initially misclassified newly staged migration 0019 as a modified historical SQL file. It now compares modified existing SQL against the actual `605b777` baseline; the corrected check passes. This was an audit-helper false positive, not a migration/test failure.

Final review fixes: special object-property subject IDs use safe dictionaries while retaining the original Pack ID contract; full simulation reservation cannot report completed learning; Hoje's date follows the routine calendar; unavailable saved subjects can be explicitly removed. These checks did not alter mastery/review/scoring weights or published versions.

NEXT ACTION: after the Phase 3 gate, continue with the versioned Adaptive Session contract (time budgets, clock, action candidates and readiness reasons), keeping immutable ACTIVE snapshots and existing core modules. Do not repeat imports/publication or alter mastery/scoring weights to fill missing content.

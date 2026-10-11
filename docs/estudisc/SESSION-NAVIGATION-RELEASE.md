# Reliable session entry

The user's mobile report shows session actions returning to Plan, and a grey Continue button. Production diagnosis confirmed session preparation succeeds while queued client navigation still leaves Plan visible; the old control cleared its busy state immediately after `router.push`/`router.refresh`. Continue belongs to the routine wizard and intentionally requires a selected study day.

Session actions now use a normal fresh document navigation after validated API success, including start/complete on the same URL. Busy feedback remains until navigation, and actual API/network errors restore controls with an alert. Controls are disabled until hydration, preventing premature clicks on server-rendered controls. Saved session links on Today/Plan also use normal document navigation. The routine wizard explains its prerequisite and that an existing session does not require routine setup.

No API, ownership, session composition, persisted snapshot, Question, scoring, mastery or review rule changes. No production student login fabricated or answers submitted. The student's existing active content remains frozen; native navigation retains ordinary authentication and ownership checks.

Regression coverage checks successful pending state, error retry, invalid returned IDs, start/complete/abandon, targeted practice and routine prerequisites. Browser regression exercises keyboard preparation, document entry, same-URL start/completion, native saved-session resume and reusing an existing ACTIVE session without replacing it. Added to the critical CI suite.

Local lint/typecheck/packs/build and 475 tests PASS (three optional real-PostgreSQL SKIP). Flagged Chrome desktop/mobile regression PASS. WebKit public HTTPS profile selection works; optional local WebKit full-flow verification is unavailable because the HTTP dev harness upgrades assets to unavailable HTTPS, and a temporary test-only workaround encounters HMR reloads. No production CSP change or Safari full-flow success is claimed. Initial browser checks also exposed a premature click before hydration; the guard fixed it. Browser-response assertions use status rather than reading a discarded response body after document navigation.

The initial full browser gate exposed the same premature click on the lesson's server-rendered “Ver tudo”; the shared LessonStepper now has the same readiness guard. Its fixture import also needed to match the existing percentage fixture in the process-global memory harness. Those initial failures were repaired before restarting the gate; no production lesson payload changed.

## Actual release acceptance

Released through [PR #21](https://github.com/theusinshow/estudisc/pull/21), exact checked head `3e523d26e47eec5625b6de7801dbe90ab666dd25`, all eight required checks SUCCESS. Merge `6fbad5b05569ebdf6940eb0740fb5e8ee4849217` at 2026-10-11 02:36:31 UTC. Git-backed production `dpl_8sdzWa6JxV1MxDYSQeTnb916KPVD` independently verified READY, correct merge SHA and public `vecta-three.vercel.app` alias. No local/private files uploaded.

Final local lint/typecheck/packs/build and 475 tests PASS (three optional real-PostgreSQL SKIP). Full serial browser gate: 60 PASS / 38 rollout-gated SKIP. Final adaptive/New Today/Planner/Interactive regression: desktop/mobile PASS. The old percentage browser test now waits for actual completion before leaving the session, avoiding a competing `goto` during document navigation. All encountered failures were diagnosed and repaired before release; optional WebKit harness limitation remains as described above.

Actual public Plan, authenticated ADMIN profile and database health 200/ok. Native “Abrir sessão” and “Estudar 10 min” both reached the ADMIN's pre-existing ACTIVE lesson with a fresh document and enabled session controls; no new session or answer was created. The first tool click exceeded its five-second navigation wait, and the next read independently confirmed successful document navigation. Normal student authentication/ownership remains required; no actual STUDENT browser sign-in is claimed.

Repeated read-only audit: 14 sessions valid, no missing frozen references. Requested student's exact session IDs/statuses/start times/items are unchanged compared with the pre-release audit. No student progress was modified. Correct public entry link: https://vecta-three.vercel.app/plan?update=20261010-sessions. A profile without a current cookie uses normal sign-in.

Commands actually run for final gates and release:

```text
pnpm exec vitest run tests/component/session-controls.test.tsx tests/component/lesson-stepper.test.tsx tests/component/routine-planner.test.tsx tests/unit/session-navigation.test.ts
pnpm lint
pnpm typecheck
pnpm test
pnpm packs:verify
DATABASE_URL=memory://local pnpm build
DATABASE_URL=memory://local pnpm test:e2e
DATABASE_URL=memory://local FEATURE_NEW_TODAY=true FEATURE_STUDY_PLANNER=true FEATURE_ADAPTIVE_SESSION=true FEATURE_INTERACTIVE_LESSONS=true pnpm test:e2e tests/e2e/session-navigation.spec.ts
gh pr checks 21 --required --json name,state,link
gh pr merge 21 --merge --match-head-commit 3e523d26e47eec5625b6de7801dbe90ab666dd25
git fetch origin
git switch main
git merge --ff-only origin/main
vercel api '/v13/deployments/dpl_8sdzWa6JxV1MxDYSQeTnb916KPVD?teamId=team_ffNsgkKpYXQdXR7eDiCM3G15' --method GET
pnpm exec tsx .local/database-migration/private/session-access-audit-20261010.mts
git diff --check
```

Environment prefixes above express the actual PowerShell environment assignments. Exact private diagnostics, deployment/CI metadata and initial failures remain ignored locally. NEXT ACTION: normal Kauã access through the updated public link; investigate a specific remaining error if reported. The separate scored-content architecture handoff remains unchanged.

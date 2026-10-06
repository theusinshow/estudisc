# Estudisc E2E failure audit

The requested baseline was 22 pass / 14 fail. No tests were deleted. The seven baseline failures occurred in both Chromium projects and are classified individually below. Additional issues exposed by the full consolidation run are recorded separately.

| Browser project | Test | Classification | Correction |
|---|---|---|---|
| chromium | auth: sign-in surface | OBSOLETE_EXPECTATION | Assert live Estudisc wordmark; decorative mark has empty alt. |
| mobile-chrome | auth: sign-in surface | OBSOLETE_EXPECTATION | Same accessible identity correction. |
| chromium | import: bundled Track Pack | OBSOLETE_EXPECTATION | Use the current study/import flow and visible action labels. |
| mobile-chrome | import: bundled Track Pack | OBSOLETE_EXPECTATION | Same current workflow assertions. |
| chromium | import: compact first step | OBSOLETE_EXPECTATION | Advanced generation remains collapsed until explicitly opened. |
| mobile-chrome | import: compact first step | OBSOLETE_EXPECTATION | Assert compactness before opening advanced controls. |
| chromium | import: manual Lesson Pack | OBSOLETE_EXPECTATION | Open the advanced generation section before interacting. |
| mobile-chrome | import: manual Lesson Pack | OBSOLETE_EXPECTATION | Same explicit interaction with collapsed controls. |
| chromium | motion: sign-in feedback | REAL_BUG | Declare the transition properties and canonical finite duration. |
| mobile-chrome | motion: sign-in feedback | REAL_BUG | Same motion token correction; reduced-motion test remains. |
| chromium | percentage study/session | REAL_BUG | Distinguish answer feedback and XP status with accessible labels; retain actual correctness assertions. |
| mobile-chrome | percentage study/session | REAL_BUG | Same feedback semantics; additionally isolate process-global evidence per browser project. |
| chromium | catalog/progress continuation | REAL_BUG | Restore the visible “Continuar estudando” action on Progress. |
| mobile-chrome | catalog/progress continuation | REAL_BUG | Same continuation correction. |

Additional consolidation findings:

- **TEST_INFRA:** GH mobile preview depended on ignored `.local` pilot/receipt files. Generate SSR previews directly from the versioned Pack and exercise the eight actual pilots, native radio keyboard behavior and overflow checks. Independent content QA stays in its dedicated suite; an E2E run is never an editorial approval.
- **TEST_INFRA:** Serial workers shared learner evidence between browser projects in the process-global memory harness. `scripts/run-e2e.mjs` owns a fresh Next process per project and retains separate output directories. No reset endpoint or production bypass was introduced.
- **REAL_BUG:** When the editor lost focus on mobile, the bottom navigation reappeared between pointer-down and pointer-up and intercepted RUN. Keep it hidden while the programming panel contains focus. The full first-click flow remains asserted.
- **REAL_BUG:** An edit made before hydration could be displayed in the native textarea without entering React state, submitting starter code. Disable editing and submission until hydration; RUN/SUBMIT semantics and the sandbox remain unchanged.
- **OBSOLETE_EXPECTATION:** Shell tests still expected the former accessible product name. Update them to Estudisc.
- **TEST_INFRA:** The E2E server must explicitly set `AUTH_TRUST_HOST=true`; production continues respecting parsed configuration.

Final exact results are recorded in [ESTUDISC-CONSOLIDATION-RESULTS.md](ESTUDISC-CONSOLIDATION-RESULTS.md), including complete desktop and mobile runs.

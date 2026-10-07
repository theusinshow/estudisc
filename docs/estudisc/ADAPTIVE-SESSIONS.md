# Estudisc — Phase 4 adaptive sessions

Date: 2026-10-06. Base checkpoint: `b334aa5`. Local implementation under the user's continuing authorization; no model switch, independent architectural review, deployment, production migration or content republication is claimed.

## Contract and behavior

[ADR 0042](../ADR/0042-adaptive-session-snapshots-and-readiness.md) extends the existing planner and session repositories. FEATURE_ADAPTIVE_SESSION defaults off. Enabled controls offer 10/20/30/45 minutes; persisted legacy 15/30/60 sessions and new snapshots remain readable when disabled. No Pack schema, database migration or learner-history backfill.

The adaptive path uses one injected clock for composition, exposure, exam phase, mastery freshness, routine constraints and session timestamps. Reviews precede active mistakes, ordinary practice and new learning; existing priority weights remain within these tiers. Stable tie breaks, Question identity deduplication and per-track exam caps preserve deterministic selection. Routine quotas still constrain both planning and start. Returning an ACTIVE session never regenerates its composition; no-fit preserves earlier PLANNED state.

Question estimates are conservative heuristics: foundation 3, direct 4, applied 5, IFSC 6, challenge 8 minutes plus 2 minutes per action. They are estimates, not measured active time. Short actions use the existing shared Question registry. Full lessons require objectives/sources, available exit checkpoints, at least two distinct available training Questions per Concept, prerequisite readiness and actual independent four-layer QA for this release/version. Full estimates are never clamped to a short budget. Publication, Admin Direct or a metadata marker cannot fabricate independent QA; mapping and source caveats remain applicable.

Both adapters exclude unavailable canonical Questions and prior independent successful answers from ordinary practice. Due retrieval may repeat only under existing exposure rules. SQL batches canonical Question versions, activity membership and learner exposures instead of per-activity calls. An owned ACTIVE EXAM blocks new training composition. Help, evaluation, evidence weights, mastery, review scheduling and official scores remain canonical existing rules.

Each item pins track/lesson/version/activity/Question references and minimal authored Activity snapshots without embedded solutions or reserved assets. The Question study service checks owner and frozen membership before selecting the matching version, preventing latest-import drift and cross-track substitution. Existing lesson/Question delivery handles resume; persisted step/unsent response resume remains Phase 5.

Summary distinguishes requested time, planned estimate, wall-clock interval including pauses, latest unique answers and real independently successful Concept evidence/delayed retrieval. Planning and completion never append evidence. Next action uses existing recommendations. Simulation reservations remain separate from completed study.

## Validation

- Focused: `pnpm exec vitest run tests/integration/adaptive-sessions.test.ts tests/unit/adaptive-session-policy.test.ts` — 18 PASS. Includes disposable SQL/memory parity, owned EXAM blocking, canonical availability with fixed clock, independently successful submit/idempotence, cross-track membership, newer import resume, no-fit preservation and legacy budget compatibility.
- `pnpm exec vitest run tests/integration/adaptive-sessions.test.ts tests/unit/adaptive-session-policy.test.ts tests/unit/frozen-membership.test.ts tests/unit/session-summary.test.ts` — 12 PASS before the additional exposure/evidence/EXAM fixtures, with full-suite repetition below. Latest-answer/help/version membership cases are covered.
- Adaptive on: `pnpm test:e2e tests/e2e/adaptive-session.spec.ts` — 4 PASS, two per fresh desktop/mobile server. Keyboard, Focus exit/reload, truthful zero-answer completion, 320/360/390/430/1280 layouts, 44px controls, reduced motion and no horizontal overflow. Two bounded visual rounds: correction of clipped reasons/four-choice placement, then confirmation. Screenshots in ignored `test-results/`.
- `pnpm lint` — PASS; `pnpm test` — 319 PASS / 3 optional real-PostgreSQL SKIP; `pnpm packs:verify` — PASS, one catalog Pack; Impeccable `detect --json --target src/app/study/[sessionId]/page.tsx` — no findings; `git diff --check` — PASS.
- Final default `pnpm test:e2e` — 40 PASS / 12 intentional flag-gated SKIP (20/6 per fresh desktop/mobile server).
- Foundation/routine on with adaptive off: `pnpm test:e2e tests/e2e/foundation-evolution.spec.ts tests/e2e/routine-planner.spec.ts` — 10 PASS, five per browser.
- `pnpm build` and final `pnpm typecheck` — PASS. `node .local/adaptive-session/verify-evidence.mjs` verifies current code/test hashes, actual prior Phase 3 hashes, unchanged source/corpus/assets/migrations and documentation links; [evidence](ADAPTIVE-SESSIONS-EVIDENCE.json). The link audit also corrected an existing ADR 0038 pointer mislabeled as 0037.

E2E environment was explicit: DATABASE_URL=memory://local; FEATURE_STUDY_PLANNER / FEATURE_NEW_TODAY / FEATURE_INTERACTIVE_LESSONS were all false for default, all true for foundation/routine and adaptive suites. FEATURE_ADAPTIVE_SESSION was false for default/foundation, true for adaptive. Each command owns fresh serial servers; no production database or publication was used.

The first test fixtures attempted an invalid generated-annulled status and an invalid reserved lesson import; repository validators correctly rejected both. Fixtures now use valid canonical lifecycle availability and a real generated full-simulation fixture through the existing assessment engine. A same-clock history assertion now selects the PLANNED record explicitly. The initial desktop browser test used a nonexistent CSS locator; the existing renderer locator was corrected and the combined run passed. These are recorded test corrections, not production-content changes.

## Limits and continuation

No production feature activation. Real PostgreSQL optional tests need their explicitly configured disposable service; PGlite provides local SQL contract coverage. Published content bytes and prior migrations must remain unchanged, verified against the actual baseline rather than rewriting historical receipts. A single independent correct answer is not certified Concept mastery; UI describes only recorded practice.

Phase 4 accepted locally. NEXT ACTION: create a local checkpoint, then Phase 5 owner/version/context-pinned step and interaction resume through existing lesson runtime. Preserve source and publication caveats, canonical evidence and external approval boundaries.

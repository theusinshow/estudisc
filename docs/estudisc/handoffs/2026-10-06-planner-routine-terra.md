# MODEL HANDOFF — Planner routine contract

MODEL ESCALATION REQUIRED

Recommended model: **Terra**. Risk: HIGH for routine/rebalance policy; routine UI/additive storage returns to Luna Max after the contract is settled. No additional agent has been recruited and this session cannot switch its own model.

## Current task

Phase 3 Study Planning System: persistent weekly availability, subject budgets, Automatic/Assisted/Manual modes, temporary overrides/focus and missed-day rebalance preview/apply. The existing `/plan` now exposes real session preparation/history but deliberately does not implement a weekly algorithm.

## Why escalation is recommended

The contract must resolve dated overrides and timezone/day boundaries against deterministic pedagogical priorities and immutable ACTIVE sessions. Preview/apply must avoid task debt, over-allocation and stale revisions. Publication is not proof of rights, official mapping, pacing or planner readiness; altering eligibility/weights based on these facts changes what students study. Current code has no persisted routine/mode/override semantics. This is a specific domain/consistency decision, not a large-file-count problem.

## Confirmed architecture and facts

- Modular monolith; extend existing study-session/planner/recommendation services. No new planner/mastery/review/assessment engine.
- `planner.v1` already scores due reviews, weakness, importance, exam phase and subject balance; filters reserved/unready/blocked learning. Existing API accepts 15/30/60; candidates have a 15-minute minimum estimate.
- SQL planning locks owner; returns existing ACTIVE session; abandons prior PLANNED sessions before creating another. ACTIVE composition and question versions are immutable. SQL replans within one selected track; memory iterates packs.
- Candidate kind has remediation, but current repositories instantiate review/practice/learn; explicit mistake/routine priorities are missing. Future Adaptive Session budgets 10/20/30/45 need a separate composition decision.
- SQL candidate generation checks published QA release and exposure but then sets `plannerReady:true`. Reviewed vs Admin Direct have distinct actual audit records; neither mode alone proves all curriculum/pedagogical prerequisites.
- There is no weekly StudyPlan/override schema; existing study table stores StudySession and QuestionAssistance. This increment made no schema/migration/evidence changes.
- ADR 0040 accepts flagged five-destination shell and runtime step projection. Four UI flags are wired; all default off. Existing local published fixture content and production corpus remain intact.

## Relevant files

Read only [Phase 3/4](../IMPLEMENTATION-PLAN.md), [gap sections 5/6](../IMPLEMENTATION-GAP-ANALYSIS.md) and these implementation/ADR targets. [Handoff hashes](2026-10-06-planner-routine-evidence.json) pin the exact inputs.

| Target | Purpose |
|---|---|
| `src/features/study-sessions/planner-policy.ts` | Current pure selection/phase rules |
| `src/features/study-sessions/contracts.ts` and `src/app/api/study-sessions/route.ts` | Budget/item/action contracts |
| `src/db/repositories/study-session-repository.ts` | SQL composition, locks, transitions, result |
| `src/db/repositories/memory-study-session-repository.ts` | Memory parity path |
| `src/db/schema/study.ts` | Existing persistence, no weekly routine |
| `src/features/recommendations/recommendation-rules.ts` | Existing next-action ordering |
| `src/features/recommendations/lesson-candidates.ts` | Published candidates and prerequisite metadata |
| `src/app/plan/page.tsx`, `src/features/today/today-plan.tsx` | Implemented session-only UI |
| `docs/ADR/0021-deterministic-planner.md`, `0024-mastery-review-v2.md`, `0029-published-content-immutable.md`, `0036-direct-admin-publication.md`, `0040-evolution-shell-and-runtime-compatibility.md` | Invariants and publication/navigation semantics |
| `tests/unit/planner-policy.test.ts`, `tests/unit/today-dashboard.test.ts` | Existing deterministic golden expectations |

## Changes already made

Phase 0 compatibility/navigation ADR and validated flags; Phase 1 compatible shell/Focus, Sheet/Dialog/Tabs and registry; Phase 2 reusable Today next-action-first presentation. Existing session controls/engine are reused on `/plan`. Canonical tokens, actual selection/scoring/mastery and published Pack bytes are unchanged. Detailed command results: [foundation report](../EVOLUTION-FOUNDATION.md). Full-phase completion is not claimed for routine-dependent UX.

## Tests and status

Focused flag/shell/control/card/coordinator tests pass after a jsdom fixture repair; typecheck, final lint and build pass. Full Vitest: 275 PASS / 3 optional real-PostgreSQL SKIP. Default E2E: 38 PASS / 4 intentional flagged SKIP; separate flagged E2E: 4 PASS / no skips/failures. Pack validation and browser QA pass; sheet focus wrapping corrected from real browser evidence. Exact commands are in the completed foundation report. No known domain-policy regression; SQL concurrency is not certified by memory tests.

## Open decisions

1. Minimum routine/mode/day allocation contract, timezone and effective-date behavior; manual vs assisted boundaries.
2. Priority/review reservation and temporary focus conflicts under actual available budgets.
3. Missed-day recomputation/no debt and treatment of ACTIVE/PLANNED sessions; preview revision/apply consistency.
4. Eligibility/readiness facts and visible caveats without inventing independent review or silently equating mode with readiness.
5. Minimal additive persistence and compatibility/index strategy; reusable pure policy interfaces for later Adaptive Session.

## Constraints

No production migration, publication, push/deployment, secret or provider operation. No mutation of published lesson/question versions, Attempts or existing evidence. Concept mastery remains deterministic, lesson completion non-authoritative. New migrations need disposable SQL tests; any persisted Pack-schema change requires ADR/compatibility fixtures. Preserve DS 4.0.0 and existing off paths.

## Exact next prompt

> Use Terra to settle Estudisc Phase 3's weekly Planner contract. Read this handoff, its pinned files, Phase 3/4 in IMPLEMENTATION-PLAN.md and gap sections 5/6 only. Define availability/timezone, Automatic/Assisted/Manual behavior, subject allocations, dated overrides/temporary focus, missed-day recomputation/no debt, immutable ACTIVE-session interaction, and deterministic preview/apply revisions. Resolve readiness from actual review/source/mapping facts rather than publication mode alone. Reuse planner.v1 and current session repositories; preserve all historical evidence/content and auth/exposure boundaries. Deliver an accepted ADR, minimal additive persistence/policy contracts and meaningful golden acceptance fixtures. Then return specified UI/helpers/storage work to Luna Max. Do not implement Adaptive Session weights, transform existing learner data, or perform external/production writes in this contract task.

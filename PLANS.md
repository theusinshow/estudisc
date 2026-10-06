# Estudisc current plan

## Current task — Phase 3 weekly routine (2026-10-06)

The user's “pode seguir” answers the pending choice: authorize this session to resolve and implement the Phase 3 contract. This is an explicit exception to the earlier Terra handoff for this increment; no model switch or additional agent. Local implementation remains authorized; production/external operations remain separate.

Assumptions/acceptance: versioned deterministic time allocation inside the existing study-session/planner feature; owner/timezone-scoped seven-day routine, modes/priorities/manual allocations, dated overrides/focus, review target and simulation time reservation; immutable ACTIVE composition; no missed-day task debt. Preview/apply is explicit, owner/revision/dependency/expiry checked and idempotent. Publication is not readiness certification; existing question/prerequisite/exposure selection rules remain. Additive tables only, no Pack/content/evidence migration.

- [x] ADR 0041, validated contracts, pure calendar/allocation policy and meaningful golden/edge tests.
- [x] SQL + memory plan/preview persistence, owner isolation/stale preview/idempotence and disposable SQL validation.
- [x] Owner-scoped API and routine onboarding/week/editor UI with default-off rollout, loading/empty/error recovery.
- [x] Integrate routine time constraints with existing session planning/start without changing priority weights/mastery; preserve ACTIVE and prepared state on failed replan.
- [x] Complete final default/on confirmation and documentation/hash/diff acceptance; 38 default and 10 flagged E2E pass.
- [x] Prepare the accepted Phase 3 checkpoint and resumable Adaptive Session next increment; model-policy and production boundaries preserved.

Current gate evidence: lint/typecheck/build/packs PASS; 299 tests PASS / 3 optional real-PostgreSQL SKIP; flagged E2E 10 PASS / no skips or failures; browser 320/360/390/430/1280, keyboard/preview/apply/reload/day-off/server-budget QA PASS. The first E2E attempt caught a test label locator mismatch; semantic combobox locator fixed it. One later child launch returned exit 1 without a mobile result; direct mobile passed, runner diagnostics were improved, and final combined on run passed. Exact commands/limits: [Phase 3 report](docs/estudisc/WEEKLY-ROUTINE.md).

Phase 3 gate: accepted locally. Default final E2E 38 PASS / 10 intentional gated SKIP; on final E2E 10 PASS / no skips or failures; remaining checks as above. Evidence pins 41 implementation/test hashes and compares the actual 17 prior handoff inputs; previous SQL and 12 source documents unchanged.

NEXT ACTION: Phase 3 is checkpointed and locally accepted. Continue the versioned Adaptive Session contract (10/20/30/45, explicit candidate actions, one clock and readiness reasons) inside existing core modules. Model choice for Phase 3 is resolved; no repeat permission is needed for its fixes. Do not execute migration 0019 against production, deploy or republish content without explicit authorization.

## Completed task — product context refresh and continuation (2026-10-06)

User authorized updating the stale Impeccable context and continuing local implementation. Update existing PRODUCT.md to the current schema using confirmed repository/user facts; remove deprecated Register and add platform, positioning, operating context, constraints, evidence and product principles. Preserve canonical DS authority and do not invent claims or visual direction.

- [x] Refresh PRODUCT.md and recognized DESIGN.md sections; verify confirmed source pointers and current Impeccable schema (`doctor findings=[]`).
- [x] User authorized this session to resolve the Phase 3 contract and continue; no automatic model switch.
- [x] Complete context schema/link/hash/diff checks, lint, status and changelog. No runtime/content/dependency changes; prior application acceptance remains valid evidence, not a fresh run claim.
- [ ] Continue dependent Phase 3 work after the asynchronous model-routing choice; no new algorithm has been implemented while awaiting the answer.

NEXT ACTION: await the already-presented model-routing choice, then continue the Phase 3 contract in the authorized session or preserve the Terra handoff as selected. Context refresh is complete; exact commands/results: [refresh report](docs/estudisc/PRODUCT-CONTEXT-REFRESH.md). No rediscovery or production write.

## Completed increment — authorized evolution foundation (2026-10-06)

The user authorized implementation after the completed audit. Continue local increments automatically; external/production writes and published content changes remain separate boundaries. No additional agents or automatic model switch.

Current increment: Phase 0 compatibility/navigation decision and validated flags; Phase 1 shell/Focus mode, accessible foundation primitives and registry; Phase 2 reusable Today presentation using existing recommendations. Weekly scheduling/readiness and evidence policy decisions remain Terra handoff work.

Assumptions: preserve Design System 4.0.0 values and current engines; new flags default off; `/plan` initially exposes only existing session planning/history, not invented weekly availability; old navigation remains usable with flags off; existing lesson steps are runtime projections, not a new Pack schema. Focus does not abandon or complete a session. Recommendation ordering is unchanged.

Acceptance: flag off/on and invalid configuration tests; real five-destination navigation with secondary actions in the top bar; Focus hides global nav but provides explicit exit; native dialog/sheet focus/escape/return and keyboard tabs/segmented controls; truthful Today counts/durations/reasons; 320/360/390/430px checks, reduced motion, 44px targets; full configured phase gates and immutable-content checks.

- [x] Record ADR 0040 and canonical screen/navigation/compatibility rules.
- [x] Implement validated flags and compatible shell/Focus/navigation; focused tests.
- [x] Add native Dialog/Sheet, keyboard Tabs and component registry; unused wrappers deferred to real consumers.
- [x] Extract Today presentation without domain-policy changes; routine-dependent states remain Phase 3 work.
- [x] Complete mobile/accessibility/browser QA, lint/typecheck/test/build/full off/on E2E and documentation.
- [x] Reach the Terra routine/mode/override/rebalance/preview domain-contract boundary and save a compact hash-pinned handoff.

Current increment acceptance: PASS. Lint/typecheck/build/pack validation PASS; tests 275 PASS / 3 optional PostgreSQL SKIP; default E2E 38 PASS / 4 intentional flagged SKIP; separate on E2E 4 PASS / no failures; browser 320/360/390/430/1280, keyboard/modal/Focus/reduced-motion QA PASS. Exact commands: [foundation report](docs/estudisc/EVOLUTION-FOUNDATION.md).

NEXT ACTION — MODEL ESCALATION REQUIRED: Terra must define Phase 3 routine timezone/modes/allocations/overrides, missed-day no-debt recomputation and preview/apply revision semantics, including actual readiness facts. [Compact handoff and exact next prompt](docs/estudisc/handoffs/2026-10-06-planner-routine-terra.md), with 17 input hashes. Local implementation remains authorized after that decision; no repeated approval needed for routine work. This session cannot switch models. Production/external writes remain unapproved.

## Completed task — architecture pack audit (2026-10-06)

User scope for this execution: read `estudisc_codex_pack.zip`, audit the existing implementation, write `docs/estudisc/IMPLEMENTATION-GAP-ANALYSIS.md` and `docs/estudisc/IMPLEMENTATION-PLAN.md`, and route future phases by model. Do not implement the large phases or perform external/production writes.

Assumptions: the pack is an evolution proposal, existing accepted ADRs and immutable published content remain constraints, and example phase lists must be reconciled with actual code. The active session cannot switch its own model; requested future routing is Luna Max → Terra when justified → Sol High exceptionally. No additional agents.

Acceptance: every pack area has code/test evidence or an explicit unverified finding; phases have dependencies, acceptance gates and concrete model-escalation reasons; source provenance and unresolved conflicts are visible; documentation validation and configured final checks have actual results recorded.

- [x] Preserve and read all eleven source-pack documents and manifest; inventory current architecture and relevant ADRs.
- [x] Audit each requested capability against targeted implementation and tests.
- [x] Write gap analysis and phased implementation/model-routing plan.
- [x] Complete documentation hash/link/diff checks and configured final application checks; record results and resumable next action.

Verification: frozen install PASS after initial `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; lint/typecheck/build/pack validation PASS; tests 262 PASS / 3 optional PostgreSQL SKIP; full E2E 38 PASS / 0 FAIL (19 per project). Exact commands and limitations: [audit verification](docs/estudisc/AUDIT-VERIFICATION.md). No runtime implementation, production operation or model switch.

Audit acceptance: complete. Document checks PASS: 94 source/implementation hashes, 12 byte-identical source files, 18 local links, all 16 phases and documentation-only diff; `git diff --check` PASS.

NEXT ACTION: this first-execution audit is complete. Future implementation must be separately authorized and starts with the remaining Phase 0 navigation/flag/compatibility reconciliation using Luna Max. Read [architecture](docs/estudisc/PRODUCT_ARCHITECTURE.md), [gaps](docs/estudisc/IMPLEMENTATION-GAP-ANALYSIS.md), and [plan/model routing](docs/estudisc/IMPLEMENTATION-PLAN.md); use Terra for concrete domain decisions, Sol High exceptionally. Large phases and corpus enrichment remain pending.

## Historical consolidation — complete

Authorized scope: rename, stabilize and consolidate. Preserve 132 published lessons, 1,144 Questions, stable IDs, immutable content, migration hashes and learner state. No re-import, republication or production reset.

- [x] Inventory historical names and classify branding, compatibility contracts and immutable history; preserve a local hash/archive checkpoint.
- [x] Reconcile remote main and existing local work without losing source bytes.
- [x] Centralize canonical environment aliases; preserve signed legacy sessions and backup restore.
- [x] Modularize memory domains, importer panels/hooks, QA release/bundle/publication responsibilities and ordered CSS.
- [x] Add the Today coordinator, deterministic recommendation reasons and bulk mastery reads.
- [x] Expose publication mode and actual audit information; validate critical API responses and add safe structured operational logging.
- [x] Reconcile current docs, agent context, branding and the canonical Design System version.
- [x] Separate CI fast checks, integration/content QA and critical E2E; fix the heavy test setup and isolate browser projects.
- [x] Complete final lint, typecheck, tests, build and full E2E; record exact results.
- [x] Rename the existing GitHub repository after green local gates; update origin, verify actual remote CI and configure main protection where permitted.
- [x] Verify Vercel Git integration and preserve the production URL; verify the catalog read-only.
- [x] Record exact rename counts, legacy exceptions, remote results and unavoidable manual follow-ups.

Acceptance: all configured local gates pass, no known E2E failures, explicit compatibility tests pass, immutable content checks pass, actual remote results are distinguished from local results. Private receipts and diagnostic logs remain in `.local/estudisc-consolidation-audit/`.

NEXT ACTION: use protected main for the next explicitly approved evolution. Consolidation and identity migration are complete; the final Today queue correction follows the same mandatory remote release gates. Do not repeat imports or publication. Historical plans are in `docs/history/`.

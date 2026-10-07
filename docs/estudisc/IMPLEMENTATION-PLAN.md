# Estudisc — Implementation Plan

Date: 2026-10-06. Base: `d38f640`, `main`. Inputs: [architecture](PRODUCT_ARCHITECTURE.md), [gap analysis](IMPLEMENTATION-GAP-ANALYSIS.md), [routing policy](MODEL-ROUTING-POLICY.md), source pack and existing accepted ADRs.

## 1. Strategy and authorization

The first execution delivered audit/planning only. The user's subsequent implementation request authorizes local increments, now tracked in [EVOLUTION-FOUNDATION.md](EVOLUTION-FOUNDATION.md). The existing IFSC roadmap remains accepted; this plan extends its modules rather than replaying IFSC-00–15. External/production operations remain separate boundaries. Continue from the first unmet gate.

Use the smallest reversible increment: contract → focused implementation → focused tests → documentation → full phase acceptance → safe local checkpoint. Luna Max performs routine work; Terra resolves precise domain/security/architecture decisions; Sol High reviews exceptional risk. Do not scale model because a phase has many files. No additional agents by default.

Every implementation phase must preserve content identities/bytes, immutable published versions and Attempts, append-only ConceptEvidence/study events, owner isolation, official question/asset reservation, deterministic mastery/review/planner/scoring, and optional AI. Preserve RUN vs SUBMIT and isolated learner-code execution. Use English identifiers and Portuguese UI.

Current acceptance commands and results are in [AUDIT-VERIFICATION.md](AUDIT-VERIFICATION.md). Local green checks do not imply remote CI or future pack-flow acceptance. External writes, real-secret handling, publishing and production/data migrations require explicit authorization.

## 2. Phase gates and rollback policy

Before each phase: update `PLANS.md` with exact increment, assumptions, targets, dependencies and acceptance. Read only the phase's specialized source docs and relevant code/ADRs; for Next.js implementation read the installed `node_modules/next/dist/docs/` guides relevant to the change.

During each coherent change: focused tests must verify actual domain rules and failure/recovery behavior. Repair regressions before advancing. At each phase gate run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; retain full `pnpm test:e2e` before final acceptance, and critical E2E after affected flows. `pnpm packs:verify` plus the corpus identity/hash test protect content. Use an explicitly disposable DB for SQL parity/migration tests; no production credentials. Keep Playwright serial on port 3210 with fresh desktop/mobile server processes.

UI gates: 320/360/390/430px, desktop, safe areas, focus, keyboard/touch, 44px targets, labels/semantics, contrast, reduced motion, loading/empty/error, recovery and non-drag alternatives. Existing E2E is a baseline, not certification for new controls. Source/media review gates require actual rights/mapping evidence and complete initial QA.

Central feature flags now live in validated application configuration. All nine default off; four expose the initial foundation UI and the other five reserve later rollout names. Off restores the prior presentation/service entry path; on must be tested. Flags cannot bypass owner permissions, exposure, scoring or publication checks. Leave additive data in place when disabling a phase; no destructive down-migration or historic-record rewriting. Versioned policy/snapshot data must remain readable with the flag off.

Update `PROJECT_STATUS.md`, this plan, relevant docs/ADRs and `CHANGELOG.md` for behavior/contracts. Commit locally only with understood tree and passed gate. Stop at a safe handoff for unsupported model decisions, material unresolved specification conflicts or authorization boundaries.

## 3. Phase 0 — Stabilization

Implementation update: ADR 0040 and canonical screen/index documentation reconcile the new navigation. Zod flags default off; Section/Step remains the existing runtime projection. No persisted Pack contract or migration was introduced. Current acceptance is in EVOLUTION-FOUNDATION.md.

Risk LOW; Luna Max. Existing consolidation is substantially complete. This audit reruns baseline acceptance; it does not certify the implementation phases.

- [x] Read and preserve source pack; pin provenance and targeted implementation hashes.
- [x] Reconcile existing engines, DS 4.0.0 and accepted scope with the new proposal in the architecture entry point.
- [x] Write gap analysis and model-routed phased plan without runtime/domain edits.
- [x] Record five-destination navigation in ADR/screen specs and keep steps as compatible runtime projection; persisted purpose/resume is a later contract.
- [x] Establish central flags with default/off/on and invalid-setting tests.

Targets: architecture docs, DS specs/VERSION, relevant ADRs, existing application environment configuration. Acceptance: current configured checks actually pass; differences from historical CI/production evidence are explicit; no duplicate version authority or existing-content changes. Rollback: docs/checkpoint revert; no data migration.

## 4. Phase 1 — Design Foundation

First increment implemented: shared shell/TopBar, flagged five destinations with real `/plan`, Focus variant, native Dialog/Sheet, keyboard Tabs and registry. Tokens/fonts are preserved. Extra primitives wait for concrete consumers. Full routine UX is not claimed; current acceptance is in EVOLUTION-FOUNDATION.md.

Risk LOW/MEDIUM; Luna Max. Depends on navigation reconciliation in Phase 0. Flag: `FEATURE_STUDY_PLANNER` controls exposure of the future Plano destination; shared foundation changes require compatibility tests.

Reuse `src/components/layout/app-shell.tsx`, `primary-nav.tsx`, existing ui/motion components and canonical DS tokens. Create Page/Focus shell variants through existing layout, reusable Sheet/Dialog/Tabs/SegmentedControl only where inventory lacks them, and an internal component registry with FOUNDATION/APPROVED/EXPERIMENTAL status. Preserve Archivo/JetBrains Mono, border/shadow identity and Programming Lab enhancement.

Acceptance: five primary destinations have real authorized routes; staged Planner link stays hidden until usable. Focus removes bottom navigation and restores it on exit. Sheets manage focus/escape/return; desktop expands the same information architecture. Extend shell/component/accessibility/motion tests and required viewport QA. No decorative component-library identity. Rollback: retain old shell/nav path behind applicable flags.

## 5. Phase 2 — Today

First increment implemented under FEATURE_NEW_TODAY: reusable StudyActionCard, next action first, factual session snapshots/preparation, attention/queue/week. Recommendation policy/coordinator are unchanged. Routine-dependent no-plan/day-off/completed-day states remain pending real Phase 3 facts.

Risk LOW for presentation, HIGH if ordering changes. Luna Max; Terra only for new recommendation rules. Depends on Phase 1; routine-dependent states finalize after Phase 3. Flag: `FEATURE_NEW_TODAY`.

Targets: `src/app/page.tsx`, `src/features/today/get-today-dashboard.ts`, recommendation types, Today CSS and existing tests. Extract StudyActionCard/TodayPlan/Attention/LearningSummary presentation without duplicating query coordination. Show reason and counts/duration only from facts. Preserve active-session priority and read-only rendering. Add explicit no-content/no-routine/day-off/completed states when supporting facts exist.

Acceptance: first ~390×844 viewport foregrounds next action; resume/queue work; no mutation on GET and shared facts are fetched once. Domain priority fixtures remain unchanged for UI-only work. Rollback: existing Today rendering; historical sessions and evidence remain readable.

## 6. Phase 3 — Study Planner

The user authorized this session to resolve the routine contract. [ADR 0041](../ADR/0041-weekly-study-routine-and-checked-previews.md) and [Phase 3 report](WEEKLY-ROUTINE.md) record weekly availability, modes, overrides/focus, explicit checked preview/apply and compatible session time limits. The original Terra handoff is resolved; its hashes remain historical. Adaptive Session/readiness and backup integration remain separate contracts.

Risk MEDIUM for contracts/UI; HIGH for scheduling. Luna Max for additive storage and specified UI; Terra defines rebalance/availability conflicts before algorithm changes. Depends on Phases 0–2. Flag: `FEATURE_STUDY_PLANNER`.

First contract: owner/timezone-scoped availability, subject budgets/preferences, Automatic/Assisted/Manual mode, dated override/temporary focus, plan revision and preview/apply boundaries. Extend `src/features/study-sessions/` and `src/db/schema/study.ts`; introduce a dedicated Planner route beside current study routes. Do not treat saved session composition as a weekly routine.

Implement onboarding days → time → priorities → preview; week view shows subject time allocations; routine view controls settings. Define zero-time/day-off, timezone/day boundary, missed-day recomputation/no debt, stale preview and conflicting overrides. Scheduling priorities/weights are a Terra contract; preserve ACTIVE composition.

Acceptance: owner isolation and memory/SQL contract parity, availability respected, deterministic preview, explicit apply and recoverable no-eligible-content state. Meaningful tests for overrides/timezone/missed days/conflicts; onboarding E2E. Rollback: disable routine entry points; retain additive preferences and prior session planner.

## 7. Phase 4 — Adaptive Session

Implementation delta (2026-10-06): ADR 0042 and [ADAPTIVE-SESSIONS.md](ADAPTIVE-SESSIONS.md) record the authorized local implementation and current acceptance. The user's continuation resolves the model handoff for this increment; no model switch or independent review is claimed. Continue Phase 5 after this gate.

Risk HIGH; Terra architecture/selection policy, Luna helpers/UI after contract. Depends on Phase 3 and existing recommendation/review/mastery facts. Flag: `FEATURE_ADAPTIVE_SESSION`.

Targets: `planner-policy.ts`, session contracts/API/controls, SQL and memory study-session repositories, `/study/[sessionId]`, Today inputs and planner/integration tests. Specify policy version, one evaluation clock, candidate/action types, selection reasons, immutable snapshot and 10/20/30/45-minute budgets. Define short-budget/no-fit behavior, explicit reviews/remediation, incomplete activity avoidance, priorities, prerequisites, curriculum-readiness facts, cross-track/date handling and interrupted-session reuse. Current 15/30/60 plus 15-minute minimum cannot simply be renamed.

Read actual publication/QA/source records; `plannerReady:true` cannot alone certify readiness. Eligibility policy must keep editorial caveats visible and explain excluded candidates without fabricating QA. Produce factual summary (actual elapsed vs budget, unique answers, concepts/evidence changed, next action) through existing result/read services.

Acceptance: permutation/clock determinism, budget bounds, reserved/draft/annulled exclusion, prerequisite behavior, empty catalogs and help conditions, immutable ACTIVE items, idempotent owner-scoped transitions. SQL parity/concurrency checks on disposable PostgreSQL when transaction boundaries change. Query counts before optimization; batching must preserve exposure checks. Sol High adversarial review if new policy spans selection, help and evidence or unresolved concurrency. Rollback: default previous policy for new sessions; retain versioned readers for already-created snapshots.

Terra handoff prompt:

> Define the versioned Adaptive Session extension for Estudisc using Phase 4 and the gap analysis. Inspect planner-policy.ts, both study-session repositories, contracts/API, Today recommendation rules and ADRs 0021/0024/0029/0036. Resolve budget minima, readiness from actual review/mapping records, remediation, cross-track priorities and fixed-clock determinism. Preserve ACTIVE snapshots and append-only learner history. Deliver an ADR/contract and golden acceptance fixtures; return approved helpers/UI to Luna Max. Do not migrate production or rewrite existing engines.

## 8. Phase 5 — Lesson Architecture and resume

Current increment: [LESSON-RESUME.md](LESSON-RESUME.md) and ADR 0043 implement scoped stable-step/expanded-view/shared Question drafts, canonical answer/assistance reload and revision/idempotence recovery. Additional typed interaction state is added with Phase 6 block contracts; no generic arbitrary state or new Pack renderer. Local final gate is recorded in that report.

Risk MEDIUM; Luna Max for approved runtime projection/UI; Terra if persisted contracts/evidence or version migration become ambiguous. Depends on Phases 1/4 contracts. Flag: `FEATURE_INTERACTIVE_LESSONS`.

Extend `lesson-steps.tsx`, `lesson-stepper.tsx`, existing block dispatcher and Activity registry. Start with a projection/sidecar for Section/Step/purpose; preserve old Pack inputs. Any Pack-schema change requires ADR/migration fixtures and compatibility tests. Add FocusShell and owner/version/context-pinned resume (step, interaction state, answers, elapsed time, scroll only when meaningful), using new mutable snapshots or append-only events separate from Attempts.

Acceptance: reload and pause resume sent/unsent state correctly; version mismatch/stale snapshot recovers safely; old lessons still render and questions remain shared; completion does not set mastery. Extend golden lesson/renderer/Question/resume tests and E2E. Rollback: legacy projection and existing answers/assistance remain; retain compatible resume readers.

## 9. Phase 6 — Core Interactive Blocks

Current increment: [CORE-INTERACTIVE-BLOCKS.md](CORE-INTERACTIVE-BLOCKS.md) and ADR 0044 add typed existing/new exploratory state, visual fallback, configured linear models and an authored offline map/list. MapLibre/geographic workers/tiles/provider boundaries require a real approved blueprint and remain explicitly deferred; no dependency was installed to simulate completion. This local gate preserves the existing canonical evidence policy.

Risk MEDIUM; Luna Max under specified contracts, Terra for evidence/help semantics. Depends on Phase 5; advanced assets resolve with Phase 7. Flag: `FEATURE_INTERACTIVE_LESSONS`.

Order: Prediction → safe Image/figure → Matching → Sorting/ordering → Timeline → Comparison → Hotspot → Slider/NumericExplorer generalization → InteractiveMap pilot. Reuse current dispatch/evaluators/response controls; do not create a parallel block or mastery registry. Consult `source-pack/05_INTERACTIVE_LEARNING.md` only for this phase. Adopt dnd-kit/MapLibre only when a justified pilot needs them; approve dependency/version/license then, not now.

For each block document schema, purpose/Concepts, response, evaluator if assessed, feedback/help/evidence, events and touch/keyboard/fallback. Local EducationalActivityPanel feedback is not a recorded Attempt; exploratory blocks stay non-authoritative. Four help levels persist usage and follow the agreed evidence policy. Charts/formula/geometry/custom simulations wait for blueprint demand.

Acceptance: predict/observe/explain/practice, matching without drag, sorting with buttons, vertical timeline, comparison text/buttons, hotspot zoom/text alternative, slider keyboard/value validation, map accessible list. Error/loading/reduced-motion and fail-open lesson fallback. Tests use actual interaction and evidence boundary. Rollback: old block types/legacy renderer remain; new drafts are not published by enabling a flag.

## 10. Phase 7 — Visual Asset System

Current metadata/authoring increment: [TEACHING-ASSETS.md](TEACHING-ASSETS.md) and ADR 0045 add optional licensed reuse metadata, local inventory/search/hash-pinned selection and rights checks for every visual source. Actual existing candidates remain unpromoted; index exports metadata only. Admin UI and storage/provider/exposure changes remain distinct later consumers/boundaries.

Risk MEDIUM; Luna Max metadata/UI; Terra for storage/security/exposure changes. Depends on Phases 5–6 contracts. Flag: `FEATURE_INTERACTIVE_LESSONS`; later Admin search under `FEATURE_CONTENT_HEALTH`.

Extend existing question asset and Studio media boundaries into reusable licensed teaching-asset metadata: type/title/subjects/Concepts/tags/source/license/alt/reusable/interactiveReady plus version/hash references. Preserve protected Question storage and official reservations. Safe figure data URIs, size limit and SVG inspection remain supported. Add accessible fallback and missing-asset recovery; no automatic asset generation/purchases.

Acceptance: actual rights state controls reuse; unknown/link-only rights cannot embed; private official bytes never become public assets; alt/text equivalent, dimensions, safe formats and broken references tested. Rollback: disable registry references for new authoring; existing figures/question assets continue unchanged; retain referenced assets/history.

## 11. Phase 8 — Lesson Blueprint Pipeline

Local proposal pipeline: [LESSON-BLUEPRINTS.md](LESSON-BLUEPRINTS.md) and ADR 0046. All 132 historically audited import lesson versions have deterministic, UNREVIEWED metadata-only proposals; missing goals are explicit, no mistakes are invented. Cache compares actual artifacts and binds source/corpus/catalog/policy/current asset eligibility. Human blueprint review and Phase 9 enrichment remain pending.

Risk LOW/MEDIUM; Luna Max; Terra only for low-confidence/complex pedagogical exceptions. Depends on stable Phase 5–7 component contracts. No student flag; CLI dry-run/report is default.

Reuse `tools/estudisc-content-studio/catalog.ts`, contracts, artifact hashing/validation and adapter. Extract current published versions locally, summaries (IDs/version/subject/Concepts/objectives/blocks/word count), deterministic archetypes/clusters and asset/component needs. Write sourceHash, dependency/policy hashes, blueprintVersion/generatedAt/reviewState; source-only hash equality must not hide changed policy or assets. Define confidence heuristics and review limits transparently.

Acceptance: exactly one identified blueprint for each of 132 current lesson versions; deterministic report totals, reusable component opportunities, source caveats/missing objectives and exception list; unchanged inputs SKIP; changed source/dependency invalidates correctly. Never rewrite/import/publish in this run. Compact summaries go to Luna; Terra receives exceptions only. Test corpus extraction without transmitting full content to stronger models. Rollback: keep versioned file artifacts; runtime catalog untouched.

## 12. Phase 9 — Content Enrichment

Pilot accepted/live: actual MAT-07 v5 targeted production append and authenticated Admin Direct activation completed on 2026-10-07; [receipt](TARGETED-LESSON-RELEASE.json). Original v4/Questions and collection size preserved, actual learner-view smoke passed, no false QA. Next: bounded source-defined batches under standing social release authorization. Earlier pending import/deployment/editorial review descriptions are historical.

Next bounded increment accepted/live: MAT-08 v3 adds three source-defined percentage explorers; [actual receipt](PERCENTAGE-APPLICATIONS-RELEASE.json), [behavior and reproduction](PERCENTAGE-APPLICATIONS-ENRICHMENT.md). Original v2/thirteen blocks/fifteen Activities/ten Questions preserved, current outputs and historical access verified. Next: compatible existing linear-model recipes and actual production interaction rollout before broader-domain batches. Phase 9 is ongoing; no missing goals or broader enrichment completion are invented.

Linear increment accepted locally: [existing-model recipes/baseline interaction](LINEAR-ENRICHMENT.md), ADR 0050. MAT-05/MAT-06 source-preserving v3 candidates; no migration, feature flag or new engine. Complete protected code release before actual authenticated targeted append/Admin Direct activation; published percentage pilots are not re-imported.

Linear rollout accepted/live: protected PR #6/main c190d53/Vercel commit+READY+alias verified, then authenticated targeted imports and Admin Direct activation of MAT-05/MAT-06 v3. [Actual receipt](LINEAR-ENRICHMENT-RELEASE.json). Original v2/eight Questions per lesson and nineteen Mathematics identities preserved; three correct baseline explorations live. Continue broader source-defined batches; this is four enriched lesson identities, not completion of the full Phase 9/remaining roadmap.

Targeted import implementation: [TARGETED-LESSON-IMPORT.md](TARGETED-LESSON-IMPORT.md), ADR 0049. Source-bound next-version append now uses existing SQL/memory core and import UI, preserving original collection/Question/history. The earlier Terra handoff is resolved by current-session implementation after user continuation; no model switch claimed. Actual remote deployment/activation and then bounded enrichment batches remain to execute under standing Admin Direct authorization.

Current owner policy: [ADR 0048](../ADR/0048-social-project-direct-release.md) supersedes independent/human editorial release gates. Social/community feedback follows technically validated direct launch using existing Admin Direct with actual authorization/audit records. Missing objective/source/rights facts remain visible; UNREVIEWED is evidence status, not a permission gate. MAT-07 v5 is authorized; compatible targeted lesson-version import is the current engineering prerequisite, documented in [handoff](handoffs/2026-10-07-targeted-enrichment-import.md).

First review-preparation increment: [ENRICHMENT-PREVIEW.md](ENRICHMENT-PREVIEW.md), ADR 0047. A source-bound MAT-07 percentage explorer is illustrated in an isolated next-version candidate; all blueprints/candidates remain UNREVIEWED/REVIEW_REQUIRED. This preparation supplies no approved blueprint, independent factual approval or reviewed batch. Existing Studio review/export remains authoritative.

Risk MEDIUM, HIGH for ambiguous pedagogy. Luna Max for approved blueprints/components; Terra exceptions. Depends on Phase 8 review and relevant blocks/assets. Flag: `FEATURE_INTERACTIVE_LESSONS` gates presentation, not publication authorization.

Start one small representative pilot, then batches of 10–20 lessons after engineering QA passes. Create new versions with stable lesson/question identities and preserved historical references; do not modify original published bytes. Community review follows launch. Keep actual factual/pedagogical/accessibility/source findings and use prior evidence only with actual target/dependency hashes. Direct release authorization comes from the current owner instruction; confidence and historic publication never imply independent QA.

Acceptance per batch: meaning/facts/answers/distractors and Concept mapping checked with truthful findings, valid interaction goal/help/evidence, rights/alt, mobile and Pack compatibility/engineering QA, original versions still usable. Standing authorization permits direct release under existing Admin Direct after these checks; no repeated human review is required. Rollback retains original immutable versions. Existing security and unrelated operation boundaries remain applicable.

## 13. Phase 10 — Review and Smart Mistakes

Risk HIGH engine; Terra policy, Luna UI/storage implementation under contract. Depends on Phase 4 action contract, Phase 6 assessed interactions and actual Attempt facts. Flag: `FEATURE_SMART_MISTAKES`; new Quick Review path uses a separately documented flag or existing compatible entry point.

Extend review.v2 and existing mistake repositories: bounded Quick Review retrieval, explainable prioritization, derived pedagogical patterns/categories with evidence pointers, example → different-question retry → new evidence. Specify when a supported observation may be labeled concept_gap/procedure_error/misconception/attention/interpretation/calculation/prerequisite_gap; keep uncertainty visible. Preserve coding categories and original records. Reflection stays distinct from successful retrieval.

Acceptance: no fabricated urgency/patterns, reserved-question avoidance, independent/help-aware retry effects, deterministic grouping/selection, original mistakes retained, versioned schedules/evidence, end-to-end mistake/review loops. Sol High reviews meaningful mastery/review/retention policy changes before activation when risk warrants. Rollback: prior read view and policy for new decisions; retain historical policy-version interpretation.

## 14. Phase 11 — AI Learning Layer

Risk HIGH architecture/security/cost; Terra contract, Luna adapters/components after approval. Depends on verified Phase 4/10 factual summaries/groups and Phase 5 assistance contexts. Flag: `FEATURE_AI_LEARNING` off by default; missing provider is supported.

Reuse generation provider interface/server gateway/pricing and TutorPanel. Specify explainDifferently/giveHint/analyzeMistakes/summarizeSession/explainConceptRelation, minimal context, structured Zod outputs, timeout/cancellation, owner/version/policy cache boundaries, limits/cost/usage persistence, error/fallback and assistance exposure. AI text never writes mastery/planner/review/scoring/publication. No full user history or reserved official stimuli. Do not weaken current solution-exposure attestation accidentally.

Acceptance with mocks: unconfigured provider, timeout, invalid output, cache scope/invalidation, budget/rate limits, usage, sensitive-context exclusion, exam block, recoverable UI; learning works with flag off/provider unavailable. Real provider/credential operations require authorization. Rollback: disable AI entry points; authored hints/text remain; preserve truthful assistance history.

## 15. Phase 12 — Knowledge Map

Risk HIGH graph semantics; Terra contract, Luna React Flow/UI. Depends on curriculum prerequisite contracts and canonical progress/read projections. Flag: `FEATURE_KNOWLEDGE_MAP`.

Extend concepts knowledge-map API/read model with prerequisite edges and canonical mastery/review states; settle cycles, required vs recommended edges, scope filtering and unlock explanations. Reuse catalog/graph validators. Lazy-load interactive view, with mobile subject subgraphs, Concept sheet and existing list fallback. React Flow is presentation; no propagation of mastery from completed lessons or neighboring nodes.

Acceptance: contract/edge fixtures, stable state mappings and no graph-owned evidence; mobile/keyboard accessible path, heavy chunk unloaded when flag off, list fallback for canvas failure. Rollback: current hierarchy list, unchanged curriculum/evidence.

## 16. Phase 13 — Real Exam Mode

Risk MEDIUM UI; Luna Max. Terra only for scoring/deadline/transactions/security changes. Depends on Phase 1 FocusShell and existing unified assessment engine. Flag: `FEATURE_REAL_EXAM` gates new presentation; does not weaken current EXAM rules.

Extend `assessment-panel.tsx` and existing route with question navigation/index, flags, final review, timer and factual post-exam Concept analysis. Reuse immutable snapshot, saved response controls, delayed feedback and finalization. No tutor/hints/visible mastery during EXAM; reserved official material follows exposure policy and annulled questions remain non-scoring/non-evidence.

Acceptance: navigation/save/resume/flag/final review/submit/results, dirty-save/expiry recovery, exactly-once finalization and mistakes/review integration. Existing engine tests remain green. Rollback: previous assessment presentation; in-flight instances remain readable, score/history unchanged.

## 17. Phase 14 — Admin Authoring

Risk MEDIUM specified UI; Luna Max; Terra for admin authorization/publication/transactions. Depends on stable runtime/assets/blueprints and batch QA. Flag: `FEATURE_CONTENT_HEALTH`.

Extend existing import/review/QA pages and Studio artifacts with Add Block, mobile preview, Asset Library, Blueprint Viewer and Content Health/accessibility/source reports. Preserve actual Editorial Reviewed/Admin Direct modes, actors/reasons/audit records and draft/new-version editing. Display missing sources/mapping/rights as findings; never fabricate certification. No new publication engine or duplicate mode table.

Acceptance: ADMIN-only mutation and STUDENT denial, old imports/preview still work, published versions cannot be edited in place, schema/source/asset QA precedes preview, real mode/audit visible. Critical publication-path change merits Sol High adversarial review. Rollback: prior admin views; validated authored drafts retained; publication records untouched.

## 18. Phase 15 — Offline / Advanced Experiences

DEFERRED. The source pack names this phase but does not define offline writes, sync/conflict rules, protected-data handling or advanced acceptance. Luna may inventory requirements; Terra is needed for any sync/consistency/security architecture. Do not implement offline learner-state queues, new code runtimes or speculative advanced blocks without a separately scoped contract and authorization.

## 19. Proposed migrations

No migration is created/executed in this audit. Order after accepted contracts: (1) routine/day allocations/overrides; (2) version/context-scoped resume and elapsed/session summary facts; (3) asset metadata/references; (4) optional persisted blueprints, preferring Studio sidecars initially; (5) derived mistake memberships; (6) optional AI usage/cache metadata. Exact indexes/cardinality/backfill and data retention are phase decisions.

Simple additive empty tables: Luna. Existing-data transforms, relation changes, evidence/mastery/history or auth boundaries: Terra. High-risk/irreversible production transformations require Sol High review plus explicit production authorization. New LearningPurpose/Section/Step Pack contracts require ADR, compatibility plan and fixtures even if the JSON field looks additive. Existing publication audit tables and policy versions are reused.

## 20. MODEL ROUTING PLAN

| Phase | Recommended model | Reason |
|---|---|---|
| 0 — Stabilization/audit | Luna Max | Read-only comparison, documentation and existing checks |
| 1 — Design Foundation | Luna Max | Approved primitives, shell, tokens and accessibility |
| 2 — Today | Luna Max; Terra if selection rules change | Reuse coordinator; ordering has pedagogical consequences |
| 3 — Study Planner | Luna Max; Terra for scheduling/rebalance contracts | UI/additive persistence are routine; availability conflicts require domain decisions |
| 4 — Adaptive Session | Terra → Luna Max | Budget/review/mastery/mistake/curriculum/prerequisite priorities and immutable snapshots |
| 5 — Lesson Architecture | Luna Max; Terra for ambiguous persisted/evidence contracts | Existing projection/renderer can be extended; migrations may affect history |
| 6 — Interactive Blocks | Luna Max; Terra for help/evidence policy | Reusable interactions under defined assessment/assistance rules |
| 7 — Visual Assets | Luna Max; Terra for security/storage changes | Metadata/UI are routine; reserved bytes/exposure are sensitive |
| 8 — Blueprint Pipeline | Luna Max; Terra exceptions | Local extraction/hashing/classification; ambiguous pedagogy escalates individually |
| 9 — Content Enrichment | Luna Max; Terra exceptions | Source-bound existing components; engineering QA then authorized Admin Direct, community feedback after launch (ADR 0048) |
| 10 — Review & Mistakes | Terra engine → Luna Max UI | Scheduling, inference/grouping and targeted practice affect evidence |
| 11 — AI Learning | Terra architecture → Luna Max implementation | Context/cache/fallback/cost and assistance/security boundaries |
| 12 — Knowledge Map | Terra semantics → Luna Max React Flow UI | Prerequisite interpretation/unlocks vs graph presentation |
| 13 — Real Exam | Luna Max; Terra for domain changes | Existing engine; UI navigation, review and focus |
| 14 — Admin | Luna Max; Terra for authorization/publication changes | Existing authoring/QA paths and real publication audits |
| 15 — Offline/advanced | Deferred; Terra if sync architecture is scoped | Contracts and authorization are insufficient |

Likely Sol High review points: new Adaptive Session crossing selection/evidence, substantial mastery/review changes, critical publication pipeline changes, any irreversible production/evidence migration, or a persistent cross-system defect without reliable Luna/Terra diagnosis. These are conditional review gates, not permission to keep Sol High on routine work.

## 21. Current completion and next action

- [x] Source pack read and preserved; current implementation audited; gaps and reusable paths recorded.
- [x] Model routing, risks, likely migrations, dependencies, acceptance and rollback documented.
- [x] Complete application and documentation acceptance; results recorded in AUDIT-VERIFICATION.md.
- [x] Implement the first Phase 0/1/2 foundation increment after explicit user authorization; see EVOLUTION-FOUNDATION.md.
- [ ] Complete routine-dependent Phase 1/2 remainder and Phases 3–15 after their required contracts/model gates.

NEXT ACTION: MAT-05 v3/MAT-06 v3/MAT-07 v5/MAT-08 v3 are live. Continue broader source-defined batches with existing compatible models and actual authored goals, preserving published originals/Questions; exclude completed versions from repeat import/publication. Route concrete pedagogical exceptions to Terra. ADR 0048 authorizes technically validated Admin Direct release without independent editorial review; no fabricated QA or full corpus republication.

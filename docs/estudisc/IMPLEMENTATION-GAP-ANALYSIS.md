# Estudisc — Implementation Gap Analysis

2026-10-08 delta: existing review/mistake loops, contextual AI, lazy canonical knowledge map, assessment navigation/final review and source-bound ADMIN authoring are now released. Final consumers add catalog search/area filtering, owned routine/resume backup and checked activation of existing additive user-state migrations; see [final rollout](FINAL-EVOLUTION-ROLLOUT.md). Historical gap rows below describe the original audit. Ten source-defined lesson identities/seventeen explorers are live; original-objective, asset-rights and pedagogical exceptions remain factual content findings rather than invented approvals. Offline/geographic provider/unspecified advanced interactions remain outside the detailed accepted contracts.

[Phase 9 review preparation](ENRICHMENT-PREVIEW.md) adds a generic source/blueprint/Question/policy-bound recipe and local MAT-07 exploratory candidate. Original blocks/activities and twelve Questions remain intact. Actual blueprint/pilot review and batch enrichment remain pending; no alternate reviewer state, approval, import or publication is introduced.

Current deltas: [weekly routine](WEEKLY-ROUTINE.md) and [adaptive sessions](ADAPTIVE-SESSIONS.md). The original gaps below remain the initial audit snapshot; use the reports and current implementation plan for continuation.

[Scoped lesson resume](LESSON-RESUME.md) closes stable-step/expanded/shared Question draft reload and stale-submission/assistance guards. Typed state for other interactive blocks remains tied to Phase 6 contracts.

[Phase 6 core increment](CORE-INTERACTIVE-BLOCKS.md) now provides those typed contracts for the supported exploratory blocks. MapLibre/geographic providers, complex simulation blueprints and actual corpus enrichment remain pending; existing publication is unchanged.

[Phase 7 metadata/authoring](TEACHING-ASSETS.md) provides licensed version/hash inventory, local search/selection and per-source visual rights validation. Admin catalogue UI and distribution/storage remain later consumers; no actual asset was approved or published by this increment.

[Phase 8 proposal pipeline](LESSON-BLUEPRINTS.md) locally extracts all 132 historically audited lesson versions into compact UNREVIEWED blueprints, clusters/needs/confidence findings and cache-bound sidecars. Actual goals are absent for 113 source lessons; 117 proposals need deeper/source review. No approved blueprint, invented objective/mistake, enrichment or republication is claimed.

Implementation delta: the subsequent authorized Phase 0/1/2 foundation increment is recorded in [EVOLUTION-FOUNDATION.md](EVOLUTION-FOUNDATION.md). Classifications below retain the initial audited checkpoint; use that report and the current plan for implemented flags/navigation/Focus/Today and remaining routine contracts.

Phase 3 delta: [WEEKLY-ROUTINE.md](WEEKLY-ROUTINE.md) records actual routine persistence, onboarding/week/manual/override/focus and checked previews; original gap classifications below remain audit history rather than current implementation status.

## 1. Snapshot and audit limits

Date: 2026-10-06. Branch: `main`. Base: `d38f640` (`Merge pull request #2 from theusinshow/finalize/estudisc`). Initial working tree was clean. Remote: `https://github.com/theusinshow/estudisc.git`.

Next.js 16.3.6; React 19.2.8; TypeScript strict; pnpm 11.9.0; Drizzle 0.45.2; PostgreSQL/Neon; Auth.js 5 beta; existing Vercel deployment. Versions come from `package.json`, not a new dependency recommendation. Canonical Design System: 4.0.0.

All eleven source-pack Markdown files and the manifest were read. Targeted code, schemas, tests, CI configuration and applicable ADRs were inspected. Evidence hashes are in [AUDIT-EVIDENCE.json](AUDIT-EVIDENCE.json). This is a repository/spec audit, not an independent factual review of every published lesson or a production-data audit. No complete lesson corpus was sent to another model. No runtime code or domain rule was changed.

Current content count is documented as 132 lessons / 1,144 Questions and verified locally by the existing identity/hash test. Historical production and remote-CI evidence remains in [the consolidation report](../migrations/ESTUDISC-CONSOLIDATION-RESULTS.md); remote CI and production were not rechecked in this session.

Local checks: frozen install, lint, typecheck, 262 tests passed / 3 optional real-PostgreSQL skipped, build and pack catalog validation passed. Full E2E result and exact commands are recorded in [verification](AUDIT-VERIFICATION.md). Initial lint/test launches failed before execution with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; frozen install with `CI=true` repaired the local dependency environment, then checks were rerun.

## 2. Classification

`EXISTS`: requested capability has inspected implementation; does not imply complete new-pack acceptance. `PARTIAL`: foundation exists but specific behavior is absent. `MISSING`: not found in scoped implementation/search. `NEEDS_REFACTOR`: current path needs a compatible extension/reorganization. `DEFERRED`: insufficient scope/contracts or later phase. P0 = phase prerequisite; P1 = core cycle; P2 = later experience. Absence findings refer to this checkout, not an external service or private branch.

## 3. Design Foundation

| Requirement | Status | Evidence | Gap / priority |
|---|---|---|---|
| Mobile shell, TopBar, desktop sidebar | EXISTS | `src/components/layout/app-shell.tsx`; `primary-nav.tsx`; shell E2E | Reuse; validate proposed navigation at 320/360/390/430px. P1 |
| Five-item BottomNavigation | PARTIAL | Current primary nav is Hoje/Aprender/Progresso/Mais; ADR 0030 | Plano and Revisar become primary destinations; record evolution of accepted four-item shell. P1 |
| FocusShell without bottom nav | MISSING | Lessons, study and assessment routes use `AppShell` | Add shell mode through existing layout; preserve Programming Lab. P1 |
| Responsive layout, fonts and canonical DS version | EXISTS | DS index/VERSION; app layout; `foundation.css`; shell E2E | No DS reset/version cleanup needed. P0 |
| Semantic tokens | PARTIAL | `design-system/design-tokens.json`; generated CSS | Audit coverage of mastery/subject/surface aliases against pack; derive new aliases from canonical JSON only. P1 |
| Motion and reduced motion | EXISTS | `src/components/motion/`; DS MOTION; motion E2E | Keep existing duration authority; educational animation contracts still needed per new block. P1 |
| Accessibility contracts | EXISTS | DS ACCESSIBILITY; accessibility E2E; interaction tests | Existing tests do not certify all new sheets/maps or all four mobile widths. P1 |
| Component Registry and primitives | PARTIAL | DS COMPONENT_SYSTEM; layout/ui/motion component inventories | Need explicit FOUNDATION/APPROVED/EXPERIMENTAL status and reusable Sheet/Dialog/Tabs/SegmentedControl contracts; no standalone runtime registry found. P1 |

## 4. Today

| Requirement | Status | Evidence | Gap / priority |
|---|---|---|---|
| Request coordinator, recommendation reasons | EXISTS | `src/features/today/get-today-dashboard.ts`; recommendation rules; `tests/unit/today-dashboard.test.ts` | Preserve read-only coordinator and stable tie-breaking. P1 |
| StudyActionCard | PARTIAL | `src/app/page.tsx`: next-card, resume-card, kind labels | Extract presentation for review/continue/lesson/practice/quick-review/simulation with reason/duration/count when factual. P1 |
| Today plan | PARTIAL | Session time buttons, open sessions, next action and queue | Queue is not routine/day allocation; no persisted daily availability plan. P1 |
| No-plan / completed / day-off states | PARTIAL | Existing no-content callout and completed study result | Distinguish no configured routine from no eligible content; day-off and completed-day state need routine facts. P1 |
| Learn/subject/concept entry points | PARTIAL | `/tracks`, `/tracks/[trackId]`, `/concepts/[conceptId]` | Preserve routes; add search and subject drill-down/explorers without a second catalog. P2 |

Recommendation changes are Terra work: current priority is active session → due reviews → weaknesses/mistakes → interrupted lessons → prerequisites → new lessons. Presentation reuse is Luna work. Do not equate UI refactoring with changing selection policy.

## 5. Planner

Existing `planner.v1` in `src/features/study-sessions/planner-policy.ts` scores due days, weakness, importance, phase and subject balance; excludes unavailable/reserved and blocked new learning, and enforces a time budget. `tests/unit/planner-policy.test.ts` covers filtering, ordering and budget. ADR 0021 freezes ACTIVE composition and recomputes missed days instead of accumulating debt.

| Requirement | Status | Evidence / gap |
|---|---|---|
| Persistence | PARTIAL | `src/db/schema/study.ts` stores StudySession, not a reusable weekly StudyPlan/routine |
| Availability/day/timezone, subject allocations and user priorities | MISSING | Existing subject history and track importance are not weekly user availability/preferences |
| Automatic/Assisted/Manual modes; onboarding; week/routine views | MISSING | No dedicated Planner route or these mode contracts found |
| Overrides, temporary focus and missed-day rebalance preview | MISSING | No override persistence or preview/apply path found; specify timezone and no-debt semantics |
| Eligibility and curriculum readiness | NEEDS_REFACTOR | Session repository filters published QA-release lessons and question exposure, then sets `plannerReady:true`; recommendations filter published content. Publication mode is not complete curriculum/pacing/editorial certification |

Luna can build forms, preview presentation and additive persistence after contracts. Terra must decide scheduling/rebalance semantics or change readiness/priority rules. Do not silently exclude Admin Direct content solely because its publication mode differs; derive eligibility from actual facts and visible caveats.

## 6. Adaptive Session

| Requirement | Status | Evidence / gap |
|---|---|---|
| Time budget | PARTIAL | API and SessionControls accept 15/30/60; pack asks 10/20/30/45. Minimum candidate estimate is 15; UI-only change would fail 10-minute composition |
| Deterministic composition | PARTIAL | `planCandidates`; SQL and memory repositories. Current items are lesson/question slices, not full review/remediation/lesson session actions |
| Interrupted sessions / persistence | EXISTS | `plan()` returns ACTIVE session; owner locks; immutable items/versions; transition guards |
| Reviews, mistakes, prerequisites, curriculum, routine priorities | PARTIAL | Due reviews/mastery/prerequisites/importance used; `remediation` exists in policy type but repository candidate kinds are review/practice/learn. No explicit mistake source or routine input |
| Cross-subject composition | PARTIAL | SQL chooses one track and replans within it; memory selects a pack. Decide intended cross-track behavior with track-specific dates/prerequisites |
| Stable clock / policy reproducibility | NEEDS_REFACTOR | Pure policy is stable, repository uses current Date/Date.now while gathering facts. Inject one evaluation clock into future composition |
| Session Summary | PARTIAL | Study route and repository `result()` show attempts/latest correct answers | Missing actual elapsed study time, reviewed-concept counts, factual evidence changes and next step; budget is not measured elapsed time |

Terra must specify composition and a versioned snapshot contract before Luna implements routine helpers/UI. Sol High review is justified before enabling a new policy that changes recommendation, assistance and evidence pathways together.

## 7. Lesson Runtime

| Requirement | Status | Evidence / gap |
|---|---|---|
| Lesson and question integration | EXISTS | `src/features/lessons/api.ts`; Activity registry; shared QuestionActivity |
| One idea per step and checkpoints | EXISTS | `lesson-steps.tsx` groups blocks; `checkpointFor`/exit_ticket; `lesson-stepper.tsx` |
| Persisted Section/Step/LearningPurpose | PARTIAL | Steps are a runtime projection; ImportedLessonBlock is stableId/type/payload, not the new proposed persisted hierarchy |
| Block dispatch and fallback | EXISTS | `lesson-block-renderer.tsx`: validated type dispatch plus invalid/unsupported fallback; extend it |
| Feedback and assistance | PARTIAL | Existing inline educational feedback and shared Question hints/solution | Four semantic help levels and uniform Correct/Incorrect/Partial/Explanation presentations still need contracts |
| Pause/resume | PARTIAL | Standalone step stored in URL hash; mounted steps retain state during navigation; Question last answers/assistance persist | Reload loses unsent educational-block state. Missing version-pinned step/interaction/elapsed-time snapshot; session steppers do not own URL |

Choose an additive runtime/sidecar projection first. Published Pack changes require ADR and compatibility fixtures. Preserve old lesson rendering, including unavailable-version recovery, and keep completion separate from mastery.

## 8. Interactive Blocks

| Block | Status | Existing component | Reusable / remaining work |
|---|---|---|---|
| Prediction | PARTIAL | Static prediction activity; prediction text block | Yes; compose predict/observe/explain/practice explicitly; persisted signal only under approved evidence contract |
| Image | PARTIAL | `figure` schema/rendering, ADR 0032 | Yes; safe image, caption, alt/long description, size and credit exist; add variants and registry references compatibly |
| Matching | PARTIAL | EducationalActivityPanel and evaluator | Yes; native select works by touch/keyboard; tap-to-pair presentation and durable response contracts missing |
| Sorting / dragDrop | PARTIAL | `ordering` with Subir/Descer buttons | Yes; accessible non-drag path exists; drag optional and must retain buttons |
| Timeline | PARTIAL | Timeline block maps to ordering | Yes; chronological mobile presentation and dated metadata missing |
| Comparison | MISSING | No generic before/after comparison found | New block with text/buttons plus optional slider |
| Hotspot | MISSING | No generic hotspot/zoom response contract found | Need target geometry, zoom, keyboard/text alternatives and evaluation |
| Slider | PARTIAL | NumericExplorer | Yes; percentage/proportion exploration, not an arbitrary variable simulation |
| Interactive Map | MISSING | No MapLibre dependency/renderer | Lazy map adapter with GeoJSON validation and accessible list/text fallback |
| text/callout/question/checkpoint/reveal | PARTIAL | Text/note/warning, QuestionActivity, checkpoint projection, solution disclosure | Reuse current types; avoid cosmetic type renames requiring schema changes |
| diagram/chart/stepAnimation/simulation/formulaPlayground/geometryCanvas | DEFERRED | AtomModel is a specialized diagram; progress charts exist | No generic contracts for all advanced block types; prioritize blueprint-backed demand |

Important boundary: EducationalActivityPanel evaluates locally and stores responses/hints in React state. Unlike shared QuestionActivity, it does not submit a durable Attempt/ConceptEvidence. This is suitable for exploration, not proof of recorded practice/mastery. Every newly assessed interaction must define schema, response/evaluator, feedback, evidence/help rules, touch/keyboard and fallback through existing core paths. Terra defines evidence semantics; Luna implements approved contracts. Do not turn local success feedback into canonical mastery.

## 9. Assets

Question assets exist in `src/db/schema/question-assets.ts`, authenticated repositories/routes and QuestionAssets. They are version-bound binary/hash/mime/dimension/alt records with official exposure checks, not a general public reusable Asset Registry. Lesson figures embed validated image data and attribution; Studio media contracts record rights, purpose, attribution and alt drafts.

General asset type/title/subjects/concepts/tags/reusable/interactiveReady metadata, searchable Admin Asset Library and explicit fallback handling are `PARTIAL`/`MISSING`. Extend the existing asset/media boundaries. Protected official assets must never enter public static files, AI training/context or unrestricted reuse. Current figure limits and SVG safety remain intact.

## 10. Review

`review.v1` and `review.v2` exist. v2 uses staged 1/3/7/14/30-day intervals, independence and a budget helper. Shared question submission and assessment finalization update schedules. `/review` lists due Concepts and reasons; v2 self-rating records reflection without claiming successful retrieval. Evidence: review policies/repository, question-study repository, `tests/unit/learning-policies-v2.test.ts` and review tests.

Quick Review, an explicit time-bounded retrieval flow and the broader ranking factors (mistake patterns, prerequisite relevance, curriculum importance) are `PARTIAL`. Preserve reflection vs actual answers. Terra owns scheduling/ranking changes; Luna owns the Review UI.

## 11. Mistakes

Existing mistake records link Attempts and Concepts and retain active/resolved history. Coding categorization uses failed_check/runtime_error/timeout/output_limit; shared questions record incorrect answers. `/mistakes` displays a flat list. The seven pedagogical pattern categories in the pack, repeat-error clustering, supported explanations/examples, targeted different-question retry and AI-readable deterministic groups are `MISSING`/`PARTIAL`. Add derived groups with source Attempt references; preserve original categories and records. Terra must distinguish observation from inferred misconception.

## 12. Progress

`src/features/progress/overview.ts` and `api.ts` provide a mastery ladder, retention/cooling, weekly activity, trends/charts and area summaries. Bulk evidence reads already exist and are tested (`bulk-mastery`, `progress-overview`). `EXISTS` for core summary; `PARTIAL` for subject drill-down and explanations of prerequisite bottlenecks. No need to rebuild progress or turn it into BI. Query-cost acceptance needs measured evidence; do not invent latency targets.

## 13. Knowledge Map

Concept prerequisites/curriculum contracts and validations already exist. Current `knowledge-map-api.ts` reads catalog membership; catalog query and `/knowledge-map` render a hierarchical Concept list (12 in focus plus full index), not prerequisite edges with canonical mastery/review states. Thus graph read model is `PARTIAL`, interactive React Flow view is `MISSING`. Terra defines required/recommended edge/cycle/unlock semantics; Luna adapts approved state projections into lazy mobile subgraphs and an accessible list/sheet. The UI must not become a second mastery engine.

## 14. Simulation / Real Exam

Unified assessment kinds, immutable snapshots, saved editable responses, flags, server deadline, delayed result and exactly-once finalization already exist (`assessment-repository.ts`, contracts/panel, integration test). Finalization creates Attempts/evidence/review updates; annulled items do not score or emit evidence. Tutor/shared-question access is blocked in active EXAM context. These engine requirements `EXIST`.

Dedicated FocusShell, one-question navigation/index, explicit final-review screen and clearer per-concept post-exam analysis are `PARTIAL`/`MISSING`. Current panel renders every question in a list and a finalization footer. Luna can extend presentation under unchanged scoring/finalization; Terra handles changes to assessment semantics, deadlines, assistance isolation or consistency. Keep server decisions authoritative.

## 15. AI Learning

Existing optional TutorPanel and `/api/tutor` use the server DeepSeek generation gateway, input/output Zod validation, bounded user message, provider timeout and returned token usage. No provider means recoverable unavailability; learning continues. Consultation conservatively records solution exposure before calling AI, protecting independence. Generation providers/contracts/pricing already exist and should be reused.

The five-capability AIService, cross-lesson minimal-context builder, application cache, durable usage/budget controls and relation/session/mistake-specific schemas are `PARTIAL`/`MISSING`. Provider token-cache statistics do not constitute an application cache. Current tutor sends the viewed question plus canonical explanation; minimize and explicitly protect reserved material. Terra must settle owner/version/policy cache keys, limits, fallback and exposure semantics. Luna can implement the resulting adapters/UI. No real keys/API calls are needed for fixtures and missing-provider tests.

## 16. Blueprint Pipeline and enrichment

Studio already has compact catalog context, editorial lesson-architecture artifacts, content/media contracts, hashes, validation and a draft pack adapter. These are reusable foundations, not the requested corpus pipeline. No `sourceHash`/`blueprintVersion`/`needsDeepReview` lesson-blueprint pipeline was found in scoped tooling/runtime searches.

`MISSING`: per-current-lesson extraction, compact word/block/objective summaries, deterministic archetypes/clusters, confidence policy, one versioned blueprint per lesson, frequency/media/reuse reports and exception-only escalation. `PARTIAL`: hashing/editorial review and source metadata foundations. A lesson-architecture editorial file is not evidence that all 132 lessons have approved blueprints.

Phase 8 audits locally without rewriting. Phase 9 starts only after approved blueprints and stable components; batches of 10–20 create new drafts. Do not invent missing objectives, source rights, current-edition curriculum verification or independent approval. Portuguese Concept caveats stay visible; no bulk ID normalization.

## 17. Admin

Import/preview/generation, review forms, QA releases and explicit publication audit already exist. Editorial Reviewed and Admin Direct are distinct verified modes (ADR 0036 and publication-details tests). Preserve them rather than creating new publication semantics. `MISSING`/`PARTIAL`: generic Add Block editor, device preview, searchable Asset Library, Blueprint Viewer, integrated Content Health/accessibility reports. Studio CLI validators and existing review views are extension points. Admin permission changes require Terra.

## 18. Performance and feature flags

Today coordinator and bulk mastery are already consolidated; `globals.css` imports ordered focused CSS modules. Do not schedule duplicate cleanup. Remaining measured-code concern: SQL session planning loops over lessons for activities and over activities for availability, while loading broad evidence/curriculum inputs. This is an inspected N+1 query pattern, not a measured production latency incident. Optimize with Terra only after counting queries/benchmarking and preserving authorization/exposure/transaction correctness.

Some source files use compact long lines and large feature panels; split only for a concrete phase need. dnd-kit, MapLibre, React Flow and shadcn packages are absent from current dependencies; do not install all preemptively. Heavy experiences need client lazy loading and static alternatives. The proposed `FEATURE_*` flags are `MISSING` in scoped runtime searches; centralize validated configuration before first gated UI and verify off/on paths. Flags never grant permissions or mutate domain policies by themselves.

## 19. Tests and QA

Existing unit, component, integration, corpus/Content Studio QA and full desktop/mobile Playwright suites plus split CI jobs exist. Full Vitest includes identity/bytes preservation for all 132/1,144, compatibility readers, planner/recommendations, mastery/review, assistance, publication and assessment idempotence. Three real-PostgreSQL tests are optional and skipped without an isolated test DB; memory tests do not certify PostgreSQL concurrency.

Missing acceptance fixtures concern the proposed routine onboarding → Today → composed session → summary, persisted interaction reload, Quick Review, pedagogical clusters/retries, graph/maps, flags, new exam navigation and blueprint incremental reports. Existing accessibility/mobile tests cover current flows, not future UI or a manual screen-reader/contrast audit at every required width. Each future phase must add meaningful domain/flow tests and perform its mobile/accessibility checks before enabling it.

## 20. Risks

| Risk | Probability | Impact | Mitigation / model |
|---|---|---|---|
| Rebuild an existing renderer/policy/assessment | Medium | High | Existing extension points and compatibility fixtures; Luna implementation under contracts |
| Published interpreted as pedagogically/planner certified | High | High | Explicit eligibility/caveat decision from actual records; Terra |
| Change hints/exploration into strong evidence | Medium | High | Purpose/help versioned rules, server-owned Attempts; Terra, Sol review if spanning engines |
| Mutate published corpus, IDs or historic attempts | Medium | Critical | New draft versions, preservation hashes, separate human publication; Sol review before any irreversible migration |
| Apply suggested DS tokens/five tabs without reconciliation | Medium | Medium | Canonical DS values and documented navigation evolution; Luna |
| Memory/SQL drift or weak concurrency coverage | Medium | High | Shared fixtures; disposable PostgreSQL parity/transaction tests; Terra if changing boundaries |
| Leak reserved official assets or learner history via AI/assets | Medium | High | Existing exposure gates, minimal context and private storage; Terra security review |
| Send 132 full lessons to strong model / redo QA | High | Medium | Local extractor, dependency hashes, exception-only review; Luna pipeline |
| Treat confidence score as approval | Medium | High | Document heuristic limits and real independent review; Terra ambiguous cases |
| Assume baseline checks establish future feature acceptance | Medium | High | Per-phase off/on domain/mobile/E2E gates; no implementation claims |

## 21. Concrete sequence and likely files

Baseline checks → design/navigation/flag reconciliation → Today presentation → routine persistence/UI → Terra session contract → compatible resume/runtime → reusable blocks → assets → local blueprints → reviewed draft batches → Review/Mistakes → contextual AI → graph UI → Exam UI → Admin. Phase 15 stays deferred. Design/Today may proceed before new routine logic using truthful existing facts; do not create placeholder availability as if it were real.

Likely targets: existing `src/components/layout/`, `src/features/today/`, `src/app/page.tsx`, `src/features/study-sessions/`, both study-session repositories and `src/db/schema/study.ts`; lessons/blocks and Activity registry; question/asset services; review/mistakes/progress/concepts/assessments/generation/QA modules; Studio catalog/adapter/contracts. New feature files belong beside these domains, not parallel engines. Relevant tests extend the suites cited above. Canonical DS tokens/specifications and relevant ADRs change only for approved durable contracts.

## 22. Likely migrations — proposals only

1. Owner-scoped routine/plan preferences, day allocations and dated overrides, with versioned modes/timezone and preview semantics.
2. Owner + lesson version + session/context resume snapshots; factual elapsed-time/events and optional summary read projection.
3. Lesson-version-bound blueprint artifacts: source/dependency hashes, blueprint/policy versions and actual review state. File-based Studio sidecars first; DB only if product retrieval needs it.
4. Reusable licensed asset metadata/references separate from protected question bytes; retain existing question-asset IDs/storage/exposure.
5. Derived mistake group membership with Attempt references and grouping-policy version; no rewriting historical categories.
6. Optional AI usage/cache metadata with owner/version scope and retention policy after Terra architecture.

No migration is required for this audit. No new publication-mode table is needed: it already exists. Section/purpose changes are not automatically additive: any persisted Pack-schema change needs ADR, migration/compatibility strategy and fixtures. Exact migrations, indexes and backfills are intentionally unspecified until their contracts are accepted; any production execution needs explicit authorization.

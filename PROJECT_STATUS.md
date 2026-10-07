# Estudisc — Current project status

```text
Product: Estudisc
Production: live
Published lessons: 132
Questions: 1,144
```

## Current production

Production URL: https://vecta-three.vercel.app. Preserve this existing alias during the identity migration. Publication evidence: [all subjects live](docs/all-subjects-live-20261006.md). Current validation: [consolidation report](docs/migrations/ESTUDISC-CONSOLIDATION-RESULTS.md).

## Current architecture

Next.js, Drizzle, Neon, Vercel and Auth.js remain a modular monolith with private ADMIN/STUDENT profiles. Attempts and evidence are append-only. Mastery, retention and planner decisions are deterministic. The learning core works without AI. Estudisc environment parsing, legacy session and backup readers preserve existing production contracts.

## Current content

| Subject | Published lessons | Questions |
|---|---:|---:|
| Mathematics | 19 | 240 |
| Science | 40 | 320 |
| History / Geography | 49 | 392 |
| Portuguese | 24 | 192 |
| Total | 132 | 1,144 |

Do not repeat content imports or publication. Stable IDs, versions, source files, hashes and learner state remain unchanged.

## Known issues

Editorial source caveats about rights, official curriculum mapping, pacing and quarantined Portuguese Concept labels remain recorded. Publication does not certify these matters. Local acceptance, main CI and full E2E are green; exact evidence is in the consolidation report.

## Current priorities

Phase 7 metadata/authoring increment accepted locally: optional version/hash-pinned teaching-asset metadata extends existing Media Pack candidates; CLI search/index/pinned selection re-read actual rights/source/policy. Every comparison/hotspot/map source has separate licensing/attribution/provenance checks. Actual local inventory: 19 jobs/four produced images (two APPROVED_EMBED, two REQUIRES_REVIEW), zero explicitly reusable/interactive-ready; no licence/review/status promotion. No bytes exported, database/Pack envelope/protected Question storage/auth/CSP changed. ADR 0045; lint/typecheck/build/packs/CLI PASS; 346 tests PASS / 3 optional real-PostgreSQL SKIP; default E2E 44 PASS / 18 gated SKIP, combined on 12 PASS / 2 off-case SKIP, foundation on 18 PASS / 2 off-case SKIP; corpus/hash/link/diff PASS. [Teaching-assets report](docs/estudisc/TEACHING-ASSETS.md). Next: Phase 8 local blueprint pipeline. Admin UI/storage/provider/distribution/publication remain separate consumers/boundaries.

Phase 6 core increment accepted locally (2026-10-07): existing registries support scoped exploratory prediction/observation/explanation, matching/order/timeline response/help reload, percent and configured linear models, safe comparison/hotspot and offline authored map/list. Optional snapshots preserve legacy hashes/clients, source membership and question-only session boundaries. Local feedback is recomputed; no Attempts/evidence/weights/scoring change. Bounded generated CSS and margin centering preserve CSP and reduced-motion geometry. ADR 0044; no dependency, migration or corpus republication. Lint/typecheck/build/packs/geometry PASS; 343 tests PASS / 3 optional real-PostgreSQL SKIP; default E2E 44 PASS / 18 gated SKIP, combined on 12 PASS / 2 off-case SKIP, foundation on 18 PASS / 2 off-case SKIP; pixel/corpus/hash/link/diff PASS. [Phase 6 report](docs/estudisc/CORE-INTERACTIVE-BLOCKS.md). Next: Phase 7 licensed teaching assets. MapLibre/geographic tiles and complex simulations remain blueprint/provider work, not claimed complete.

Phase 5 resume increment accepted locally: owner/track/lesson-version/context-scoped mutable snapshots, optimistic revision and idempotent save, stable step IDs/expanded view and bounded unsent shared Question responses. Existing canonical Attempts/assistance restore answers/feedback/hints/solution state; stale drafts cannot replace newer submissions. ADR 0043 and additive migration 0020; no production operation. Lint/typecheck/build/packs PASS; 329 tests PASS / 3 optional real-PostgreSQL SKIP; default E2E 42 PASS / 16 gated SKIP, foundation/routine/resume on 16 PASS, adaptive/resume on 10 PASS; UI/hash/source/link/diff PASS. [Resume report](docs/estudisc/LESSON-RESUME.md). Next: typed state and contracts for additional Phase 6 interactive blocks through existing registries. Migration 0020 and production rollout remain unexecuted boundaries.

Phase 4 accepted locally: default-off FEATURE_ADAPTIVE_SESSION extends the existing planner with 10/20/30/45, one composition clock, explicit review/remediation/practice/learning reasons, actual QA/checkpoint readiness and routine limits. Short actions use the shared Question registry; frozen per-item track/version membership survives newer imports. Factual summary reports estimates, elapsed wall time and actual evidence without completion-based mastery. ADR 0042; no schema migration or published content change. Lint/typecheck/build/packs PASS; 319 tests PASS / 3 optional real-PostgreSQL SKIP; default E2E 40 PASS / 12 gated SKIP, foundation/routine on 10 PASS, adaptive on 4 PASS; UI/hash/source/link/diff PASS. [Phase 4 report](docs/estudisc/ADAPTIVE-SESSIONS.md). Next: Phase 5 persisted step/interaction resume through existing runtime.

Phase 3 implementation: the user authorized this session to continue after the model-routing choice. Owner-scoped weekly routine, three modes, priorities/manual allocation, dated overrides/focus, review target, simulation time reservation and explicit revision/dependency/expiry-checked preview/apply are implemented under default-off FEATURE_STUDY_PLANNER. Existing planner/start paths respect time/subject limits while preserving ACTIVE snapshots; saving availability does not count as a study day. ADR 0041 and additive migration 0019 record the contract. No Pack or published-content transformation; no production migration or release.

Phase 3 acceptance: lint/typecheck/build/packs PASS; 299 tests PASS / 3 optional real-PostgreSQL SKIP; final default E2E 38 PASS / 10 intentional gated SKIP; final on E2E 10 PASS / no failures; mobile/desktop/browser/hash/diff QA PASS. Exact commands and limits: [WEEKLY-ROUTINE.md](docs/estudisc/WEEKLY-ROUTINE.md). The earlier Terra handoff is resolved by explicit user continuation, not a claimed model switch/independent review. Remaining contracts include Adaptive Session 10/20/30/45, readiness reasons, persisted lesson interaction resume and compatible routine backup.

Auxiliary product/design context refresh is complete under the user's latest authorization: PRODUCT.md has the current Impeccable schema, DESIGN.md uses recognized sections and actual ADR 0040 navigation/Focus pointers. Doctor reports no findings; schema/source/hash/link/diff checks and lint pass. No runtime/content/dependency changes from `b30b86d`; prior application gates remain verified evidence. See [context refresh](docs/estudisc/PRODUCT-CONTEXT-REFRESH.md).

The user's previously pending asynchronous choice was answered with “pode seguir”; this session was authorized to resolve the Phase 3 contract. The context-refresh checkpoint remains historical evidence, not a current blocker.

Implementation is now authorized by the user and the first Phase 0/1/2 foundation increment is locally accepted: validated default-off flags, compatible five-destination shell, Focus mode, native Sheet/Dialog, keyboard Tabs, real session-only `/plan`, and reusable Today presentation with next action first. ADR 0040 and canonical DS screen/registry docs record compatibility; tokens remain 4.0.0. No Pack/data migration, published-content change or domain-policy change.

Current implementation checks: lint/typecheck/build/pack validation PASS; tests 275 PASS / 3 optional PostgreSQL SKIP; existing off/default E2E 38 PASS / 4 intentional flagged SKIP; separate on E2E 4 PASS. Browser QA at 320/360/390/430/1280, keyboard/modal/Focus exit/reduced motion passed. Exact commands/results/limitations: [foundation report](docs/estudisc/EVOLUTION-FOUNDATION.md).

Historical foundation handoff: [the original routine task](docs/estudisc/handoffs/2026-10-06-planner-routine-terra.md) was subsequently resolved by the user's current-session authorization and ADR 0041. No model switch/new agent or production rollout is claimed. All new flags remain off unless explicitly enabled.

## Completed initial audit — historical baseline

Consolidation is implemented and accepted. The architecture pack's initial audit produced documentation only before the user authorized implementation. Read [architecture](docs/estudisc/PRODUCT_ARCHITECTURE.md), [gap analysis](docs/estudisc/IMPLEMENTATION-GAP-ANALYSIS.md), and [implementation/model-routing plan](docs/estudisc/IMPLEMENTATION-PLAN.md). The initial gap classifications describe the audit checkpoint, not a claim that subsequent increments are missing.

Initial audit checks: lint, typecheck, build and pack validation PASS; tests 262 PASS / 3 optional real-PostgreSQL SKIP; full E2E 38 PASS / 0 FAIL. Initial dependency auto-install failed with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; `$env:CI = 'true'; pnpm install --frozen-lockfile` repaired the local environment before successful reruns. Source provenance and initial evidence: [audit verification](docs/estudisc/AUDIT-VERIFICATION.md). Current implementation verification is in the foundation report above. No new remote/production acceptance is claimed.

Remaining contracts: weekly routine/override semantics, version-compatible persisted resume/purpose, readiness independent of mere publication, and help-aware assessed interactions. Navigation and runtime projection are reconciled by ADR 0040. Luna Max handles routine implementation; Terra handles domain/security/architecture decisions; Sol High is conditional critical review.

Preserve the production alias, authentication and existing catalog; use protected main for future authorized evolution. Current Design System version is defined only in `design-system/VERSION` (4.0.0).

## Next action

Complete the current Phase 3 acceptance evidence, then continue the Adaptive Session contract through existing modules; see [PLANS.md](PLANS.md) and [.estudisc-agent-context/NEXT.md](.estudisc-agent-context/NEXT.md). Do not repeat imports/publication or claim planner-readiness certification from publication. Historical implementation logs are in `docs/history/`.

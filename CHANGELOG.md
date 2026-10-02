# Changelog

## 2026-10-01 — First-lesson dogfood fixes

- Numeric answers accept a trailing `%`, unit word or `R$` prefix through one shared parser; the Question `unit` is shown beside the field.
- Wrong answers show "Ainda não" without the worked solution and no longer mark the solution as revealed, keeping retries independent evidence; a correct answer locks resubmission until the answer changes.
- Lessons end in a completion screen linking to the next lesson; the current step is kept in the URL hash (standalone lessons only, not study sessions).
- The lesson progress card refreshes after each attempt (read-only `GET /api/lessons/[lessonId]/progress`) and shows the weakest practiced concept from `mastery.v2`; lesson completion still never sets mastery.
- Track page: CTA to the first unfinished lesson, completed-lesson marks, pluralization, "nesta trilha"/"Aulas" wording; student-facing track description no longer carries the internal draft notice.
- MAT-PREREQ draft: practice items differ from the worked examples, per-question hints, clearer decimal-to-percent example (still draft, unapproved).
- Visual: full-width question cards in steps, single input label, stable scrollbar gutter.

## 2026-10-01 — IFSC local runtime and draft content

- Extended existing renderer/registries/imports with educational interactions, Golden Lessons and immutable Questions.
- Added owner-scoped frozen StudySessions, deterministic planner and versioned mastery/review policies.
- Added shared assessment/diagnostic engine, definitive-key ingestion, private authenticated images and 12 draft simulations/benchmarks.
- Added independent four-layer QA, atomic publication/withdrawal, Admin JSON authoring/preview and v2 GenerationJob integration.
- Added optional contextual tutor through the existing gateway, protected exam mode and attested assistance.
- Mapped all 27 official numbered requirements to 378 Concepts; explicitly retained 63 teaching gaps and unpublished content for human review.
- Hardened owner-aware exports, dynamic personalized pages, mutation origin checks and four-item mobile bottom navigation.
- Updated Next.js/lint config to 16.3.6 and vulnerable inherited transitive overrides; production dependency audit passes.
- Validation: 134 tests passed / 1 real-PostgreSQL test skipped, eight final focused generation tests, lint/typecheck/build passed, five mobile checks passed. No remote or production write.

## 2026-10-01 — IFSC-00 integration

- Integrated approved IFSC specifications and ADRs 0017–0029; superseded the single-owner constraint while preserving infrastructure/history.
- Reconciled core documentation, roadmap and agent rules; v1 behavior remains explicit.
- Merged Design System v3 direction/tokens into the canonical pipeline.
- Copied the existing checkout into vecta without credentials; historical exam sources remain private local files.
- Runtime IFSC capabilities remain pending; this entry records documentation foundation only.

All notable changes to this repository specification are documented here.

The format follows Keep a Changelog principles. Product versions will follow Semantic Versioning once the application scaffold exists.

## [Unreleased]

### Added

- Modo aula em passos (uma ideia por tela, checagem rápida após cada conceito, prática e desafio final) na sessão de estudo e nas aulas sem código; rascunhos aceitam intuição, exemplos e erro comum por conceito; MAT-01 reescrita no formato rico como piloto.
- Simulados, resultado e Revisão redesenhados (ADR 0030): cards por tipo, cronômetro fixo, marcação "revisar depois", placar e barras por área, correção com prévia do enunciado, estados vazios úteis.
- ADR 0030 neo-brutalist UI refresh: tokens v4, self-hosted Archivo/JetBrains Mono, new shell and bottom navigation, rebuilt Today and study session, unified control vocabulary, colored lesson blocks and answer feedback, Portuguese student labels.

- IFSC test-week lesson drafts (MAT-01–06, MAT-08–10) in compact seed format, expanded into Pack v2 Questions/activities and merged by the source-pack builder; all `draft` pending human review.
- `scripts/audit-ifsc-official-bank.mjs`: read-only OCR/representation pre-review checklist for the private official bank.
- Fixed: the 2025.2 OCR page footer is now filtered during official ingestion.

- Phase 0 Next.js App Router scaffold with TypeScript strict mode and pinned pnpm dependencies.
- Tailwind CSS foundation and generated CSS custom properties from `design-system/design-tokens.json`.
- Minimal responsive accessible application shell using official branding assets, skip link, navigation placeholders, main landmark and status region.
- PostgreSQL/Drizzle foundation with schema placeholder, migration configuration, connection helper and development-safe database health endpoint.
- Initial Phase 1 Drizzle content/user-state schema and generated migration for the import-to-attempt vertical slice.
- Track Pack Zod validation, semantic validation, deterministic content hashing and import idempotency/conflict service.
- Drizzle-backed Track Pack import repository and `POST /api/import/track` API boundary.
- Imported track, lesson, code activity and history routes for the Phase 1 vertical slice.
- QuickJS child-process JavaScript runtime with timeout and output limits.
- RUN and SUBMIT SOLUTION API boundaries with tests proving RUN creates no Attempt and SUBMIT creates one Attempt plus append-only StudyEvent.
- Simple lesson/track progress projection after successful submission.
- `memory://local` disposable Playwright harness and PGlite-backed Drizzle integration tests.
- ADR 0011 for the initial JavaScript runtime adapter.
- Phase 2 concept detail page, concept read model, lesson concept links and concept navigation tests.
- Phase 2 lesson block renderer registry with safe renderers for initial block types and unsupported/invalid block states.
- Phase 2 activity registry for typed code activity parsing/rendering and persisted latest Attempt feedback after reload.
- Phase 2 lesson and track progress summaries derived from append-only Attempt evidence without implying concept mastery.
- Phase 3 JavaScript runtime contract metadata and coverage for timeout, output limits, runtime errors, stdout/stderr and blocked DOM/network/process access.
- Phase 3 programming activity feedback UI with separated runtime metadata, STDOUT, STDERR and test summary.
- Phase 3 display-only attempt diff generated from immutable submitted source against starter code.
- Phase 3 debug activity registry path and example fixture using the isolated JavaScript evaluator.
- Phase 3 verified Programming Lab gate covering runtime contract, terminal/test feedback, attempt diff and debug activity behavior.
- Phase 4 append-only concept evidence model with ADR 0012 and generated migration.
- Phase 4 deterministic `mastery.v1` concept policy with explainable concept-page output.
- Phase 4 deterministic `review.v1` scheduling, `/review` queue and review completion evidence/events.
- Phase 4 mistake categorization, active/resolved mistake state and `/mistakes` page.
- Phase 4 deterministic Today recommendations ordered by due review, active mistake and catalog continuation.
- Phase 5 optional project contexts with imported concept and activity links plus `/projects`.
- Phase 5 append-only XP ledger, first-pass SUBMIT awards and `/progress` audit surface.
- Phase 5 deterministic rank, badge and mission read models plus `/achievements`.
- Phase 5 accessible `/knowledge-map` list fallback for imported concept relationships.
- Phase 5 project-aware Today recommendations after due review, active mistake and catalog continuation.
- Phase 6 import hardening with request size limits, preview endpoint and same-version content-hash conflict reporting.
- Phase 6 export contracts for Backup, Progress and Teacher Context with category previews and privacy warnings.
- Phase 6 restore preview/application endpoints using non-destructive Pack manifest restore and ADR 0014 for user-state replay boundaries.
- Phase 6 `/exports` portability surface.
- Phase 6 accessibility and responsive audit coverage across implemented V1 routes.
- Phase 6 baseline security headers and E2E header smoke coverage.
- Phase 6 security audit, deployment preparation document and ADR 0013 for the production authentication/session stop condition.
- ADR 0015 selecting Vercel, Neon Postgres and Auth.js Google OAuth as the production preparation stack.
- Step 2.3 production environment contract for Auth.js Google OAuth and Neon/Vercel readiness placeholders.
- Step 2.4 Auth.js v5 foundation with Google provider route, readiness helpers and tests.
- Step 2.5 central auth middleware that protects private pages/APIs when Google OAuth is configured while preserving local no-OAuth development.
- Step 2.6 Neon/Vercel production runbook and `pnpm db:migrate` command for applying Drizzle migrations.
- Step 2.7 final local validation gate for production readiness.
- Production Auth.js `AUTH_TRUST_HOST` environment contract for Vercel proxy deployment.
- Custom Auth.js sign-in page at `/auth/signin` using the KNOW/OS Design System and Google account selection via `prompt=select_account`.
- Design-system motion pass for the app shell, sign-in surface and recurring content primitives, including Playwright coverage for normal and reduced-motion modes.
- Product import surface at `/import` with bundled example loading, paste/file JSON input, preview-before-apply behavior and E2E coverage.
- Production activation of the bundled JavaScript Track Pack on Neon, with service-level validation of catalog read, RUN, SUBMIT SOLUTION, progress, history and export availability.
- Guarded `pnpm test:postgres` validation against a real PostgreSQL engine using a disposable schema and migration-backed import/RUN/SUBMIT/progress smoke.
- Production dependency vulnerability audit via `pnpm security:audit`, patched pnpm overrides and documented dev-only audit residual for ESLint/minimatch/brace-expansion.
- Enforced CSP candidate in Next.js response headers with Playwright coverage for core directives and Google OAuth compatibility.
- Pack publication catalog and `pnpm packs:verify` hash/compatibility gate for accepted distributed Packs.
- Persisted gamification projections with `badge_awards`, `mission_progress`, mission status-change audit events, achievement timestamps and export coverage.
- ADR 0016 defining the dry-run/apply policy required before full append-only user-state restore.
- Restore dry-run planner foundation with `restore_provenance` schema, Backup fingerprinting and blocked `user_state_dry_run` preview output.
- Restore preview UI on `/exports` showing blocked user-state dry-run categories, source fingerprint and blockers.
- Per-request nonce CSP through `src/proxy.ts`, with production `script-src` no longer using `unsafe-inline` or `unsafe-eval`.
- Route-aware primary navigation component for the shared app shell.
- Step 14 generation foundation with provider-independent contracts, prompt compiler, raw JSON parser, server-only DeepSeek readiness detection and owner-scoped `GenerationJob` persistence.
- DeepSeek server environment placeholders and validation for `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_DEFAULT_MODEL` and `DEEPSEEK_PRO_MODEL` without exposing secrets through `NEXT_PUBLIC_*`.
- `generation_jobs` persistence schema, migration and repository tests for generation status timelines, compiled prompts, normalized specs and provider usage estimates.
- `caderno.lesson.v1` validation for generated Lesson Packs, including duplicate stable ID and missing concept-reference checks before preview or import.
- Manual Copy/Paste generation flow on `/import`, with prompt compilation, copied prompt, pasted AI JSON validation, generated lesson preview and atomic import through a reconstructed Track Pack boundary.
- Server-only DeepSeek generation adapter and `/api/generation/deepseek/generate`, using JSON-object responses, retry/error mapping and the shared generated Lesson Pack validation path before preview.
- Versioned DeepSeek usage/cost estimates for generated content, including persisted pricing metadata and an estimated-cost label in the DeepSeek preview flow.
- DeepSeek failure-recovery UI with Retry, Switch to Manual, Copy Prompt and sanitized technical details while preserving the fallback prompt for the same generation spec.
- Manual generation provider abstraction and DeepSeek route validation tests covering valid and invalid generated JSON before preview/import.
- Step 15 first-run callout for empty-catalog study surfaces, routing Today, Tracks, Review, Mistakes and Knowledge Map back to the content activation path.
- Scoped product-area accent tokens for import/onboarding, learn, practice, review, mistakes, progress and generation surfaces.
- Visual identity guide for exact logo, lockup, clear space, size, color, typography, area accents, app usage and implementation checklist rules.
- Safe imported static activity renderers for `prediction` and `multiple-choice`, including choices, hints and expected-answer disclosure where present.
- Zod server-environment validation.
- Vitest, Testing Library and Playwright smoke coverage.
- GitHub Actions baseline CI and separate Playwright E2E workflow.
- Guarded autonomy protocol in `AUTONOMY.md`.
- Persistent autonomous phase progression and recovery rules.
- `PROMPT-CODEX-RESUME.md` for context/session interruption recovery.
- Explicit local-action authorization and external/destructive stop boundaries.
- Phase gates, checkpoint rules, verification logs and durable `NEXT ACTION` requirements.

### Changed

- `AGENTS.md`, `README.md`, `PLANS.md` and `PROJECT_STATUS.md` now describe the real Phase 0 scaffold and canonical commands.
- Playwright E2E now runs with a fresh owned serial server because the local `memory://local` harness is process-global.
- Production deployment status now reflects the live Vercel + Neon + Google OAuth path and remaining manual owner-login validation.
- Production Google OAuth environment values were re-applied in Vercel after a Google `invalid_client` response, then redeployed and smoke-tested without exposing secrets.
- App interaction states now consume approved motion tokens for short reveal, hover, active, focus-within and state feedback rather than rendering as fully static surfaces.
- App shell and shared page primitives now align more closely with the approved Claude Design direction: signal window chrome, bordered workspace, boxed module sections, differentiated record/progress/import surfaces and stronger technical-brutalist separation across implemented routes.
- Playwright E2E now forces local no-OAuth mode with a disposable test secret so ignored production OAuth values do not redirect local smoke tests to sign-in.
- Empty Today and Tracks states now route users to the import product surface instead of asking them to call an API endpoint manually.
- Primary navigation is simplified around the study flow: `Hoje`, `Aprender`, `Praticar`, `Progresso` and progressive `Mais` access for secondary routes.
- Mobile navigation now uses a two-column grid with full-width `Mais` instead of a clipped horizontal rail.
- Lesson pages now present theory as the main `Aula` surface before linked concepts and practice activities.
- `/import` now prioritizes activating existing Track Packs before lesson creation or provider-assisted generation.
- `/import` mobile now keeps first Track Pack activation controls compact with scoped import-surface density rules and regression coverage for 375 px screens.
- Track Pack JSON imports now allow complete generated tracks up to 1 MiB while retaining oversized request blocking.
- Lesson pages now expose compact `Aula`, `Conceitos` and `Prática` anchors, with mobile practice panels tightened for shorter code editing and stacked RUN/SUBMIT controls.
- Track detail and Progress mobile screens now keep visible continuation paths back into the study flow using scoped area-accent CTAs.
- Secondary navigation now stays collapsed behind `Mais` by default on mobile, while preserving access to secondary routes and 44 px touch targets.
- Track detail and Knowledge Map now use progressive disclosure so complete imported catalogs do not dominate the first mobile study view.
- `/import` now starts with an intent selector, defaulting to ready Track Pack study and hiding Manual/DeepSeek generation until `Criar aula com IA` is selected.
- Area accents now use small brutalist border/shadow cues while keeping yellow reserved for signal/action/current/focus roles.
- Activity RUN/SUBMIT actions now surface HTTP, non-JSON and network failures in the terminal instead of crashing the lesson page, with explicit pending state and `aria-busy`.
- Lesson study pages now show session-state next actions and collapse persisted terminal/tests/diff output behind a technical summary, while fresh RUN/SUBMIT feedback still opens immediately.
- Central route/API guard moved from legacy `middleware.ts` to `src/proxy.ts` so Next.js 16 recognizes the network boundary.
- Initial Codex prompt now authorizes phase-by-phase V1 execution instead of stopping after Phase 0.
- `AGENTS.md`, `PLANS.md`, `PROJECT_STATUS.md`, `README.md`, `START-HERE.md`, and roadmap now support high-autonomy execution with repository guardrails.

## [0.1.0] — 2026-07-30

### Added

- Initial KNOW/OS product, architecture and Design System specification repository.
- Design System v2.2 and official branding assets.
- Product, domain, data, Pack, Programming Lab, testing, security and roadmap documentation.
- ADR set for foundational architectural decisions.
- Initial Codex Phase 0 bootstrap prompt.

## 2026-10-01 — IFSC-01

- Added curriculum/source/prerequisite/settings schema and migration 0010; atomic idempotent foundation seed and derived partial coverage.
- Basic gate: 3 focused tests, typecheck and lint passed. No production migration.


## 2026-10-01 — IFSC-02

- Added compatible strict Track Pack v2 and versioned shared Questions with deterministic scoring and protected exposure rules.
- Migration 0011; focused compatibility/integration gate: 11 tests, typecheck/lint passed. New interactions remain blocked until IFSC-03.


## 2026-10-01 — IFSC-03

- Added accessible educational interactions and numeric exploration through existing registries.
- Bound shared question activity references to immutable question versions; unavailable content fails safely.
- Validated 12 focused tests, typecheck and lint.

## 2026-10-01 — IFSC student slice and versioned policies

- Server-scored Questions emit immutable, idempotent Attempts and append-only multi-Concept evidence.
- Private Google identities have separate owner IDs and explicit ADMIN/STUDENT roles.
- Added persisted study sessions, frozen active structure, resumption and result summaries.
- Added deterministic mastery.v2/review.v2 while retaining v1. Hints and solution exposure reduce independence; self-rating cannot prove retrieval.
- MAT-07 seed remains draft pending independent QA. Integration uses disposable published fixtures; mobile slice passed.

## 2026-10-01 — IFSC planner

- Added deterministic time-budget planning with prerequisites, weakness, review urgency, subject balance and configurable exam phase.
- Replanning preserves active sessions and discards planned debt.
- Added draft prerequisite teaching for MAT-07; publication approval remains pending.

## 2026-10-01 — four Golden Lessons

- Authored draft Portuguese, Science and Geography/History Golden Lessons with truthful sources/provenance.
- Added accessible atom exploration and a vertical ordering timeline through the existing renderer.
- Verified edital Anexo V directly; retained historical/private source boundaries.

## 2026-10-01 — unified assessment engine

- Added versioned templates, frozen assessment instances and mutable open responses.
- Added transactional/idempotent finalization using existing Attempts/evidence/review.
- Added student assessment UI with server deadline and deferred results; Admin template authorization.
- Tested migrated integration, typecheck and lint. Actual official bank/template content remains pending.

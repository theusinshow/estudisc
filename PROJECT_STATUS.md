# KNOW/OS — Project Status

## IFSC expansion — current status (2026-10-01)

Active checkout: `C:\Dev\pessoal\vecta`, copied with Git history from the original KNOW/OS under explicit user authorization. Production and the original checkout remain untouched.

Current state: **LOCAL IFSC RUNTIME IMPLEMENTED; CONTENT RELEASE DEFERRED TO HUMAN REVIEW**. User explicitly selected draft content for human review on 2026-10-01. Sessions, deterministic planner/mastery/review, shared Questions/assessments, private official assets, editorial QA/CMS and optional tutor are implemented locally. Migrations 0010–0017 passed disposable PGlite. Full production/content acceptance remains open.

Private source inventory: 112 official Questions plus 29 Golden Questions, 303 image references, 27 Anexo V requirements mapped to 378 Concepts, and 12 draft assessment templates. Inventory mapping is not teaching coverage: 63 curriculum Lessons still need authored teaching/practice/exit-ticket content. Existing Golden Lessons and proposed official classifications also require independent human QA. No published seed or complete curriculum is claimed.

Validation: 134 tests passed / 1 real-PostgreSQL test skipped; lint/typecheck/build passed; five mobile shell and percentage session/resume/submit/result checks passed. Eight focused generation tests cover the final legacy-route guard. Dependency security remediation passed `pnpm security:audit` with no known production vulnerabilities. PostgreSQL/OAuth production configuration and deployment remain outside this local validation.

The existing V1 core is the implementation foundation. The approved target is `docs/ifsc/17-ACCEPTANCE-CRITERIA.md` once integrated. Historical PDFs are private local source material under `sources/ifsc/historical`, not publicly served assets. Credentials were not copied.

Update (2026-10-01, Claude Code): one test week of AI-assisted **draft** lessons was added: MAT-01–06, MAT-08–10 in `packs/seeds/ifsc-2027.lesson-drafts/`, 99 draft Questions. 54 Lessons remain without teaching content. Nothing was approved. The 2025.2 OCR page-footer leak was removed from 20 official items; their classification still needs human review. Validation: `tests/unit/ifsc-lesson-drafts.test.ts` and `tests/integration/source-pack-local.test.ts` passed, typecheck and lint clean.

UI update (2026-10-01): ADR 0030 neo-brutalist refresh was applied to the student shell, Today, study session, lesson blocks, questions, lists and Progress. Validation: component tests 15/15, the token test, typecheck and lint passed, and the mobile E2E shell and percentage-session specs passed 5/5. The Lab, import and admin screens inherit the tokens but have not had a dedicated design pass.

NEXT ACTION: human editorial production/review using the private source pack and `/admin`; publish only through independent QA. See `docs/ifsc/LOCAL-DELIVERY.md`. The older V1 status below is historical.

Last updated: 2026-08-05

## Current phase

`STEP 23 READY FOR REVIEW — DOGFOOD STUDY FLOW UX PASS`

Phase 0 repository foundation is implemented and verified. The repository now contains a Next.js App Router scaffold with TypeScript strict mode, Tailwind/token generation, minimal accessible shell, Drizzle/PostgreSQL foundation, Zod validation, Vitest/Testing Library/Playwright smoke tests and GitHub Actions CI.

Phase 1 first vertical slice is implemented and verified: import Track Pack, browse Track and Lesson, open JavaScript activity, RUN code, SUBMIT solution, record Attempt, update simple progress and show History event.

Phase 2 learning core is implemented and verified: concept read models/pages, lesson block renderers, activity registry routing, persisted latest attempt feedback and navigation progress summaries.

Phase 3 programming lab is implemented and verified: explicit runtime contracts, clearer terminal/test feedback, display-only attempt diffs and a first debug activity path.

Phase 4 mastery, review and mistakes is implemented and verified.

Phase 5 projects and gamification is implemented and verified. The implemented surface includes optional project contexts, append-only XP, transparent ranks/badges/missions, an accessible knowledge map and project-aware Today recommendations.

Phase 6 portability and hardening is implemented and verified. The V1 local product now includes import preview/hardening, Backup/Progress/Teacher Context exports, non-destructive Backup restore for Pack manifests, accessibility/responsive audit coverage, baseline security headers, security audit documentation and deployment preparation within local-only guardrails.

Production deployment is live at `https://know-os.vercel.app` using the ADR 0015 stack: Vercel, Neon Postgres and Auth.js Google OAuth. Step 2 implementation includes the Auth.js Google foundation, production environment contract, central session guard and Neon/Vercel runbook. Neon migrations have been applied and unauthenticated production smoke checks pass. The sign-in surface now uses the custom `/auth/signin` page following the KNOW/OS Design System, and Google OAuth requests include `prompt=select_account` so account selection is explicit. After a Google `invalid_client` response, Vercel Production OAuth/Auth environment values were re-applied from ignored local values, production was redeployed and the Google page was verified without `invalid_client`. A design-system motion pass now applies approved short motion tokens to app shell, sign-in and recurring content primitives while preserving reduced-motion behavior. Step 3 adds a real `/import` product surface for example/paste/file Track Pack activation with preview-before-apply semantics, deploys it to production and validates the first production learning loop at service level. Step 4 adds and runs guarded real-PostgreSQL validation through a disposable schema, covering checked-in migrations plus import/RUN/SUBMIT/progress behavior without touching production application tables. Step 5 adds production dependency vulnerability scanning, patched transitive runtime overrides and an enforced CSP candidate with Playwright coverage. Step 6 adds a Pack publication catalog and verifier so the accepted example Pack has immutable schema/ID/version/hash metadata before broader distribution. Step 7 adds persisted gamification projections for badge awards, mission progress and mission status-change audit events while keeping XP/review/mistake/mastery rules authoritative. Step 8 accepts ADR 0016 for conflict-safe full user-state restore replay policy. Step 9 implements the restore provenance schema foundation and a blocked `user_state_dry_run` plan in restore preview. Step 10 exposes that dry-run plan in `/exports` with product UI coverage. Step 11 moves the central guard to the Next.js 16 `src/proxy.ts` convention and applies nonce-bearing CSP to runtime responses. Step 12 authenticated production walkthrough confirms most protected pages load, but `/exports` and `/achievements` fail with production Server Components render errors until Neon production migrations are explicitly approved and applied; append-only user-state replay/merge remains blocked until a future explicit apply mode is approved and implemented. Step 13 UI alignment is implemented, validated and pushed as commit `81f4ce3`: the app shell now uses stronger window chrome, route-aware navigation, boxed sections, differentiated surfaces and fixed sidebar/terminal visual issues. Step 14 generation modes are implemented locally through 14.8, including Manual and DeepSeek generation through the same validation/preview/import pipeline. Step 15 is implemented, validated and pushed as commit `1d334d6`: first-run navigation is simpler, empty-catalog guidance is explicit, Pack activation comes before generation, lessons are theory-first and scoped product-area accents reduce the previous yellow dominance. Step 16 is implemented and checkpointed locally: `/import` now uses scoped mobile density rules for compact first activation controls without changing desktop density or touching production. Step 17 is implemented locally: imported lessons now expose compact `Aula / Conceitos / Prática` anchors and mobile practice panels are denser without changing RUN/SUBMIT behavior. Step 18 is implemented locally: Track detail and Progress now keep visible mobile continuation CTAs so the imported-catalog flow does not strand the learner after browsing progress or a track. Step 19 is implemented locally: the user-provided complete programming Track Pack validates against KNOW/OS, the import request ceiling now supports complete generated tracks up to 1 MiB, and the pack is imported in the running local memory server for study. Step 20 is implemented locally: the Impeccable audit findings were addressed for mobile secondary navigation, Track/Knowledge Map progressive disclosure and safe static imported activities without changing RUN/SUBMIT semantics. Step 21 is implemented locally: `/import` now asks for intent first, defaults to studying a ready Track Pack and hides Manual/DeepSeek generation until the user chooses `Criar aula com IA`. Step 22 hotfix is implemented locally: the code activity panel now tolerates failed/non-JSON RUN/SUBMIT responses without crashing the lesson page, normalizes omitted runtime `result` fields, and uses explicit pending action state for immediate feedback. Step 23 is implemented locally after dogfooding the JavaScript example lesson as a learner: lesson pages now expose a session-state callout, post-attempt activity panels show immediate next steps, and persisted terminal/tests/diff output collapses behind a technical summary so repeated study and mobile review are easier to scan without changing RUN/SUBMIT semantics.

## Agent operating mode

`HIGH AUTONOMY WITH REPOSITORY GUARDRAILS`

Codex may progress through approved V1 roadmap phases without routine user confirmation, provided each phase gate passes and no stop condition in `AUTONOMY.md` applies.

## Approved

- Product name: `KNOW/OS`.
- Technical identifier and repository: `know-os`.
- Positioning: Personal Learning Operating System.
- Design System v2.2 with official logo and icon assets.
- Modular-monolith direction.
- PostgreSQL + Drizzle persistence direction.
- Generic learning core with programming as the first extension.
- Portable Pack architecture.
- JavaScript Programming Lab with isolated execution.
- Append-only attempts and study events.
- Deterministic concept mastery.
- Single-user now, ownership-ready for future multi-user evolution.
- Guarded autonomous execution protocol in `AUTONOMY.md`.

## Implemented in Phase 0

- Pinned pnpm dependency graph in `package.json` and `pnpm-lock.yaml`.
- Next.js App Router application shell with official `public/branding` lockup, skip link, navigation placeholders, main landmark and status region.
- Generated design-token CSS at `src/styles/generated/design-tokens.css` from `design-system/design-tokens.json`.
- Planned modular-monolith source directories with boundary README files.
- Drizzle configuration, database connection helper, schema placeholder and safe `GET /api/health/db` endpoint.
- Zod server-environment validation that treats absent/blank optional URLs as not configured.
- Unit, integration, component and Playwright smoke tests.
- Baseline CI workflow plus separate Playwright workflow.

## Implemented in Phase 1

- Minimal content/user-state Drizzle schema and generated migration for the vertical slice.
- Zod Track Pack validation, semantic validation, deterministic hashing and idempotent/conflict-aware import service.
- Drizzle-backed import repository tested against a migrated PGlite database.
- Disposable `memory://local` repository harness for Playwright/UI validation when no PostgreSQL service is available.
- Imported track, lesson and activity browsing routes.
- QuickJS child-process JavaScript runtime adapter with timeout/output limits.
- RUN API that executes code without recording an Attempt.
- SUBMIT API that evaluates deterministic tests, records one immutable Attempt, writes test results, updates simple progress and emits an append-only StudyEvent.
- Activity panel with editable code, RUN, SUBMIT SOLUTION, terminal output and test results.
- History route showing submitted activity events.
- ADR 0011 for the initial QuickJS runtime decision.

## Implemented in Phase 2

- Concept detail route at `/concepts/[conceptId]`.
- Catalog repository concept read model with imported lesson/activity relationships.
- Lesson concept links to concept pages.
- Explicit placeholder copy separating current progress from future deterministic mastery/review.
- Drizzle/PGlite integration test and Playwright coverage for concept navigation.
- Allowlisted lesson block renderer registry for text, code, concept, note, warning, example, prediction and summary blocks.
- Safe invalid/unsupported block surfaces that do not execute arbitrary imported UI payloads.
- Typed activity registry for code activity config parsing and rendering.
- Persisted latest Attempt feedback read model with stdout/stderr and test results.
- Activity panel initializes from the latest persisted Attempt after page reload while preserving RUN versus SUBMIT SOLUTION semantics.
- Lesson and track progress summaries derived from append-only Attempt evidence.
- Progress UI explicitly separates navigation/completion from future deterministic concept mastery.

## Implemented in Phase 3

- JavaScript runtime contract metadata with runtime version, timeout/output limits and blocked capability expectations.
- Runtime tests covering stdout, stderr, runtime errors, timeout, output limits and blocked DOM/network/process/window access.
- Activity feedback UI that separates runtime status/contract metadata, STDOUT, STDERR and automated test summaries.
- Display-only source diff from immutable submitted Attempt source against starter code.
- Debug activity type registered through the activity registry and example Track Pack fixture.
- RUN/SUBMIT boundaries preserved for both code and debug activities.

## Implemented in Phase 4

- Append-only `concept_evidence` table and ADR 0012 for concept-scoped evidence.
- SUBMIT writes concept evidence in the same transaction as Attempt creation.
- Deterministic `mastery.v1` policy with explainable concept page output.
- `review_schedules` projection and `review.v1` interval policy.
- `/review` page plus review completion API/action that appends delayed-review evidence and `review_completed` StudyEvent.
- `mistakes` table, categorization rules, active/resolved state and `/mistakes` page.
- Deterministic Today recommendations ordered by due review, active mistake and catalog continuation.

## Implemented in Phase 5

- Optional `project_contexts` with joins to imported `concepts` and `activities`.
- `/projects` page that keeps project flow optional and reports linked concept/activity counts.
- Append-only `xp_transactions` ledger.
- First successful `SUBMIT SOLUTION` awards XP once per activity; `RUN` awards nothing and records no attempt.
- `/progress` page with total XP and transaction history.
- Deterministic rank, badge and mission read models displayed on `/achievements`.
- `/knowledge-map` page with a complete list-first fallback for imported concept relationships.
- Today recommendations include project application suggestions after review, mistake and catalog continuation priorities.

## Implemented in Step 7

- `badge_awards` table records earned badges once per owner with criteria snapshot and deterministic source.
- `mission_progress` table stores current mission status, completion timestamp and criteria snapshot.
- `mission_progress_events` appends mission status-change audit records.
- `/achievements` surfaces persisted badge/progress timestamps when available.
- Export snapshots include gamification projection data; restore V1 still skips gamification replay with the other user-state categories.

## Implemented in Step 8

- ADR 0016 defines the full user-state restore replay policy.
- Future restore now has explicit modes: current `pack_manifest_apply`, required `user_state_dry_run` and blocked future `user_state_apply`.
- Policy defines restore provenance ledger requirements, idempotency identity, append-only replay categories, projection rebuild rules, apply ordering and blocking conflicts.
- Import/export docs now state that attempts, XP, history, mistakes, reviews and gamification projections must not be replayed automatically by the V1 restore endpoint.

## Implemented in Step 9

- `restore_provenance` table foundation records source export fingerprint, source record identity, local record identity and payload hash for future idempotent replay.
- Shared canonical JSON hashing now supports both Track Pack content hashes and Backup fingerprints.
- Restore preview includes `know-os.user-state-restore-dry-run.v1` with category plans, blockers, warnings and `applyEnabled=false`.
- Unit coverage asserts stable Backup fingerprinting and blocked user-state replay planning.

## Implemented in Step 10

- `/exports` now includes a restore preview panel for Backup JSON.
- The panel posts to `/api/restore/preview` and displays the blocked `user_state_dry_run` summary, source fingerprint, category plans and blockers.
- No apply action exists for attempts, XP, history, mistakes, reviews or gamification projections.
- Component and contract coverage verify the UI readout and missing Pack manifest blocker behavior.

## Implemented in Step 11

- Central auth/session and runtime header guard now lives in `src/proxy.ts`, matching the Next.js 16 file convention for this `src/app` layout.
- Runtime responses receive a per-request CSP nonce and `x-nonce` request header for dynamic rendering.
- Production `script-src` no longer includes `unsafe-inline` or `unsafe-eval`; local development keeps `unsafe-eval` only for the Next.js dev server.
- Unit and Playwright coverage assert nonce-bearing CSP behavior and preserved Google OAuth origins.

## Step 12 production walkthrough

- Authenticated Chrome session reached the protected production app.
- `/`, `/tracks`, `/tracks/javascript`, `/lessons/js-fundamentals-001`, `/import`, `/progress` and `/knowledge-map` loaded without visible page errors.
- `/exports` and `/achievements` failed with production Server Components render errors.
- Production CSP readback confirms the live deployment is already serving nonce-bearing CSP from Step 11.
- Likely repair: apply checked-in migrations `0007_icy_vengeance.sql` and `0008_pale_shiver_man.sql` to Neon production with `pnpm db:migrate`.
- Stop condition: running production Neon migrations is an external database schema write and requires explicit user confirmation.

## Step 13 UI alignment

- Shared app chrome now uses the technical-brutalist window direction from the design references: signal topbar, bordered workspace frame, stronger sidebar and explicit main surface.
- Primary navigation is route-aware through `src/components/layout/primary-nav.tsx`, so the current route is highlighted instead of keeping `Fundação` active everywhere.
- Shared page primitives now create clearer hierarchy: foundation headers, boxed module sections, bordered record rows, differentiated progress/import/restore summaries and stronger auth status blocks.
- Playwright E2E harness now forces local no-OAuth mode with a disposable test secret so `.env.local` production OAuth values do not redirect local UI tests to sign-in.
- Local screenshots were captured under `test-results/ui-alignment/` for Today desktop, Import desktop, Lesson desktop and Progress mobile.
- Checkpoint and push: `81f4ce3 Align app UI with design system`.

## Step 14 generation modes and DeepSeek provider

- Step 14 introduces first-release generation with two modes: Manual Copy and Paste, and Direct AI Generation with DeepSeek.
- Both modes must share the same normalized `GenerationSpec`, prompt compiler, JSON parser, Pack validator, business validator, preview/diff and atomic importer.
- Implemented 14.0 orientation: generated output targets `caderno.lesson.v1`, but raw model/manual JSON cannot import until the shared validation/preview/import pipeline exists.
- Implemented 14.1 contracts/environment: `GenerationSpec`, full `GenerationStatus` vocabulary, provider request/result/error contracts, prompt compiler, raw JSON parser, `server-only` DeepSeek readiness config and env defaults.
- Implemented 14.2 persistence foundation: `generation_jobs` table, Drizzle and memory repositories, status timeline, compiled prompt/spec storage, provider usage storage and migration `0009_volatile_captain_britain.sql`.
- Implemented 14.3 Lesson Pack validation: `caderno.lesson.v1` parser, semantic validation, generated-output validation and malformed/Markdown blocking before preview or import.
- Implemented 14.4 Manual Copy/Paste flow on `/import`: Configure -> Compile Prompt -> Copy Prompt -> Paste AI JSON -> Validate -> Preview -> Import, with `waiting_external_response` job persistence and import through a reconstructed validated Track Pack boundary.
- Implemented 14.5 DeepSeek adapter: server-only provider, OpenAI-compatible JSON request, `response_format: { type: "json_object" }`, one retry for empty/transient/timeout responses, non-retry auth/balance/rate failures, `/api/generation/deepseek/generate` and shared generated-output validation before preview.
- Implemented 14.6 usage/cost estimates: versioned DeepSeek pricing config `deepseek-api-pricing-2026-07-31`, provider-side USD estimate from input/output/cache-hit usage, persisted `pricingVersion` metadata and a DeepSeek preview callout labeled as estimated cost.
- Implemented 14.7 failure recovery UI: failed DeepSeek generation preserves a Manual fallback prompt for the same `GenerationSpec`, exposes Retry, Switch to Manual, Copy Prompt and View Technical Details, and limits technical details to sanitized status/error metadata.
- Implemented 14.8 validation gate and provider abstraction completion: `ManualGenerationProvider` now wraps the manual compile path beside `DeepSeekGenerationProvider`, route tests cover valid and invalid DeepSeek generated JSON before preview/import, and the local validation gate has passed.
- Manual flow must be complete: Configure -> Compile Prompt -> Copy Prompt -> Paste AI JSON -> Validate -> Preview -> Import, preserving a persisted `GenerationJob` with `waiting_external_response`.
- DeepSeek flow must be visible even when unconfigured; absent `DEEPSEEK_API_KEY` shows `AI / DEEPSEEK` with `STATUS API NOT CONFIGURED`, disables direct generation only and allows switching to Manual without losing form data.
- Server env keys implemented: `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_DEFAULT_MODEL`, `DEEPSEEK_PRO_MODEL`; no `NEXT_PUBLIC_` secret exposure is allowed.
- Provider abstraction planned: `ManualGenerationProvider` and server-only `DeepSeekGenerationProvider`; app code must not import provider-specific API clients directly.
- DeepSeek model IDs are fixed by user instruction for this work: default `deepseek-v4-flash`, advanced `deepseek-v4-pro`; retired aliases `deepseek-chat` and `deepseek-reasoner` are prohibited.
- The implementation must add or confirm `caderno.lesson.v1` validation before importing generated output; raw model responses can never import directly.

## Step 15 first-run and visual routing

- Primary navigation is now reduced to the main study destinations: `Hoje`, `Aprender`, `Praticar`, `Progresso` and `Mais`; below desktop it uses a two-column grid instead of a clipped horizontal rail.
- Secondary routes remain reachable through `Mais`: import, history, mistakes, projects, knowledge map, exports and achievements.
- Empty-catalog surfaces now share a first-run callout that explains why study content is unavailable and routes the user to `/import` as the first activation path.
- `/import` presents existing Track Pack activation before lesson creation/generation, while Manual and DeepSeek generation remain available through the same validated preview/import path.
- Lesson pages now present theory first as `Aula`, then linked concepts as supporting understanding, then practice activities as evidence-generating work.
- Product-area accent roles are defined in design tokens/docs and applied as small bordered brutalist accents for import, learn, review, mistakes, progress and generation surfaces. Yellow remains the `signal` token for primary action/current/focus, not page decoration.
- `design-system/VISUAL_IDENTITY.md` now defines operational identity rules for the exact logo, lockup, clear space, minimum sizes, colors, typography, app usage and implementation checklist.
- Screenshot-backed responsive QA covered empty and imported states at 375, 390, 768 and 1440 px. The initial capture found clipped mobile navigation; the grid repair was captured again at 375 px for Today, Import, Tracks and Lesson.
- Focused component, full unit, full Playwright E2E, lint, typecheck, build and diff checks passed for the Step 15 increment, then it was checkpointed and pushed as `1d334d6`.

## Step 16 import mobile density polish

- `/import` mobile now reduces only import-surface panel gaps/padding, textarea minimum heights and action layout inside `.import-workspace`.
- First Pack activation controls stack into one-column full-width touch actions at 375 px, keeping the first-run activation path easier to scan on a phone.
- Lesson/practice activity editors and actions do not inherit these import-specific density rules.
- Playwright now verifies `/import` at 375 px for no horizontal overflow, compact Track Pack JSON input height and stacked first-step actions.
- Local validation passed with focused mobile import E2E, lint, typecheck, unit tests, full Playwright E2E and build. No deploy, production migration or push was performed for Step 16.

## Step 17 lesson mobile study flow polish

- Imported lesson pages now show a compact in-page `Fluxo da aula` navigation with anchors for `Aula`, `Conceitos` and `Prática`.
- Mobile practice panels now use tighter panel padding, a shorter code editor and stacked full-width RUN/SUBMIT controls, scoped to `.activity-panel`.
- RUN remains a non-attempt execution path and SUBMIT SOLUTION remains the official attempt path.
- Playwright now verifies the mobile lesson route at 375 px after importing the example Pack, including flow anchors, no horizontal overflow, compact code editor height and stacked practice actions.
- Local validation passed with focused mobile vertical-slice E2E, lint, typecheck, unit tests, full Playwright E2E and build. No deploy, production migration or push was performed for Step 17.

## Step 18 catalog and progress mobile continuity

- Imported Track detail pages now show a visible `Continuar pela primeira aula` CTA after the Track progress summary.
- `/progress` now shows a visible `Continuar estudando` CTA back to `/tracks`, so the summary screen has a clear path back into study.
- Continuation CTAs use scoped `.study-next-action` area-accent styling rather than expanding global yellow decoration.
- Playwright now verifies the mobile Track detail and Progress continuation path at 375 px, including no horizontal overflow on the Track page.
- Local validation passed with focused mobile vertical-slice E2E, lint, typecheck, unit tests, full Playwright E2E and build. No deploy, production migration or push was performed for Step 18.

## Step 19 complete generated Track Pack import

- `KNOW-OS-Trilha-Programacao-Completa-v1.zip` contains `content/programacao-aplicada-com-ia.track.json` plus manifest/readme/report artifacts.
- The Track Pack validates against the KNOW/OS TypeScript validator with `schema=caderno.track.v1`, `packId=know-os.programacao-aplicada-com-ia`, `version=1`, 10 modules, 58 lessons, 189 concepts and 174 activities.
- The raw JSON SHA-256 matches the manifest: `b5933c7bd79a3ec6b9be9a320f7262fcb03b6dade5f321a2fe6c005dd417f4a6`.
- The JSON is 309,936 bytes, which exposed that the previous 256 KiB request ceiling was too small for complete generated tracks.
- `MAX_TRACK_PACK_BYTES` is raised to 1 MiB while retaining the existing oversized-request rejection behavior.
- Local preview through `/api/import/track/preview` returned `ready`; local import through `/api/import/track` returned `imported` with 58 lessons and 174 activities.
- Study smoke passed on the running local server: `/tracks`, `/tracks/programacao-aplicada-com-ia` and `/lessons/js-foundations-001` all returned 200.

## Step 20 mobile study-flow distillation

- The Impeccable critique found four P1 UX issues; this increment addresses the navigation overload, large imported-catalog exposure and static imported activity trust break.
- `Mais` remains closed by default even on secondary routes, while secondary routes stay reachable and mobile secondary links meet the 44 px touch target.
- Track detail now keeps the continuation CTA first, expands only the first module by default and collapses the remaining imported modules behind native disclosure controls.
- Knowledge Map now starts with 12 focused concepts and places the full concept index inside a collapsed disclosure section.
- Imported `prediction` and `multiple-choice` activities now render as safe reading-check panels with choices, hints and expected answers where present instead of `ATIVIDADE INDISPONÍVEL`.
- Executable behavior remains scoped to `code` and `debug`: `RUN` still records no official attempt and `SUBMIT SOLUTION` remains the only attempt-writing path.
- Local validation passed with focused component coverage, lint, typecheck, full Vitest suite, build and a Playwright smoke against the live imported memory server. The normal owned-server Playwright command was not run to completion because stopping port 3211 would discard the imported `memory://local` study pack.

## Step 21 import intent flow

- `/import` now starts with a two-option intent selector: `Estudar trilha pronta` and `Criar aula com IA`.
- `Estudar trilha pronta` is selected by default and shows only the Track Pack activation flow: example/file/source, preview and apply.
- `Criar aula com IA` reveals the existing Manual/DeepSeek generation mode selector and panels without changing generation validation, preview or import APIs.
- Intent switching keeps the Manual/DeepSeek subtree mounted, preserving DeepSeek failure recovery and fallback-to-Manual state.
- Mobile smoke against the running `3211` memory server confirms generation controls are hidden on first view, appear after the creation intent and do not introduce horizontal overflow.
- The official owned-server Playwright command remains deferred while the local imported `memory://local` pack is preserved on port 3211.

## Step 22 activity RUN/SUBMIT resilience

- The code activity panel now handles HTTP errors, non-JSON responses and network failures from RUN/SUBMIT as visible terminal feedback instead of letting the lesson page crash.
- Runtime payloads whose JSON omits `result` after an `undefined` JavaScript result are normalized to `result: null` before updating the UI.
- RUN/SUBMIT action pending state is explicit, disables both buttons during the request and exposes `aria-busy` on the activity panel.
- Focused component coverage reproduces a non-JSON 500 response from RUN and verifies the page remains mounted.

## Step 23 dogfood study flow UX pass

- A no-OAuth memory-mode Playwright dogfood imported the bundled JavaScript example Pack, opened the JavaScript fundamentals lesson, read the theory/concept flow, ran and submitted code/debug activities, then visited Today, Tracks, Review, Mistakes, Progress, Achievements, Knowledge Map, Projects, History, Import and Exports.
- The main learner friction was not the learning model; it was scan load after attempts. Completed activities reloaded with terminal output, tests and diffs expanded, making the lesson feel slow and especially tall on mobile.
- Lesson pages now include a session-state callout that tells the learner whether to read, continue practice or review completed evidence, with direct links back into the active study flow.
- Activity panels now keep the latest attempt summary visible, add explicit post-attempt next-step links to Progress and History, and collapse persisted terminal/tests/diff output behind a compact technical summary. Fresh RUN/SUBMIT output still opens immediately so debugging remains direct.
- The dogfood run saw dev-mode first-route delays from Next.js compilation and repeated console CSP inline-style warnings without page errors. Treat these as follow-up observations; production performance should be judged from build/preview validation rather than first-load `next dev` timings.

## Implemented in Phase 6

- Track Pack import size limit, preview endpoint and content-hash conflict reporting.
- Explicit Backup, Progress and Teacher Context export contracts with category previews and privacy warnings.
- `/exports` portability surface.
- Backup restore preview and non-destructive Pack manifest application through `/api/restore/preview` and `/api/restore`.
- ADR 0014 documenting why append-only user-state replay/merge is not automatic in V1 restore.
- Accessibility and responsive audit documentation plus Playwright coverage for landmarks, headings, skip link and page overflow across implemented V1 routes.
- Baseline response security headers and Playwright header smoke coverage.
- Security audit and deployment preparation documents.
- ADR 0013 documenting the authentication/session stop condition before public deployment.

## Not implemented

Authenticated owner browser walkthrough/polish after service-level production validation, external sync, full user-state replay/merge restore and multi-Pack distribution/release workflow.

## Verification

Latest Step 15.0-15.5 first-run and visual-routing results:

```text
pnpm exec vitest run tests/component/app-shell.test.tsx tests/component/lesson-block-renderer.test.tsx — passed, 2 files and 4 tests.
pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/import-ui.spec.ts tests/e2e/vertical-slice.spec.ts --project=chromium — passed, 5 tests.
pnpm exec vitest run tests/component/app-shell.test.tsx tests/component/track-pack-importer-generation.test.tsx — passed, 2 files and 2 tests.
pnpm exec playwright test tests/e2e/import-ui.spec.ts tests/e2e/vertical-slice.spec.ts --project=chromium — passed, 3 tests.
pnpm generate:tokens — passed, generated 157 design tokens.
pnpm exec vitest run tests/unit/design-tokens.test.mjs tests/component/app-shell.test.tsx tests/component/track-pack-importer-generation.test.tsx tests/component/lesson-block-renderer.test.tsx — passed, 4 files and 6 tests.
pnpm lint — passed.
pnpm typecheck — passed.
pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/import-ui.spec.ts tests/e2e/accessibility.spec.ts --project=chromium — passed, 6 tests.
pnpm build — passed, generated 157 design tokens and built all implemented app/API routes.
pnpm test — passed, 41 files and 107 tests, plus 1 skipped real-Postgres file/test.
git diff --check — passed with LF/CRLF normalization warnings only.
Playwright screenshot QA — captured empty and imported Today, Import, Tracks and Lesson states at 375, 390, 768 and 1440 px under `test-results/step15-responsive`; no auth redirect and no global horizontal overflow, but initial mobile nav labels were clipped.
Playwright screenshot QA after nav repair — captured fixed 375 px Today, Import, Tracks and Lesson under `test-results/step15-responsive-after-nav`; primary nav labels are visible and `Mais` stays full-width.
pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/import-ui.spec.ts tests/e2e/accessibility.spec.ts --project=chromium --project=mobile-chrome — passed, 14 tests after mobile navigation grid and visual identity docs.
pnpm exec vitest run tests/unit/design-tokens.test.mjs tests/component/app-shell.test.tsx — passed, 2 files and 2 tests.
pnpm lint after mobile navigation grid and visual identity docs — passed.
pnpm typecheck after mobile navigation grid and visual identity docs — passed.
pnpm test for Step 15.7 — passed, 41 files and 107 tests, plus 1 skipped real-Postgres file/test.
pnpm test:e2e for Step 15.7 — passed, 24 tests across desktop Chromium and mobile Chrome.
pnpm build for Step 15.7 — passed, generated 157 design tokens and built all implemented app/API routes.
git diff --check for Step 15.7 — passed with LF/CRLF normalization warnings only.
```

Latest Step 14.0-14.2 generation foundation results:

```text
pnpm exec vitest run tests/unit/env.test.ts tests/unit/generation-contracts.test.ts — initially failed because `server-only` was not installed; added `server-only@0.0.1`.
pnpm exec vitest run tests/unit/env.test.ts tests/unit/generation-contracts.test.ts — passed, 2 files and 10 tests.
pnpm typecheck — passed.
pnpm lint — passed.
pnpm install --frozen-lockfile — passed, already up to date.
pnpm test after Step 14.1 — passed, 33 files and 84 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit — passed with no known production vulnerabilities.
pnpm build after Step 14.1 — passed.
git diff --check after Step 14.1 — passed.
pnpm db:generate — passed, generated `src/db/migrations/0009_volatile_captain_britain.sql`.
pnpm exec vitest run tests/integration/generation-job-repository.test.ts tests/unit/generation-contracts.test.ts tests/unit/env.test.ts — passed, 3 files and 12 tests.
pnpm exec vitest run tests/integration/generation-job-repository.test.ts — passed after memory repository global-store alignment, 1 file and 2 tests.
pnpm lint after Step 14.2 — passed.
pnpm test after Step 14.2 — passed, 34 files and 86 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit after Step 14.2 — passed with no known production vulnerabilities.
pnpm typecheck after Step 14.2 — passed.
pnpm build after Step 14.2 — passed.
git diff --check after Step 14.2 — passed.
pnpm exec vitest run tests/unit/lesson-pack-validation.test.ts tests/unit/track-pack-validation.test.ts tests/unit/track-import-service.test.ts tests/unit/generation-contracts.test.ts — initially failed after schema refactor because `stableId` was still referenced; fixed to `stableIdSchema`.
pnpm exec vitest run tests/unit/lesson-pack-validation.test.ts tests/unit/track-pack-validation.test.ts tests/unit/track-import-service.test.ts tests/unit/generation-contracts.test.ts — passed, 4 files and 18 tests.
pnpm typecheck after Step 14.3 — passed.
pnpm exec vitest run tests/unit/lesson-pack-validation.test.ts tests/unit/manual-generation-service.test.ts tests/unit/generation-contracts.test.ts tests/integration/generation-job-repository.test.ts — passed, 4 files and 16 tests.
pnpm typecheck after Step 14.4 routes/UI — passed.
pnpm lint after Step 14.4 UI — passed.
pnpm exec playwright test tests/e2e/import-ui.spec.ts --project=chromium — passed, 2 tests covering Track Pack import and manual generated Lesson Pack import.
pnpm test after Step 14.4 — passed, 36 files and 96 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit after Step 14.4 — passed with no known production vulnerabilities.
pnpm typecheck after Step 14.4 — passed.
pnpm build after Step 14.4 — passed.
pnpm test:e2e after Step 14.4 — initially failed because the single accessibility route sweep exceeded its 30s test timeout after the heavier `/import` generation surface; assertions had passed up to `/exports` page content. Increased only that test timeout to 60s.
pnpm test:e2e after accessibility timeout adjustment — passed, 22 tests across desktop Chromium and mobile Chrome.
pnpm exec vitest run tests/unit/deepseek-generation-provider.test.ts tests/unit/generation-contracts.test.ts tests/unit/manual-generation-service.test.ts tests/unit/lesson-pack-validation.test.ts after Step 14.5 — passed, 4 files and 18 tests.
pnpm typecheck after Step 14.5 — initially failed on Vitest mock call tuple inference; fixed test cast.
pnpm typecheck after Step 14.5 test typing fix — passed.
pnpm lint after Step 14.5 — passed.
pnpm exec playwright test tests/e2e/import-ui.spec.ts --project=chromium after Step 14.5 UI preservation — passed, 2 tests.
pnpm test after Step 14.5 — passed, 37 files and 100 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit after Step 14.5 — passed with no known production vulnerabilities.
pnpm build after Step 14.5 — passed and built `/api/generation/deepseek/generate`.
pnpm test:e2e after Step 14.5 — passed, 22 tests across desktop Chromium and mobile Chrome.
```

Latest Step 3.1 product import activation results:

```text
pnpm lint — passed.
pnpm typecheck — initially failed when run in parallel with `pnpm build` because `.next/types` was being regenerated; rerun after build passed.
pnpm exec playwright test tests/e2e/import-ui.spec.ts --project=chromium — passed, 1 test.
pnpm test — passed, 29 files and 72 tests.
pnpm build — passed.
pnpm test:e2e — passed, 20 tests across desktop Chromium and mobile Chrome profiles.
git diff --check — passed.
```

Latest Step 3.2 production import and vertical-slice results:

```text
pnpm dlx vercel@latest --prod --yes — passed, deployment `dpl_6DevBvMk8iDgmw1PBroFEHnaGwW8` ready and aliased to `https://know-os.vercel.app`.
production smoke `/api/health/db` — passed, 200 OK.
production smoke `/import` — passed, 307 redirect to `/auth/signin`.
production smoke `/tracks` — passed, 307 redirect to `/auth/signin`.
production smoke `/api/import/track/example` — passed, 401 Unauthorized.
production Track Pack import through application service — passed, imported `know-os.javascript-fundamentals` version `1`, `track=javascript`, `lessons=1`, `activities=2`.
production vertical-slice service validation — passed: catalog read `tracks=1`; RUN completed without recording an attempt; both activity submissions passed; lesson progress `2/2`; track progress `1/1`; study history has 2 submission events; exports expose `backup`, `progress`, `teacher_context`.
production progress readback script — passed, lesson progress `passed=2/2 attempted=2`, track progress `completedLessons=1/1 passed=2/2 attempted=2`.
```

Latest Step 4 real PostgreSQL validation results:

```text
pnpm exec vitest run tests/integration/real-postgres.test.ts — passed with 1 skipped file/test when the real-Postgres flag is absent; normal unit/integration suite does not access external PostgreSQL.
pnpm test:postgres — initially failed on Windows runner `spawn EINVAL`; fixed runner shell handling.
pnpm test:postgres — then failed on real PostgreSQL FK references from generated migrations qualifying `"public".*` while testing in a disposable schema; fixed the harness to rebind those FK references to the disposable schema at runtime.
pnpm test:postgres — passed, 1 test against configured real PostgreSQL URL from ignored local env; applied 7 migrations in `know_os_real_pg_*`, imported 1 track and 2 activities, verified RUN records 0 attempts, SUBMIT records 1 attempt and progress read models update.
pnpm typecheck — passed.
pnpm lint — passed.
pnpm test — passed, 29 files and 72 tests, plus 1 skipped real-Postgres file/test.
pnpm build — passed.
```

Latest Step 5 security publication hardening results:

```text
pnpm security:audit initial run — failed with 6 vulnerabilities: high `sharp`, high/moderate `postcss`, high `brace-expansion`, moderate `esbuild`.
npm view patched transitive versions — passed for `sharp@0.35.0`, `postcss@8.5.18`, `brace-expansion@1.1.16`, `brace-expansion@1.1.18`, `brace-expansion@5.0.8`, `esbuild@0.25.12`; `esbuild@0.24.3` does not exist.
pnpm install after overrides — passed; lockfile updated.
pnpm security:audit — passed with no known production vulnerabilities.
full `pnpm audit --audit-level moderate` — still reports dev-only `eslint -> minimatch@3 -> brace-expansion`; forcing `brace-expansion@5` breaks ESLint, so `brace-expansion@1.1.18` remains pinned and documented.
pnpm lint — passed.
pnpm test — passed, 29 files and 72 tests, plus 1 skipped real-Postgres file/test.
pnpm exec playwright test tests/e2e/security-headers.spec.ts --project=chromium — passed, 1 test with CSP assertions.
pnpm install --frozen-lockfile — passed, already up to date.
pnpm typecheck — passed.
pnpm build — passed.
```

Latest Step 6 Pack publication hardening results:

```text
node canonical hash check for `packs/examples/javascript-fundamentals.track.json` — passed, hash `d8af392872b0c41cc3dce30af0a896937986270ade1a1d5b62d924647d7a10c4`.
pnpm packs:verify — passed, `pack_catalog_validation:passed:packs=1`.
pnpm exec vitest run tests/unit/track-pack-validation.test.ts — passed, 1 file and 3 tests.
pnpm typecheck — passed.
pnpm lint — passed.
pnpm test — passed, 29 files and 73 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit — passed with no known production vulnerabilities.
pnpm build — passed.
```

Latest Step 7 gamification persistence results:

```text
pnpm db:generate — passed, generated `src/db/migrations/0007_icy_vengeance.sql`.
pnpm exec vitest run tests/integration/gamification-repository.test.ts tests/unit/gamification-rules.test.ts tests/unit/export-contracts.test.ts tests/unit/restore-contracts.test.ts — passed, 4 files and 8 tests.
pnpm lint — passed.
pnpm typecheck — passed.
pnpm test — passed, 30 files and 74 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit — passed with no known production vulnerabilities.
pnpm build — passed.
git diff --check — passed.
pnpm typecheck after restoring `next-env.d.ts` dev route reference — passed.
```

Latest Step 8 user-state restore policy results:

```text
pnpm lint — passed.
pnpm typecheck — passed.
git diff --check — passed.
```

Latest Step 12 authenticated production walkthrough results:

```text
Authenticated Chrome production walkthrough — protected session reached production home.
Loaded successfully: `/`, `/tracks`, `/tracks/javascript`, `/lessons/js-fundamentals-001`, `/import`, `/progress`, `/knowledge-map`.
Failed in production UI: `/exports` and `/achievements` showed Server Components render errors.
Production CSP readback for `https://know-os.vercel.app/` — passed, nonce-bearing CSP active with `script-src 'self' 'nonce-*' 'strict-dynamic'` and no production `unsafe-inline`/`unsafe-eval`.
git status --short --branch before Step 12 status update — clean at `main...origin/main`.
```

Latest Step 13 UI alignment results:

```text
pnpm lint — passed.
pnpm typecheck — passed.
pnpm test — passed, 32 files and 79 tests, plus 1 skipped real-Postgres file/test.
pnpm build — passed, generated 150 design tokens and built all implemented routes.
pnpm exec playwright test tests/e2e/accessibility.spec.ts tests/e2e/import-ui.spec.ts --project=chromium — initially failed because `.env.local` OAuth values forced local sign-in; fixed the Playwright harness and reran successfully, 3 tests passed.
Playwright screenshot capture — captured `test-results/ui-alignment/today-desktop.png`, `import-desktop.png`, `lesson-desktop.png` and `progress-mobile.png`; visual inspection found and fixed sidebar placeholder overflow and low-contrast terminal empty text.
pnpm test:e2e — first run failed because a leftover local Next dev server was still running on PID 63392; stopped it and reran successfully, 20 tests across desktop Chromium and mobile Chrome.
```

Latest Step 11 CSP nonce hardening results:

```text
pnpm exec vitest run tests/unit/security-headers.test.ts — passed, 1 file and 2 tests.
pnpm typecheck — passed.
pnpm lint — passed.
pnpm build — passed and confirmed `ƒ Proxy (Middleware)` is recognized only after moving the guard to `src/proxy.ts`.
pnpm exec playwright test tests/e2e/security-headers.spec.ts --project=chromium — initially failed because the CSP header was absent while the guard still lived in legacy `middleware.ts`; passed after moving to `src/proxy.ts`, 1 test.
pnpm security:audit — passed with no known production vulnerabilities.
pnpm test — passed, 32 files and 79 tests, plus 1 skipped real-Postgres file/test.
```

Latest Step 10 restore dry-run UI results:

```text
pnpm exec vitest run tests/component/restore-preview-panel.test.tsx tests/unit/restore-contracts.test.ts — initially failed because `userEvent.type` parsed raw JSON braces as keyboard descriptors; switched the test to `fireEvent.change`, rerun passed with 2 files and 6 tests.
pnpm lint — passed.
pnpm typecheck — passed.
pnpm test — passed, 31 files and 77 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit — passed with no known production vulnerabilities.
pnpm build — passed.
pnpm typecheck after restoring `next-env.d.ts` dev route reference — passed.
git diff --check — passed.
```

Latest Step 9 restore dry-run foundation results:

```text
pnpm db:generate — passed, generated `src/db/migrations/0008_pale_shiver_man.sql`.
pnpm exec vitest run tests/unit/restore-contracts.test.ts tests/unit/track-pack-validation.test.ts — passed, 2 files and 7 tests.
pnpm lint — passed.
pnpm typecheck — passed.
pnpm test — passed, 30 files and 75 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit — passed with no known production vulnerabilities.
pnpm build — passed.
pnpm typecheck after restoring `next-env.d.ts` dev route reference — passed.
git diff --check — passed.
```

Latest Step 2.9 motion pass results:

```text
pnpm lint — passed.
pnpm typecheck — passed.
pnpm exec playwright test tests/e2e/motion.spec.ts --project=chromium — passed, 2 tests.
pnpm build — passed.
pnpm exec playwright test tests/e2e/auth.spec.ts tests/e2e/accessibility.spec.ts --project=chromium — passed, 3 tests.
pnpm test — passed, 29 files and 72 tests.
pnpm test:e2e — passed, 18 tests across desktop Chromium and mobile Chrome profiles.
git diff --check — passed.
Playwright local screenshot smoke — captured `motion-signin.png` from the sign-in surface.
```

Latest Phase 0 gate results:

```text
pnpm install --frozen-lockfile — passed, already up to date.
pnpm lint — passed.
pnpm typecheck — passed.
pnpm test — passed, 3 files and 4 tests.
pnpm build — passed, generated 150 tokens and built `/`, `/_not-found`, `/api/health/db`.
pnpm exec playwright install chromium — passed.
pnpm test:e2e — passed, 4 tests across desktop Chromium and mobile Chrome profiles.
pnpm db:generate — passed, generated src/db/migrations/0000_small_vargas.sql for 14 tables.
pnpm test after Phase 1 import foundation — passed, 5 files and 9 tests.
pnpm build after Phase 1 import foundation — passed, built /api/import/track.
pnpm test after Phase 1 completion — passed, 8 files and 17 tests.
pnpm test:e2e after Phase 1 completion — passed, 6 tests including import to history vertical slice on desktop and mobile.
pnpm build after Phase 1 completion — passed, built activity RUN/SUBMIT APIs, import API, tracks, lessons and history.
pnpm test after Phase 2 concept increment — passed, 9 files and 18 tests.
pnpm test:e2e after Phase 2 concept increment — passed, 6 tests including concept navigation.
pnpm build after Phase 2 concept increment — passed, built /concepts/[conceptId].
pnpm test after Phase 2 block renderer increment — passed, 10 files and 21 tests.
pnpm test:e2e after Phase 2 block renderer increment — passed, 6 tests.
pnpm build after Phase 2 block renderer increment — passed.
pnpm lint after Phase 2 activity registry increment — passed.
pnpm typecheck after Phase 2 activity registry increment — passed.
pnpm test after Phase 2 activity registry increment — passed, 11 files and 24 tests.
pnpm test:e2e after Phase 2 activity registry increment — passed, 6 tests including persisted latest attempt feedback after reload.
pnpm build after Phase 2 activity registry increment — passed.
pnpm lint after Phase 2 progress increment — passed.
pnpm typecheck after Phase 2 progress increment — passed.
pnpm test after Phase 2 progress increment — passed, 13 files and 26 tests.
pnpm test:e2e after Phase 2 progress increment — passed, 6 tests including lesson and track progress UI.
pnpm build after Phase 2 progress increment — passed.
pnpm install --frozen-lockfile for Phase 2 gate — passed, already up to date.
pnpm lint for Phase 2 gate — passed.
pnpm typecheck for Phase 2 gate — passed.
pnpm test for Phase 2 gate — passed, 13 files and 26 tests.
pnpm build for Phase 2 gate — passed.
pnpm test:e2e for Phase 2 gate — passed, 6 tests.
git status --short --branch for Phase 2 checkpoint — failed because this checkout has no .git directory.
pnpm typecheck after Phase 3 runtime contract hardening — passed.
pnpm exec vitest run tests/unit/javascript-runtime.test.ts after Phase 3 runtime contract hardening — passed, 1 file and 7 tests.
pnpm lint after Phase 3 runtime contract hardening — passed.
pnpm test after Phase 3 runtime contract hardening — passed, 13 files and 30 tests.
pnpm build after Phase 3 runtime contract hardening — passed.
pnpm typecheck after Phase 3 terminal/test feedback UI — passed.
pnpm exec vitest run tests/component/activity-registry.test.tsx after Phase 3 terminal/test feedback UI — passed, 1 file and 2 tests.
pnpm lint after Phase 3 terminal/test feedback UI — passed.
pnpm test after Phase 3 terminal/test feedback UI — passed, 13 files and 30 tests.
pnpm build after Phase 3 terminal/test feedback UI — passed.
pnpm test:e2e after Phase 3 terminal/test feedback UI — passed, 6 tests.
pnpm typecheck after Phase 3 attempt diff read model/UI — passed.
pnpm exec vitest run tests/unit/source-diff.test.ts tests/component/activity-registry.test.tsx after Phase 3 attempt diff read model/UI — passed, 2 files and 4 tests.
pnpm lint after Phase 3 attempt diff read model/UI — passed.
pnpm test after Phase 3 attempt diff read model/UI — passed, 14 files and 32 tests.
pnpm build after Phase 3 attempt diff read model/UI — passed.
pnpm test:e2e after Phase 3 attempt diff read model/UI — passed, 6 tests including explicit diff assertions.
pnpm typecheck after Phase 3 debug activity registry path — passed.
pnpm test after Phase 3 debug activity registry path — passed, 14 files and 32 tests.
pnpm lint after Phase 3 debug activity registry path — passed.
pnpm build after Phase 3 debug activity registry path — passed.
pnpm test:e2e after Phase 3 debug activity registry path — passed, 6 tests including code and debug activity submissions.
pnpm install --frozen-lockfile for Phase 3 gate — passed, already up to date.
pnpm lint for Phase 3 gate — passed.
pnpm typecheck for Phase 3 gate — passed.
pnpm test for Phase 3 gate — passed, 14 files and 32 tests.
pnpm build for Phase 3 gate — passed.
pnpm test:e2e for Phase 3 gate — passed, 6 tests.
git status --short --branch for Phase 3 checkpoint — failed because this checkout has no .git directory.
pnpm db:generate after Phase 4 evidence model — passed, generated src/db/migrations/0001_wet_skin.sql.
pnpm test after Phase 4 evidence model — passed, 14 files and 32 tests.
pnpm test after Phase 4 mastery policy — passed, 15 files and 35 tests.
pnpm build after Phase 4 mastery policy — passed.
pnpm test:e2e after Phase 4 mastery policy — passed, 2 focused vertical-slice tests.
pnpm db:generate after Phase 4 review scheduling — passed, generated src/db/migrations/0002_oval_secret_warriors.sql.
pnpm test after Phase 4 review scheduling — passed, 17 files and 39 tests.
pnpm build after Phase 4 review scheduling — passed after marking /review dynamic.
pnpm test:e2e after Phase 4 review scheduling — passed, 6 tests.
pnpm db:generate after Phase 4 mistake categorization — passed, generated src/db/migrations/0003_classy_wrecker.sql.
pnpm test after Phase 4 mistake categorization — passed, 19 files and 43 tests after setting Vitest testTimeout to 10000 for migration-backed integration tests.
pnpm build after Phase 4 mistake categorization — passed.
pnpm test:e2e after Phase 4 mistake categorization — passed, 6 tests after stabilizing lesson route navigation.
pnpm test after Phase 4 recommendation rules — passed, 20 files and 45 tests.
pnpm build after Phase 4 recommendation rules — passed.
pnpm test:e2e after Phase 4 recommendation rules — passed, 6 tests after scoping the shell status assertion.
pnpm install --frozen-lockfile for Phase 4 gate — passed, already up to date.
pnpm lint for Phase 4 gate — passed.
pnpm typecheck for Phase 4 gate — passed.
pnpm test for Phase 4 gate — passed, 20 files and 45 tests.
pnpm build for Phase 4 gate — passed.
pnpm test:e2e for Phase 4 gate — passed, 6 tests.
git status --short --branch for Phase 4 checkpoint — failed because this checkout has no .git directory.
pnpm db:generate after Phase 5 project contexts — passed, generated src/db/migrations/0004_misty_wong.sql.
pnpm test after Phase 5 project contexts — passed, 21 files and 46 tests.
pnpm build after Phase 5 project contexts — passed.
pnpm test:e2e after Phase 5 project contexts — passed, 6 tests.
pnpm db:generate after Phase 5 XP ledger — passed, generated src/db/migrations/0005_greedy_dreadnoughts.sql.
pnpm test after Phase 5 XP ledger — passed, 21 files and 47 tests.
pnpm build after Phase 5 XP ledger — passed.
pnpm test:e2e after Phase 5 XP ledger — passed, 6 tests.
pnpm test after Phase 5 achievements — passed, 22 files and 49 tests.
pnpm build after Phase 5 achievements — passed.
pnpm test:e2e after Phase 5 achievements — passed, 6 tests.
pnpm test after Phase 5 knowledge map — passed, 22 files and 49 tests.
pnpm build after Phase 5 knowledge map — passed.
pnpm test:e2e after Phase 5 knowledge map — passed, 6 tests.
pnpm test after Phase 5 project-aware recommendations — passed, 22 files and 50 tests.
pnpm build after Phase 5 project-aware recommendations — passed.
pnpm test:e2e after Phase 5 project-aware recommendations — passed, 6 tests.
pnpm db:generate after Phase 5 project activity links — passed, generated src/db/migrations/0006_curved_deadpool.sql.
pnpm test after Phase 5 project activity links — passed, 22 files and 51 tests.
pnpm build after Phase 5 project activity links — passed.
pnpm test:e2e after Phase 5 project activity links — passed, 6 tests.
pnpm install --frozen-lockfile for Phase 5 gate — passed, already up to date.
pnpm lint for Phase 5 gate — passed.
pnpm typecheck for Phase 5 gate — passed.
pnpm test for Phase 5 gate — passed, 22 files and 51 tests.
pnpm build for Phase 5 gate — passed.
pnpm test:e2e for Phase 5 gate — passed, 6 tests.
git status --short --branch for Phase 5 checkpoint — failed because this checkout has no .git directory.
pnpm install --frozen-lockfile after Phase 6 import hardening — passed, already up to date.
pnpm test after Phase 6 import hardening — passed, 23 files and 55 tests.
pnpm build after Phase 6 import hardening — passed.
pnpm test:e2e after Phase 6 import hardening — passed, 6 tests.
pnpm test after Phase 6 export contracts — passed, 24 files and 57 tests.
pnpm build after Phase 6 export contracts — passed.
pnpm test:e2e after Phase 6 export contracts — passed, 6 tests.
pnpm test after Phase 6 restore application — passed, 25 files and 60 tests.
pnpm build after Phase 6 restore application — passed.
pnpm test:e2e after Phase 6 restore application — passed, 6 tests.
pnpm exec playwright test tests/e2e/accessibility.spec.ts — passed, 4 tests.
pnpm test:e2e after accessibility stabilization — passed, 10 tests using 1 worker.
pnpm exec playwright test tests/e2e/security-headers.spec.ts — passed, 2 tests.
pnpm install --frozen-lockfile for final V1 gate — passed, already up to date.
pnpm lint for final V1 gate — passed.
pnpm typecheck for final V1 gate — passed.
pnpm test for final V1 gate — passed, 25 files and 60 tests.
pnpm build for final V1 gate — passed, generated 150 design tokens and built all implemented routes.
pnpm test:e2e for final V1 gate — passed, 12 tests across desktop Chromium and mobile Chrome.
git status --short --branch for final checkpoint — failed because this checkout has no .git directory.
pnpm install --frozen-lockfile for Step 2 final gate — passed, already up to date.
pnpm lint for Step 2 final gate — passed.
pnpm typecheck for Step 2 final gate — passed.
pnpm test for Step 2 final gate — passed, 28 files and 70 tests.
pnpm build for Step 2 final gate — passed, generated 150 design tokens and built Auth.js route plus middleware/proxy.
pnpm test:e2e for Step 2 final gate — passed, 12 tests across desktop Chromium and mobile Chrome.
git push origin main for Step 2 — passed, pushed main from bc146fa to 7adf18e.
pnpm db:migrate against Neon Postgres — passed, migrations applied successfully.
pnpm build with `.env.local` production values — passed.
vercel link --yes --project know-os — passed, linked to `theusinshows-projects/know-os`.
vercel --prod --yes — passed, deployed and aliased production to `https://know-os.vercel.app`.
production smoke `/api/health/db` — passed, 200 OK.
production smoke `/` — passed, 307 redirect to `/api/auth/signin`.
production smoke `/api/export/preview` — passed, 401 unauthenticated.
production smoke `/api/auth/signin` — initially 400 until `AUTH_TRUST_HOST=true` was added; redeploy passed and endpoint returned 200 OK.
pnpm typecheck after custom sign-in and Google account-selection config — passed.
pnpm exec vitest run tests/unit/google-oauth.test.ts tests/unit/session-guard.test.ts — passed, 2 files and 5 tests.
pnpm exec playwright test tests/e2e/auth.spec.ts — passed, 2 tests across desktop Chromium and mobile Chrome.
pnpm lint for custom sign-in gate — passed.
pnpm typecheck for custom sign-in gate — passed.
pnpm test for custom sign-in gate — passed, 29 files and 72 tests.
pnpm build for custom sign-in gate — passed, `/auth/signin` built as a dynamic route.
pnpm test:e2e for custom sign-in gate — passed, 14 Playwright tests across desktop Chromium and mobile Chrome.
git commit -m "Add custom Google sign-in surface" — passed, commit `dc236a3`.
git push origin main — passed, pushed `dc236a3`.
vercel --prod --yes after custom sign-in — passed, deployment ready and aliased to `https://know-os.vercel.app`.
production smoke `/api/health/db` after custom sign-in — passed, 200 OK.
production smoke `/` after custom sign-in — passed, 307 redirect to `/auth/signin`.
production smoke `/auth/signin` after custom sign-in — passed, 200 OK.
production smoke `/api/export/preview` after custom sign-in — passed, 401 unauthenticated.
production Google OAuth redirect request after custom sign-in — passed, observed `accounts.google.com` request with `prompt=select_account`.
pnpm exec vitest run tests/unit/deepseek-generation-provider.test.ts tests/unit/generation-pricing.test.ts tests/integration/generation-job-repository.test.ts after Step 14.6 — passed, 3 files and 9 tests.
pnpm typecheck after Step 14.6 — passed.
pnpm lint after Step 14.6 — passed.
pnpm test after Step 14.6 — passed, 38 files and 103 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit after Step 14.6 — passed with no known production vulnerabilities.
pnpm build after Step 14.6 — passed and built `/api/generation/deepseek/generate`.
pnpm test:e2e after Step 14.6 — passed, 22 tests across desktop Chromium and mobile Chrome.
git diff --check after Step 14.6 — passed with LF/CRLF normalization warnings only.
pnpm exec vitest run tests/component/track-pack-importer-generation.test.tsx tests/unit/deepseek-generation-provider.test.ts after Step 14.7 — initially failed on a component test matcher; fixed to inspect the textarea value directly.
pnpm exec vitest run tests/component/track-pack-importer-generation.test.tsx tests/unit/deepseek-generation-provider.test.ts after Step 14.7 matcher fix — passed, 2 files and 5 tests.
pnpm typecheck after Step 14.7 — initially failed on a stale `failure` condition in Manual error rendering; fixed the Manual and DeepSeek alert conditions.
pnpm lint after Step 14.7 — initially failed because recovery state was synchronized via `useEffect`; replaced it with keyed Manual remount and state initializers.
pnpm typecheck after Step 14.7 fixes — passed.
pnpm lint after Step 14.7 fixes — passed.
pnpm test after Step 14.7 — passed, 39 files and 104 tests, plus 1 skipped real-Postgres file/test.
pnpm security:audit after Step 14.7 — passed with no known production vulnerabilities.
pnpm build after Step 14.7 — passed and built `/api/generation/deepseek/generate` plus `/api/generation/manual/compile`.
pnpm test:e2e after Step 14.7 — passed, 22 tests across desktop Chromium and mobile Chrome.
pnpm exec vitest run tests/unit/deepseek-generation-route.test.ts tests/unit/manual-generation-provider.test.ts tests/component/track-pack-importer-generation.test.tsx after provider abstraction and route tests — initially failed because the mocked DeepSeek provider was not constructable; fixed the mock constructor.
pnpm exec vitest run tests/unit/deepseek-generation-route.test.ts tests/unit/manual-generation-provider.test.ts tests/component/track-pack-importer-generation.test.tsx after mock fix — passed, 3 files and 4 tests.
pnpm exec vitest run tests/unit/manual-generation-provider.test.ts tests/component/track-pack-importer-generation.test.tsx tests/unit/deepseek-generation-provider.test.ts tests/unit/generation-contracts.test.ts after ManualGenerationProvider — passed, 4 files and 10 tests.
pnpm typecheck after final Step 14 tests — passed.
pnpm lint after final Step 14 tests — passed.
pnpm test after final Step 14 tests — passed, 41 files and 107 tests, plus 1 skipped real-Postgres file/test.
git diff --check after final Step 14 docs — passed with LF/CRLF normalization warnings only.
```

```text
pnpm exec vitest run tests/component/code-activity-panel.test.tsx tests/component/activity-registry.test.tsx after Step 22 — passed, 2 files and 4 tests.
pnpm typecheck after Step 22 — passed.
pnpm lint after Step 22 — passed.
pnpm exec playwright test tests/e2e/vertical-slice.spec.ts --project=chromium after Step 22 — passed, 3 tests including RUN, SUBMIT, reload and history.
pnpm test after Step 22 — passed, 42 files and 110 tests, plus 1 skipped real-Postgres file/test.
pnpm build after Step 22 — passed, generated 157 design tokens and built all implemented app/API routes.
git diff --check after Step 22 — passed with LF/CRLF normalization warnings only.
pnpm typecheck after Step 23 — passed.
pnpm lint after Step 23 — passed.
pnpm exec vitest run tests/component/code-activity-panel.test.tsx tests/component/activity-registry.test.tsx after Step 23 — passed, 2 files and 5 tests.
pnpm exec playwright test tests/e2e/vertical-slice.spec.ts --project=chromium after Step 23 — passed, 3 tests including collapsed persisted details and completed lesson session state.
pnpm test after Step 23 — passed, 42 files and 111 tests, plus 1 skipped real-Postgres file/test.
pnpm build after Step 23 — passed, generated 157 design tokens and built all implemented app/API routes.
pnpm test:e2e after Step 23 — first attempt failed before completion because stale local `next dev` PID 48384 on port 3224 blocked Playwright's owned server; after `Stop-Process -Id 48384 -Force`, rerun passed, 32 tests across desktop Chromium and mobile Chrome.
git diff --check after Step 23 — passed with LF/CRLF normalization warnings only.
Local no-OAuth `memory://local` review server after Step 23 — running at `http://127.0.0.1:3211` with launcher PID 35308 and listener PID 40540; imported `packs/examples/javascript-fundamentals.track.json`; `/tracks/javascript` and `/lessons/js-fundamentals-001` return 200.
```

Do not run `pnpm typecheck` concurrently with `pnpm build`; Next mutates generated `.next` types during build.

## Next milestone

Step 23 is ready for local review on `http://127.0.0.1:3211/lessons/js-fundamentals-001` while listener PID 40540 stays alive. The bundled JavaScript example Pack is imported there; reimport the desired complete programming Track Pack if needed because imported content only survives while that exact dev server process stays alive. Do not push, deploy or apply production Neon migrations without explicit confirmation.

## Risk register

- Browser code execution is isolated through the current QuickJS child-process adapter, but any broader runtime support needs a fresh threat review.
- Pack versioning must be finalized before public content distribution.
- Production authentication is configured for Google OAuth with e-mail allowlist; protected redirects and service-level production flow are validated, while authenticated browser walkthrough remains user-session dependent.
- Gamification must not distort mastery or reward empty activity.
- High autonomy must remain bounded to the repository and approved V1 scope.
- Local checkpoint commits are now available after Git initialization. External push still requires user confirmation.
- Playwright uses port `3210`; port `3000` was already serving another local app during validation.
- No real local PostgreSQL service is available outside `.env.local`; `pnpm test:postgres` validates the configured PostgreSQL service through a disposable schema and destructive production database operations remain out of scope.
- Production Neon schema appears behind checked-in migrations after Steps 7 and 9; `/exports` and `/achievements` fail until migrations are explicitly approved and applied.
- Step 14 must not request, print, persist or expose `DEEPSEEK_API_KEY`; use `UNCONFIGURED` locally until the user adds the key to ignored server environment.
- Local migration `0009_volatile_captain_britain.sql` is generated for generation job persistence. Do not apply it to production Neon without explicit confirmation.
- Step 15.0 through 15.7 are implemented, validated and pushed as `1d334d6`; deploy validation remains user-session dependent.
- Step 16 import mobile density polish is implemented, validated locally and checkpointed. Push/deploy remain separate approval boundaries.
- Step 17 lesson mobile study-flow polish is implemented and validated locally. Push/deploy remain separate approval boundaries.
- Step 18 catalog/progress mobile continuation polish is implemented and validated locally. Push/deploy remain separate approval boundaries.
- Step 19 complete generated Track Pack validation/import is implemented and validated locally. Push/deploy remain separate approval boundaries.
- Step 20 mobile study-flow distillation is implemented and validated locally.
- Step 21 import intent flow is implemented and validated locally.
- Step 22 activity RUN/SUBMIT resilience is implemented and validated locally. The previous `memory://local` process on port 3211 was no longer running during diagnosis, so the complete Track Pack imported there must be imported again for live study.
- Step 23 dogfood study-flow UX pass is implemented and validated locally. Dev-mode route delays and CSP inline-style console warnings were observed without page errors and remain follow-up observations.
- Playwright uses `memory://local` because PGlite works for Vitest/Drizzle integration but cannot be bundled reliably inside the Next dev server.
- Backup restore applies Pack manifests only in V1. User-state replay/merge is intentionally blocked by ADR 0014 until a conflict-safe append-only restore policy exists.
- Full dev dependency audit has one residual `eslint -> minimatch@3 -> brace-expansion` advisory path; production dependency audit is clean and the compatible dev pin is documented until the ESLint/minimatch path can move safely.

## NEXT ACTION

Review Step 23 on `http://127.0.0.1:3211/lessons/js-fundamentals-001` while listener PID 40540 stays alive. The bundled JavaScript example Pack is already imported in that `memory://local` process; persistent database import, push, deploy and production migrations remain separate approval boundaries.

Active IFSC update: IFSC-03 focused gate passed. IFSC-04 is in progress; interaction checks are currently formative, so the first student slice is not yet complete.

Active IFSC update: the percentage slice, v2 learning policies and persistent sessions passed focused functional checks, including mobile E2E. AI-authored seed content is draft and requires independent QA before student publication. IFSC-07 planner is in progress.

Active IFSC update: deterministic planner policy is connected to both adapters and passed focused checks. IFSC-08 remaining Golden Lessons is active. All generated content is still draft pending independent QA.

Active IFSC update: all four Golden draft fixtures validate/render/evaluate. Official edital was checked directly. IFSC-09 unified assessment engine is active; publication still requires independent QA.

Active IFSC update: unified assessment engine passed migrated integration, types and lint. IFSC-10 official bank preservation is active. Content QA, complete curriculum and final integrated checks remain pending.

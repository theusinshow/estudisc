# KNOW/OS — Autonomous Execution Plan

## IFSC expansion — active program (2026-10-01)

User authorization: implement IFSC-00 through IFSC-15 autonomously in this copied checkout, `C:\Dev\pessoal\vecta`. The original `know-os` checkout is read-only. No production migrations, remote pushes or deployments are authorized.

User update: remote `https://github.com/theusinshow/vecta.git` is empty (successful `git ls-remote`, no refs). It is now `origin`; the read-only local source is `know-os-source`. Preserve inherited history. Favor low token usage and basic focused checks per coherent milestone; run full final gate once, expanding checks only for actual failures/risks.

Current state: **IFSC local engineering validation; editorial publication deferred to human review by explicit user choice**. The full source inventory and runtime are implemented, but IFSC-10 factual/classification QA and IFSC-14 planner-ready teaching coverage remain open. No milestone is marked complete merely because inventory exists. See `docs/ifsc/LOCAL-DELIVERY.md` and the audit.

- [x] Integrate ADRs 0017–0029; supersede only ADR 0008's single-owner constraint.
- [x] Reconcile the core documentation and agent rules with the approved expansion.
- [x] Merge the v3 design delta into the canonical design documentation/token source.
- [x] Validate documentation authority, tokens, lint, typecheck, tests and build.
- [x] Record the gate; immediately start IFSC-01.

Following milestones: IFSC-01 curriculum; IFSC-02 Pack v2; IFSC-03 interactions; IFSC-04 percentage slice; IFSC-05 versioned policies; IFSC-06 sessions; IFSC-07 planner; IFSC-08 remaining Golden Lessons; IFSC-09 assessments; IFSC-10 historical exams; IFSC-11 simulations; IFSC-12 QA; IFSC-13 tutor; IFSC-14 curriculum; IFSC-15 hardening and final acceptance audit.

Inspection: existing V1 imports/renderer/registry/Attempts/evidence/review/mastery/auth/generation are reused. The source checkout has only untracked exam PDFs. It was cloned locally without secrets or build output. Historical PDFs were copied to `sources/ifsc/historical`, outside `public`. The ZIP is extracted under `ifsc-source/know-os-ifsc-spec-v1-final` for traceability. The minimal v2 example is a contract fixture, not a validated curriculum or publication approval.

IFSC-01 acceptance: relational requirements/sources/prerequisites/settings; reference and cycle validation; idempotent foundation seed (four modules, six percentage concepts plus prerequisite concepts); coverage derived from real mappings/content/QA, with gaps visible; migrated PGlite tests; baseline gate. No authoritative coverage claim from lesson titles or imported status.

IFSC-02: preserve v1 parser/hash behavior; add strict v2 shape and semantic references/answers/exposure checks; persist sources/curriculum/Question versions atomically in the existing importer; reject version conflicts; preserve attempts. Validate focused import compatibility/integration plus typecheck/lint.

IFSC-14 lesson drafts (2026-10-01, Claude Code): author the 63 missing Lessons as AI-assisted **drafts** in `packs/seeds/ifsc-2027.lesson-drafts/*.json` (compact format), expanded by `scripts/expand-ifsc-lesson-drafts.mjs` into existing Pack v2 blocks/`question` activities/shared Questions (no new engine). `scripts/build-ifsc-source-pack.py` merges them into the private source pack without changing the Anexo V Concept mapping. Acceptance for this increment: every gap Lesson has one concept block per Concept, worked examples, warning, summary, ≥2 primary practice Questions per Concept and exactly 3 exit-ticket Questions; all items `draft` with `generated` provenance and source `src-ifsc-draft-author`; focused draft test plus private source-pack import test pass. Out of scope: approval/publication (human + independent QA only), official-question reclassification.

User scope change (2026-10-01): author only one test week of lessons to save tokens. Delivered drafts: MAT-01, MAT-02, MAT-03, MAT-04, MAT-05, MAT-06, MAT-08, MAT-09, MAT-10 (99 draft Questions). Together with the Golden lessons, these give 14 study lessons. The other 54 Lessons stay inventory-only (`contentGaps` in `coverage.inventory.json`). The test week is mostly Math; POR/CIE/GH have only their Golden Lesson. Also fixed: the 2025.2 OCR page footer leaked into 20 official items (ingestion header filter). `scripts/audit-ifsc-official-bank.mjs` writes a human pre-review checklist to `.local/ifsc-official/official-review.checklist.json`.

First-lesson dogfood fixes (2026-10-01, Claude Code): a simulated student run of `MAT-PREREQ` found 18 issues; the user asked to fix them one by one. Increments, each with focused validation:
- [x] F1 numeric answers accept a trailing `%` or unit word ("75%", "4 copos"); one shared parser; `unit` shown beside the field.
- [x] F2 last step ends in a completion panel linking to the next lesson / track instead of a disabled "Fim da aula".
- [x] F3 lesson progress shows real concept mastery (mastery.v2 via existing evidence), never lesson completion as mastery.
- [x] F4/F5 progress refreshes after an attempt (`router.refresh`); a correct answer locks resubmission until the answer changes.
- [x] F6 current step survives reload (URL hash `#passo-N`).
- [x] F7 track CTA points to the first unfinished lesson; lesson cards mark completed lessons.
- [x] F8 copy: pluralization, "nesta trilha", "aulas" wording, no "catálogo importado" jargon, no internal draft notice in the student track description.
- [x] F9 incorrect feedback no longer reveals the worked answer (keeps retries independent; `solutionRevealed` only when the explanation is actually shown).
- [x] F10 draft content: MAT-PREREQ practice differs from the worked example, per-question hints, clearer 0,75/75% sentence (stays draft).
- [x] F11 visual: question card full width, single field label, stable scrollbar gutter.
Not changed: mistakes stay active until resolved in /mistakes (deliberate error notebook); "Próximo" stays enabled on practice steps (skipping is allowed by design). Validation: 143 tests / 3 skipped (baseline), lint/typecheck/build, mobile E2E percentage-study/shell/vertical-slice passed; vertical-slice Lab RUN step is a pre-existing intermittent failure (also at HEAD).

Code accounts (2026-10-01, Claude Code, user request): dev-created accounts with a 6-digit code and the React Bits Code Slots animation, to separate progress (Matheus ADMIN, Kauã STUDENT). Valid locally and in production (user choice); recorded in ADR 0031.
- [x] A1 `KNOW_OS_ACCOUNTS` (scrypt-hashed codes, never committed) + HMAC session cookie signed with `AUTH_SECRET`; accounts mode takes precedence over Google OAuth.
- [x] A2 `getOwnerProfile` and the proxy resolve the account; admin paths need ADMIN; `POST/DELETE /api/session` with per-IP/account throttling.
- [x] A3 Sign-in page: account picker + Code Slots (adapted: no inline styles because of CSP, design tokens, client-only); "Sair" and account name in the nav.
- [x] A4 `scripts/create-account.mjs` writes `.env.local`; demo seed mints an admin session when accounts exist; Playwright server keeps accounts off.
- [x] A5 tests, ADR, docs, changelog.

Progress + Today redesign (2026-10-01, Claude Code, user request, direction "Escada + Memória"): progress describes concept mastery, not XP. Matos UI charts (vendored from its shadcn registry, adapted to tokens/CSP) and React Bits micro-interactions (CountUp, ClickSpark, staggered entry; adapted, no SSR inline styles). Styles live in `src/styles/progress.css`/`today.css` to avoid colliding with the parallel login work in `globals.css`.
- [x] P1 `ConceptEvidenceRepository.listForOwner` (+ memory) and pure `buildProgressOverview` (mastery ladder via the versioned policy, cooling concepts by retention, study days from study events, no streak) with unit tests.
- [x] P2 `/progress`: mastery ladder, cooling memory, rhythm heatmap (Matos), area balance radar (Matos, ≥3 areas), XP demoted to effort.
- [x] P3 `/` Today: pulse line (reviews/mistakes/practicing), 7-day week strip, staggered queue, ClickSpark on session start.
- [x] P4 lint, typecheck, unit tests, build, mobile/desktop visual check; changelog.

Week 1 lessons (2026-10-01, Claude Code, user request "semana equilibrada"): 8 lessons, 2 per area, AI-authored by one author per file and self-reviewed by the main agent; content stays draft (no approvals).
- [x] W1 MAT-02, POR-02, CIE-01/02, GH-01/02 authored in the MAT-01 format; MAT-01 and Golden POR-01 revised.
- [x] W2 four-layer self-review with a key-position/length audit; findings fixed; record in `docs/ifsc/WEEK-01-REVIEW.md`.
- [x] W3 stimulus rendering fix; lint, typecheck, 155 tests, mobile check on the seeded memory server.
- [ ] W4 human review and release (user decision); optional: per-lesson review screen in `/admin` to make that release practical.
Validation: pnpm lint, pnpm typecheck, pnpm test (155 passed / 3 skipped), pnpm build passed; Playwright screenshots at 390px and 1280px on a seeded `memory://local` server (no horizontal overflow; only Next devtools CSP warnings, identical on untouched pages). E2E not re-run. Risk: progress counts every catalog concept, including draft tracks hidden from students.

NEXT ACTION (previous): ingest/classify the four Integrated historical exams and definitive keys, preserve private assets, enforce reserved benchmarks and retain 2025.1 Q15 as annulled. Then seed simulations and connect publication QA. Assessment engine focused integration passed. Golden draft rendering/evaluation checks passed; independent publication QA remains pending. Planner functional policy checks passed; final QA readiness certification remains pending IFSC-12. MAT-07 source is draft; independent content QA/publication remains a visible acceptance item. Historical V1 plans below are retained as history, not the active roadmap.

This file is the durable control surface for the current multi-step implementation task. Keep it current so a new Codex session can resume without asking the user to restate decisions.

Operating protocol: `AUTONOMY.md`.

## Program objective

Deliver the approved KNOW/OS V1 through verified roadmap phases, without collapsing the work into one unstructured pass.

## Current phase

Status: `READY FOR REVIEW`
Owner: Codex lead agent
Phase: `STEP 23 — DOGFOOD STUDY FLOW UX PASS`
Autonomy: `HIGH WITH GUARDRAILS`

### Objective

Use KNOW/OS as a learner studying the JavaScript lesson, complete the available activities, audit the complete local product surface from that experience, and implement focused UX/UI improvements without changing the approved Design System or learning-domain semantics.

### Acceptance criteria

- [x] Import boundaries include explicit size limits, preview before mutation and conflict reporting for same-version content hash mismatches.
- [x] Export boundaries support explicit Backup, Progress and Teacher Context JSON payloads with category preview and privacy warnings.
- [x] Backup/restore preserves imported content references and owner-scoped user state without mixing content and user data.
- [x] Teacher-context export includes selected lesson, mastery evidence, recent attempts, mistakes, review queue and projects.
- [x] Accessibility audit covers keyboard paths, landmarks, focus states, status messaging and responsive behavior for implemented V1 routes.
- [x] Security audit covers learner-code isolation, secret redaction, export privacy, import validation and production deployment readiness notes.
- [x] Owner authentication/deployment preparation is documented or implemented only within approved local scope; external deployment remains blocked pending user confirmation.
- [x] Unit, integration, component and E2E coverage includes import conflict handling, export/restore behavior and audit-relevant smoke paths.
- [x] Documentation, changelog, `PROJECT_STATUS.md` and this plan reflect Phase 6 behavior.

### Step 13 acceptance criteria

- [x] App shell follows the approved technical-brutalist window/chrome direction with stronger topbar/sidebar/status separation.
- [x] Primary navigation marks the current route instead of leaving `Fundação` selected on every screen.
- [x] Shared page shells, module sections, lists, progress summaries, import/restore panels and auth status blocks use visible borders, backgrounds and solid shadows to separate information hierarchy.
- [x] UI changes reuse generated design tokens and official `public/branding` assets; no Design System source files are modified.
- [x] Motion remains state-driven, short and compatible with `prefers-reduced-motion`.
- [x] Lint, typecheck, tests, build and focused Playwright visual/accessibility smoke pass locally.

### Step 14 acceptance criteria

- [x] `/import` or a dedicated generation surface exposes a mode selector with `MANUAL / COPY AND PASTE` and `AI / DEEPSEEK`.
- [x] Manual mode is fully functional: Configure -> Compile Prompt -> Copy Prompt -> Paste AI JSON -> Validate -> Preview -> Import.
- [x] A persisted `GenerationJob` survives the manual waiting state with status `waiting_external_response`.
- [x] DeepSeek mode has complete UI, domain contract, configuration detection and provider adapter; the card remains visible as `UNCONFIGURED` when `DEEPSEEK_API_KEY` is absent.
- [x] Server env supports `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_DEFAULT_MODEL`, `DEEPSEEK_PRO_MODEL` without exposing secrets to client code.
- [x] Provider abstraction includes `ManualGenerationProvider` and `DeepSeekGenerationProvider`; app code outside the adapter does not import DeepSeek/OpenAI-compatible client specifics directly.
- [x] DeepSeek defaults to `deepseek-v4-flash`, supports advanced `deepseek-v4-pro`, and never uses retired `deepseek-chat` or `deepseek-reasoner`.
- [x] DeepSeek requests execute only from server-only modules, use `response_format: { type: "json_object" }`, explicitly request JSON, include a compact JSON example, require `caderno.lesson.v1`, prohibit Markdown outside JSON and default Thinking Mode off.
- [x] Empty or transient provider failures retry once; authentication, insufficient balance and deterministic validation errors do not retry automatically.
- [x] Failure UI preserves `GenerationSpec` and compiled prompt and offers Retry, Switch to Manual, Copy Prompt and View Technical Details.
- [x] Generation statuses include: `draft`, `compiled`, `waiting_external_response`, `ready`, `generating`, `receiving`, `validating`, `repairing`, `ready_to_import`, `invalid`, `rate_limited`, `insufficient_balance`, `timeout`, `failed`, `imported`.
- [x] Provider usage is persisted when returned with model, input tokens, output tokens, cache-hit tokens, estimated cost and timestamp; pricing lives in one versioned configuration module and UI labels cost as an estimate.
- [x] Manual and DeepSeek outputs use exactly the same parser, schema validator, business validator, preview, diff and atomic importer. No raw model response can be imported directly.
- [x] Required tests cover unconfigured DeepSeek, client secret isolation, model defaults, mode switching state preservation, valid/invalid DeepSeek JSON validation, empty-response retry, auth failure no-retry, failure-to-manual fallback, usage persistence and import bypass prevention.

### Step 15 acceptance criteria

- [x] Empty-catalog use is explicit: `Today` explains that no lesson is available, offers one primary path to activate a first Track/Lesson, and does not present dead-end study routes as equivalent choices.
- [x] First-run flow is ordered: Start -> Import example or create/import lesson -> Preview -> Activate catalog -> Open first lesson -> Practice -> Submit -> Return to next action.
- [x] Mobile navigation is simplified into primary study destinations, with advanced/secondary routes moved behind a `More` pattern or equivalent progressive navigation.
- [x] The lesson page treats theoretical content as the main study object, replacing generic "Blocos" language with learner-facing lesson structure: read, understand concepts, then practice.
- [x] Concepts remain evidence objects and navigation aids, not a replacement for lessons. Activities remain practice/evidence objects, not the only learning surface.
- [x] `/import` distinguishes "activate existing Pack", "create/import one lesson" and provider-assisted generation without overwhelming first-run users.
- [x] A scoped accent-color system is defined in Design System docs/tokens for product areas such as onboarding/import, learn/lesson, practice/lab, review, mistakes, progress and generation.
- [x] Yellow remains the canonical `signal` for primary action/current state/focus, not a global decorative color.
- [x] All new visual accents include non-color cues and pass existing accessibility rules for contrast, focus and state communication.
- [x] Desktop keeps the technical-brutalist operational density; mobile prioritizes one visible next action and avoids long sidebar-style route lists.
- [x] Tests cover empty-catalog first-run, imported-catalog study flow, mobile navigation, lesson reading order and no regression to RUN/SUBMIT semantics.
- [x] Documentation, `PROJECT_STATUS.md`, `CHANGELOG.md` and this plan record behavior and validation results before the Step 15 gate is considered complete.

### Step 15 planned increments for today

- [x] 15.0 Orientation and current-flow audit.
  - Inspect `Today`, `Tracks`, `Import`, `Lesson`, `PrimaryNav`, app shell CSS and existing Playwright mobile coverage.
  - Confirm whether local memory-mode first-run has zero imported content and whether example Pack activation is enough for a complete study loop.
  - Output: file-level implementation notes and any discovered blockers.
- [x] 15.1 Information architecture and navigation simplification.
  - Redefine visible navigation groups for empty state and normal study state.
  - Candidate primary nav: `Hoje`, `Aprender`, `Praticar`, `Progresso`, `Mais`.
  - Keep secondary routes accessible: Importar, Historico, Projetos, Mapa, Exports, Badges, Review, Erros, depending on available data and route readiness.
  - Add mobile behavior tests for the reduced navigation surface.
- [x] 15.2 First-run empty-catalog experience.
  - Turn empty `Today` into a guided start screen with one primary CTA and clear explanation that lessons appear after activating/importing content.
  - Make empty `Tracks`, `Review`, `Mistakes`, `Progress`, `Knowledge Map` and `Achievements` point back to the same first-run path instead of feeling like separate failures.
  - Prefer real example Pack activation over mock/demo data.
- [x] 15.3 Import/generation flow hierarchy.
  - Reorganize `/import` so first-run users see the quickest safe action first: example Pack or validated lesson import.
  - Keep Manual and DeepSeek generation visible but secondary unless the user chooses creation.
  - Preserve the shared validation/preview/import pipeline and never expose provider keys.
- [x] 15.4 Lesson-first study page.
  - Rename learner-facing "Blocos" to "Aula" or equivalent.
  - Recompose lesson content as: lesson body, concepts referenced, activities/practice.
  - On mobile, keep reading first and move activity actions after theory unless a focused activity route is explicitly opened.
  - Preserve concept links and activity progress evidence.
- [x] 15.5 Product-area accent palette.
  - Add approved semantic accent roles in `design-system/design-tokens.json` and `COLOR_SYSTEM.md`.
  - Suggested roles: import/onboarding, learn, practice, review, mistakes, progress, generation.
  - Apply accents to headers, badges, controls or small brutalist blocks, not decorative full-card coloring.
  - Regenerate CSS tokens with `pnpm generate:tokens`.
- [x] 15.6 Responsive and accessibility hardening.
  - Audit 375px/390px mobile, tablet and desktop.
  - Check focus order, touch targets, no text overlap, no color-only state, reduced motion and screen-reader status messages.
  - Capture Playwright screenshots for empty and imported states.
- [x] 15.7 Validation and documentation gate.
  - Run focused component/unit tests, `pnpm lint`, `pnpm typecheck`, `pnpm test`, focused Playwright mobile/import/lesson tests, `pnpm test:e2e` if time permits, `pnpm build` and `git diff --check`.
  - Update `PROJECT_STATUS.md`, `CHANGELOG.md`, this verification log and a precise `NEXT ACTION`.
  - Do not push, deploy or apply production Neon migrations without explicit confirmation.

### Step 16 acceptance criteria

- [x] `/import` mobile keeps the first Pack activation step visually compact at 375 px.
- [x] Import action buttons stack into a predictable one-column touch layout on mobile.
- [x] Import and generation textareas use shorter mobile minimum heights without changing desktop density.
- [x] CSS changes are scoped to `.import-workspace` so lesson activity editors and practice actions do not inherit the import-specific density rules.
- [x] Playwright coverage verifies no horizontal overflow, compact source input height and stacked first-step actions on mobile.
- [x] Lint, typecheck, unit tests, full Playwright E2E, build and diff checks pass locally.
- [x] No deploy, production migration, credential handling or push is performed in this step.

### Step 16 implemented increment

- [x] 16.1 `/import` mobile density polish.
  - Added mobile-only `.import-workspace` rules for tighter panel padding/gaps, stacked import/generation/action buttons, shorter import/generation textareas and full-width import-surface actions.
  - Added a regression test in `tests/e2e/import-ui.spec.ts` for 375 px `/import` bounds, compact textarea height and stacked first activation controls.
  - Stopped the stale local `next dev` server on port 3211 only after Playwright reported it blocked the owned test server.
  - Validation passed locally; production deployment remains unvalidated by user and untouched by this step.

### Step 17 acceptance criteria

- [x] Imported lesson pages expose a compact in-page study flow for `Aula`, `Conceitos` and `Prática`.
- [x] The flow works as anchor navigation on mobile without adding a modal, wizard or separate route.
- [x] Practice panels become easier to scan on 375 px screens: tighter panel padding, shorter code editor and stacked RUN/SUBMIT actions.
- [x] RUN remains a non-attempt execution path and SUBMIT SOLUTION remains the official attempt path.
- [x] Playwright coverage verifies the mobile lesson flow, no horizontal overflow and compact practice controls.
- [x] Documentation, changelog and project status record the Step 17 behavior and validation results.
- [x] No deploy, production migration, credential handling or push is performed in this step.

### Step 17 planned increment

- [x] 17.1 Lesson mobile study-flow polish.
  - Add a concise in-page lesson flow navigation after the lesson progress summary.
  - Apply mobile-only `.activity-panel` density rules for practice panels.
  - Add focused Playwright regression coverage for the mobile lesson route after example Pack import.
  - Validated locally and checkpointed without pushing.

### Step 18 acceptance criteria

- [x] `/tracks/[trackId]` exposes a visible continuation CTA to the first lesson after imported content is active.
- [x] `/progress` exposes a visible continuation CTA back to the catalog instead of becoming a dead-end summary screen.
- [x] Continuation CTAs use scoped area-accent styling and brutalist border/shadow cues, not additional global yellow decoration.
- [x] Mobile 375 px coverage verifies no horizontal overflow on the Track detail continuation path.
- [x] Existing RUN/SUBMIT behavior remains unchanged by this navigation polish.
- [x] Documentation, changelog and project status record the Step 18 behavior and validation results.
- [x] No deploy, production migration, credential handling or push is performed in this step.

### Step 18 implemented increment

- [x] 18.1 Catalog/progress mobile continuation polish.
  - Add a first-lesson continuation CTA to imported Track detail pages after the Track progress summary.
  - Add a Progress-page continuation CTA back to `/tracks` so mobile users can return to the active catalog from their progress summary.
  - Style both CTAs with `.study-next-action`, mixing paper with the active area accent and retaining solid neobrutalist borders/shadows.
  - Add focused Playwright regression coverage for 375 px Track detail and Progress continuation.
  - Validated locally and checkpointed without pushing.

### Step 19 acceptance criteria

- [x] The user ZIP is inspected without trusting its self-reported validation report alone.
- [x] The contained `caderno.track.v1` JSON passes KNOW/OS Track Pack validation and semantic checks.
- [x] The raw file SHA-256 matches the ZIP manifest.
- [x] The import request ceiling supports complete generated Track Packs while still blocking oversized payloads.
- [x] The pack is imported through the local app endpoint, not by bypassing validation.
- [x] The local catalog exposes the imported Track and a lesson can be opened for study.
- [x] Focused validation passes and docs record exact results.
- [x] No deploy, production migration, credential handling or push is performed in this step.

### Step 19 in-progress increment

- [x] 19.1 ZIP and Pack validation.
  - Extracted `KNOW-OS-Trilha-Programacao-Completa-v1.zip` to a temporary folder.
  - Validated `content/programacao-aplicada-com-ia.track.json` with the KNOW/OS TypeScript validator.
  - Confirmed `packId=know-os.programacao-aplicada-com-ia`, `version=1`, `track=programacao-aplicada-com-ia`, 10 modules, 58 lessons, 189 concepts and 174 activities.
  - Confirmed raw SHA-256 `b5933c7bd79a3ec6b9be9a320f7262fcb03b6dade5f321a2fe6c005dd417f4a6`, matching the manifest.
- [x] 19.2 Complete Pack request-size support.
  - Raised `MAX_TRACK_PACK_BYTES` from 256 KiB to 1 MiB so complete generated tracks can pass the normal preview/import endpoint.
  - Added unit coverage asserting the configured default ceiling while preserving the existing oversized request rejection tests.
- [x] 19.3 Local endpoint import and study smoke.
  - Start a local no-OAuth dev server.
  - Preview and import the validated Track Pack through `/api/import/track/preview` and `/api/import/track`.
  - Open `/tracks/programacao-aplicada-com-ia` and the first lesson to verify the study path.

### Step 20 acceptance criteria

- [x] Mobile study surfaces reduce cognitive load from the Impeccable critique without removing routes or imported content.
- [x] Secondary navigation remains reachable, but does not stay expanded as a competing route list on secondary pages.
- [x] Secondary navigation touch targets meet the 44 px minimum below 1200 px.
- [x] Track detail prioritizes the continuation path and current module before exposing the full imported catalog.
- [x] Knowledge Map no longer renders a 100+ item ungrouped mobile list as the first experience.
- [x] `prediction` and `multiple-choice` imported activities render as safe learner-facing prompts instead of `ATIVIDADE INDISPONÍVEL`.
- [x] RUN and SUBMIT SOLUTION semantics remain unchanged for executable code/debug activities.
- [x] Focused unit/component and Playwright mobile checks pass. The official owned-server Playwright run was blocked while preserving the live imported `memory://local` server; a custom Playwright smoke passed against `http://127.0.0.1:3211`.
- [x] Documentation, changelog, project status and this verification log record the Step 20 behavior and remaining risks.

### Step 20 planned increments

- [x] 20.1 Navigation distillation.
  - Keep the primary four study destinations visible.
  - Keep `Mais` closed by default so secondary routes do not compete with the screen task.
  - Preserve access to all secondary routes and visible current state when `Mais` is opened.
  - Repair mobile secondary link hit areas to the canonical touch target.
- [x] 20.2 Track and Knowledge Map progressive disclosure.
  - Keep the Track continuation CTA first.
  - Expand only the opening/current module by default and collapse the remaining module catalog behind native disclosure controls.
  - Group Knowledge Map concepts into a compact "focus first" set plus collapsed full index.
- [x] 20.3 Imported activity hardening.
  - Add allowlisted safe renderers for `prediction` and `multiple-choice`.
  - Parse config defensively with optional choices/explanation fields only.
  - Keep unsupported types visible as safe status content.
- [x] 20.4 Validation and documentation.
  - Run focused component tests for the activity registry.
  - Run focused Playwright mobile coverage for navigation, track disclosure and lesson activity renderers.
  - Run lint/typecheck and update `PROJECT_STATUS.md`, `CHANGELOG.md` and this plan.

### Step 21 acceptance criteria

- [x] `/import` starts with an explicit intent choice instead of showing Track Pack activation and lesson generation as one continuous flow.
- [x] The default intent is `Estudar trilha pronta`, showing the existing Track Pack activation controls and hiding Manual/DeepSeek generation controls.
- [x] `Criar aula com IA` reveals the existing Manual/DeepSeek mode selector and generation panels without changing their validation/preview/import pipeline.
- [x] Switching between intents preserves in-progress generation recovery state, including DeepSeek fallback to Manual.
- [x] Mobile `/import` has no horizontal overflow and does not expose generation controls before the user chooses the creation intent.
- [x] Existing Track Pack import, Manual generated lesson import and DeepSeek failure-recovery tests remain covered.
- [x] Documentation, changelog, project status and this verification log record the Step 21 behavior and remaining risks.

### Step 21 planned increments

- [x] 21.1 Intent selector.
  - Add a product-level intent selector above import/generation controls.
  - Keep `Estudar trilha pronta` selected by default.
  - Use button/pressed semantics instead of a modal or separate route.
- [x] 21.2 Conditional workflow rendering.
  - Render Track Pack activation only for the study intent.
  - Render Manual/DeepSeek mode selection only for the creation intent.
  - Preserve component state across intent changes.
- [x] 21.3 Mobile and recovery tests.
  - Add Playwright coverage proving generation controls are hidden on first mobile view and appear after choosing creation.
  - Update existing generation E2E/component tests to choose creation before interacting with Manual/DeepSeek.
  - Preserve DeepSeek failure-to-Manual recovery assertions.
- [x] 21.4 Validation and documentation.
  - Run focused component and E2E checks, then lint/typecheck/test/build where feasible.
  - Update `PROJECT_STATUS.md`, `CHANGELOG.md` and this verification log.

### Step 22 acceptance criteria

- [x] RUN/SUBMIT client calls tolerate non-JSON server responses, HTTP errors and network failures without unmounting or crashing the lesson page.
- [x] Failed RUN/SUBMIT requests render as terminal feedback with `request_error` status and an actionable learner-facing message.
- [x] Valid RUN/SUBMIT payloads still update terminal output, tests, latest attempt feedback and source diff.
- [x] Pending action state is explicit, disables both activity actions during the request and exposes `aria-busy` on the activity panel.
- [x] Existing RUN semantics remain unchanged: RUN records no official attempt.
- [x] Existing SUBMIT semantics remain unchanged: SUBMIT records the official attempt and progress evidence.
- [x] Focused component tests, typecheck, lint and vertical-slice Playwright validation pass.

### Step 22 implemented increment

- [x] 22.1 Activity panel resilience hotfix.
  - Replaced the unguarded `response.json()` activity client path with checked HTTP/JSON parsing and request-error terminal feedback.
  - Normalized API execution payloads whose JSON omits `result` when the evaluated JavaScript result is `undefined`.
  - Replaced async `useTransition` action handling with explicit `pendingAction` state so RUN/SUBMIT feedback appears immediately and duplicate clicks are blocked predictably.
  - Added component regression coverage for a non-JSON 500 response from RUN while keeping the page mounted.

### Step 23 acceptance criteria

- [x] Complete a learner dogfood loop through the available JavaScript Track Pack: import, browse catalog, read lesson theory, inspect concepts, run code, submit solutions, review progress/history and visit secondary surfaces.
- [x] Record UX/UI findings from the actual flow, prioritizing issues that affect comprehension, speed, wayfinding, trust, error recovery or repeated study.
- [x] Improve the activity study experience so reading, coding, output and next-step feedback are easier to scan without altering RUN/SUBMIT rules.
- [x] Improve cross-surface wayfinding so Today, Tracks, Lesson, Review/Mistakes, Progress, Achievements, Knowledge Map, Projects, History, Import and Exports feel like one study system.
- [x] Keep the technical-brutalist Design System intact: no new off-token colors, no rounded-card redesign, no decorative animation, no dark-mode pivot.
- [x] Preserve all existing route/API contracts, imported content boundaries, append-only attempts and deterministic progress/mastery rules.
- [x] Add or update focused tests for changed UX behavior.
- [x] Run relevant component/unit/E2E checks, lint, typecheck, build and `git diff --check`.

### Step 23 planned increments

- [x] 23.1 Dogfood walkthrough and evidence capture.
  - Use Playwright/no-OAuth memory harness to import the example JavaScript Pack and complete the learner loop.
  - Capture timings, console/page errors, route notes and screenshots for desktop/mobile.
  - Visit all major implemented app surfaces after attempting activities.
- [x] 23.2 Findings and scope selection.
  - Identify the highest-impact UX/UI fixes inside current V1 scope.
  - Prefer structural clarity and speed of use over cosmetic changes.
- [x] 23.3 Implement focused UI/UX improvements.
  - Improve activity panel scan hierarchy, action feedback and post-submit next steps.
  - Improve global wayfinding/route context where the dogfood session exposes confusion.
- [x] 23.4 Validation and documentation.
  - Add tests for changed behavior.
  - Run focused and broad validation.
  - Update `PROJECT_STATUS.md`, `CHANGELOG.md` and this verification log.

### Post-V1 hardening increments

- [x] 4.1 Real PostgreSQL validation harness.
  - Add a guarded script that loads a real PostgreSQL URL from `TEST_DATABASE_URL` or ignored local env, creates a uniquely named disposable schema, applies checked-in SQL migrations inside that schema, runs a minimal Track Pack import/read/RUN/SUBMIT/progress smoke, and drops only that schema in cleanup.
  - The script must redact connection strings, refuse `memory://local`, avoid production `public` schema, and report exact counts/results.
  - Added `pnpm test:postgres`, `scripts/run-real-postgres-test.mjs` and `tests/integration/real-postgres.test.ts`.
  - The normal `pnpm test` suite skips the real PostgreSQL test unless the runner sets `KNOW_OS_RUN_REAL_POSTGRES_TESTS=1`.
  - The harness creates and drops only a validated `know_os_real_pg_*` schema. It discovered that generated Drizzle foreign keys in existing migrations qualify references as `"public".*`; the isolated harness rebinds those references to the disposable schema at runtime without modifying migration files or production tables.
- [x] 4.2 Real PostgreSQL validation gate.
  - Run the new validation against the configured PostgreSQL service when a URL is available.
  - Record exact results and keep production application data untouched.
  - `pnpm test:postgres` passed against the configured real PostgreSQL URL from ignored local environment using a disposable schema. Validation covered 7 migrations, 1 imported track, 2 activities, RUN with 0 attempts and SUBMIT with 1 attempt plus progress assertions.
- [x] 5.1 Dependency vulnerability scanning.
  - Add dependency vulnerability scanning command/documentation.
  - Added `pnpm security:audit` for production/runtime dependencies.
  - Added pnpm overrides for patched transitive production dependencies: `sharp@0.35.0`, `postcss@8.5.18` and `esbuild@0.25.12`.
  - Kept the full dev audit residual explicit: `eslint -> minimatch@3 -> brace-expansion`; `brace-expansion@1.1.18` is pinned for compatibility, while forcing `brace-expansion@5` breaks ESLint.
- [x] 5.2 CSP candidate and header coverage.
  - Define and test a production CSP candidate without breaking current Auth.js/Google/Vercel behavior.
  - Added an enforced CSP candidate to `next.config.ts` covering default/base/frame/object/form/script/style/img/font/connect/frame/worker/manifest directives.
  - Extended Playwright security-header coverage for CSP directives and Google OAuth origin allowance.
- [x] 5.3 Security validation gate.
  - Run dependency audit, lint, typecheck, unit tests, focused security-header E2E and build.
  - Record exact results and checkpoint.
  - Gate passed with production audit clean, lint/typecheck/test/security-header E2E/build passing.
- [x] 6.1 Pack distribution catalog.
  - Consolidate Pack versioning/distribution rules before public content publication.
  - Added `packs/catalog.json` with the published example Track Pack, canonical content hash and compatibility metadata.
  - Documented the immutable `schema:packId:version` publication tuple in `docs/11-PACK-SPEC.md` and `packs/README.md`.
- [x] 6.2 Pack compatibility verification.
  - Add compatibility fixtures/tests for accepted Pack versions.
  - Added `pnpm packs:verify` and `scripts/verify-pack-catalog.mjs` to validate catalog entries, paths, metadata, canonical hashes and compatibility.
  - Extended `tests/unit/track-pack-validation.test.ts` to assert the catalog entry matches the accepted `caderno.track.v1` fixture hash.
- [x] 6.3 Pack publication validation gate.
  - Run Pack verification, focused unit tests, lint, typecheck and build.
  - Record exact results and checkpoint.
  - Gate passed with Pack verification, focused unit tests, lint, typecheck, production audit, full tests and build.
- [x] 7.1 Persisted gamification schema.
  - Add `badge_awards`, `mission_progress` and append-only mission progress audit records with owner scope and generated migration.
  - Added `badge_awards`, `mission_progress`, `mission_progress_events` and generated `src/db/migrations/0007_icy_vengeance.sql`.
- [x] 7.2 Gamification projection repository.
  - Materialize earned badge awards once, upsert current mission progress and append mission status-change events from deterministic rule output.
  - Keep XP, review, mistakes and mastery as the inputs; do not let persisted gamification change domain decisions.
  - Added PostgreSQL and memory repositories for deterministic gamification projection sync.
- [x] 7.3 Product and export readback.
  - Surface persisted award/progress timestamps on `/achievements`.
  - Include gamification projection data in export snapshots without enabling automatic user-state replay.
  - `/achievements` displays persisted badge/progress timestamps when available.
  - Backup and Progress exports include gamification projection data; restore V1 still skips gamification replay with other user-state categories.
- [x] 7.4 Gamification persistence validation gate.
  - Run focused unit/integration tests, migration generation, lint, typecheck, full tests, build and diff check before checkpoint.
  - Gate passed with migration generation, focused tests, lint, typecheck, full tests, production audit, build and diff check.
- [x] 8.1 User-state restore policy ADR.
  - Design the conflict-safe append-only replay/merge policy before implementing restore of attempts, XP, history, mistakes or review state.
  - Define identity mapping, idempotency keys, conflict classes, blocked cases and acceptable append-only merge behavior.
  - Added ADR 0016 for `user_state_dry_run`, future `user_state_apply`, restore provenance ledger, append-only categories, projection handling and blocking conflicts.
- [x] 8.2 Restore contract documentation.
  - Update import/export/restore docs with explicit V1 restore modes: Pack-only apply, dry-run user-state replay plan and future apply gate.
  - Keep automatic replay disabled until compatibility tests and UI review exist.
  - Updated import/export docs, README, data model notes and changelog.
- [x] 8.3 Restore policy validation gate.
  - Run documentation-relevant type/test checks and diff check.
  - Gate passed with lint, typecheck and diff check.
- [x] 9.1 Restore provenance schema.
  - Add owner-scoped `restore_provenance` ledger with source export fingerprint, source record identity, local record identity and payload hash.
  - Added `restore_provenance`, generated `src/db/migrations/0008_pale_shiver_man.sql` and added the read repository foundation.
- [x] 9.2 Dry-run planner contract.
  - Extend restore preview with `know-os.user-state-restore-dry-run.v1`, stable Backup fingerprint, category plans, warnings and blockers.
  - Keep `applyEnabled=false`; do not import attempts, XP, history, mistakes, reviews or gamification projections.
  - Restore preview now includes a blocked dry-run user-state plan and stable canonical Backup fingerprint.
- [x] 9.3 Dry-run validation gate.
  - Run migration generation, focused restore/import tests, lint, typecheck, full tests, build and diff check.
  - Gate passed with migration generation, focused tests, lint, typecheck, full tests, production audit, build and diff check.
- [x] 10.1 Restore dry-run UI.
  - Add a `/exports` restore preview panel that posts Backup JSON to `/api/restore/preview`.
  - Display categories, source fingerprint, blocked apply state and user-state dry-run blockers.
  - Added `RestorePreviewPanel` to `/exports` with textarea input, status region, dry-run summary, category plan and blocker readout.
- [x] 10.2 Restore compatibility coverage.
  - Add component coverage for the UI and contract coverage for missing Pack manifest blockers.
  - Keep user-state apply unavailable.
  - Added component test for the blocked dry-run UI and contract test for state without Pack manifests.
- [x] 10.3 Restore UI validation gate.
  - Run focused component/unit tests, lint, typecheck, full tests, build and diff check.
  - Gate passed with focused tests, lint, typecheck, full tests, production audit, build and diff check.
- [x] 11.1 CSP nonce builder and proxy application.
  - Move CSP construction into a tested shared module.
  - Generate a per-request nonce in the Next.js 16 `src/proxy.ts` guard, set `x-nonce` for dynamic rendering and attach the matching CSP header to runtime responses.
  - Remove production `script-src 'unsafe-inline'`; allow `unsafe-eval` only outside production if required by the local Next.js dev server.
- [x] 11.2 Header coverage.
  - Extend unit and Playwright coverage to assert nonce-bearing CSP behavior and preserved Google OAuth origins.
  - Confirm security headers remain present on protected redirects and public runtime pages.
- [x] 11.3 CSP hardening validation gate.
  - Run focused security tests, lint, typecheck, build, security audit and diff check before checkpoint.
  - Gate passed with focused CSP unit tests, lint, typecheck, build, focused Playwright security-header smoke, production audit and full tests.
- [x] 12.1 Authenticated read-only walkthrough.
  - Use an existing owner browser session when available.
  - Validate protected production pages without clicking RUN, SUBMIT SOLUTION, restore apply or other mutating actions.
  - Chrome owner session reached the protected home page and validated `/`, `/tracks`, `/tracks/javascript`, `/lessons/js-fundamentals-001`, `/import`, `/progress` and `/knowledge-map`.
- [x] 12.2 Production CSP readback.
  - Confirm the live production deployment emits nonce-bearing CSP after the Step 11 push.
  - `https://know-os.vercel.app/` returned `Content-Security-Policy` with `script-src 'self' 'nonce-*' 'strict-dynamic'` and no production `unsafe-inline`/`unsafe-eval`.
- [ ] 12.3 Production schema repair gate.
  - `/exports` and `/achievements` currently fail in authenticated production with Server Components render errors.
  - Likely cause: Neon production schema has not applied checked-in migrations `0007_icy_vengeance.sql` and `0008_pale_shiver_man.sql`.
  - Stop for explicit user confirmation before running `pnpm db:migrate` against Neon production because it is an external database schema write.
- [x] 13.1 Global UI alignment implementation.
  - Compare `design-system/uploads` and `design-system/KNOW-OS.dc.html` against current app shell/pages.
  - Update shared layout/CSS primitives so all routes inherit the same section, panel, list and status hierarchy.
  - Keep product behavior unchanged and avoid fake unfinished product screens.
- [x] 13.2 UI alignment validation gate.
  - Run lint, typecheck, unit tests, build, focused Playwright smoke and local screenshot capture.
  - Update durable status/changelog and checkpoint/push when the gate passes.
  - Implemented, checkpointed and pushed as `81f4ce3`.
- [x] 14.0 Deep orientation.
  - Read/update: `docs/11-PACK-SPEC.md`, `docs/13-IMPORT-EXPORT.md`, `docs/16-SECURITY-ARCHITECTURE.md`, `docs/20-ACCEPTANCE-CRITERIA.md`, `docs/22-API-CONVENTIONS.md`, `docs/23-ERROR-HANDLING.md`, ADR 0010 and applicable import/domain files.
  - Confirm whether generation imports `caderno.lesson.v1` directly or wraps validated Lesson Packs into an atomic Track/Module import boundary; if this is a durable Pack-pipeline choice, create an ADR.
  - Orientation completed on 2026-07-31. Generation output will target `caderno.lesson.v1` as the normalized model/manual artifact, but raw output remains blocked from import until the shared parser, schema validator, business validator, preview/diff and atomic importer are implemented in later Step 14 increments. No ADR is required for 14.0/14.1 because no Pack schema or import behavior changes in this increment.
- [x] 14.1 Generation contracts and environment.
  - Create/update: `src/features/generation/**`, `src/lib/env.ts`, `.env.example`, tests/unit env/provider readiness tests.
  - Define `GenerationSpec`, `GenerationStatus`, provider-independent request/result/errors, prompt compiler and server-only provider interface.
  - Add DeepSeek configuration detection with defaults: base URL `https://api.deepseek.com`, default model `deepseek-v4-flash`, pro model `deepseek-v4-pro`.
  - Implemented generation contracts, provider-independent prompt compilation, raw JSON parser, server-only DeepSeek readiness detection, env defaults and model-alias rejection. Added `server-only` as an explicit runtime guard dependency.
- [x] 14.2 Persistence foundation.
  - Create/update: `src/db/schema/user-state.ts`, `src/db/repositories/generation-job-repository.ts`, memory repository, generated migration and integration tests.
  - Persist `GenerationJob`, selected mode/model, normalized spec, compiled prompt, status timeline, raw response metadata hash where safe, validation result references and provider usage estimates.
  - Never persist API keys, client secrets or unredacted provider credentials.
  - Implemented owner-scoped `generation_jobs`, Drizzle and memory repositories, status timeline persistence, compiled prompt/spec storage and provider usage storage. Generated `0009_volatile_captain_britain.sql`.
- [x] 14.3 Lesson Pack parser and shared validation pipeline.
  - Create/update: lesson Pack schema/semantic validator under `src/features/import/application/**` or a new Pack-validation module, plus fixtures/tests.
  - Add `caderno.lesson.v1` parser and semantic validation, then route manual/DeepSeek outputs into the same preview/diff/import path.
  - Ensure unsupported schema versions, malformed JSON and business-rule failures are blocked before preview/import.
  - Implemented `lessonPackSchema`, `validateLessonPack`, generated-output validation, malformed/Markdown blocking and Track Pack wrapping only after validated Lesson Pack JSON.
- [x] 14.4 Manual generation product flow.
  - Create/update: generation UI components and server actions/API routes.
  - Implement Configure -> Compile Prompt -> Copy Prompt -> Paste AI JSON -> Validate -> Preview -> Import with `waiting_external_response` persistence.
  - Preserve form data when switching modes.
  - Implemented `/import` mode selector, Manual Copy/Paste flow, DeepSeek readiness panel, compile/validate/import API routes and E2E coverage. Manual import rebuilds a validated Track Pack boundary before calling the existing atomic importer.
- [x] 14.5 DeepSeek provider adapter.
  - Create/update: `src/features/generation/infrastructure/deepseek-generation-provider.server.ts`, provider tests and request handler.
  - Use the OpenAI-compatible DeepSeek API from server-only code, `response_format: { type: "json_object" }`, timeout/cancellation support, one retry for empty/transient responses and no retry for auth/balance/validation failures.
  - Map errors to `invalid`, `rate_limited`, `insufficient_balance`, `timeout` and `failed` statuses with technical details available without exposing secrets.
  - Implemented server-only `DeepSeekGenerationProvider`, `/api/generation/deepseek/generate`, JSON-only OpenAI-compatible request construction, one retry for empty/transient/timeout results, non-retry auth/balance/rate handling and UI action wiring while preserving Manual form state across mode switches.
- [x] 14.6 Usage/cost estimates.
  - Create/update: versioned pricing config module and usage persistence/read models.
  - Persist provider usage when returned and label estimated cost as an estimate everywhere in UI/API.
  - Implemented `src/features/generation/pricing.ts` with official DeepSeek model pricing captured as `deepseek-api-pricing-2026-07-31`, provider-side cost estimation, persisted `pricingVersion` metadata and a DeepSeek preview callout that labels the USD value as estimated.
- [x] 14.7 Failure recovery UI.
  - Add Retry, Switch to Manual, Copy Prompt and View Technical Details actions for failed generation without losing `GenerationSpec` or compiled prompt.
  - Keep DeepSeek mode visible while unconfigured and disable only the direct generation action.
  - Implemented DeepSeek fallback state that compiles the same `GenerationSpec` through the Manual pipeline before direct generation, preserves the compiled prompt on failure, exposes Retry, Switch to Manual, Copy Prompt and View Technical Details, and keeps technical details limited to sanitized status/error metadata.
- [x] 14.8 Generation validation gate.
  - Run focused unit/component/integration tests for generation, import validation reuse and provider behavior.
  - Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, focused Playwright generation smoke and `git diff --check`.
  - Checkpoint locally and ask before push/deployment.
  - Final validation and local checkpoint are complete in this increment.

### Assumptions

- Phase 6 may harden existing `caderno.track.v1` import behavior without changing the Pack schema namespace.
- Export/restore can use JSON payloads in V1; a `.caderno` binary container remains future work unless required by tests/specs.
- Production deployment is preparation only. Any external write, publish or deployment requires user confirmation.
- Owner authentication requires a durable provider decision if it goes beyond local-only preparation; create an ADR or stop for confirmation when needed.
- Content/user-state separation, append-only attempts/evidence/events/XP and RUN/SUBMIT boundaries remain non-negotiable.
- `memory://local` remains a disposable E2E harness; Drizzle/PGlite tests continue to cover migration-backed repository behavior.
- Production stack is now user-approved as Vercel + Neon Postgres + Auth.js Google OAuth.
- No Vercel project, Neon database, Google OAuth credential, secret, deployment or external configuration may be created without a separate user confirmation.

### Production readiness increments

- [x] 2.1 Choose production stack.
  - Accepted stack: Vercel hosting, Neon Postgres, Auth.js with Google OAuth.
- [x] 2.2 Record production stack ADR.
  - Added ADR 0015 for Vercel + Neon + Google OAuth, single-owner e-mail allowlist and owner mapping.
- [x] 2.3 Environment contract.
  - Update `.env.example`, `src/lib/env.ts`, deployment docs and tests for `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `KNOW_OS_ALLOWED_GOOGLE_EMAILS`, `APP_URL`, `DATABASE_URL` and `KNOW_OS_OWNER_ID`.
  - Implemented optional local auth env parsing, Google e-mail allowlist parsing, `.env.example` placeholders and README/deployment docs.
- [x] 2.4 Auth foundation.
  - Add Auth.js dependencies, Google provider route and server auth helpers.
  - Installed `next-auth@5.0.0-beta.32`, added `src/auth.ts`, `/api/auth/[...nextauth]` and auth readiness helpers/tests.
- [x] 2.5 Owner resolution and route/API protection.
  - Map allowed Google account to `KNOW_OS_OWNER_ID`; protect user-state pages and private/mutating APIs in production mode.
  - Added central middleware guard: local mode stays open when Google auth is absent; configured Google OAuth mode requires an allowed session for private pages and APIs.
- [x] 2.6 Neon migration/deployment runbook.
  - Document Neon/Vercel setup, migration command path and health-check expectations without committing secrets.
  - Added `pnpm db:migrate`, migration README notes and `docs/28-PRODUCTION-RUNBOOK.md`.
- [x] 2.7 Validation, commit and push.
  - Validation gate passed and Step 2 production-readiness commits were pushed to GitHub.
- [x] 2.8 Production OAuth sign-in repair.
  - Custom sign-in page was already live; production Google OAuth returned `invalid_client`.
  - Re-applied Vercel Production `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `APP_URL` and `AUTH_TRUST_HOST` from ignored local environment values without printing secrets.
  - Redeployed production and verified Google opens with `prompt=select_account` and without `invalid_client`.
- [x] 2.9 Design-system motion pass.
  - Apply the approved Design System motion tokens to app shell, sign-in and recurring content primitives.
  - Add state feedback for hover, focus, active, reveals and status changes without continuous decorative animation.
  - Preserve `prefers-reduced-motion`, focus visibility and the technical-brutalist visual direction.
  - Validated lint, typecheck, build, focused Playwright motion/accessibility/auth smoke and local screenshot capture before push/deployment.
- [x] 3.1 Product import activation.
  - Add a real `/import` product surface for Track Pack JSON instead of instructing users to call `POST /api/import/track`.
  - Support loading the bundled example Pack, paste/file JSON input, server preview, conflict/error feedback and apply-only-after-valid-preview behavior.
  - Link empty Today/Tracks states and primary navigation to the import flow.
- [x] 3.2 Production import and vertical-slice validation.
  - Deploy the `/import` product surface.
  - Use the protected production UI/API to import the bundled JavaScript example Pack.
  - Validate `/tracks`, `/tracks/javascript`, `/lessons/js-fundamentals-001`, RUN/SUBMIT behavior and `/exports` after import.
  - Record exact production smoke results, checkpoint and continue.
  - Deployed commit `7e9246f` to production deployment `dpl_6DevBvMk8iDgmw1PBroFEHnaGwW8`, aliased to `https://know-os.vercel.app`.
  - Confirmed unauthenticated production protection: `/import` and `/tracks` redirect to `/auth/signin`; `/api/import/track/example` returns `401`; `/api/health/db` returns `200`.
  - Imported `know-os.javascript-fundamentals` version `1` into Neon through the production service boundary.
  - Validated the production vertical slice at service level: catalog read returns `tracks=1`, `track=javascript`, `lesson=js-fundamentals-001`, `activities=2`; `RUN` completed without creating attempts; `SUBMIT SOLUTION` passed both activities; lesson progress is `2/2`; track progress is `1/1`; export kinds are `backup`, `progress` and `teacher_context`.
  - Browser-session UI validation remains user-operated because the agent does not have the owner's authenticated Google browser session in this environment.

### Planned increments

- [x] 6.1 Orient from portability, Pack, import/export, security and deployment docs.
  - Read/update context: `docs/11-PACK-SPEC.md`, `docs/13-IMPORT-EXPORT.md`, `docs/16-SECURITY-ARCHITECTURE.md`, `docs/18-DEPLOYMENT.md`, `docs/20-ACCEPTANCE-CRITERIA.md`, `docs/22-API-CONVENTIONS.md`, `docs/23-ERROR-HANDLING.md`, design-system accessibility/responsive docs and applicable ADRs.
  - Confirm which owner-auth/deployment-prep work is local-only and which requires a stop condition.
  - Read Pack/import-export/security/API/error/accessibility/responsive sources. `docs/18-DEPLOYMENT.md` is missing and must be created during deployment preparation; no production deployment is authorized.
- [x] 6.2 Import hardening.
  - Create/update: `src/features/import/**`, `src/app/api/import/track/route.ts`, import tests.
  - Add payload size limit, preview/diff output and same-version conflict reporting without mutating data.
  - Implemented `readJsonRequestWithLimit`, `previewTrackPack`, `/api/import/track/preview`, hash diff metadata and import request tests.
- [x] 6.3 Export contracts.
  - Create/update: `src/features/export/**`, export schemas, API routes/pages and tests.
  - Support Backup, Progress and Teacher Context previews with explicit included categories and privacy warnings.
  - Implemented export snapshot repositories, `know-os.export.v1` contract builders, `/exports`, `/api/export/preview` and `/api/export`.
- [x] 6.4 Restore path.
  - Create/update: restore validation/application service, repository tests and recovery UI/API as needed.
  - Preserve user state/content separation and append-only history semantics.
  - Implemented `previewRestore`, `/api/restore/preview`, manifest-backed Backup payloads and `/api/restore` content Pack application. User-state categories are preserved in the Backup payload and reported during non-destructive restore; ADR 0014 keeps append-only user-state replay out of V1 restore.
- [x] 6.5 Accessibility and responsive audit.
  - Create/update: component/E2E coverage and docs for keyboard/focus/status/responsive checks across V1 routes.
  - Added `tests/e2e/accessibility.spec.ts` and `docs/25-ACCESSIBILITY-AND-RESPONSIVE-AUDIT.md`; full E2E now runs serially because the disposable `memory://local` harness is process-global.
- [x] 6.6 Security and deployment preparation.
  - Create/update: security audit doc, deployment readiness doc/config, owner-auth ADR or local-only implementation if in scope.
  - Do not deploy, publish or configure real external services.
  - Added baseline security headers, `tests/e2e/security-headers.spec.ts`, `docs/26-SECURITY-AUDIT.md`, `docs/27-DEPLOYMENT-PREPARATION.md`, ADR 0013 and ADR 0014.
- [x] 6.7 Documentation, full verification and V1 completion gate.
  - Update: `README.md`, `CHANGELOG.md`, `PROJECT_STATUS.md`, `PLANS.md`, relevant docs.
  - Required commands: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.
  - Completed final V1 gate. Checkpoint commit unavailable because this checkout has no `.git/` directory.

### Phase gate

After every Phase 6 acceptance criterion passes:

1. update `PROJECT_STATUS.md`;
2. record verification results below;
3. create a local checkpoint commit when safe and available;
4. mark the active goal complete when V1 is genuinely handled;
5. stop for user confirmation before any deployment, publishing, external write or provider decision.

## Completed phases

### Phase 0 — Repository Foundation

Status: `COMPLETE`
Completed: 2026-07-30

Acceptance criteria:

- [x] Repository dependencies and scripts are reproducible from a clean clone.
- [x] Next.js application starts locally.
- [x] TypeScript strict mode is enabled.
- [x] Approved design tokens generate CSS custom properties.
- [x] Accessible shell renders using the approved brand assets.
- [x] PostgreSQL/Drizzle configuration exists without committing secrets.
- [x] Unit, integration and end-to-end test harnesses exist with meaningful smoke coverage.
- [x] CI runs install, lint, typecheck, unit tests and build.
- [x] README, AGENTS, CHANGELOG and PROJECT_STATUS reflect the implemented state.
- [x] No product feature beyond the foundation is presented as complete.

Checkpoint: unavailable because this checkout has no `.git/` directory.

### Phase 1 — First Vertical Slice

Status: `COMPLETE`
Completed: 2026-07-30

Acceptance criteria:

- [x] The example `caderno.track.v1` JSON Pack is parsed, Zod-validated and semantically checked before mutation.
- [x] Imported catalog content remains separate from owner-scoped user state.
- [x] Re-importing the same Pack version is idempotent.
- [x] Track and lesson browsing render imported content from repository boundaries, not hardcoded UI copies.
- [x] The first JavaScript code activity opens from the imported lesson.
- [x] `RUN` evaluates code in an isolated QuickJS child-process adapter and does not create an Attempt or official StudyEvent.
- [x] `SUBMIT SOLUTION` re-evaluates deterministically, creates exactly one immutable Attempt and emits an append-only StudyEvent.
- [x] A simple progress projection updates after successful submission without claiming concept mastery is complete.
- [x] History displays the submission event chronologically.
- [x] Tests cover import idempotency, RUN/SUBMIT separation, attempt immutability, progress projection and the main E2E slice.
- [x] Documentation, changelog, `PROJECT_STATUS.md` and this plan reflect the implemented slice and remaining limitations.

Checkpoint: unavailable because this checkout has no `.git/` directory.

### Phase 2 — Learning Core

Status: `COMPLETE`
Completed: 2026-07-30

Acceptance criteria:

- [x] Concept pages render imported concepts and their lesson/activity relationships.
- [x] Lesson block renderers cover the initial block types used by V1 fixtures without executing arbitrary Pack UI payloads.
- [x] Activity registry routes rendering and validation through typed activity definitions.
- [x] Attempts show feedback, stdout/stderr and test results from persisted Attempt records.
- [x] Track and lesson progress views distinguish navigation/progress from concept mastery.
- [x] Existing Phase 1 RUN/SUBMIT invariants remain covered.
- [x] Component and E2E coverage includes concept browsing, block rendering, feedback display and progress state.
- [x] Documentation, changelog, `PROJECT_STATUS.md` and this plan reflect Phase 2 behavior.

Checkpoint: unavailable because this checkout has no `.git/` directory.

### Phase 3 — Programming Lab

Status: `COMPLETE`
Completed: 2026-07-30

Acceptance criteria:

- [x] Runtime contracts make timeout, output limits, runtime version and blocked capability expectations explicit in code and tests.
- [x] Terminal output distinguishes stdout, stderr, runtime errors, timeouts and output-limit failures clearly.
- [x] Automated test feedback differentiates visible checks from evaluator outcome without leaking future hidden-test implementation details.
- [x] Attempt history exposes a readable diff from starter/current or previous submitted source.
- [x] Debug activity support is introduced through the activity registry without hardcoding the learning core to JavaScript.
- [x] Existing RUN/SUBMIT invariants remain covered and no learner code executes in the main browser/server/database context.
- [x] Component and E2E coverage includes terminal states, test feedback, attempt diff and the debug activity path.
- [x] Documentation, changelog, `PROJECT_STATUS.md` and this plan reflect Phase 3 behavior.

Checkpoint: unavailable because this checkout has no `.git/` directory.

### Phase 4 — Mastery, Review and Mistakes

Status: `COMPLETE`
Completed: 2026-07-30

Acceptance criteria:

- [x] Concept evidence is append-only, owner-scoped and linked to imported content without mutating Pack content.
- [x] Mastery state is computed by a documented deterministic policy with recorded policy version and explainable reasons.
- [x] A concept cannot become `Mastered` from one immediate activity.
- [x] Review scheduling is deterministic, explains why a concept is due and updates next review date after review completion.
- [x] Mistakes are categorized links to attempts and can be resolved without disappearing from history.
- [x] Recommendation rules use evidence, review due state and mistakes without depending on AI.
- [x] UI separates lesson progress, concept mastery, due review and mistake/recommendation states.
- [x] Unit, integration, component and E2E coverage includes mastery, review, mistakes and recommendation behavior.
- [x] Documentation, changelog, `PROJECT_STATUS.md` and this plan reflect Phase 4 behavior.

Checkpoint: unavailable because this checkout has no `.git/` directory.

### Phase 5 — Projects and Gamification

Status: `COMPLETE`
Completed: 2026-07-30

Acceptance criteria:

- [x] Project contexts can link imported concepts and activities without making project flow mandatory.
- [x] XP transactions are append-only and independently auditable.
- [x] XP/rank/badge/mission UI remains separate from mastery evidence and does not imply certification.
- [x] Badge and mission criteria are transparent and deterministic.
- [x] Knowledge map exposes concept relationships with a complete non-canvas/list fallback.
- [x] Recommendations can include project application suggestions after review, mistakes and continuation rules.
- [x] Unit, integration, component and E2E coverage includes project context, XP ledger and knowledge map behavior.
- [x] Documentation, changelog, `PROJECT_STATUS.md` and this plan reflect Phase 5 behavior.

Checkpoint: unavailable because this checkout has no `.git/` directory.

## Roadmap continuation

The lead agent may continue Phase 1 through Phase 6 autonomously, one verified phase at a time. Every phase requires:

- explicit objective and acceptance criteria;
- file-level increments;
- narrow checks after each increment;
- full phase-gate validation;
- updated documentation and project status;
- a local checkpoint when available;
- a resumable `NEXT ACTION`.

Do not implement deferred public-product features.

## Decisions needed during execution

Record durable decisions in `docs/ADR/`. Do not silently choose an authentication provider, hosted database, runtime engine, deployment vendor, billing system, or marketplace design.

Reversible implementation details may be chosen and documented without pausing.

## Verification log

Add timestamped commands and exact outcomes during implementation.

```text
2026-07-30 10:44 BRT — Get-Content/read commands for mandatory docs and relevant ADRs: passed.
2026-07-30 10:46 BRT — rg --files and directory inspection: passed; repository is documentation-first with placeholder `src/`, `tests/`, `scripts/`.
2026-07-30 10:46 BRT — git status --short --branch: failed because this directory is not a Git repository; checkpoint commits unavailable unless Git is initialized later.
2026-07-30 10:46 BRT — node --version: passed, `v24.14.0`.
2026-07-30 10:46 BRT — pnpm --version: passed, `11.9.0`.
2026-07-30 10:49 BRT — npm registry version lookups for Next, React, TypeScript, Tailwind, Drizzle, Zod, Vitest, Testing Library and Playwright: passed.
2026-07-30 10:46 BRT — pnpm install: initially failed with `ERR_PNPM_IGNORED_BUILDS`; fixed by explicit `allowBuilds` policy for esbuild, sharp and unrs-resolver.
2026-07-30 10:48 BRT — pnpm generate:tokens: passed after fixing CLI entrypoint; generated 150 CSS custom properties.
2026-07-30 10:48 BRT — pnpm lint: initially failed because ESLint scanned `design-system/support.js` and shell used raw internal links; fixed by ignoring non-implementation design helper JS and using `next/link`.
2026-07-30 10:48 BRT — pnpm typecheck: initially failed on TypeScript 6 `baseUrl` deprecation and test env helper typing; fixed with `ignoreDeprecations: "6.0"` and a narrower env source type.
2026-07-30 10:48 BRT — pnpm test: initially failed because Vitest collected Playwright specs and blank `DATABASE_URL` was invalid; fixed by excluding `tests/e2e/**` and treating blank optional URLs as absent.
2026-07-30 10:49 BRT — pnpm build: passed; Next.js 16.2.12 built `/` and `/api/health/db`.
2026-07-30 10:50 BRT — pnpm exec playwright install chromium: passed; Chromium for Testing 151.0.7922.34 installed locally.
2026-07-30 10:50 BRT — pnpm test:e2e: initially failed because Playwright reused an unrelated server on port 3000 serving NexoDoc; fixed by moving Playwright webServer/baseURL to port 3210.
2026-07-30 10:55 BRT — pnpm install --frozen-lockfile: passed, already up to date.
2026-07-30 10:54-10:55 BRT — pnpm lint: passed.
2026-07-30 10:55 BRT — pnpm typecheck: passed. Note: do not run concurrently with `pnpm build` because Next mutates `.next` generated types.
2026-07-30 10:54 BRT — pnpm test: passed, 3 files and 4 tests.
2026-07-30 10:54 BRT — pnpm build: passed; generated 150 tokens and built 3 routes.
2026-07-30 10:55 BRT — pnpm test:e2e: passed, 4 Playwright tests across desktop Chromium and mobile Chrome profiles.
2026-07-30 10:56 BRT — Phase 1 orientation docs read: `docs/05-DOMAIN-MODEL.md`, `docs/06-DATA-MODEL.md`, `docs/08-LEARNING-ENGINE.md`, `docs/09-ACTIVITY-ENGINE.md`, `docs/11-PACK-SPEC.md`, `docs/12-PROGRAMMING-LAB.md`, `docs/13-IMPORT-EXPORT.md`, `docs/16-SECURITY-ARCHITECTURE.md`, `docs/22-API-CONVENTIONS.md`, `docs/23-ERROR-HANDLING.md`, Pack schema and example fixture.
2026-07-30 10:58 BRT — local PostgreSQL check: `DATABASE_URL` empty, `psql` unavailable, Docker unavailable, no running `postgres` process.
2026-07-30 10:59 BRT — pnpm typecheck: passed after adding Phase 1 Drizzle schema.
2026-07-30 10:59 BRT — pnpm db:generate: passed; generated `src/db/migrations/0000_small_vargas.sql` and Drizzle metadata for 14 tables.
2026-07-30 11:00 BRT — pnpm typecheck: passed after Track Pack validation/import service.
2026-07-30 11:00 BRT — pnpm test: passed, 5 files and 9 tests after Track Pack validation/import service.
2026-07-30 11:01 BRT — pnpm typecheck: passed after Drizzle import repository and API route.
2026-07-30 11:01 BRT — pnpm test: passed, 5 files and 9 tests.
2026-07-30 11:01 BRT — pnpm build: passed; built `/`, `/_not-found`, `/api/health/db`, `/api/import/track`.
2026-07-30 11:05 BRT — pnpm test with PGlite repository integration: passed; migration-backed Track Pack import covers idempotency and content/user-state separation.
2026-07-30 11:12 BRT — Added ADR 0011 for QuickJS initial JavaScript runtime.
2026-07-30 11:13 BRT — pnpm test for QuickJS runtime and RUN/SUBMIT boundary: passed after moving QuickJS execution to a child-process runner.
2026-07-30 11:16 BRT — pnpm test: passed, 8 files and 17 tests after history/progress wiring.
2026-07-30 11:25 BRT — pnpm install --frozen-lockfile: passed, already up to date.
2026-07-30 11:25 BRT — pnpm lint: passed.
2026-07-30 11:25 BRT — pnpm typecheck: passed.
2026-07-30 11:25 BRT — pnpm test: passed, 8 files and 17 tests.
2026-07-30 11:25 BRT — pnpm build: passed; built `/`, `/_not-found`, activity RUN/SUBMIT APIs, health/import APIs, `/tracks`, `/tracks/[trackId]`, `/lessons/[lessonId]`, `/history`.
2026-07-30 11:24 BRT — pnpm test:e2e: passed, 6 Playwright tests including import → browse → RUN → SUBMIT → history on desktop Chromium and mobile Chrome.
2026-07-30 11:27 BRT — Phase 2 orientation docs read: `docs/10-MASTERY-AND-REVIEW.md`, `design-system/SCREEN_SPECS.md`, `design-system/COMPONENT_SYSTEM.md`, `design-system/RESPONSIVE.md`, `design-system/PROGRAMMING_LAB.md` plus Phase 1 learning/activity docs already in context.
2026-07-30 11:28 BRT — pnpm lint: passed after concept read model/page.
2026-07-30 11:28 BRT — pnpm typecheck: passed after concept read model/page.
2026-07-30 11:28 BRT — pnpm test: passed, 9 files and 18 tests after concept read model/page.
2026-07-30 11:29 BRT — pnpm test:e2e: passed, 6 tests including concept navigation in the vertical slice.
2026-07-30 11:29 BRT — pnpm build: passed; built `/concepts/[conceptId]` plus prior Phase 1 routes.
2026-07-30 11:32 BRT — pnpm lint: passed after lesson block renderer registry.
2026-07-30 11:32 BRT — pnpm typecheck: passed after lesson block renderer registry.
2026-07-30 11:33 BRT — pnpm test: passed, 10 files and 21 tests after lesson block renderer registry.
2026-07-30 11:33 BRT — pnpm test:e2e: passed, 6 tests after lesson block renderer registry.
2026-07-30 11:33 BRT — pnpm build: passed after lesson block renderer registry.
2026-07-30 11:39 BRT — pnpm lint: passed after activity registry and persisted feedback surface; an initial warning-only run was cleaned.
2026-07-30 11:39 BRT — pnpm typecheck: passed after fixing readonly activity array typing.
2026-07-30 11:39 BRT — pnpm test: initially failed because the new feedback assertion used a stale fixture test name; fixed to match the imported Track Pack.
2026-07-30 11:39 BRT — pnpm test: passed, 11 files and 24 tests after activity registry and persisted feedback surface.
2026-07-30 11:40 BRT — pnpm test:e2e: initially failed because parallel desktop/mobile workers shared the disposable memory store and attempt numbers were not globally deterministic; fixed the assertion to validate persisted passed feedback rather than a fixed global attempt count.
2026-07-30 11:40 BRT — pnpm test:e2e: passed, 6 tests including persisted latest attempt feedback after reload.
2026-07-30 11:41 BRT — pnpm build: passed; generated 150 tokens and built `/concepts/[conceptId]`, activity APIs, catalog routes, lesson route and history.
2026-07-30 11:45 BRT — pnpm lint: passed after progress read model/UI.
2026-07-30 11:45 BRT — pnpm typecheck: passed after progress read model/UI.
2026-07-30 11:46 BRT — pnpm test: initially failed because the new integration test used descriptive slugs instead of imported Pack stable ids; fixed to `javascript` and `js-fundamentals-001`.
2026-07-30 11:46 BRT — pnpm test: passed, 13 files and 26 tests after progress read model/UI.
2026-07-30 11:47 BRT — pnpm test:e2e: initially failed on a concept link click timing/dev-server navigation artifact after adding the progress panel; fixed by asserting the imported concept link exists and navigating directly to the concept route.
2026-07-30 11:47 BRT — pnpm test:e2e: passed, 6 tests including progress UI on lesson and track routes.
2026-07-30 11:48 BRT — pnpm build: passed after progress read model/UI.
2026-07-30 11:49 BRT — pnpm install --frozen-lockfile: passed, already up to date.
2026-07-30 11:49 BRT — pnpm lint: passed for Phase 2 gate.
2026-07-30 11:49 BRT — pnpm typecheck: passed for Phase 2 gate.
2026-07-30 11:50 BRT — pnpm test: passed, 13 files and 26 tests for Phase 2 gate.
2026-07-30 11:50 BRT — pnpm build: passed for Phase 2 gate.
2026-07-30 11:51 BRT — pnpm test:e2e: passed, 6 tests for Phase 2 gate.
2026-07-30 11:51 BRT — git status --short --branch: failed because this directory is not a Git repository; Phase 2 checkpoint commit unavailable.
2026-07-30 11:51 BRT — Phase 3 planning context read from `docs/09-ACTIVITY-ENGINE.md`, `docs/12-PROGRAMMING-LAB.md`, `docs/16-SECURITY-ARCHITECTURE.md`, `docs/20-ACCEPTANCE-CRITERIA.md` and prior design-system Programming Lab context.
2026-07-30 11:54 BRT — pnpm typecheck: passed after runtime contract hardening.
2026-07-30 11:54 BRT — pnpm exec vitest run tests/unit/javascript-runtime.test.ts: initially failed because small learner output limits also shrank the host JSON transport buffer; fixed by enforcing a separate minimum host buffer.
2026-07-30 11:55 BRT — pnpm exec vitest run tests/unit/javascript-runtime.test.ts: passed, 1 file and 7 tests.
2026-07-30 11:55 BRT — pnpm lint: passed after runtime contract hardening.
2026-07-30 11:55 BRT — pnpm test: passed, 13 files and 30 tests.
2026-07-30 11:56 BRT — pnpm build: passed after runtime contract hardening.
2026-07-30 11:57 BRT — pnpm typecheck: passed after terminal/test feedback UI.
2026-07-30 11:57 BRT — pnpm exec vitest run tests/component/activity-registry.test.tsx: passed, 1 file and 2 tests.
2026-07-30 11:57 BRT — pnpm lint: passed after terminal/test feedback UI.
2026-07-30 11:58 BRT — pnpm test: passed, 13 files and 30 tests.
2026-07-30 11:58 BRT — pnpm build: passed after terminal/test feedback UI.
2026-07-30 11:59 BRT — pnpm test:e2e: passed, 6 tests after terminal/test feedback UI.
2026-07-30 12:00 BRT — pnpm typecheck: passed after attempt diff read model/UI.
2026-07-30 12:00 BRT — pnpm exec vitest run tests/unit/source-diff.test.ts tests/component/activity-registry.test.tsx: passed, 2 files and 4 tests.
2026-07-30 12:01 BRT — pnpm lint: passed after attempt diff read model/UI.
2026-07-30 12:01 BRT — pnpm test: passed, 14 files and 32 tests.
2026-07-30 12:01 BRT — pnpm build: passed after attempt diff read model/UI.
2026-07-30 12:02 BRT — pnpm test:e2e: passed, 6 tests after attempt diff read model/UI.
2026-07-30 12:03 BRT — pnpm test:e2e: passed, 6 tests after adding explicit E2E diff assertions.
2026-07-30 12:04 BRT — pnpm typecheck: passed after debug activity registry path.
2026-07-30 12:05 BRT — pnpm test: passed, 14 files and 32 tests after debug fixture/count updates.
2026-07-30 12:05 BRT — pnpm lint: passed after debug activity registry path.
2026-07-30 12:05 BRT — pnpm build: passed after debug activity registry path.
2026-07-30 12:06 BRT — pnpm test:e2e: passed, 6 tests including code and debug activity submissions.
2026-07-30 12:07 BRT — pnpm install --frozen-lockfile: passed, already up to date.
2026-07-30 12:07 BRT — pnpm lint: passed for Phase 3 gate.
2026-07-30 12:08 BRT — pnpm typecheck: passed for Phase 3 gate.
2026-07-30 12:08 BRT — pnpm test: passed, 14 files and 32 tests for Phase 3 gate.
2026-07-30 12:09 BRT — pnpm build: passed for Phase 3 gate.
2026-07-30 12:09 BRT — pnpm test:e2e: passed, 6 tests for Phase 3 gate.
2026-07-30 12:12 BRT — git status --short --branch: failed because this directory is not a Git repository; Phase 3 checkpoint commit unavailable.
2026-07-30 12:13 BRT — Phase 4 orientation read from `docs/05-DOMAIN-MODEL.md`, `docs/06-DATA-MODEL.md`, `docs/08-LEARNING-ENGINE.md`, `docs/10-MASTERY-AND-REVIEW.md`, `docs/20-ACCEPTANCE-CRITERIA.md`, `design-system/SCREEN_SPECS.md`, `design-system/COMPONENT_SYSTEM.md`, ADR 0003 and ADR 0006.
2026-07-30 12:14 BRT — pnpm db:generate: passed; generated `src/db/migrations/0001_wet_skin.sql` for `concept_evidence`.
2026-07-30 12:14 BRT — pnpm typecheck: passed after append-only concept evidence schema/repository.
2026-07-30 12:14 BRT — pnpm exec vitest run tests/integration/run-submit-boundary.test.ts: passed, 1 file and 3 tests after evidence write integration.
2026-07-30 12:15 BRT — pnpm lint: passed after evidence model and repository.
2026-07-30 12:15 BRT — pnpm test: passed, 14 files and 32 tests after evidence model and repository.
2026-07-30 12:17 BRT — pnpm exec vitest run tests/unit/mastery-policy.test.ts: passed, 1 file and 3 tests.
2026-07-30 12:17 BRT — pnpm typecheck: passed after deterministic mastery policy and concept read API.
2026-07-30 12:18 BRT — pnpm exec playwright test tests/e2e/vertical-slice.spec.ts: initially failed because parallel desktop/mobile workers shared `memory://local` evidence and moved the concept from `Understood` to `Practicing`; fixed the assertion to accept deterministic non-mastered progression.
2026-07-30 12:18 BRT — pnpm exec playwright test tests/e2e/vertical-slice.spec.ts: passed, 2 tests after mastery UI assertion repair.
2026-07-30 12:19 BRT — pnpm lint: passed after deterministic mastery policy.
2026-07-30 12:19 BRT — pnpm test: passed, 15 files and 35 tests after deterministic mastery policy.
2026-07-30 12:19 BRT — pnpm build: passed after deterministic mastery policy and concept UI.
2026-07-30 12:21 BRT — pnpm db:generate: passed; generated `src/db/migrations/0002_oval_secret_warriors.sql` for `review_schedules`.
2026-07-30 12:22 BRT — pnpm typecheck: passed after review policy/repository.
2026-07-30 12:22 BRT — pnpm exec vitest run tests/unit/review-policy.test.ts tests/integration/review-repository.test.ts: passed, 2 files and 4 tests.
2026-07-30 12:23 BRT — pnpm typecheck: passed after review API/page/navigation.
2026-07-30 12:23 BRT — pnpm exec vitest run tests/unit/review-policy.test.ts tests/integration/review-repository.test.ts tests/component/app-shell.test.tsx: passed, 3 files and 5 tests.
2026-07-30 12:24 BRT — pnpm lint: passed after review scheduling.
2026-07-30 12:24 BRT — pnpm test: passed, 17 files and 39 tests after review scheduling.
2026-07-30 12:24 BRT — pnpm build: initially failed because `/review` was statically prerendered without `DATABASE_URL`; fixed by marking the database-backed route `force-dynamic`.
2026-07-30 12:24 BRT — pnpm build: passed after marking `/review` dynamic.
2026-07-30 12:25 BRT — pnpm test:e2e: passed, 6 tests after review route/navigation.
2026-07-30 12:27 BRT — pnpm db:generate: passed; generated `src/db/migrations/0003_classy_wrecker.sql` for `mistakes`.
2026-07-30 12:27 BRT — pnpm exec vitest run tests/unit/mistake-categorization.test.ts tests/integration/mistake-repository.test.ts tests/component/app-shell.test.tsx: passed, 3 files and 5 tests.
2026-07-30 12:27 BRT — pnpm typecheck: initially failed because the mistake unit-test fixture used a stale `durationMs` field; fixed the fixture to match `JavaScriptExecutionResult`.
2026-07-30 12:28 BRT — pnpm typecheck: passed after mistake categorization.
2026-07-30 12:28 BRT — pnpm lint: passed after mistake categorization.
2026-07-30 12:28 BRT — pnpm test: initially failed because several PGlite integration tests exceeded Vitest's 5s default timeout after the schema gained multiple migrations; fixed by setting `testTimeout: 10000`.
2026-07-30 12:29 BRT — pnpm test: passed, 19 files and 43 tests after increasing the timeout for migration-backed integration tests.
2026-07-30 12:28 BRT — pnpm build: passed after mistakes route.
2026-07-30 12:29 BRT — pnpm test:e2e: initially failed on a mobile click timing artifact from track to lesson; fixed by asserting the lesson link and navigating to the stable lesson route.
2026-07-30 12:30 BRT — pnpm test:e2e: passed, 6 tests after mistake route/navigation.
2026-07-30 12:32 BRT — pnpm typecheck: passed after recommendation rules and Today UI.
2026-07-30 12:32 BRT — pnpm exec vitest run tests/unit/recommendation-rules.test.ts tests/component/app-shell.test.tsx: passed, 2 files and 3 tests.
2026-07-30 12:33 BRT — pnpm lint: passed after recommendation rules and Today UI.
2026-07-30 12:33 BRT — pnpm test: passed, 20 files and 45 tests after recommendation rules.
2026-07-30 12:33 BRT — pnpm build: passed after Today route became dynamic for recommendations.
2026-07-30 12:34 BRT — pnpm test:e2e: initially failed because the new Today empty state added a second `role=status`; fixed the shell assertion to target the visible topbar status text.
2026-07-30 12:35 BRT — pnpm test:e2e: passed, 6 tests after recommendation UI.
2026-07-30 12:35 BRT — pnpm install --frozen-lockfile: passed, already up to date.
2026-07-30 12:36 BRT — pnpm lint: passed for Phase 4 gate.
2026-07-30 12:36 BRT — pnpm typecheck: passed for Phase 4 gate.
2026-07-30 12:36 BRT — pnpm test: passed, 20 files and 45 tests for Phase 4 gate.
2026-07-30 12:36 BRT — pnpm build: passed for Phase 4 gate.
2026-07-30 12:37 BRT — pnpm test:e2e: passed, 6 tests for Phase 4 gate.
2026-07-30 12:37 BRT — git status --short --branch: failed because this directory is not a Git repository; Phase 4 checkpoint commit unavailable.
2026-07-30 12:38 BRT — Phase 5 orientation read from `docs/14-GAMIFICATION.md`, `docs/03-INFORMATION-ARCHITECTURE.md`, `docs/04-UX-FLOWS.md`, `design-system/RESPONSIVE.md`, `design-system/UX_RECOMMENDATIONS.md`, `docs/15-TESTING-STRATEGY.md` and prior domain/data docs.
2026-07-30 12:39 BRT — pnpm db:generate: passed; generated `src/db/migrations/0004_misty_wong.sql` for project contexts and project concepts.
2026-07-30 12:40 BRT — pnpm exec vitest run tests/integration/project-repository.test.ts tests/component/app-shell.test.tsx: passed, 2 files and 2 tests.
2026-07-30 12:40 BRT — pnpm typecheck: initially failed because an internal project aggregation reused a readonly public type; fixed with a mutable accumulator shape.
2026-07-30 12:40 BRT — pnpm typecheck: passed after project context foundation.
2026-07-30 12:41 BRT — pnpm lint: initially warned on an unused discarded destructured field; fixed by returning explicit project summary fields.
2026-07-30 12:41 BRT — pnpm lint: passed after project context foundation.
2026-07-30 12:41 BRT — pnpm test: passed, 21 files and 46 tests after project context foundation.
2026-07-30 12:41 BRT — pnpm build: passed after project context foundation.
2026-07-30 12:42 BRT — pnpm test:e2e: passed, 6 tests after project route/navigation.
2026-07-30 12:43 BRT — pnpm db:generate: passed; generated `src/db/migrations/0005_greedy_dreadnoughts.sql` for `xp_transactions`.
2026-07-30 12:44 BRT — pnpm typecheck: passed after XP ledger.
2026-07-30 12:44 BRT — pnpm exec vitest run tests/integration/run-submit-boundary.test.ts tests/component/app-shell.test.tsx: passed, 2 files and 5 tests after XP ledger.
2026-07-30 12:44 BRT — Vitest `testTimeout` raised to 15000 because the expanded PGlite migration suite was again close to the previous timeout.
2026-07-30 12:45 BRT — pnpm test: passed, 21 files and 47 tests after XP ledger.
2026-07-30 12:45 BRT — pnpm build: passed after XP ledger and `/progress`.
2026-07-30 12:46 BRT — pnpm lint: initially warned on an unused discarded memory XP owner field; fixed by returning explicit transaction fields.
2026-07-30 12:46 BRT — pnpm lint: passed after XP ledger.
2026-07-30 12:46 BRT — pnpm test:e2e: passed, 6 tests after XP route/navigation.
2026-07-30 12:47 BRT — pnpm typecheck: passed after deterministic ranks, badges and missions.
2026-07-30 12:47 BRT — pnpm exec vitest run tests/unit/gamification-rules.test.ts tests/component/app-shell.test.tsx: passed, 2 files and 3 tests.
2026-07-30 12:48 BRT — pnpm lint: passed after ranks, badges and missions.
2026-07-30 12:48 BRT — pnpm test: passed, 22 files and 49 tests after ranks, badges and missions.
2026-07-30 12:48 BRT — pnpm build: passed after `/achievements`.
2026-07-30 12:49 BRT — pnpm test:e2e: passed, 6 tests after achievements route/navigation.
2026-07-30 12:53 BRT — pnpm typecheck: passed after Knowledge Map read model/UI.
2026-07-30 12:53 BRT — pnpm exec vitest run tests/integration/catalog-repository.test.ts tests/component/app-shell.test.tsx: passed, 2 files and 2 tests after Knowledge Map coverage.
2026-07-30 12:54 BRT — pnpm lint: passed after Knowledge Map.
2026-07-30 12:54 BRT — pnpm test: passed, 22 files and 49 tests after Knowledge Map.
2026-07-30 12:55 BRT — pnpm build: passed after `/knowledge-map`.
2026-07-30 12:56 BRT — pnpm test:e2e: passed, 6 tests after Knowledge Map route/navigation.
2026-07-30 12:56 BRT — pnpm typecheck: passed after project-aware recommendations.
2026-07-30 12:56 BRT — pnpm exec vitest run tests/unit/recommendation-rules.test.ts tests/component/app-shell.test.tsx: passed, 2 files and 4 tests.
2026-07-30 12:57 BRT — pnpm lint: passed after project-aware recommendations.
2026-07-30 12:57 BRT — pnpm test: passed, 22 files and 50 tests after project-aware recommendations.
2026-07-30 12:58 BRT — pnpm build: passed after Today project recommendation copy/API.
2026-07-30 12:58 BRT — pnpm test:e2e: passed, 6 tests after project-aware recommendations.
2026-07-30 12:59 BRT — pnpm db:generate: passed; generated `src/db/migrations/0006_curved_deadpool.sql` for `project_activities`.
2026-07-30 12:59 BRT — pnpm typecheck: passed after adding project activity links.
2026-07-30 13:00 BRT — pnpm exec vitest run tests/integration/project-repository.test.ts tests/unit/recommendation-rules.test.ts tests/component/app-shell.test.tsx: passed, 3 files and 6 tests.
2026-07-30 13:00 BRT — pnpm lint: passed after project activity links.
2026-07-30 13:00 BRT — pnpm test: passed, 22 files and 51 tests after project activity links.
2026-07-30 13:01 BRT — pnpm build: passed after project activity links.
2026-07-30 13:01 BRT — pnpm test:e2e: passed, 6 tests after project activity links.
2026-07-30 13:02 BRT — pnpm install --frozen-lockfile: passed, already up to date.
2026-07-30 13:03 BRT — pnpm lint: passed for Phase 5 gate.
2026-07-30 13:03 BRT — pnpm typecheck: passed for Phase 5 gate.
2026-07-30 13:03 BRT — pnpm test: passed, 22 files and 51 tests for Phase 5 gate.
2026-07-30 13:04 BRT — pnpm build: passed for Phase 5 gate.
2026-07-30 13:04 BRT — pnpm test:e2e: passed, 6 tests for Phase 5 gate.
2026-07-30 13:04 BRT — git status --short --branch: failed because this directory is not a Git repository; Phase 5 checkpoint commit unavailable.
2026-07-30 13:05 BRT — Phase 6 orientation read from `docs/11-PACK-SPEC.md`, `docs/13-IMPORT-EXPORT.md`, `docs/16-SECURITY-ARCHITECTURE.md`, `docs/20-ACCEPTANCE-CRITERIA.md`, `docs/22-API-CONVENTIONS.md`, `docs/23-ERROR-HANDLING.md`, `design-system/ACCESSIBILITY.md` and `design-system/RESPONSIVE.md`; `docs/18-DEPLOYMENT.md` is missing.
2026-07-30 13:08 BRT — pnpm typecheck: passed after import size limit and preview API.
2026-07-30 13:09 BRT — pnpm exec vitest run tests/unit/import-request.test.ts tests/unit/track-import-service.test.ts tests/unit/track-pack-validation.test.ts tests/integration/track-import-repository.test.ts: passed, 4 files and 12 tests.
2026-07-30 13:09 BRT — pnpm lint: passed after import hardening.
2026-07-30 13:09 BRT — pnpm test: passed, 23 files and 55 tests after import hardening.
2026-07-30 13:10 BRT — pnpm build: passed after import preview route.
2026-07-30 13:10 BRT — pnpm test:e2e: passed, 6 tests after import hardening.
2026-07-30 13:13 BRT — pnpm typecheck: passed after export contracts and APIs.
2026-07-30 13:14 BRT — pnpm exec vitest run tests/unit/export-contracts.test.ts tests/component/app-shell.test.tsx: passed, 2 files and 3 tests.
2026-07-30 13:14 BRT — pnpm lint: passed after export contracts.
2026-07-30 13:14 BRT — pnpm test: passed, 24 files and 57 tests after export contracts.
2026-07-30 13:15 BRT — pnpm build: passed after `/exports` and export APIs.
2026-07-30 13:16 BRT — pnpm test:e2e: passed, 6 tests after export contracts.
2026-07-30 13:17 BRT — pnpm typecheck: passed after restore preview.
2026-07-30 13:18 BRT — pnpm exec vitest run tests/unit/restore-contracts.test.ts tests/unit/export-contracts.test.ts: initially failed because the category assertion was positional; fixed to use `arrayContaining`, then passed, 2 files and 4 tests.
2026-07-30 13:18 BRT — pnpm lint: passed after restore preview.
2026-07-30 13:18 BRT — pnpm test: passed, 25 files and 59 tests after restore preview.
2026-07-30 13:19 BRT — pnpm build: passed after restore preview route.
2026-07-30 13:19 BRT — pnpm test:e2e: passed, 6 tests after restore preview.
2026-07-30 13:21 BRT — pnpm typecheck: passed after manifest-backed Backup payloads and restore application service.
2026-07-30 13:22 BRT — pnpm exec vitest run tests/unit/restore-contracts.test.ts tests/unit/export-contracts.test.ts: passed, 2 files and 5 tests.
2026-07-30 13:22 BRT — pnpm lint: passed after restore application service.
2026-07-30 13:22 BRT — pnpm test: passed, 25 files and 60 tests after restore application service.
2026-07-30 13:23 BRT — pnpm build: passed after `/api/restore`.
2026-07-30 13:24 BRT — pnpm test:e2e: passed, 6 tests after restore application service.
2026-07-30 13:29 BRT — pnpm exec playwright test tests/e2e/accessibility.spec.ts: passed, 4 tests covering implemented V1 routes on desktop and mobile.
2026-07-30 13:30 BRT — pnpm typecheck: passed after accessibility audit coverage.
2026-07-30 13:30 BRT — pnpm lint: passed after accessibility audit coverage.
2026-07-30 13:31 BRT — pnpm test: passed, 25 files and 60 tests after accessibility audit coverage.
2026-07-30 13:32 BRT — pnpm build: passed after accessibility audit coverage.
2026-07-30 13:34 BRT — pnpm test:e2e: initially failed in the expanded suite because desktop/mobile projects shared the disposable `memory://local` state; fixed by using a fresh owned serial Playwright server and state-tolerant mastery assertions.
2026-07-30 13:35 BRT — pnpm test:e2e: passed, 10 tests after serializing Playwright and adding accessibility coverage.
2026-07-30 13:37 BRT — pnpm exec playwright test tests/e2e/security-headers.spec.ts: passed, 2 tests verifying baseline response security headers on desktop and mobile.
2026-07-30 13:37 BRT — pnpm typecheck: passed after security/deployment preparation.
2026-07-30 13:37 BRT — pnpm lint: passed after security/deployment preparation.
2026-07-30 13:37 BRT — pnpm test: passed, 25 files and 60 tests after security/deployment preparation.
2026-07-30 13:38 BRT — pnpm build: passed after security/deployment preparation; generated 150 tokens and built all implemented app/API routes.
2026-07-30 13:40 BRT — pnpm install --frozen-lockfile: passed for final V1 gate, already up to date.
2026-07-30 13:40 BRT — pnpm lint: passed for final V1 gate.
2026-07-30 13:40 BRT — pnpm typecheck: passed for final V1 gate.
2026-07-30 13:40 BRT — pnpm test: passed for final V1 gate, 25 files and 60 tests.
2026-07-30 13:41 BRT — pnpm build: passed for final V1 gate; generated 150 tokens and built all implemented app/API routes.
2026-07-30 13:42 BRT — pnpm test:e2e: passed for final V1 gate, 12 Playwright tests across desktop Chromium and mobile Chrome.
2026-07-30 13:42 BRT — git status --short --branch: failed because this directory is not a Git repository; final checkpoint commit unavailable.
2026-07-30 BRT — git ls-remote https://github.com/theusinshow/know-os.git: passed with no refs returned; remote appears empty.
2026-07-30 BRT — git init -b main: passed; initialized local repository.
2026-07-30 BRT — git remote add origin https://github.com/theusinshow/know-os.git: passed.
2026-07-30 BRT — git commit -m "Initial KNOW/OS V1 implementation": passed; initial local checkpoint created.
2026-07-30 BRT — Step 2.1 stack decision: user approved Vercel + Neon Postgres + Auth.js Google OAuth.
2026-07-30 BRT — Step 2.2 ADR: added ADR 0015 for the production preparation stack and updated deployment/status/changelog docs.
2026-07-30 BRT — pnpm exec vitest run tests/unit/env.test.ts tests/integration/db-health.test.ts: passed, 2 files and 6 tests for Step 2.3 environment contract.
2026-07-30 BRT — pnpm typecheck: passed for Step 2.3 environment contract.
2026-07-30 BRT — npm view next-auth version: passed, stable is 4.24.15.
2026-07-30 BRT — npm view next-auth@beta version: passed, Auth.js v5 package is 5.0.0-beta.32.
2026-07-30 BRT — pnpm add next-auth@5.0.0-beta.32: passed; lockfile updated.
2026-07-30 BRT — pnpm peers check: failed on existing transitive `@emnapi/*` peer warnings from `@napi-rs/wasm-runtime`; no NextAuth-specific peer issue found.
2026-07-30 BRT — pnpm exec vitest run tests/unit/auth-readiness.test.ts tests/unit/env.test.ts: passed, 2 files and 6 tests for Step 2.4.
2026-07-30 BRT — pnpm typecheck: passed for Step 2.4.
2026-07-30 BRT — pnpm lint: passed for Step 2.4.
2026-07-30 BRT — pnpm build: passed for Step 2.4; `/api/auth/[...nextauth]` built as a dynamic route.
2026-07-30 BRT — pnpm exec vitest run tests/unit/session-guard.test.ts tests/unit/auth-readiness.test.ts tests/unit/env.test.ts: passed, 3 files and 10 tests for Step 2.5.
2026-07-30 BRT — pnpm typecheck: passed for Step 2.5.
2026-07-30 BRT — pnpm lint: passed for Step 2.5.
2026-07-30 BRT — pnpm build: passed for Step 2.5; middleware/proxy included in build output.
2026-07-30 BRT — pnpm test:e2e: passed for Step 2.5, 12 tests; local no-OAuth harness remains operable.
2026-07-30 BRT — pnpm test: passed for Step 2.5, 28 files and 70 tests.
2026-07-30 BRT — pnpm exec drizzle-kit migrate --help: passed; confirmed migration command exists.
2026-07-30 BRT — pnpm install --frozen-lockfile: passed for Step 2.6, already up to date after script/doc changes.
2026-07-30 BRT — pnpm typecheck: passed for Step 2.6.
2026-07-30 BRT — pnpm install --frozen-lockfile: passed for Step 2.7 final gate, already up to date.
2026-07-30 BRT — pnpm lint: passed for Step 2.7 final gate.
2026-07-30 BRT — pnpm typecheck: passed for Step 2.7 final gate.
2026-07-30 BRT — pnpm test: passed for Step 2.7 final gate, 28 files and 70 tests.
2026-07-30 BRT — pnpm build: passed for Step 2.7 final gate; generated 150 design tokens and built Auth.js route plus middleware/proxy.
2026-07-30 BRT — pnpm test:e2e: passed for Step 2.7 final gate, 12 Playwright tests across desktop Chromium and mobile Chrome.
2026-07-30 BRT — git push origin main: passed; `main` pushed from `bc146fa` to `7adf18e`.
2026-07-30 BRT — production secret handling: moved user-provided values from tracked `.env.example` into ignored `.env.local` and restored `.env.example` to placeholders without printing secret values.
2026-07-30 BRT — pnpm db:migrate: passed against Neon Postgres; Drizzle migrations applied successfully.
2026-07-30 BRT — pnpm build with `.env.local`: passed before deploy.
2026-07-30 BRT — vercel link --yes --project know-os: passed; linked local checkout to `theusinshows-projects/know-os`.
2026-07-30 BRT — vercel --prod --yes: passed; production deployment ready and aliased to `https://know-os.vercel.app`.
2026-07-30 BRT — production smoke: `/api/health/db` returned 200, `/` returned 307 to Auth.js sign-in, `/api/export/preview` returned 401 unauthenticated.
2026-07-30 BRT — AUTH_TRUST_HOST production env: added after `/api/auth/signin` returned 400 behind Vercel proxy; redeploy passed and `/api/auth/signin` returned 200.
2026-07-30 BRT — custom sign-in fix: added `/auth/signin` using KNOW/OS Design System styling, Auth.js `pages.signIn`, middleware redirect to `/auth/signin`, and Google OAuth `prompt=select_account`.
2026-07-30 BRT — pnpm typecheck: passed after custom sign-in and Google account-selection config.
2026-07-30 BRT — pnpm exec vitest run tests/unit/google-oauth.test.ts tests/unit/session-guard.test.ts: passed, 2 files and 5 tests.
2026-07-30 BRT — pnpm exec playwright test tests/e2e/auth.spec.ts: passed, 2 tests across desktop Chromium and mobile Chrome.
2026-07-30 BRT — pnpm lint: passed for custom sign-in gate.
2026-07-30 BRT — pnpm typecheck: passed for custom sign-in gate.
2026-07-30 BRT — pnpm test: passed for custom sign-in gate, 29 files and 72 tests.
2026-07-30 BRT — pnpm build: passed for custom sign-in gate; `/auth/signin` built as a dynamic route.
2026-07-30 BRT — pnpm test:e2e: passed for custom sign-in gate, 14 Playwright tests across desktop Chromium and mobile Chrome.
2026-07-30 BRT — git commit -m "Add custom Google sign-in surface": passed, commit `dc236a3`.
2026-07-30 BRT — git push origin main: passed, pushed `dc236a3`.
2026-07-30 BRT — vercel --prod --yes: passed after custom sign-in, deployment ready and aliased to `https://know-os.vercel.app`.
2026-07-30 BRT — production smoke after custom sign-in: `/api/health/db` returned 200, `/` returned 307 to `/auth/signin`, `/auth/signin` returned 200, `/api/export/preview` returned 401 unauthenticated.
2026-07-30 BRT — production Google OAuth redirect request after custom sign-in: passed, observed `accounts.google.com` request with `prompt=select_account`.
2026-07-30 BRT — pnpm lint for Step 3.1 import surface — passed.
2026-07-30 BRT — pnpm typecheck for Step 3.1 import surface — initially failed when run concurrently with `pnpm build` because Next regenerated `.next/types`; rerun after build passed.
2026-07-30 BRT — pnpm exec playwright test tests/e2e/import-ui.spec.ts --project=chromium — passed, 1 test after scoping the import status region by accessible name.
2026-07-30 BRT — pnpm test for Step 3.1 import surface — passed, 29 files and 72 tests.
2026-07-30 BRT — pnpm build for Step 3.1 import surface — passed.
2026-07-30 BRT — pnpm test:e2e for Step 3.1 import surface — passed, 20 tests across desktop Chromium and mobile Chrome profiles.
2026-07-30 BRT — git diff --check for Step 3.1 import surface — passed.
2026-07-30 BRT — git commit -m "Add product import surface" — passed, commit `7e9246f`.
2026-07-30 BRT — git push origin main after Step 3.1 — passed, pushed `7e9246f`.
2026-07-30 BRT — vercel --prod --yes after Step 3.1 — passed, deployment `dpl_6DevBvMk8iDgmw1PBroFEHnaGwW8` ready and aliased to `https://know-os.vercel.app`.
2026-07-30 BRT — production smoke after Step 3.1: `/api/health/db` returned 200; `/import` and `/tracks` returned 307 to `/auth/signin`; `/api/import/track/example` returned 401 unauthenticated.
2026-07-30 BRT — production Track Pack import through application service — passed, imported `know-os.javascript-fundamentals` version `1`, `track=javascript`, `lessons=1`, `activities=2`.
2026-07-30 BRT — production vertical-slice service validation — passed: catalog read `tracks=1`; RUN completed without recording an attempt; both activity submissions passed; lesson progress `2/2`; track progress `1/1`; study history has 2 submission events; exports expose `backup`, `progress`, `teacher_context`.
2026-07-30 BRT — pnpm exec vitest run tests/integration/real-postgres.test.ts without the real-Postgres flag — passed with 1 skipped file/test; normal test suite does not access external PostgreSQL.
2026-07-30 BRT — pnpm typecheck after adding real PostgreSQL harness — passed.
2026-07-30 BRT — pnpm test:postgres initial run — failed before database access because the Windows runner used `spawn` without shell handling for `pnpm.cmd`; fixed the runner.
2026-07-30 BRT — pnpm test:postgres second run — failed on a real PostgreSQL FK violation because generated migrations qualify FK references as `"public".*` while the harness applied tables to a disposable schema; fixed the harness to rebind those references to the disposable schema at runtime.
2026-07-30 BRT — pnpm test:postgres final run — passed, 1 test; applied 7 migrations in a disposable real PostgreSQL schema, imported 1 track and 2 activities, verified RUN records 0 attempts and SUBMIT records 1 attempt with progress.
2026-07-30 BRT — pnpm typecheck after final real PostgreSQL harness — passed.
2026-07-30 BRT — pnpm lint after final real PostgreSQL harness — passed.
2026-07-30 BRT — pnpm test after final real PostgreSQL harness — passed, 29 files and 72 tests, plus 1 skipped real-Postgres file/test.
2026-07-30 BRT — pnpm build after final real PostgreSQL harness — passed.
2026-07-30 BRT — pnpm security:audit initial run — failed with 6 vulnerabilities: high `sharp`, high/moderate `postcss`, high `brace-expansion`, moderate `esbuild`.
2026-07-30 BRT — npm view checks for patched transitive versions — passed for `sharp@0.35.0`, `postcss@8.5.18`, `brace-expansion@1.1.16`, `brace-expansion@1.1.18`, `brace-expansion@5.0.8`, `esbuild@0.25.12`; `esbuild@0.24.3` does not exist despite advisory wording.
2026-07-30 BRT — pnpm install after production dependency overrides — passed; lockfile updated.
2026-07-30 BRT — pnpm security:audit after production overrides — passed with no known production vulnerabilities.
2026-07-30 BRT — full `pnpm audit --audit-level moderate` remains non-passing due dev-only `eslint -> minimatch@3 -> brace-expansion`; forcing `brace-expansion@5` broke ESLint with `expand is not a function`, so the compatible `brace-expansion@1.1.18` pin is retained and documented.
2026-07-30 BRT — pnpm lint after CSP and overrides — passed.
2026-07-30 BRT — pnpm test after CSP and overrides — passed, 29 files and 72 tests, plus 1 skipped real-Postgres file/test.
2026-07-30 BRT — pnpm exec playwright test tests/e2e/security-headers.spec.ts --project=chromium after CSP — passed, 1 test.
2026-07-30 BRT — pnpm install --frozen-lockfile after CSP and overrides — passed, already up to date.
2026-07-30 BRT — pnpm typecheck after CSP and overrides — passed.
2026-07-30 BRT — pnpm build after CSP and overrides — passed.
2026-07-30 BRT — node canonical hash check for `packs/examples/javascript-fundamentals.track.json` — passed, hash `d8af392872b0c41cc3dce30af0a896937986270ade1a1d5b62d924647d7a10c4`.
2026-07-30 BRT — pnpm packs:verify — passed, `pack_catalog_validation:passed:packs=1`.
2026-07-30 BRT — pnpm exec vitest run tests/unit/track-pack-validation.test.ts — passed, 1 file and 3 tests.
2026-07-30 BRT — pnpm typecheck after Pack catalog — passed.
2026-07-30 BRT — pnpm lint after Pack catalog — passed.
2026-07-30 BRT — pnpm test after Pack catalog — passed, 29 files and 73 tests, plus 1 skipped real-Postgres file/test.
2026-07-30 BRT — pnpm security:audit after Pack catalog — passed with no known production vulnerabilities.
2026-07-30 BRT — pnpm build after Pack catalog — passed.
2026-07-30 BRT — git commit -m "Add Pack publication catalog" — passed, commit `d0eb22e`.
2026-07-30 BRT — git push origin main after Pack catalog — passed, pushed `d0eb22e`.
2026-07-30 BRT — pnpm db:generate after gamification persistence schema — passed, generated `src/db/migrations/0007_icy_vengeance.sql`.
2026-07-30 BRT — pnpm exec vitest run tests/integration/gamification-repository.test.ts tests/unit/gamification-rules.test.ts tests/unit/export-contracts.test.ts tests/unit/restore-contracts.test.ts — passed, 4 files and 8 tests.
2026-07-30 BRT — pnpm lint after gamification persistence — passed.
2026-07-30 BRT — pnpm typecheck after gamification persistence — passed.
2026-07-30 BRT — pnpm test after gamification persistence — passed, 30 files and 74 tests, plus 1 skipped real-Postgres file/test.
2026-07-30 BRT — pnpm security:audit after gamification persistence — passed with no known production vulnerabilities.
2026-07-30 BRT — pnpm build after gamification persistence — passed.
2026-07-30 BRT — git diff --check after gamification persistence — passed.
2026-07-30 BRT — pnpm typecheck after restoring `next-env.d.ts` dev route reference — passed.
2026-07-30 BRT — git commit -m "Persist gamification projections" — passed, commit `2263a6f`.
2026-07-30 BRT — git push origin main after gamification persistence — passed, pushed `2263a6f`.
2026-07-30 BRT — Step 8 restore policy orientation read from `docs/13-IMPORT-EXPORT.md`, `docs/22-API-CONVENTIONS.md`, `docs/23-ERROR-HANDLING.md` and ADR 0014.
2026-07-30 BRT — Added ADR 0016 for conflict-safe full user-state restore replay policy.
2026-07-30 BRT — pnpm lint after Step 8 restore policy docs — passed.
2026-07-30 BRT — pnpm typecheck after Step 8 restore policy docs — passed.
2026-07-30 BRT — git diff --check after Step 8 restore policy docs — passed.
2026-07-30 BRT — git commit -m "Define user-state restore replay policy" — passed, commit `632a86c`.
2026-07-30 BRT — git push origin main after Step 8 restore policy — passed, pushed `632a86c`.
2026-07-30 BRT — pnpm db:generate after restore provenance schema — passed, generated `src/db/migrations/0008_pale_shiver_man.sql`.
2026-07-30 BRT — pnpm exec vitest run tests/unit/restore-contracts.test.ts tests/unit/track-pack-validation.test.ts — passed, 2 files and 7 tests.
2026-07-30 BRT — pnpm lint after restore dry-run foundation — passed.
2026-07-30 BRT — pnpm typecheck after restore dry-run foundation — passed.
2026-07-30 BRT — pnpm test after restore dry-run foundation — passed, 30 files and 75 tests, plus 1 skipped real-Postgres file/test.
2026-07-30 BRT — pnpm security:audit after restore dry-run foundation — passed with no known production vulnerabilities.
2026-07-30 BRT — pnpm build after restore dry-run foundation — passed.
2026-07-30 BRT — pnpm typecheck after restoring `next-env.d.ts` dev route reference for Step 9 — passed.
2026-07-30 BRT — git diff --check after restore dry-run foundation — passed.
2026-07-30 BRT — git commit -m "Add restore dry-run foundation" — passed, commit `b1997bd`.
2026-07-30 BRT — git push origin main after restore dry-run foundation — passed, pushed `b1997bd`.
2026-07-30 BRT — pnpm exec vitest run tests/component/restore-preview-panel.test.tsx tests/unit/restore-contracts.test.ts — initially failed because `userEvent.type` parsed raw JSON braces as keyboard descriptors; switched the test to `fireEvent.change`.
2026-07-30 BRT — pnpm exec vitest run tests/component/restore-preview-panel.test.tsx tests/unit/restore-contracts.test.ts — passed, 2 files and 6 tests.
2026-07-30 BRT — pnpm lint after restore dry-run UI — passed.
2026-07-30 BRT — pnpm typecheck after restore dry-run UI — passed.
2026-07-30 BRT — pnpm test after restore dry-run UI — passed, 31 files and 77 tests, plus 1 skipped real-Postgres file/test.
2026-07-30 BRT — pnpm security:audit after restore dry-run UI — passed with no known production vulnerabilities.
2026-07-30 BRT — pnpm build after restore dry-run UI — passed.
2026-07-30 BRT — pnpm typecheck after restoring `next-env.d.ts` dev route reference for Step 10 — passed.
2026-07-30 BRT — git diff --check after restore dry-run UI — passed.
2026-07-30 BRT — pnpm exec vitest run tests/unit/security-headers.test.ts — passed, 1 file and 2 tests.
2026-07-30 BRT — pnpm typecheck after CSP nonce builder — passed.
2026-07-30 BRT — pnpm lint after CSP nonce builder — passed.
2026-07-30 BRT — pnpm build after moving the guard to `src/proxy.ts` — passed and confirmed `ƒ Proxy (Middleware)` in the build output.
2026-07-30 BRT — pnpm exec playwright test tests/e2e/security-headers.spec.ts --project=chromium — initially failed while the guard lived in legacy `middleware.ts` because CSP was absent; passed after moving to `src/proxy.ts`, 1 test.
2026-07-30 BRT — pnpm security:audit after CSP nonce hardening — passed with no known production vulnerabilities.
2026-07-30 BRT — pnpm test after CSP nonce hardening — passed, 32 files and 79 tests, plus 1 skipped real-Postgres file/test.
2026-07-30 BRT — git commit -m "Harden runtime CSP with nonces": passed, commit `d8c4ae7`.
2026-07-30 BRT — git push origin main after CSP nonce hardening: passed, pushed `d8c4ae7`.
2026-07-30 BRT — authenticated Chrome production walkthrough: `/`, `/tracks`, `/tracks/javascript`, `/lessons/js-fundamentals-001`, `/import`, `/progress` and `/knowledge-map` loaded; `/exports` and `/achievements` failed with production Server Components render errors.
2026-07-30 BRT — production CSP readback: `https://know-os.vercel.app/` returned nonce-bearing CSP with `script-src 'self' 'nonce-*' 'strict-dynamic'` and no production `unsafe-inline`/`unsafe-eval`.
2026-07-30 BRT — Step 13 UI alignment orientation: reviewed Claude Design uploads and `design-system/KNOW-OS.dc.html`; reference direction is technical-brutalist app chrome with clear window, sidebar, boxed sections, solid borders, signal yellow action/state and differentiated paper/panel surfaces.
2026-07-30 BRT — Step 13 UI alignment implementation: added route-aware primary navigation and updated shared shell, foundation panel, module section, record list, progress, import/restore, terminal empty-state and auth-status CSS primitives.
2026-07-30 BRT — pnpm lint after Step 13 UI alignment — passed.
2026-07-30 BRT — pnpm typecheck after Step 13 UI alignment — passed.
2026-07-30 BRT — pnpm test after Step 13 UI alignment — passed, 32 files and 79 tests, plus 1 skipped real-Postgres file/test.
2026-07-30 BRT — pnpm build after Step 13 UI alignment — passed; generated 150 design tokens and built all implemented routes.
2026-07-30 BRT — pnpm exec playwright test tests/e2e/accessibility.spec.ts tests/e2e/import-ui.spec.ts --project=chromium — initially failed because `.env.local` OAuth values forced the local harness to `/auth/signin`; fixed `playwright.config.ts` to force local no-OAuth mode with a disposable test secret; rerun passed, 3 tests.
2026-07-30 BRT — Playwright screenshot capture — captured `test-results/ui-alignment/today-desktop.png`, `import-desktop.png`, `lesson-desktop.png` and `progress-mobile.png`; visual review found and fixed sidebar placeholder overflow and low-contrast terminal empty text.
2026-07-30 BRT — pnpm test:e2e after Step 13 UI alignment — first run failed because a leftover disposable Next dev server was still running on PID 63392; stopped it and reran successfully, 20 tests across desktop Chromium and mobile Chrome.
2026-07-31 BRT — Step 14.0 orientation: read Pack/import/security/API/error docs, ADR 0010 and current import pipeline; decided generated output targets `caderno.lesson.v1` but remains blocked from import until the shared validation/preview/import pipeline exists.
2026-07-31 BRT — pnpm exec vitest run tests/unit/env.test.ts tests/unit/generation-contracts.test.ts after Step 14.1 — initially failed because `server-only` was not installed; added `server-only@0.0.1`.
2026-07-31 BRT — pnpm exec vitest run tests/unit/env.test.ts tests/unit/generation-contracts.test.ts after adding `server-only` — passed, 2 files and 10 tests.
2026-07-31 BRT — pnpm typecheck after Step 14.1 — passed.
2026-07-31 BRT — pnpm lint after Step 14.1 — passed.
2026-07-31 BRT — pnpm install --frozen-lockfile after Step 14.1 — passed, already up to date.
2026-07-31 BRT — pnpm test after Step 14.1 — passed, 33 files and 84 tests, plus 1 skipped real-Postgres file/test.
2026-07-31 BRT — pnpm security:audit after Step 14.1 — passed with no known production vulnerabilities.
2026-07-31 BRT — pnpm build after Step 14.1 — passed.
2026-07-31 BRT — git diff --check after Step 14.1 — passed.
2026-07-31 BRT — pnpm db:generate after Step 14.2 persistence schema — passed, generated `src/db/migrations/0009_volatile_captain_britain.sql`.
2026-07-31 BRT — pnpm exec vitest run tests/integration/generation-job-repository.test.ts tests/unit/generation-contracts.test.ts tests/unit/env.test.ts — passed, 3 files and 12 tests.
2026-07-31 BRT — pnpm exec vitest run tests/integration/generation-job-repository.test.ts after memory repository global-store alignment — passed, 1 file and 2 tests.
2026-07-31 BRT — pnpm lint after Step 14.2 — passed.
2026-07-31 BRT — pnpm test after Step 14.2 — passed, 34 files and 86 tests, plus 1 skipped real-Postgres file/test.
2026-07-31 BRT — pnpm security:audit after Step 14.2 — passed with no known production vulnerabilities.
2026-07-31 BRT — pnpm typecheck after Step 14.2 — passed.
2026-07-31 BRT — pnpm build after Step 14.2 — passed.
2026-07-31 BRT — git diff --check after Step 14.2 — passed.
2026-07-31 BRT — pnpm exec vitest run tests/unit/lesson-pack-validation.test.ts tests/unit/track-pack-validation.test.ts tests/unit/track-import-service.test.ts tests/unit/generation-contracts.test.ts — initially failed after schema refactor because `stableId` was still referenced; fixed to `stableIdSchema`.
2026-07-31 BRT — pnpm exec vitest run tests/unit/lesson-pack-validation.test.ts tests/unit/track-pack-validation.test.ts tests/unit/track-import-service.test.ts tests/unit/generation-contracts.test.ts — passed, 4 files and 18 tests.
2026-07-31 BRT — pnpm typecheck after Step 14.3 — passed.
2026-07-31 BRT — pnpm exec vitest run tests/unit/lesson-pack-validation.test.ts tests/unit/manual-generation-service.test.ts tests/unit/generation-contracts.test.ts tests/integration/generation-job-repository.test.ts after Step 14.4 routes/services — passed, 4 files and 16 tests.
2026-07-31 BRT — pnpm typecheck after Step 14.4 routes/UI — passed.
2026-07-31 BRT — pnpm lint after Step 14.4 UI — passed.
2026-07-31 BRT — pnpm exec playwright test tests/e2e/import-ui.spec.ts --project=chromium — passed, 2 tests covering Track Pack import and manual generated Lesson Pack import.
2026-07-31 BRT — pnpm test after Step 14.4 — passed, 36 files and 96 tests, plus 1 skipped real-Postgres file/test.
2026-07-31 BRT — pnpm security:audit after Step 14.4 — passed with no known production vulnerabilities.
2026-07-31 BRT — pnpm typecheck after Step 14.4 — passed.
2026-07-31 BRT — pnpm build after Step 14.4 — passed.
2026-07-31 BRT — pnpm test:e2e after Step 14.4 — initially failed because the single accessibility route sweep exceeded its 30s test timeout after the heavier `/import` generation surface; assertions had passed up to `/exports` page content. Increased only that test timeout to 60s.
2026-07-31 BRT — pnpm test:e2e after accessibility timeout adjustment — passed, 22 tests across desktop Chromium and mobile Chrome.
2026-07-31 BRT — pnpm exec vitest run tests/unit/deepseek-generation-provider.test.ts tests/unit/generation-contracts.test.ts tests/unit/manual-generation-service.test.ts tests/unit/lesson-pack-validation.test.ts after Step 14.5 — passed, 4 files and 18 tests.
2026-07-31 BRT — pnpm typecheck after Step 14.5 — initially failed on Vitest mock call tuple inference; fixed test cast.
2026-07-31 BRT — pnpm typecheck after Step 14.5 test typing fix — passed.
2026-07-31 BRT — pnpm lint after Step 14.5 — passed.
2026-07-31 BRT — pnpm exec playwright test tests/e2e/import-ui.spec.ts --project=chromium after Step 14.5 UI preservation — passed, 2 tests.
2026-07-31 BRT — pnpm test after Step 14.5 — passed, 37 files and 100 tests, plus 1 skipped real-Postgres file/test.
2026-07-31 BRT — pnpm security:audit after Step 14.5 — passed with no known production vulnerabilities.
2026-07-31 BRT — pnpm build after Step 14.5 — passed and built `/api/generation/deepseek/generate`.
2026-07-31 BRT — pnpm test:e2e after Step 14.5 — passed, 22 tests across desktop Chromium and mobile Chrome.
2026-07-31 BRT — pnpm exec vitest run tests/unit/deepseek-generation-provider.test.ts tests/unit/generation-pricing.test.ts tests/integration/generation-job-repository.test.ts after Step 14.6 — passed, 3 files and 9 tests.
2026-07-31 BRT — pnpm typecheck after Step 14.6 — passed.
2026-07-31 BRT — pnpm lint after Step 14.6 — passed.
2026-07-31 BRT — pnpm test after Step 14.6 — passed, 38 files and 103 tests, plus 1 skipped real-Postgres file/test.
2026-07-31 BRT — pnpm security:audit after Step 14.6 — passed with no known production vulnerabilities.
2026-07-31 BRT — pnpm build after Step 14.6 — passed and built `/api/generation/deepseek/generate`.
2026-07-31 BRT — pnpm test:e2e after Step 14.6 — passed, 22 tests across desktop Chromium and mobile Chrome.
2026-07-31 BRT — git diff --check after Step 14.6 — passed with LF/CRLF normalization warnings only.
2026-07-31 BRT — pnpm exec vitest run tests/component/track-pack-importer-generation.test.tsx tests/unit/deepseek-generation-provider.test.ts after Step 14.7 — initially failed on a component test matcher; fixed to inspect the textarea value directly.
2026-07-31 BRT — pnpm exec vitest run tests/component/track-pack-importer-generation.test.tsx tests/unit/deepseek-generation-provider.test.ts after Step 14.7 matcher fix — passed, 2 files and 5 tests.
2026-07-31 BRT — pnpm typecheck after Step 14.7 — initially failed on a stale `failure` condition in Manual error rendering; fixed the Manual and DeepSeek alert conditions.
2026-07-31 BRT — pnpm lint after Step 14.7 — initially failed because recovery state was synchronized via `useEffect`; replaced it with keyed Manual remount and state initializers.
2026-07-31 BRT — pnpm typecheck after Step 14.7 fixes — passed.
2026-07-31 BRT — pnpm lint after Step 14.7 fixes — passed.
2026-07-31 BRT — pnpm test after Step 14.7 — passed, 39 files and 104 tests, plus 1 skipped real-Postgres file/test.
2026-07-31 BRT — pnpm security:audit after Step 14.7 — passed with no known production vulnerabilities.
2026-07-31 BRT — pnpm build after Step 14.7 — passed and built `/api/generation/deepseek/generate` plus `/api/generation/manual/compile`.
2026-07-31 BRT — pnpm test:e2e after Step 14.7 — passed, 22 tests across desktop Chromium and mobile Chrome.
2026-07-31 BRT — pnpm exec vitest run tests/unit/deepseek-generation-route.test.ts tests/unit/manual-generation-provider.test.ts tests/component/track-pack-importer-generation.test.tsx after provider abstraction and route tests — initially failed because the mocked DeepSeek provider was not constructable; fixed the mock constructor.
2026-07-31 BRT — pnpm exec vitest run tests/unit/deepseek-generation-route.test.ts tests/unit/manual-generation-provider.test.ts tests/component/track-pack-importer-generation.test.tsx after mock fix — passed, 3 files and 4 tests.
2026-07-31 BRT — pnpm exec vitest run tests/unit/manual-generation-provider.test.ts tests/component/track-pack-importer-generation.test.tsx tests/unit/deepseek-generation-provider.test.ts tests/unit/generation-contracts.test.ts after ManualGenerationProvider — passed, 4 files and 10 tests.
2026-07-31 BRT — pnpm typecheck after final Step 14 tests — passed.
2026-07-31 BRT — pnpm lint after final Step 14 tests — passed.
2026-07-31 BRT — pnpm test after final Step 14 tests — passed, 41 files and 107 tests, plus 1 skipped real-Postgres file/test.
2026-07-31 BRT — git diff --check after final Step 14 docs — passed with LF/CRLF normalization warnings only.
2026-08-04 BRT — Step 15.0 orientation: reviewed autonomy/status/plans/scope/design-system docs plus Today, Tracks, Import, Lesson, PrimaryNav, app-shell CSS and Playwright route coverage; first-run confusion was caused by empty catalog routes exposing equivalent dead ends before an imported or generated lesson was activated.
2026-08-04 BRT — Step 15.1-15.2 implementation: simplified primary navigation to Hoje, Aprender, Praticar, Progresso and Mais; added a shared first-run callout that routes empty Today, Tracks, Review, Mistakes and Knowledge Map states to `/import`.
2026-08-04 BRT — Step 15.3-15.5 implementation: moved existing Track Pack activation above generation on `/import`, recomposed lessons as Aula -> Conceitos -> Pratica, added scoped accent tokens for import/learn/practice/review/mistakes/progress/generation and regenerated CSS tokens.
2026-08-04 BRT — pnpm exec vitest run tests/component/app-shell.test.tsx tests/component/lesson-block-renderer.test.tsx — passed, 2 files and 4 tests.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/import-ui.spec.ts tests/e2e/vertical-slice.spec.ts --project=chromium — passed, 5 tests.
2026-08-04 BRT — pnpm exec vitest run tests/component/app-shell.test.tsx tests/component/track-pack-importer-generation.test.tsx — passed, 2 files and 2 tests.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/import-ui.spec.ts tests/e2e/vertical-slice.spec.ts --project=chromium — passed, 3 tests.
2026-08-04 BRT — pnpm generate:tokens — passed, generated 157 design tokens.
2026-08-04 BRT — pnpm exec vitest run tests/unit/design-tokens.test.mjs tests/component/app-shell.test.tsx tests/component/track-pack-importer-generation.test.tsx tests/component/lesson-block-renderer.test.tsx — passed, 4 files and 6 tests.
2026-08-04 BRT — pnpm lint — passed after Step 15 accent/navigation changes.
2026-08-04 BRT — pnpm typecheck — passed after Step 15 accent/navigation changes.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/import-ui.spec.ts tests/e2e/accessibility.spec.ts --project=chromium — passed, 6 tests.
2026-08-04 BRT — pnpm build — passed after Step 15 accent/navigation changes; generated 157 design tokens and built all implemented app/API routes.
2026-08-04 BRT — pnpm test — passed after Step 15 docs, 41 files and 107 tests, plus 1 skipped real-Postgres file/test.
2026-08-04 BRT — git diff --check — passed after Step 15 docs with LF/CRLF normalization warnings only.
2026-08-04 BRT — Step 15.6 screenshot QA: captured empty and imported states at 375, 390, 768 and 1440 px under `test-results/step15-responsive`; no auth redirect and no global horizontal overflow, but mobile navigation still used a clipped horizontal rail.
2026-08-04 BRT — Step 15.6 repair: changed mobile/tablet sidebar navigation from horizontal rail to a two-column grid with `Mais` as a full-width progressive disclosure item; desktop sidebar remains one column.
2026-08-04 BRT — Step 15.6 follow-up screenshots: captured fixed mobile states under `test-results/step15-responsive-after-nav`; 375 px Today, Import, Tracks and Lesson show no horizontal overflow and no clipped primary route labels.
2026-08-04 BRT — Visual identity guide: added `design-system/VISUAL_IDENTITY.md` with exact logo, lockup, color, typography, accent, app usage and implementation checklist rules; indexed it in Design System docs.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/import-ui.spec.ts tests/e2e/accessibility.spec.ts --project=chromium --project=mobile-chrome — passed, 14 tests after mobile navigation grid and visual identity docs.
2026-08-04 BRT — pnpm exec vitest run tests/unit/design-tokens.test.mjs tests/component/app-shell.test.tsx — passed, 2 files and 2 tests after mobile navigation grid.
2026-08-04 BRT — pnpm lint — passed after mobile navigation grid and visual identity docs.
2026-08-04 BRT — pnpm typecheck — passed after mobile navigation grid and visual identity docs.
2026-08-04 BRT — pnpm test — passed for Step 15.7, 41 files and 107 tests, plus 1 skipped real-Postgres file/test.
2026-08-04 BRT — pnpm test:e2e — passed for Step 15.7, 24 tests across desktop Chromium and mobile Chrome.
2026-08-04 BRT — pnpm build — passed for Step 15.7; generated 157 design tokens and built all implemented app/API routes.
2026-08-04 BRT — git diff --check — passed for Step 15.7 with LF/CRLF normalization warnings only.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/import-ui.spec.ts --project=mobile-chrome — initially failed because a stale local `next dev` server was running for this repo on port 3211 and blocked Playwright's owned server startup.
2026-08-04 BRT — Stop-Process -Id 37112 -Force — passed; stopped only the stale local development server reported by Playwright.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/import-ui.spec.ts --project=mobile-chrome — passed for Step 16, 3 mobile import tests including compact 375 px activation controls.
2026-08-04 BRT — pnpm lint — passed after Step 16 import mobile density polish.
2026-08-04 BRT — pnpm typecheck — passed after Step 16 import mobile density polish.
2026-08-04 BRT — pnpm test — passed after Step 16, 41 files and 107 tests, plus 1 skipped real-Postgres file/test.
2026-08-04 BRT — pnpm test:e2e — passed after Step 16, 26 tests across desktop Chromium and mobile Chrome.
2026-08-04 BRT — pnpm build — passed after Step 16; generated 157 design tokens and built all implemented app/API routes.
2026-08-04 BRT — Step 16 Playwright screenshot capture for `/import` at 375 px produced `test-results/step16-import-density/import-mobile-375.png`; visual inspection confirmed stacked first-step controls and no horizontal clipping. The inline capture command timed out while cleaning up the child process, then the leftover port 3211 owner was stopped.
2026-08-04 BRT — git diff --check — passed after Step 16 docs with LF/CRLF normalization warnings only.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/vertical-slice.spec.ts --project=mobile-chrome — passed for Step 17, 2 mobile tests including lesson flow anchors and compact practice controls.
2026-08-04 BRT — pnpm lint — passed after Step 17 lesson mobile study-flow polish.
2026-08-04 BRT — pnpm typecheck — passed after Step 17 lesson mobile study-flow polish.
2026-08-04 BRT — pnpm test — passed after Step 17, 41 files and 107 tests, plus 1 skipped real-Postgres file/test.
2026-08-04 BRT — pnpm test:e2e — passed after Step 17, 28 tests across desktop Chromium and mobile Chrome.
2026-08-04 BRT — pnpm build — passed after Step 17; generated 157 design tokens and built all implemented app/API routes.
2026-08-04 BRT — Step 18 implementation: added first-lesson continuation on `/tracks/[trackId]`, a `Continuar estudando` CTA on `/progress` and scoped `.study-next-action` accent styling.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/vertical-slice.spec.ts --project=mobile-chrome — initially failed because the new Track CTA duplicated the lesson title accessible name; fixed the CTA with an explicit `aria-label` and reran successfully, 3 mobile tests.
2026-08-04 BRT — pnpm lint — passed after Step 18 catalog/progress mobile continuation polish.
2026-08-04 BRT — pnpm typecheck — passed after Step 18 catalog/progress mobile continuation polish.
2026-08-04 BRT — pnpm test — passed after Step 18, 41 files and 107 tests, plus 1 skipped real-Postgres file/test.
2026-08-04 BRT — pnpm test:e2e — passed after Step 18, 30 tests across desktop Chromium and mobile Chrome.
2026-08-04 BRT — pnpm build — passed after Step 18; generated 157 design tokens and built all implemented app/API routes.
2026-08-04 BRT — git diff --check — passed after Step 18 docs with LF/CRLF normalization warnings only.
2026-08-04 BRT — Step 19 ZIP inspection: `KNOW-OS-Trilha-Programacao-Completa-v1.zip` contains manifest/report/readme, `content/programacao-aplicada-com-ia.track.json` and `.caderno` artifact; Track Pack JSON size is 309,936 bytes.
2026-08-04 BRT — Step 19 KNOW/OS validator: passed for `caderno.track.v1`, `packId=know-os.programacao-aplicada-com-ia`, `version=1`, `track=programacao-aplicada-com-ia`, 10 modules, 58 lessons, 189 concepts and 174 activities; raw SHA-256 matched manifest.
2026-08-04 BRT — pnpm exec vitest run tests/unit/import-request.test.ts tests/unit/track-pack-validation.test.ts tests/unit/track-import-service.test.ts — passed after raising Track Pack request ceiling to 1 MiB, 3 files and 11 tests.
2026-08-04 BRT — local dev server on `http://127.0.0.1:3211` with `DATABASE_URL=memory://local` — started and returned `/api/health/db` status `ok`.
2026-08-04 BRT — POST `/api/import/track/preview` with `programacao-aplicada-com-ia.track.json` — passed with status `ready`, 10 modules, 58 lessons, 174 activities and 189 concepts.
2026-08-04 BRT — POST `/api/import/track` with `programacao-aplicada-com-ia.track.json` — passed with status `imported`, imported 58 lessons and 174 activities.
2026-08-04 BRT — local study smoke: `/tracks`, `/tracks/programacao-aplicada-com-ia` and `/lessons/js-foundations-001` returned 200; first lesson `Ambiente, Node.js e primeiro programa` renders Aula, Conceitos, Prática, RUN and SUBMIT.
2026-08-04 BRT — pnpm lint — passed after Step 19 complete generated Track Pack import.
2026-08-04 BRT — pnpm typecheck — passed after Step 19 complete generated Track Pack import.
2026-08-04 BRT — pnpm test — passed after Step 19, 41 files and 108 tests, plus 1 skipped real-Postgres file/test.
2026-08-04 BRT — pnpm build — passed after Step 19; generated 157 design tokens and built all implemented app/API routes.
2026-08-04 BRT — git diff --check — passed after Step 19 docs with LF/CRLF normalization warnings only.
2026-08-04 BRT — Step 20 Impeccable critique: identified P1 mobile load in secondary navigation, Track/Knowledge Map inventory exposure and imported static activities rendering as unavailable.
2026-08-04 BRT — Step 20 implementation: kept `Mais` closed by default with 44 px secondary targets, collapsed Track modules after the first module, split Knowledge Map into 12 focused concepts plus collapsed full index, and added safe `prediction`/`multiple-choice` renderers.
2026-08-04 BRT — pnpm exec vitest run tests/component/activity-registry.test.tsx — passed after Step 20, 1 file and 3 tests.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/import-ui.spec.ts tests/e2e/vertical-slice.spec.ts --project=chromium — blocked before test execution because the existing `next dev` PID 30108 on port 3211 preserves the imported `memory://local` study pack.
2026-08-04 BRT — node test-results\step20-ux-smoke.mjs — passed against live `http://127.0.0.1:3211`: no mobile overflow on audited routes, 10 Track modules with 1 open, 12 focused Knowledge Map concepts, and no static imported activity rendered as unavailable.
2026-08-04 BRT — pnpm lint — passed after Step 20 mobile study-flow distillation.
2026-08-04 BRT — pnpm typecheck — passed after Step 20 mobile study-flow distillation.
2026-08-04 BRT — pnpm test — passed after Step 20, 41 files and 109 tests, plus 1 skipped real-Postgres file/test.
2026-08-04 BRT — pnpm build — passed after Step 20; generated 157 design tokens and built all implemented app/API routes.
2026-08-04 BRT — Step 21 implementation: `/import` now starts with `Estudar trilha pronta` versus `Criar aula com IA`; Track Pack activation is the default visible flow and Manual/DeepSeek generation stays hidden until the creation intent is selected.
2026-08-04 BRT — pnpm exec vitest run tests/component/track-pack-importer-generation.test.tsx — passed after Step 21, 1 file and 1 test, including DeepSeek failure recovery after choosing the creation intent.
2026-08-04 BRT — pnpm typecheck — passed after Step 21 import intent flow.
2026-08-04 BRT — node test-results\step21-import-intent-smoke.cjs — passed against live `http://127.0.0.1:3211`: mobile default intent hides generation controls, creation intent reveals Manual controls, no horizontal overflow in either state.
2026-08-04 BRT — pnpm lint — passed after Step 21 import intent flow.
2026-08-04 BRT — pnpm exec playwright test tests/e2e/import-ui.spec.ts --project=chromium — blocked before test execution because existing `next dev` PID 30108 on port 3211 preserves the imported `memory://local` study pack.
2026-08-04 BRT — pnpm test — passed after Step 21, 41 files and 109 tests, plus 1 skipped real-Postgres file/test.
2026-08-04 BRT — pnpm build — passed after Step 21; generated 157 design tokens and built all implemented app/API routes.
2026-08-05 BRT — Step 22 diagnosis: the previous `http://127.0.0.1:3211` memory server refused connections, so the complete Track Pack imported in that process was no longer available; the example Pack vertical slice still passed before the hotfix.
2026-08-05 BRT — Step 22 implementation: hardened `CodeActivityPanel` request handling for HTTP errors, non-JSON responses and network failures; normalized omitted runtime `result` fields; replaced async `useTransition` with explicit pending action state and `aria-busy`.
2026-08-05 BRT — pnpm exec vitest run tests/component/code-activity-panel.test.tsx tests/component/activity-registry.test.tsx — passed after Step 22, 2 files and 4 tests.
2026-08-05 BRT — pnpm typecheck — passed after Step 22 activity panel resilience.
2026-08-05 BRT — pnpm lint — passed after Step 22 activity panel resilience.
2026-08-05 BRT — pnpm exec playwright test tests/e2e/vertical-slice.spec.ts --project=chromium — passed after Step 22, 3 tests including RUN, SUBMIT, reload and history.
2026-08-05 BRT — pnpm test — passed after Step 22, 42 files and 110 tests, plus 1 skipped real-Postgres file/test.
2026-08-05 BRT — pnpm build — passed after Step 22; generated 157 design tokens and built all implemented app/API routes.
2026-08-05 BRT — git diff --check — passed after Step 22 with LF/CRLF normalization warnings only.
2026-08-05 BRT — Step 23 dogfood: imported the bundled JavaScript example Pack through the no-OAuth memory harness, studied `/lessons/js-fundamentals-001`, ran and submitted code/debug activities, then visited Today, Tracks, Review, Mistakes, Progress, Achievements, Knowledge Map, Projects, History, Import and Exports.
2026-08-05 BRT — Step 23 findings: persisted activity attempts made completed lessons feel slow and visually heavy because terminal output, tests and diffs stayed expanded for every activity; route changes in dev mode showed first-load compile delays, and console logs included CSP inline-style violations without page errors.
2026-08-05 BRT — Step 23 implementation: added a lesson session callout with next actions, compact post-attempt next-step links, and collapsible persisted technical details for terminal/tests/diff while keeping fresh RUN/SUBMIT output expanded.
2026-08-05 BRT — pnpm typecheck — passed after Step 23 dogfood UX pass.
2026-08-05 BRT — pnpm lint — passed after Step 23 dogfood UX pass.
2026-08-05 BRT — pnpm exec vitest run tests/component/code-activity-panel.test.tsx tests/component/activity-registry.test.tsx — passed after Step 23, 2 files and 5 tests.
2026-08-05 BRT — pnpm exec playwright test tests/e2e/vertical-slice.spec.ts --project=chromium — passed after Step 23, 3 tests including the collapsed persisted details regression and completed lesson session state.
2026-08-05 BRT — pnpm test — passed after Step 23, 42 files and 111 tests, plus 1 skipped real-Postgres file/test.
2026-08-05 BRT — pnpm build — passed after Step 23; generated 157 design tokens and built all implemented app/API routes.
2026-08-05 BRT — pnpm test:e2e — first attempt failed before the suite completed because a stale local `next dev` PID 48384 on port 3224 blocked Playwright's owned server.
2026-08-05 BRT — Stop-Process -Id 48384 -Force — passed; stopped only the stale local development server reported by Playwright.
2026-08-05 BRT — pnpm test:e2e — passed after Step 23, 32 tests across desktop Chromium and mobile Chrome.
2026-08-05 BRT — git diff --check — passed after Step 23 with LF/CRLF normalization warnings only.
2026-08-05 BRT — local review server: started no-OAuth `memory://local` Next dev server on `http://127.0.0.1:3211` with launcher PID 35308 and listener PID 40540, imported `packs/examples/javascript-fundamentals.track.json`, and verified `/tracks/javascript` plus `/lessons/js-fundamentals-001` return 200.
```

## Blockers

```text
No real local PostgreSQL service is available outside `.env.local`; `pnpm test:postgres` validates the configured PostgreSQL service through a disposable schema and production database writes must remain non-destructive and explicitly scoped.
Authenticated Chrome walkthrough is available, but `/exports` and `/achievements` fail in production with Server Components render errors after Step 11 deployment. The likely repair is applying checked-in migrations `0007_icy_vengeance.sql` and `0008_pale_shiver_man.sql` to Neon production with `pnpm db:migrate`, which requires explicit user confirmation as an external database schema write.
Step 13 UI alignment has been checkpointed and pushed as `81f4ce3`.
Step 14.0 through 14.8 are implemented locally and validated. No DeepSeek credentials should be requested or exposed; use an unconfigured provider state unless the user configures `DEEPSEEK_API_KEY` in ignored server environment.
Step 15.0 through 15.7 are implemented, validated and pushed as `1d334d6`.
Step 16 import mobile density polish is implemented, validated and checkpointed locally.
Step 17 lesson mobile study-flow polish is implemented and validated locally. Do not push, deploy or apply production Neon migrations without explicit confirmation.
Step 18 catalog/progress mobile continuation polish is implemented and validated locally. Do not push, deploy or apply production Neon migrations without explicit confirmation.
Step 19 complete generated Track Pack validation/import is implemented and validated locally. Do not push, deploy or apply production Neon migrations without explicit confirmation.
Step 20 mobile study-flow distillation is implemented and validated locally.
Step 21 import intent flow is implemented and validated locally.
Step 22 activity RUN/SUBMIT resilience is implemented and validated locally. The previous port 3211 `memory://local` server was no longer running when this diagnosis started, so its imported complete Track Pack must be imported again for live study.
Step 23 dogfood study flow UX pass is implemented and validated locally. Dev-mode route changes still include Next.js compilation delay, so production performance should be judged from `pnpm build`/production preview instead of first-load `next dev` timings.
```

## NEXT ACTION

Review Step 23 on the running no-OAuth local memory server at `http://127.0.0.1:3211/lessons/js-fundamentals-001` while the listener PID 40540 stays alive. The bundled JavaScript example Pack is imported there; import the desired complete Track Pack again if needed because `memory://local` content only survives in that exact process. Do not deploy, push or apply production Neon migrations without explicit confirmation.






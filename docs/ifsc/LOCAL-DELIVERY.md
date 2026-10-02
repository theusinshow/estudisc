# Local IFSC delivery — 2026-10-01

Checkout: `C:\Dev\pessoal\vecta`. `origin` is `https://github.com/theusinshow/vecta.git`. Inherited KNOW/OS history is preserved; the original checkout was used read-only. Commits are local. No push, deployment or production migration occurred.

## Working engineering paths

- Compatible v1/v2 Pack validation and transactional import; immutable stable versions and historical module context.
- Educational Blocks/Activities, four Golden Lessons, shared server-scored Questions, attested hints/solution exposure.
- Private Google ADMIN/STUDENT owners; deterministic `mastery.v2`, `review.v2`, prerequisite/budget/subject-aware planner; frozen/resumable StudySessions.
- Assessment instances freeze exact question versions and alternative order, save mutable responses/flags, enforce deadlines and finalize Attempts/evidence exactly once. Results expose keys only after finalization and avoid claims about admission probability.
- Mini, subject, full, broad/targeted and protected official templates use the same assessment engine. Reserved benchmarks require an explicit configured availability date; full exams require 28 items, seven per area, five choices and four hours in the exam settings.
- Private original PNG assets require Admin or an owner-granted frozen question/assessment context. Student exports omit editorial manifests containing protected text/keys; assessment Attempts remain present in owner exports.
- `/admin` previews content and sources, shows derived coverage and QA, and accepts validated JSON authoring actions. Four independent QA layers control publication; serious post-publication rejection withdraws the release. The author cannot self-approve. V2 GenerationJobs compile source contexts, validate draft output linked to the exact run and import through the existing importer.
- Optional bounded tutor reuses the existing server gateway, receives minimized current-item context and conservatively records solution exposure. EXAM blocks tutor/assistance. Credentials are optional for learning/scoring/planning.
- Student bottom navigation: Hoje, Aprender, Progresso, Mais; Admin actions are hidden from Student navigation and protected at the server. Dynamic private pages avoid shared prerendered owner state. Cross-site API mutations are rejected.

## Editorial state — intentionally unpublished

The user explicitly chose **draft content for human review**, without subagents or automatic content approval.

The source pack contains 27 official numbered Anexo V requirements, 378 atomic Concepts across 68 editorial Lesson records (including the prerequisite mini-lesson), 29 Golden Questions and 112 original Integrated Questions. All requirements have proposed mappings. A test week of AI-assisted draft Lessons now exists for MAT-01–06 and MAT-08–10 (`packs/seeds/ifsc-2027.lesson-drafts/`, expanded by `scripts/expand-ifsc-lesson-drafts.mjs`). Parallel agents only authored these drafts and approved nothing. There are **54 Lessons without authored teaching/practice/exit tickets**, and none of the seed content has fabricated independent QA. Mapping is not validated coverage or planner readiness.

The 112 original items have definitive-key provenance; 2025.1 Q15 is annulled and evidence-ineligible, and 56 items from 2026 are reserved. OCR was necessary for the 2025.2 source. All source text ordering, stimulus page coverage, classification and accessible figure descriptions still require human verification. The manually corrected Q18 is not an independent approval.

The application rejects draft content for Student study and planning. Human reviewers must complete the missing teaching material, review each immutable version against original sources, resolve findings, import the referenced PNGs and approve the four QA layers. Lesson release requires objectives, published exit tickets and at least two published training Questions per Concept. The curriculum-complete projection also requires independently approved source scope/mapping.

## Rebuild the private editorial artifacts

Use the bundled Python environment with `pdfplumber` and Pillow:

1. Keep original exam/key PDFs under `sources/ifsc/historical` and the edital under `sources/ifsc`.
2. For 2025.2, render pages and run `scripts/ocr-ifsc-pdf-pages.ps1`; the retained ingestion script documents the OCR folder contract.
3. Run `scripts/ingest-ifsc-official.py --render`.
4. Run `scripts/build-ifsc-source-pack.py`.
5. Run `node scripts/build-ifsc-assessments.mjs`.

Artifacts remain ignored under `.local/ifsc-official`: `bank.draft.json`, `track.source-pack.v2.json`, `coverage.inventory.json`, `assessment-templates.draft.json`, original-page PNGs and SHA-256 references. Benchmark dates are editable in `packs/seeds/ifsc-2027.exam-settings.json`. Protected source material is not committed or served from `public`.

## Validation and limits

The final full local suite passed 134 tests in 60 files, with one real-PostgreSQL test skipped. All checked-in migrations were exercised in disposable PGlite, including the full private Pack and authenticated image persistence. Lint, TypeScript and production build passed. Five mobile checks covered navigation/overflow/touch/skip-link plus prerequisite study, percentage submission, reload/resume and session result. An additional focused generation gate passed eight tests after blocking v2 in the legacy v1 provider route; it avoids a provider call whose output that route cannot import. These are engineering checks, not content approvals.

The inherited dependency audit reported six advisories. Next.js and its lint config now use 16.3.6; inherited overrides now resolve PostCSS 8.5.23, sharp 0.35.5 and nanoid 3.3.19. `pnpm security:audit` passes with no known production vulnerabilities. Security fix references: [Next.js 16.3.6 release](https://github.com/vercel/next.js/releases/tag/v16.3.6) and [Windows-hosted server advisory](https://github.com/advisories/GHSA-p293-qw3h-jr36).

Final commands: `pnpm typecheck`; `pnpm lint`; `pnpm test`; `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/percentage-study.spec.ts --project=mobile-chrome`; `pnpm exec vitest run tests/unit/deepseek-generation-route.test.ts tests/unit/generation-contracts.test.ts`; `pnpm build`; `pnpm security:audit`; `git diff --check`.

Added migrations: `0010_real_blur.sql` (curriculum), `0011_ordinary_lockjaw.sql` (Question Bank), `0012_strange_changeling.sql` (assistance/profiles/sessions), `0013_petite_storm.sql` (review metadata), `0014_useful_night_nurse.sql` (assessments), `0015_open_captain_america.sql` (private assets), `0016_heavy_sebastian_shaw.sql` (QA releases/reviews), `0017_lowly_hercules.sql` (Lesson identity scoped to Module). Drizzle journal/snapshots are tracked; no production migration ran.

`memory://local` is a disposable development/E2E harness and is rejected in production. Persistent local/production operation needs PostgreSQL and either configured Google allowlists/ADMIN roles or dev-created code accounts (ADR 0031: `node scripts/create-account.mjs "Nome" 123456 [--admin]`, then copy `KNOW_OS_ACCOUNTS` and `AUTH_SECRET` to the host) from `.env.example`; no credentials were copied from the original checkout. No real-provider tutor call or real-PostgreSQL deployment was validated. Full curriculum acceptance and production readiness remain open until teaching coverage, human QA and environment release are complete.

Not all `17-ACCEPTANCE-CRITERIA.md` gates pass. The detailed matrix is in `IMPLEMENTATION-AUDIT.md`. Additional limits include minimal JSON-based Admin authoring rather than complete student-management/analytics/filter views, incomplete backup restoration for assessment/private-asset state, unverified live tutor usage controls and no full assessment browser E2E. Push, deployment and real database migration remain external actions requiring explicit authorization.

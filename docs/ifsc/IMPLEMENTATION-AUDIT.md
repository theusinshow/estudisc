# IFSC implementation audit

Date: 2026-10-01. Active checkout: `C:\Dev\pessoal\vecta`.

## IFSC-00

Integrated ADRs 0017–0029, preserving the text of ADR 0008 and superseding its single-owner constraint. ADR 0015 remains Accepted. Core docs, agent rules, roadmap and canonical Design System v3 tokens are reconciled. The extracted package remains an ignored historical input; agent prompt instructions in it do not replace the user's continuous execution request. The source package audit says 67 files, while its manifest/archive contain 68; no required specification file is missing.

Validation:

- `pnpm install --frozen-lockfile`: passed; Node 24.14.0, local pnpm 11.25.0 (repository declared 11.9.0); lockfile unchanged.
- `pnpm lint`: passed, initially with four warnings from temporary integration scripts; those scripts were removed and lint rerun.
- `pnpm typecheck`: passed.
- `pnpm test`: 42 test files passed / 1 skipped; 111 tests passed / 1 skipped. The skipped test requires a real PostgreSQL URL; no production credential was read.
- `pnpm exec vitest run tests/unit/design-tokens.test.mjs`: passed after the final token merge.
- `pnpm build`: passed after the final token merge.
- `pnpm exec playwright test tests/e2e/shell.spec.ts`: 8 passed (desktop/mobile).

At this initial gate, runtime milestones were pending. Later runtime gates are recorded below. Migrations were subsequently exercised only in disposable databases; no external write occurred.

## Source inventory

The original checkout's untracked exam/key PDFs were copied into `sources/ifsc/historical`, outside `public/`. Integrated editions 2025.1, 2025.2, 2026.1 and 2026.2 are the primary set; Subsequente files are supplementary and excluded from the benchmark. Original source files are locally ignored. Official assets must be delivered through authorized exposure checks when the bank is implemented.

The authoritative `EDITAL 05_2027_1_TECNICO_INTEGRADO_PROVA ok (1).pdf` was found in Downloads and copied into `sources/ifsc`. Its Anexo V must be checked before claiming complete curriculum coverage.

## Milestones

- IFSC-00: complete; final lint passed without warnings.
- IFSC-01: curriculum foundation implemented; basic gate recorded below.
- IFSC-02: compatible Pack v2 and shared Question Bank implemented; basic gate recorded below.
- IFSC-03–09: implemented locally with the engineering gates below; seeds remain draft.
- IFSC-10/11: original-bank ingestion, private assets and simulation templates implemented; transcription/classification and benchmark publication await human QA.
- IFSC-12/13: editorial gates, v2 GenerationJobs and bounded contextual tutor implemented; live provider invocation is unverified.
- IFSC-14: proposed full requirement mapping and draft inventory exist; 63 teaching lessons and independent QA remain open.
- IFSC-15: local hardening and mobile smoke passed; production observation and final content acceptance remain open.

Final acceptance was audited against `17-ACCEPTANCE-CRITERIA.md`; the matrix below records passing local mechanisms separately from open release/content gates. Not all IFSC acceptance criteria pass.

## IFSC-01

Added six curriculum/source tables, same-Track relational constraints, Module subject metadata, atomic/idempotent foundation seed, graph/reference validators and derived coverage queries. Seed: four Modules, six MAT-07 Concepts plus three prerequisites; one mapped percentage requirement. Official scope remains explicitly unverified and published/QA content readiness remains absent, so the system cannot falsely claim curriculum completion.

Migration: `0010_real_blur.sql` and matching Drizzle snapshot/journal. The generated Module composite unique constraint was moved before foreign keys referencing it; all migrations were verified in disposable PGlite. No production database was used.

Basic validation under the user's updated testing preference: `pnpm exec vitest run tests/unit/curriculum.test.ts tests/integration/curriculum-repository.test.ts` — 3 passed. Covers repeat seed, rollback, existing-graph cycles, subject/reference checks and incomplete coverage. `pnpm typecheck` passed; lint rerun after correcting the fixture variable name. No redundant full build/E2E for this non-UI increment.

Target remote changed to `https://github.com/theusinshow/estudisc.git` per user instruction. Successful `git ls-remote` returned no refs; `origin` now points there, inherited local history is preserved, and no push occurred.

## IFSC-02

Added strict Zod v2 parsing alongside unchanged v1 parsing, semantic curriculum/question/source/provenance/exposure checks, runtime capability rejection, atomic importer extensions and versioned Question persistence. New migration `0011_ordinary_lockjaw.sql` adds five Question tables and Lesson metadata. Owner IDs follow the actual repository text-ID convention. Payloads cannot override validated type/identity fields. Supplied JSON Schema remains the initial shape reference; runtime contracts currently narrow rich content to safe plain text and require typed answer definitions.

Basic gate: `pnpm exec vitest run tests/unit/track-pack-v2.test.ts tests/integration/track-pack-v2.test.ts tests/unit/track-import-service.test.ts tests/unit/track-pack-validation.test.ts` — 11 passed; typecheck/lint passed. The integration test applies migrations in disposable PGlite and verifies v1/v2 import, idempotence, version conflict rollback and old Question reconstruction. No production migration was applied.

The supplied minimal example parses structurally but activation rejects its not-yet-registered numeric explorer/Question activity. This is intentional until IFSC-03; v2 fixtures with available capabilities import normally. Full student use, publication QA and final acceptance are pending.

## IFSC-03 — educational interactions

Extended the existing registries with numeric, ordering, matching, classification, text-highlight, guided steps and numeric exploration. Controls support keyboard/touch without dragging; invalid configuration has a safe fallback. Question references freeze the bank version on import. Guided checks are formative; official durable submissions are connected in IFSC-04.

Validation: 12 focused tests passed (interaction components, evaluator, registry, renderer and v2 import); `pnpm typecheck` and `pnpm lint` passed. Touch sizes follow generated v3 tokens. Integrated student mobile flow remains the IFSC-04 gate.

## IFSC-04/05/06 — percentage slice, policies and sessions

Functional slice implemented using existing Attempts/evidence/review/registry/catalog. Server scoring, response retry keys, monotonic hint/solution exposure, exact question references, distinct private Google owners and Admin route protection. PLANNED/ACTIVE/COMPLETED/ABANDONED sessions have owner-scoped transactional transitions; ACTIVE structure is frozen and resumes. Submitted answers survive reload. Results distinguish participation from mastery.

Versioned mastery.v2/review.v2 preserve v1. Independent, varied, later retrieval and transfer are required for Mastered; retention can become review-due independently. Reviews use adaptive 1/3/7/14/30 scheduling. Self-rating in v2 is reflection and cannot create successful retrieval evidence.

Evidence: focused profile/registry/import tests passed; migrated percentage integration passed (retry conflict, exactly one Attempt/evidence/review, owner isolation, frozen ACTIVE, result); deterministic policy tests passed; mobile Playwright percentage flow passed with 44px+ controls/no horizontal overflow/reload/result. Typecheck/lint passed.

Content boundary: `packs/seeds/ifsc-2027.golden.track.v2.json` contains draft AI-authored MAT-07 with truthful provenance and six questions. No independent publication review is fabricated. Disposable tests alone simulate published data. Functional infrastructure is verified; live student content/publication and full content-readiness acceptance remain pending the QA gate. Planner generalization is next. No production migration or remote write.

## IFSC-07 — deterministic planner

Planner policy now prioritizes real due reviews, weakness, curriculum importance, required prerequisites, weekly subject balance and configurable exam phases. Selection respects time budgets, excludes reserved/unavailable questions and caps new learning. PostgreSQL and memory adapters use the same pure priority policy; a new plan never rewrites ACTIVE structure. Expired PLANNED sessions are abandoned rather than becoming lesson debt. MAT prerequisite draft now contains actual teaching and three retrieval questions.

Focused policy and migrated slice tests passed; typecheck/lint passed. Live planner-ready QA certification remains pending IFSC-12 and is not claimed. Performance and multi-subject golden regression receive the final integrated check.

## IFSC-08 — four Golden Lessons

Draft Golden content now includes MAT-07, POR-01, CIE-06 and GH-06, plus prerequisite mathematics. Existing Block registry gained a keyboard/touch atom model with structured table and prediction; timeline uses ordering buttons. Shared Questions cover numerical, multiple-choice, matching and ordering. Text highlighting/classification remain guided interactions.

Verified official edital Anexo V pages 41–43 visually and by extraction: exam 29 November 2026 at 14:00, 4h, 28 questions (7 per area). Source PDF is private and unchanged. GH source references include the Planalto texts of Laws 581/1850, 2040/1871, 3353/1888 and Biblioteca Nacional's abolition material. Seed provenance is generated, never official.

Focused checks: all four Golden Lessons validate/render via canonical registry; every shared Question completes with the real evaluator in the disposable memory adapter. Typecheck/lint passed. Independent content QA remains pending; no draft is represented as published curriculum.

## IFSC-09 — unified assessment engine

One engine now supports all six assessment kinds via immutable versioned templates and frozen instances. Choices/order/time/policy are frozen; responses remain mutable until finalization. Server deadlines reject late response updates. Finalization row-locks owner/instance, emits immutable Attempts and multi-Concept evidence, review/mistake projections and result in one transaction; retries return the stored result. Official annulled items do not score or produce evidence. Active EXAM blocks ordinary question hint/solution endpoints. Protected templates check configured availability.

Student surfaces include assessment list/resume, saving/changing responses, timer, finalization and per-subject/result review. DTOs contain no answer or explanation before finish. Admin template endpoints require ADMIN.

Validation: migrated PGlite integration passed (resume/start retry, mutable responses, no provisional Attempts, deadline/owner protection, finalization exactly once). Typecheck/lint passed. Broad/final template seeding, actual official assets, final mobile assessment E2E and independent content QA remain visible pending items for IFSC-10/11/12/15.

## IFSC-10–15 — final local engineering audit

The private source pack now imports 141 Questions (112 official, 29 Golden), 378 Concepts and 27 numbered Anexo V requirements into disposable PGlite. Original-page PNG hashes and authenticated persistence were checked. Twelve draft assessment templates validate through the shared engine. Official annulment, reserved availability and full composition checks are enforced. See `OFFICIAL-BANK-INGESTION.md` for OCR/transcription limits.

Editorial releases preserve author/hash/version, require all four independent layers, reject self-review, enforce minimum Question coverage and withdraw a published release after rejection. V2 GenerationJobs use the existing compiler/importer with exact run provenance. The optional tutor uses the existing gateway; no live provider call was made.

The user chose draft content for human review. The full mapping is proposed rather than approved; 63 of 68 Lesson records have no authored teaching/practice/exit ticket. Derived coverage cannot report complete or planner-ready from this inventory. No independent reviews or publication were fabricated.

| Acceptance group | Local evidence | Open acceptance/release limits |
| --- | --- | --- |
| Curriculum | Strict references/cycles; complete proposed source inventory; QA-derived coverage | Human source-scope/classification verification and teaching coverage |
| Lesson system / regression | Four Golden Lessons validate/render/complete; invalid types fail safely; mobile percentage resume | Full content release; comprehensive assessment browser flow |
| Question / Attempts | Deterministic evaluators, immutable versions, retry/ownership and transaction integration | Human key/stimulus/accessibility review of official transcription |
| Mastery / Review / Planner | Versioned deterministic policies, prerequisite/budget/balance tests, frozen sessions | Tuning with actual multi-subject published curriculum and study history |
| Assessments / Diagnostic | Version/order freezing, mutable responses, deadlines, once-only evidence; broad/targeted templates and limited-confidence signals | Human-approved templates; student benchmark release and usability observation |
| Content QA | Independent-layer gates, self-approval rejection, immutable releases, withdrawal regression | Actual human approval and completion of 63 teaching gaps |
| Tutor | Bounded/minimized context, EXAM guard, persisted exposure | Live provider verification, usage controls and operational monitoring |
| Mobile / Design | Four-item bottom nav, role-aware actions; mobile shell and percentage E2E | Broader real-device observation and complete assessment E2E |
| Security / Privacy | Owner isolation, handler Admin gates, private PNGs, answer-safe DTOs, cross-site mutation guard, production memory harness prohibition | Real PostgreSQL/OAuth environment verification; full assessment/asset backup restoration |

The Admin authoring surface is a minimal JSON-based CMS with previews, coverage and QA; rich filters, student-management and analytics views remain limited. Production observation/PWA were not claimed. No live migration, deployment, push or protected-material publication occurred. Added migrations are `0010`–`0017` (curriculum, Questions, profiles/study, assessments, private assets, QA releases, scoped Lesson identity); all are tracked with Drizzle metadata.

Final command/result inventory:

- `pnpm test`: final updated-dependency gate passed 60 files / 134 tests; one real-PostgreSQL test skipped.
- `pnpm exec vitest run tests/unit/mutation-origin.test.ts tests/component/app-shell.test.tsx tests/integration/content-release.test.ts`: 3 files / 3 tests passed after final origin/navigation/withdrawal fixes.
- `pnpm exec playwright test tests/e2e/shell.spec.ts --project=mobile-chrome`: 4 passed.
- `pnpm exec playwright test tests/e2e/percentage-study.spec.ts --project=mobile-chrome`: 1 passed, including reload/resume, prerequisite retrieval and result.
- The final combined mobile command reran both files after dependency remediation: five passed.
- `pnpm exec vitest run tests/unit/deepseek-generation-route.test.ts tests/unit/generation-contracts.test.ts`: eight passed after rejecting v2 in the legacy v1 provider route before any paid call.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `git diff --check`: passed; the updated-dependency gate is recorded in `LOCAL-DELIVERY.md`.

The production dependency audit found six advisories in the inherited lockfile. Next.js and its lint config were upgraded together to 16.3.6, with patched transitive resolution. Details and final audit/build results are recorded in `LOCAL-DELIVERY.md`; old milestone version numbers above are historical.

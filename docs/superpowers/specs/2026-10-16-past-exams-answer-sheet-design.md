# Past exams (Provas anteriores) — answer-sheet assessments

Status: Draft for owner review
Date: 2026-10-16
Branch: `feat/past-exams-20261016`
Source package: `ESTUDISC-PROVAS-ANTERIORES-IFSC-2022-2026.zip` (catalog verified 2026-10-16)

## Goal

Give students a "Provas anteriores" page with the 11 IFSC Integrated editions 2022.1–2026.2 (including the 2024.1 Itajaí variant). The student opens the official question booklet on the IFSC site, fills a digital A–E answer sheet under exam conditions, and gets a server-side correction plus progress across editions.

## Decisions taken in brainstorming

1. **Source:** `catalogo/ifsc-provas-anteriores.json` from the package. It holds metadata, definitive answer keys, annulled items and official URLs. It contains no booklet PDFs; the product links to the official IFSC files and does not re-host them.
2. **Reservation kept (ADR 0023 unchanged):** 2026.1 and 2026.2 remain protected benchmarks. They appear as "reserved" and open in the same answer-sheet format on their configured release dates. Current plan: 2026.1 on 2026-11-09 and 2026.2 around 2026-11-22 (`docs/ifsc/16-IMPLEMENTATION-PLAN.md:148-154`). These dates are template configuration (`availableAt`), not code.
3. **Approach:** extend the single Assessment Engine with a new kind `PAST_EXAM_SHEET`. No parallel past-exam engine and no question-bank import in this scope.

## Non-goals (this scope)

- Importing full official Questions, per-Concept evidence or mastery from past exams.
- Subsequente exams.
- Embedding or re-hosting PDFs, or extracting text/images from booklets.
- Printing the answer sheet (the package's practice-card PDFs may be linked later).
- Any cohort ranking.

## 1. Data and engine

### Template

`kind: "PAST_EXAM_SHEET"` is added to `assessmentKinds`. A dedicated `pastExamSheetTemplateSchema` (Zod, strict) validates it. Template import dispatches on `kind`. The existing `assessmentTemplateSchema` rules (28 items, Question references, seven per area, five choices) remain unchanged for every other kind.

Sheet template fields:

- `id`, `version`, `title`, `kind`, `trackId` (`ifsc-2027`), `status` (`draft|published|retired`), `durationMinutes` (5–240), `availableAt?`;
- `exam`: `{ examId, edition, year, variant, appliedOn, examType, publisher }`. Example `examId`: `ifsc-integrado-2025-1`, `ifsc-integrado-2024-1-itajai`;
- `items`: `[{ position, key }]`; an item's subject is derived from `subjects`. `position` runs 1..N with no gaps, N ∈ {20, 24, 28}. `key` ∈ `A|B|C|D|E|ANNULLED`;
- `subjects?`: `[{ name, start, end }]`, non-overlapping and inside 1..N. It is present only when the catalog defines ranges. 2022–2024 must not be forced into the current four-area pattern;
- `links`: `{ examUrl, answerKeyUrl, sourcePage }`. Each host must be `www.ifsc.edu.br`;
- `provenance`: `{ catalogDataset, catalogVerifiedAt, catalogSha256, transcriptionNote }`.

Published versions are immutable. An answer-key erratum creates a new template version.

### Snapshot

At start, the instance freezes `{ kind, templateId, templateVersion, items:[{position, subject?}], subjects?, durationMinutes, policyVersion }`. The snapshot never contains `key`. Scoring reads keys from the frozen template version on the server.

The snapshot schema becomes a discriminated union on `kind`. The existing Question-based snapshot is unchanged.

### Responses

`assessment_responses` has the primary key `(instance_id, question_version_id)`, so `question_version_id` cannot become nullable without replacing the key. Sheet answers therefore use a sibling table, `assessment_sheet_responses`:

- columns `(instance_id → assessment_instances, position integer, answer text null, flagged, first_answered_at, updated_at)`;
- primary key `(instance_id, position)`;
- CHECK `answer` ∈ A–E or null.

The existing table is untouched. Instances, templates, the one-ACTIVE-instance-per-owner rule and finalization remain shared.

`save` validates that the position exists in the snapshot, that the value is `A–E` or null (clear), and that the instance is ACTIVE and before its deadline. Flagging ("marcar para revisar") reuses the existing `flagged` flag.

### Finalization

`finalize` stays transactional and idempotent. It gains a branch for `PAST_EXAM_SHEET`:

- `scoreSheet(items, keys, responses)` is pure and deterministic. ANNULLED items are excluded from the denominator. A blank counts as incorrect. Per-subject totals are computed only when `subjects` exists;
- the result is stored in `assessment_instances.result`: `{ correct, scorable, annulled, blank, bySubject?, byPosition:[{position, answer, key, outcome}] }`;
- the existing `assessment_finalized` study event is emitted;
- it creates **no Attempt, no ConceptEvidence and no mastery/review change**. The finalized instance is the immutable attempt record.

### Shared-engine consequences

- A sheet instance uses `mode: "EXAM"`. While it is ACTIVE, the existing EXAM guards block tutor, practice and targeted sessions, which is the intended exam condition. The owner can have only one ACTIVE instance across all kinds, so the start button must explain a 409.
- `question-asset-repository.ts` parses every owner snapshot as a Question snapshot. It must skip sheet snapshots, or a sheet instance would break asset access.

### ADR 0066 — Answer-sheet assessments for past exams

The ADR records:

- the new kind;
- the relaxed composition rules for that kind only;
- the absence of learning evidence and why: there is no Question/Concept mapping;
- link-only rights handling;
- the reservation behaviour;
- the future bridge: an optional `position → {questionId, version}` mapping once an edition's Questions are imported, which could later enable evidence without changing the page.

It complements ADR 0023 and does not supersede it.

## 2. Page and student experience

### Routes

- `/past-exams` ("Provas anteriores"): a new navigation item next to "Simulados".
- Execution reuses `/assessments/[id]`. The panel renders an `AnswerSheet` when `kind === "PAST_EXAM_SHEET"`.
- `/assessments` excludes sheet instances from the "Simulados" list. Resume entries for active sheet instances appear on both pages.

### List

- Editions are grouped by year, newest first, with year filter chips.
- Each card shows edition + variant ("2024.1 · Itajaí"), application date, item count, areas, and annulled items when there are any.
- Card states:
  - **Livre**: actions "Abrir caderno oficial" and "Responder";
  - **Em andamento**: remaining time and "Continuar";
  - **Feita**: best result, attempt count, "Refazer" and "Gabarito oficial";
  - **Reservada**: "Simulado reservado: libera em dd/mm". No booklet or answer-key link is shown.
- "Abrir caderno oficial" opens the IFSC PDF in a new tab (`rel="noopener"`).
- The official answer-key link appears only after the student has finalized that edition at least once.
- Persistent notice: "Projeto independente, sem vínculo com o IFSC. Cadernos e gabaritos pertencem aos seus titulares; os links levam ao site oficial." It is followed by the catalog verification date.

### Answer sheet

- Header: timer, an "18/28 respondidas" counter and "Abrir caderno" (new tab; no iframe).
- Each row has the question number and an A–E radio group. Touch targets are ≥ 44px. Each row is a native radio group (fieldset/legend), so arrow keys change the letter and Tab moves to the next row. An explicit "Limpar" button clears the row. A "marcar para revisar" toggle is available.
- Subject separators appear when `subjects` exists.
- Each change is saved through the engine's `save`. Reload resumes from the server state.
- "Finalizar" opens a confirmation listing blank and flagged items. Nothing is corrected before finalization.
- Layout: one column on mobile, two on desktop.

### Result

- "19 de 27 — 1 anulada fora da conta", followed by a note that this training criterion is not the official classification rule.
- Per-subject totals when ranges exist.
- Per-position table: student answer, key, and correct/incorrect/annulled/blank.
- Links to the official booklet and answer key.
- Progress: a list of result % per edition and completion date, plus a small chart when ≥ 3 editions are finalized. No ranking.

## 3. Import, security and reservation

### Catalog conversion

- The catalog JSON is committed to the repository: it holds metadata, answer keys and links only, no PDFs. Its SHA-256 is recorded in each template's provenance.
- A converter turns the catalog into 11 `PAST_EXAM_SHEET` template definitions. It rejects:
  - an item count that differs from `questions`;
  - a key outside `A–E|ANULADA`;
  - `annulledQuestions` that is inconsistent with the keys;
  - `questionCountScorable` that does not match;
  - overlapping or out-of-range subject ranges;
  - non-IFSC URLs;
  - duplicate `examId`.
- **Cross-check:** when the private bank exists locally, the converter compares the 2025.1–2026.2 keys against it and fails on any mismatch. Without the private files (CI), the check is skipped and logged.
- Publication uses the existing Admin Direct path with the actual authorization/reason. It is not recorded as Editorial Reviewed. The UI shows "Transcrito do gabarito definitivo; em caso de conflito vale o documento oficial."

### Answer-key secrecy

- `listTemplates` (student DTO) and `view` of a non-finalized instance never include `key`.
- Keys per position are returned only for the owner's FINALIZED instance.
- Another owner's instance → 404.

### Reservation

- Server-side: `start` rejects a template whose `availableAt` is in the future, including direct API calls.
- Before `availableAt`, the student DTO for that edition omits `examUrl` and `answerKeyUrl`.
- Release dates come from template configuration. A change is made by a new template version.

## 4. Testing and delivery

### Tests

- **Unit:** sheet template schema (20/24/28, invalid key, inconsistent annulled items, overlapping ranges, bad host); `scoreSheet` (annulled excluded, blank = incorrect, per-subject only with ranges, determinism).
- **Converter:** all 11 real catalog editions convert. Broken fixtures fail with clear messages. The private cross-check is conditional.
- **Repository (memory and migrated SQL):** start → save → resume → idempotent finalize; reserved start rejected; no `key` in pre-finalization payloads; foreign owner 404; zero `attempts`/`concept_evidence` rows after a sheet finalization; existing simulado tests unchanged and passing.
- **E2E (Playwright, mobile and desktop):** list states; answering by touch and by keyboard; reload resume; finalize warning for blanks; result with an annulled item; reserved card without links.
- **Accessibility:** named radio groups ("Questão 7, alternativa C"), visible focus, a polite `aria-live` timer announcement at thresholds only.

### Documentation

ADR 0066; updates to `docs/ifsc/09-ASSESSMENT-SYSTEM.md` (new kind) and `docs/ifsc/10-OFFICIAL-EXAMS.md` (2022–2024 editions, answer-sheet reservation); `CHANGELOG.md`, `PLANS.md`, `PROJECT_STATUS.md`.

### Increments (each validated before the next)

1. ADR 0066, sheet template/snapshot contracts and `scoreSheet`, with unit tests.
2. Migration (`item_position`) and the repository branch (start/save/view/finalize), with repository, secrecy and no-evidence tests.
3. Catalog committed, converter, 11-edition test and conditional private cross-check.
4. UI: `/past-exams`, `AnswerSheet` in the assessment panel, result and progress; E2E and accessibility checks.
5. Docs, full gates (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`), then import/publication through Admin Direct.

## Risks

- Answer keys are a third-party transcription. Mitigations: the private-bank cross-check covers 4 of 11 editions, the conflict notice in the UI, and versioned errata.
- Official URLs may change. Mitigation: `catalogVerifiedAt` is visible, and the converter could gain an optional link-check script later.
- The new constraint on `assessment_responses` touches a shared table. Mitigation: the migration is additive (nullable column + CHECK) and the existing simulado suite must pass unchanged.

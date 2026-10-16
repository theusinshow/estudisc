# Past exams catalog (ADR 0066)

`ifsc-integrado-2022-2026.catalog.json` lists the 11 IFSC Integrated editions from 2022.1 to 2026.2, including the 2024.1 Itajaí variant. For each edition it has metadata, the definitive answer key (`ANULADA` marks annulled items) and the official IFSC URLs. It was verified against the IFSC portal (`https://www.ifsc.edu.br/provas-e-gabaritos`, `…/provas-e-gabaritos-antigos`) on 2026-10-16.

- It contains **no PDFs**. Booklets and official answer keys are linked, never re-hosted, because they may incorporate third-party texts and images.
- The answer keys are a transcription. If anything conflicts, the definitive answer key published by IFSC prevails, and the fix is a new template version, never an edit to a published one.
- `releases.json` holds the `availableAt` dates for the reserved benchmarks (ADR 0023). They currently follow `docs/ifsc/16-IMPLEMENTATION-PLAN.md:148-154`: 2026.1 on 2026-11-09 and 2026.2 around 2026-11-22. To change a date, edit this file and publish a new template version.

Build the templates with `pnpm tsx scripts/build-past-exam-templates.ts "<actual publication authorization/reason>"`. The output goes to `.local/past-exams/templates.json` (ignored by git).

# IFSC 2027/1 Mathematics source enrichment

Curated 2026-10-02 for the gaps recorded in the [ProEdu coverage audit](../matematica-instrumental-proedu-585/COVERAGE-IFSC-2027-1.md). The canonical Content Studio SourcePack now contains IDs `SRC-MAT-00020`–`SRC-MAT-00065`: 46 records, of which 41 are active research references and 5 remain in the verification inbox. The [coverage report](../../../MATHEMATICS-COVERAGE-REPORT.md) gives topic-by-topic recommendations, page locators, error findings, validation scope and open gaps.

This is a source inventory, not proof that a topic is taught, an official mapping approval, or a set of ready-to-use lesson assets. Every new SourcePack record remains `RESEARCH_REQUIRED` in Content Studio. `details.mathValidation` describes only the factual checks actually completed. Quality class describes provenance/source strength, not mathematical correctness.

The [independent assessment](EVALUATION-VECTA.md) consolidates real Lupa, Trama and Crivo audits plus Codex integration. Two additional error findings were recorded protectively in `SRC-MAT-00020` and `00056`; there are now five `HAS_ERRORS` records among the additions. The coverage report incorporates corrected SME notation, ProEdu capacity evidence and narrower angle/time ratings. No original was altered or source approved.

## Preserved originals

Only two PDFs were preserved locally because the files were useful, reasonably sized, and their source pages supported private study/research preservation. Files are unchanged and Git-ignored; catalog records include the SHA-256 and exact locator.

| Source | File | Pages / size | Rights and parser limits |
| --- | --- | --- | --- |
| [SRC-MAT-00025](../../sources.json) — IFTO, financial education/simple interest | `pdfs/SRC-MAT-00025-ifto-educacao-financeira-juros-simples.pdf` | 19 pages; 3,531,771 bytes | p. 2 permits reproduction for study/research with citation; `REQUIRES_REVIEW` for VECTA use. Original PDF has a broken xref pointer: strict pypdf parsing fails, permissive parsing opens 19 pages and extracts 18 text pages. Preserved without repair. SHA-256: `ae2bcd85d387a37fde7c90aceb2c61d42ae249d58cf6c632cdb70bab47fa1894`. |
| [SRC-MAT-00032](../../sources.json) — IFES, divisibility | `pdfs/SRC-MAT-00032-divisibilidade-ifes-564027.pdf` | 42 pages; 2,359,897 bytes | p. 3 describes public teaching material for free reproduction, without a versioned CC license; `REQUIRES_REVIEW` for commercial embedding. Strict pypdf parse succeeded. SHA-256: `246588e9f618088a3222ccd2da5a4197d190c4459f4ca53efd780a6ab6fceea4`. |

No other remote PDF, video, image, GeoGebra construction, chapter or answer key was copied. `APPROVED_EMBED` is not assigned to any new record. A public URL, government/university origin, or “free reproduction” statement is not treated as a commercial reuse license.

## Catalog and resumption

Machine-readable metadata is in [`sources.json`](../../sources.json); source indexes are derived by `manage.ts`. Five unresolved items are listed in [`inbox/INDEX.md`](../../inbox/INDEX.md), with their reason and next verification action in the canonical records: oversized IFF notation workbook, inaccessible CECIERJ notation file, unreadable UFPB interest item, UDESC algebra item without page inspection, and UDESC angles PDF without page inspection.

The same CECIERJ *Matemática Fundamental — Fascículo 8* supplied for both polynomials and factoring has one canonical record, `SRC-MAT-00033`, with mappings to both topics. The prior 19 library URLs/IDs were checked for collisions; none matched these 46 additions. Other weak/out-of-level candidates are documented in the coverage report rather than retained as usable sources.

Validation commands run:

```text
pnpm exec tsx .local/curate-math-enrichment.ts
pnpm exec tsx vecta-source-library/manage.ts refresh
pnpm exec tsx vecta-source-library/manage.ts check
pnpm exec vitest run tests/unit/source-library.test.ts
```

The focused unit-test result and PDF integrity checks are recorded in the top mathematics-enrichment section of `PLANS.md`.

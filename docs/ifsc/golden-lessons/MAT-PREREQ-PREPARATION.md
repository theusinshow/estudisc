# MAT-PREREQ — Editorial corrections

Status: **Draft; human publication review pending**
Updated: 2026-10-02

The user authorized correcting the editorial findings and committing/pushing the result. This does not record an independent approval or publish the lesson.

## Teaching flow

1. Chocolate-bar hook: 3/10 = 0,3 = 30%.
2. Fraction meaning, numerator/denominator and equivalent fractions.
3. Decimal place value: tenths and hundredths.
4. Authored diagram with ten equal parts and three highlighted, plus alt text and a full textual equivalent.
5. Worked fraction/decimal/percentage conversions.
6. Explicit ratio/proportion definitions and a recipe example.
7. Guided practice: two measures of concentrate for three of water; four of concentrate require six of water.
8. Warning about adding equal amounts instead of multiplying by the same factor.
9. Summary followed by exactly three A–E exit questions. Independently calculated answers: 0,25 (C), 40% (B), 15 spoons (E).

Guided practice uses the existing self-check block and does not create an official Question attempt. Final Questions use the existing shared Question renderer/evaluator. Concept mastery is still determined by evidence, never by lesson completion.

## Versions and regeneration

- MAT-PREREQ: lesson version 3 (previously 2).
- Q-MAT-PREREQ-1/2/3: Question version 2 (previously 1).
- Golden and Week 1 packs: version 2 (previously 1).
- All corrected items retain draft status and generated provenance. Already imported versions and their attempts are not edited in place.

Canonical scoped authoring: `scripts/build-ifsc-math-preparation.mjs`, also called by the Golden seed generator. Figure source: `packs/seeds/ifsc-2027.lesson-drafts/figures/MAT-PREREQ/tres-decimos.svg`.

```text
node scripts/build-ifsc-math-preparation.mjs
node scripts/build-ifsc-week-pack.mjs
node scripts/export-lessons-for-review.mjs
node scripts/render-lesson-figures.mjs MAT-PREREQ .local/mat-prereq-phone.png
```

The Markdown/PNG exports remain local and ignored by Git. The importer bundle is committed. The exporter now reads interaction types from the block instead of its payload, preserving guided prompts and answers in the review document.

## Official-source limitation

The official [04/DEING/2026/1 edital](https://www.ifsc.edu.br/documents/d/ingresso/edital-04_2026_1_tecnico_integrado_prova-ok), Anexo V / Matemática / item 1, confirms historical coverage of fractions, decimal notation, ratios, proportions and percentages. It is not the target 2027/1 edital. The existing source inventory references 05/DEING/2027/1; its actual Anexo V was not located during this review. **Verificar na fonte** before claiming current-edition mapping or editorial release readiness. No new official-source approval is recorded.

## Validation

The final suite had 172 passes and 3 skips; eight focused evaluator/import/rendering/immutable-release tests also passed. Lint, TypeScript and production build passed; the diagram was visually checked at 343 px. The updated study flow passed desktop E2E and an isolated mobile E2E, including actual final Question submissions and session resume. The full E2E run had 20 passes and 14 failures; full application acceptance remains open. Exact commands, failure details and recovery actions are recorded in the top sections of PLANS.md and PROJECT_STATUS.md.

# Representative authored mathematics batch

This continuous-execution increment appends six source-preserving lesson versions with ten existing linear explorers. Combined with the four live pilots, it covers ten lesson identities and seventeen added explorations. It is not a claim that all 132 lessons have objectives or new interaction blocks.

| Source lesson | Source model / initial result | Conditions retained |
|---|---|---|
| MAT-04 | Decimal product 3.2 × 0.25 = 0.8; scientific coefficient 3.6 × 10⁵ = 360000 | Second factor/exponent fixed; scientific coefficient bounded below 10 |
| MAT-11 | Poster price 8 × 3 + 5 = 29 reais | Whole quantities, fixed preparation fee |
| MAT-13 | Substitute x=5 into 7x+4: left member 39 | Right member remains 39; explorer does not solve a new equation |
| MAT-16 | 0.3 m² = 3000 cm²; 4 dm³ = 4000 mL; rectangle 7 × 4 = 28 cm² | Unit factors fixed; rectangle height fixed, area distinct from perimeter |
| MAT-17 | Prism 32 × 9 = 288 cm³; 2.5 m³ = 2500 L | Fixed base area, perpendicular height, exact selected unit factor |
| MAT-18 | 3 shirts × 2 trousers = 6 combinations | Whole quantities, second stage fixed, all pairs eligible |

All 101 original blocks, 107 Activities and 95 Question references across the six source lessons remain intact. Initial arithmetic is independently checked against the complete authored examples. Recipes bind exact source lesson/anchor/quote hashes, actual existing objectives and Concept links. No old published version, Question, prerequisite, exit ticket, source or rights/mapping caveat is rewritten.

ADR 0051 adds optional integerInput to the existing linear payload for explicit count examples. Its authored bounds/step/initial are integers; fractional input displays an integer recovery message. Old absent-field decimal/time behavior, raw unsent draft strings, flags and no-Attempt/evidence semantics remain compatible. No Pack envelope/response change, DDL, backfill or new simulation engine. Numeric blueprint keywords now recognize plural fractions, algebraic expressions and counting; all proposals remain UNREVIEWED with source/confidence caveats.

Reproduce each export with `pnpm estudisc-content enrichment-export --request tools/estudisc-content-studio/recipes/<name>.v1.json`: decimal-scientific, algebraic-price, equation-substitution, measures-area, prism-capacity, multiplicative-count. Repeat exports are stable. Large packets use bounded local gzip transport in the existing authenticated browser; canonical packet hashes are checked before writes. No full corpus/Question bank is transmitted as enrichment input.

Engineering gates: `pnpm lint`, `pnpm typecheck`, `pnpm packs:verify`, `pnpm test`, `pnpm build`, `pnpm test:e2e`; focused source/blueprint/discrete-input/legacy tests and both browser projects with flags off/on. Actual results/hashes are recorded in REPRESENTATIVE-ENRICHMENT-EVIDENCE.json; actual deployed code, six preflights/targeted appends/Admin Direct publication and historical/current preservation are separately recorded after activation. No independent editorial approval is fabricated.

Continue the approved roadmap after the representative release: review/mistake loop, optional contextual AI, knowledge-map/exam/ADMIN consumers and remaining verified rollout. Missing source objectives and complex pedagogical cases remain explicit; source data never implies official curriculum readiness.

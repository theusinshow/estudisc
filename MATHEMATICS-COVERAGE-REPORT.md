# Estudisc — Mathematics source coverage for IFSC 2027/1

Research snapshot: 2026-10-02. This report evaluates source-library support against the official Mathematics syllabus recorded in [the current ProEdu collection audit](vecta-source-library/MAT/matematica-instrumental-proedu-585/COVERAGE-IFSC-2027-1.md). `STRONG` means multiple relevant, traceable sources with useful page/section locators; it does not mean every claim was independently audited or that Estudisc has authored teaching coverage. New Content Studio SourcePack records remain `RESEARCH_REQUIRED`.

Post-research correction: real Lupa, Trama and Crivo audits found additional errors in `SRC-MAT-00020` and `00056`; both now carry protective `HAS_ERRORS`/reference-only metadata. Angles/time ratings were narrowed to PARTIAL, and SME notation/ProEdu capacity evidence were corrected. See the [independent assessment](vecta-source-library/MAT/math-enrichment-ifsc-2027-1/EVALUATION-VECTA.md) for checked scope, provenance and limitations. Original PDFs are unchanged.

## Outcome

Screened 55 candidate mentions (36 supplied resource links and 19 additional candidates). Added 46 canonical records, `SRC-MAT-00020`–`SRC-MAT-00065`; five are explicitly in the verification inbox. One repeated nomination of CECIERJ Fascículo 8 was consolidated across polynomial operations and factorization. Zero canonical URL/ID collisions were found against the previous 19-source catalog. Eight other screened alternatives were not promoted: five less useful GeoGebra metric constructions, an inaccessible UFSJ divisibility app, an out-of-level UFU factoring item focused on fractions, and one Ceará radical course candidate whose two PDFs were not inspectable.

Two PDFs were preserved, unchanged and Git-ignored: IFTO financial education/simple interest (3,531,771 bytes) and IFES divisibility (2,359,897 bytes). Eight videos and three interactive-tool records were cataloged as external references; none was copied or embedded. One diagram candidate is recorded as reference-only. No lesson, question set, simulated exam or publication artifact was created.

| Topic | Previous collection | Enriched library | Coverage after research |
| --- | --- | --- | --- |
| Scientific notation | No structured treatment found | SEDUC-MT p. 9; GESTAR II p. 90; UFABC printed p. 70; Khan review/video; two candidates in inbox | **STRONG** |
| Simple interest | Mentions only | UEPA pp. 27–38; IFTO pp. 8–11; Khan video/exercise; one error-flagged thesis | **GOOD** |
| Monomials and polynomials | No systematic degree/operations treatment | CECIERJ Fasc. 8 pp. 5–14; UTFPR exercises pp. 4–5; Khan video; IFES minicourse flagged | **GOOD** |
| Polynomial factorization | No structured polynomial methods | CECIERJ Fasc. 8 pp. 27–40; Khan common factor, difference of squares and perfect-square trinomial; UDESC item in inbox | **GOOD** |
| Divisibility criteria | Primes, MMC/MDC and numeric factorization, but criteria underdeveloped | IFES pp. 23–41 and CECIERJ Fasc. 1 pp. 39–47, plus Khan; rules 2/3/4/5/6/8/9/10 have references | **STRONG** |
| Inequalities/inequations | Interval notation and comparisons only | Unifesspa pp. 18–22; Khan linear equations/inequalities | **PARTIAL** |
| Radicals | Basic extraction/examples only | IFCE basics, two MultiRio videos, Khan simplification and grade-8 course | **PARTIAL** |
| Angles | No systematic angle section | Basic classification/measurement located; further relations and external tools remain unverified | **PARTIAL** |
| Time conversions | Incidental time quantities | CECIERJ III, ch. 4 (printed p. 122); other candidates/chapter exercises still require inspection | **PARTIAL** |
| Right-triangle metric relations | Pitágoras/trigonometry, no altitude/projection relations | UEPA pp. 33–57; UEPA GeoGebra book pp. 24–35; Goiânia SME formulas/examples; GeoGebra and Khan references | **STRONG** |
| Capacity | ProEdu Aula 14, PDF p. 15: cm³/mL/litres; p. 29: m³/litres | UFPA candidate does not add located systematic L/mL/dm³ instruction | **PARTIAL** |
| Experimental probability/frequency | ProEdu Aula 17 gives only partial empirical context | Khan 6:55 example and existing Aula 17 evidence | **PARTIAL** |

## Recommended sources and checked evidence

- **Scientific notation:** `SRC-MAT-00020` (official SEDUC-MT/SAGE, 8th grade) has useful operations on p. 9, but is supplemental/reference-only because p. 2 contains an incorrect conversion step. Its p. 9 samples were recalculated by Crivo: multiplication, division and subtraction confer. The faulty intermediate coefficient is `1.1618` instead of `1.618` for `0.00001618 = 1.618×10⁻⁵`. `SRC-MAT-00022` adds conversion/order-of-magnitude locators at p. 90; `00021` has only a UFABC objective locator, without opened PDF examples. No full answer-key QA is claimed.
- **Interest:** `SRC-MAT-00027` (UEPA) is the strongest instructional source: pp. 27–29 develop capital, rate, time and amount; pp. 33–38 include activities and `J=C×i×n`, `M=C+J=C(1+i×n)`. Recalculation confirmed that rate and term must use compatible time units. `SRC-MAT-00025` supplies contextual problems on pp. 8–11; for R$3,000 at 8% per month for six months, recalculation gives `J=R$1,440` and `M=R$4,440`. The source does not provide a full, checked set of inverse problems for solving separately for capital, rate, time, interest and amount.
- **Monomials/polynomials:** `SRC-MAT-00033` has monomial/polynomial treatment in pp. 5–14; `SRC-MAT-00036` offers UTFPR operation exercises at pp. 4–5; `SRC-MAT-00038` is a supplemental Khan introduction. Factorization sections of the same CECIERJ Fascículo 8 are separately mapped, not duplicated.
- **Factorization:** `SRC-MAT-00033` maps notable products at pp. 17–26 and factor common/grouping/difference of squares/perfect-square patterns at pp. 27–40. Khan records `SRC-MAT-00039`–`00041` add common-factor, difference-of-squares and perfect-square-trinomial references. Use the CECIERJ procedures only with the recorded correction on p. 30 and a second-source check.
- **Divisibility:** `SRC-MAT-00032` maps the IFES inductive material, including questions on 6 and 8 at p. 24 and rule construction/proofs at pp. 25–41. `SRC-MAT-00034` provides CECIERJ pp. 39–41 criteria for 2, 3, 4, 5, 6, 9 and 10, with primes/factorization across pp. 38–47. Rule 11 and a complete independent review of every rule/activity remain open.
- **Inequalities:** `SRC-MAT-00043` covers definitions, solution sets, number lines and contextual linear inequalities at pp. 18–22. Sample solutions were recalculated. Neither this inspected portion nor the indexed Khan course establishes full coverage of reversing the inequality when multiplying/dividing by a negative or intervals across the real line.
- **Radicals:** `SRC-MAT-00045` and `00046` are MultiRio properties/simplification videos; `SRC-MAT-00048` is a Khan higher-index-root example. Its `⁵√96=2⁵√3` example checks because `2⁵×3=96`. The complete set of product/quotient, extraction, simplification and insertion properties was not independently confirmed across these sources.
- **Angles and time:** `SRC-MAT-00050` covers notation, measuring with a protractor and classifying angles at pp. 10–12. `SRC-MAT-00052` is an untested GeoGebra complementary/supplementary construction. Opposite-vertex angles and broad relation exercises still need a validated locator. For time, `SRC-MAT-00053` (printed p. 122) covers 60 seconds/minute, 60 minutes/hour, sexagesimal notation, weeks, months and years; the UENP manual (`00055`) is a supplementary activity reference. Mixed-unit duration exercises were not exhaustively checked.
- **Right-triangle relations:** `SRC-MAT-00056` has a useful teaching sequence, but its Quadro 2 (PDF p. 10 / printed p. 9) has inconsistent cross-relations and now requires correction/cross-checking; `00057` offers further sequence locators. Prefer the inspected `SRC-MAT-00058` (Goiânia SME) formulas/examples: in its notation, `a=m+n`, `h²=mn`, `c²=am`, `b²=an`, and the Pythagorean connection. Examples `m=4,n=9→h=6` and `a=14,m=5,n=9→c≈8.4,b≈11.2` confer. Its math VERIFIED flag is scoped to this sample. GeoGebra pages `00059`–`00060` remain external/untested; SME figure reuse rights are unknown.
- **Capacity/probability:** UFPA `SRC-MAT-00062` did not provide a located L/mL/dm³ treatment. Existing ProEdu `SRC-MAT-00014`, Aula 14 PDF p. 15, relates cm³, mL and litres; p. 29 relates m³ and litres. Retain those refinements while seeking systematic equivalences/conversions and checked practice. Khan `SRC-MAT-00063` gives `5/16=31.25%`, and ProEdu Aula 17 p. 12 has germination-frequency evidence; repeated trials and absolute/relative frequency remain partially supported.

## Mathematical issues and validation states

After independent assessment, the catalog distinguishes factual sampling from Studio approval. Among the 46 additions, `details.mathValidation` is: **VERIFIED 1**, **PARTIALLY_VERIFIED 21**, **REFERENCE_ONLY 19**, **HAS_ERRORS 5**. None has Content Studio `verification: VERIFIED`; all remain `RESEARCH_REQUIRED`. “Reference only” means evidence was too limited to recommend as a factual base, not that the topic is irrelevant.

Five sources retain useful provenance but are unsafe as sole factual authorities:

- `SRC-MAT-00020`, SEDUC notation PDF p. 2: incorrect intermediate conversion coefficient, despite correct final result and correct sampled operations on p. 9.
- `SRC-MAT-00056`, UEPA metric relations, Quadro 2, PDF p. 10 / printed p. 9: two cross-relations contradict its own cathetus/projection identities. Its prior validation claim is preserved in metadata history and superseded by the independent finding.

- `SRC-MAT-00031`, UTFPR financial-education dissertation: its example states 1.5% monthly but writes `0.15×6`; later result uses 0.015. The rate/exponent mismatch is recorded; use only as reference pending correction.
- `SRC-MAT-00033`, CECIERJ Fascículo 8: p. 30 claims `4x²+12xy+36y²=(2x+6y)²`; expansion yields middle term `24xy`, so the identity is false. A stray closing parenthesis also appears at p. 17. Sampled exercises on pp. 9–14 and 28–31 were recalculated; other pages were not exhaustively audited.
- `SRC-MAT-00037`, IFES polynomial minicourse: its final exercise page computes `p(2)` for `p(x)=2x²+3x` as `8+12=20`; the correct calculation is `8+6=14`. Other sections were sampled, not comprehensively checked.

Recalculation claims are limited to the documented samples; independent review identified counterexamples that supersede the earlier general validation wording for SRC-MAT-00056. Other PDFs/pages/videos were inspected only to the scope recorded in their metadata and audit notes. No universal answer-key correctness is claimed. The IFTO PDF opens in tolerant mode due to a broken cross-reference pointer; no repair was made. No video transcripts were copied.

## Rights and remaining work

For new records the license distribution is **LINK_ONLY 20**, **UNKNOWN 24**, **REQUIRES_REVIEW 2**, **APPROVED_EMBED 0**. Khan Academy material is linked under the identified CC BY-NC-SA terms and applicable restrictions on putting its distinct content in a paid service. The 41 active records are research references, not blanket reuse permission. The IFTO PDF states study/research reproduction with attribution; IFES says free reproduction but gives no versioned commercial license. Both local copies remain private and ignored by Git. All other unclear materials are URL/metadata only. The CECIERJ source has unknown reuse terms.

Inbox records: `SRC-MAT-00024` (IFF/eduCAPES notation PDF, 64.34 MB and CC BY-NC-SA; not downloaded), `00026` (CECIERJ notation resource fetch failed), `00028` (UFPB interest item could not be read), `00042` (UDESC algebra item lacks inspected section locators), and `00064` (UDESC angles PDF, 12.39 MB, not inspected). The chosen UDESC time chapter has a noncommercial license and is link-only. No student-facing embeds are authorized by this curation.

Priorities for the next research pass: complete negative-factor inequality/real-interval examples; verify radical product, quotient and extraction procedures; find a checked angle source for vertical-opposite relations; establish 1 L = 1 dm³ and mL conversions; add a repeated-experiment frequency source distinguishing absolute/relative frequency; find and independently validate the divisibility-by-11 rule if in scope; complete inverse simple-interest exercises. Preserve the three error flags and recheck their surrounding content before any later factual use. The UDESC algebra/angle and UFPB/CECIERJ items need direct content access. These are library-source gaps; no lessons were generated.

## Stable files and validation

- Canonical metadata: [`vecta-source-library/sources.json`](vecta-source-library/sources.json), IDs `SRC-MAT-00020`–`SRC-MAT-00065`.
- Human index: [`vecta-source-library/INDEX.md`](vecta-source-library/INDEX.md), [`vecta-source-library/MAT/INDEX.md`](vecta-source-library/MAT/INDEX.md), and [`vecta-source-library/inbox/INDEX.md`](vecta-source-library/inbox/INDEX.md).
- Collection notes and preserved files: [`vecta-source-library/MAT/math-enrichment-ifsc-2027-1/README.md`](vecta-source-library/MAT/math-enrichment-ifsc-2027-1/README.md).

`pnpm exec tsx vecta-source-library/manage.ts refresh` and `check` passed with 65 total sources, 378 actual Concepts and 21 derived files. Focused library tests and local PDF size/hash checks are recorded in `PLANS.md`. This snapshot is ready for the requested read-only coordination audits; no audit result or approval is presumed.

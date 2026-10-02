# Week 1 — authoring and self-review record

Status: **draft, pending independent human review** (2026-10-01). Nothing here is an approval. The four QA layers in `12-CONTENT-QA.md` still require a reviewer who is not the author; see `EDITORIAL-RELEASE.md`.

## Scope

A balanced first week, two lessons per area (planner bands in `08-STUDY-PLANNER.md`): about 5 h 20 min and 117 questions.

| Lesson | Source | Concepts | Questions | Minutes |
|---|---|---|---|---|
| MAT-01 Números e operações | `lesson-drafts/MAT-01.json` | 5 | 10 | 40 |
| MAT-02 Divisibilidade, primos, MMC e MDC | `lesson-drafts/MAT-02.json` (moved out of `MAT-A.json`) | 6 | 17 | 40 |
| POR-01 Compreensão e inferência | Golden, `scripts/build-ifsc-golden-seed.mjs` | 5 | 10 | 35 |
| POR-02 Gêneros, finalidade, contexto e autoria | `lesson-drafts/POR-A.json` | 6 | 16 | 40 |
| CIE-01 Movimento e máquinas simples | `lesson-drafts/CIE-A.json` | 4 | 15 | 40 |
| CIE-02 Energia e transformações | `lesson-drafts/CIE-A.json` | 5 | 17 | 40 |
| GH-01 Espaço geográfico, cartografia, tempo e fontes | `lesson-drafts/GH-A.json` | 9 | 19 | 45 |
| GH-02 Formação social de Santa Catarina | `lesson-drafts/GH-A.json` | 6 | 13 | 40 |

New lessons were AI-authored (parallel authors, one file each) in the MAT-01 pilot format: per concept an intuition, the rule, worked examples and a common error; hints on every question; exactly three exit-ticket questions; at least two questions per concept.

## Self-review method

The main agent read every block and question of all eight lessons and applied the four layers as a checklist:

- **Structural:** expander rules, `validateTrackPack` via `tests/unit/ifsc-lesson-drafts.test.ts`, concept coverage.
- **Factual:** every calculation recomputed; historical, geographic and scientific claims checked against well-established knowledge, with uncertain specifics removed or stated qualitatively.
- **Pedagogical:** exit tickets must not repeat worked examples; hints are progressive and question-specific; distractors map to real errors.
- **Psychometric:** an audit script measured key position and whether the key is noticeably longer than every distractor. Before the fixes, the key was the longest choice in 7–12 questions per lesson for POR-02, CIE-02, GH-01 and GH-02. All lessons now show 0 such questions and keys spread across A–E. Numeric choice sets stay in ascending order.

## Findings and resolutions

| Lesson | Finding | Resolution |
|---|---|---|
| MAT-01 | No hints; two exit tickets repeated worked examples verbatim; explanations ignored distractors | Hints on all questions; new exit contexts (erva-mate seedlings, Serra temperatures in decreasing order); distractor rationale added |
| MAT-01 / MAT-02 | Keys concentrated in B/C | Rebalanced; numeric sets sorted ascending |
| POR-01 (Golden) | Only 1 of 5 concepts taught; 4 concepts with a single question; generic identical hints; implausible distractors; every POR key was E | Teaching blocks for EXPLICIT, MAIN_IDEA, EVIDENCE, DISTRACTOR; third text; Q-POR-GOLDEN-7..10; question-specific hints; plausible distractors. Generator bug fixed: the key position read `pack.questions.length` while a subject's questions were still being built, so a whole subject shared one letter (also affected CIE-06 and GH-06). Golden pack now has 33 questions |
| POR-02 | Blood-donation weight stated as "mais de 50 kg"; length cues | "pelo menos 50 kg"; keys trimmed, distractors made equally specific |
| CIE-01 / CIE-02 | Length cues; keys never in D/E; exit item labelled options "A, B, C", which collide with answer letters | Rewritten; rebalanced; options renamed I, II, III |
| GH-01 / GH-02 | Length cues (12 of 13 in GH-02); key never E; unverified "faxinalenses in SC"; "ainda provoca debate" about Florianópolis | Rewritten; rebalanced; faxinalense claim removed; neutral wording; Antonieta de Barros phrased as first Black woman elected state deputy in Brazil |
| Renderer | Question `stimulus` rendered as one paragraph after the stem, losing poem and comic-strip line breaks | Stimulus now renders before the stem with authored paragraphs and line breaks (`src/components/ui/paragraphs.tsx`) |

## Items a human reviewer must still verify

- **GH-02:** all historical claims, especially bugreiros and Xokleng conflicts, Invernada dos Negros and Valongo as quilombola communities, Cruz e Sousa, Antonieta de Barros, Estado Novo nationalization, and Laws 10.639/2003 and 11.645/2008.
- **GH-01:** Florianópolis renaming context (1894), Mercator/Peters statements, Africa vs. Greenland area ratio.
- **CIE-02:** qualitative claims about Brazil's and Santa Catarina's electricity mix (hydro predominance, wind in high areas, coal plant in the south, more thermal generation in dry years).
- **POR-02:** blood-donation requirements in the exit text (16–69 years, guardian consent under 18, at least 50 kg); whether "modalidade" matches the edital's intent (verbal / não verbal / multimodal).
- **All lessons:** invented names, places and data are fictional teaching material; confirm none collides confusingly with real people or schools.
- **Length:** GH-01 (9 concepts, 19 questions) and CIE-02 (17 questions) may exceed their estimated minutes on a phone.

## Trying the week locally

`node scripts/demo-local.mjs` starts a disposable `memory://local` server and runs `scripts/seed-local-demo.mjs`, which marks this content as published only inside that process. Student accounts on a persistent database see these lessons only after a real release.

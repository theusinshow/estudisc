# Frontend refinement — presentation, math notation and weight (2026-10-11)

User request (2026-10-11): refactor the existing frontend for organization, legibility, consistency, accessibility and performance while preserving the approved Design System, flows and pedagogical behavior. Explore React Bits (including Micro Interactions) and other libraries as sources. Supersedes the narrower [lesson presentation plan](LESSON-PRESENTATION-PLAN.md), whose audit remains valid.

## Stage 0 — inventory and measured baseline

Environment: local disposable `memory://local` dev harness (all rollout flags on except AI) seeded with the repository's MAT (19 lessons), week-1 (12) and golden packs; production build statically analysed. No production data read or written.

**Initial JS per route** (gzip, production build manifests; `_global-error` framework floor = 127 KB): `/` 234, `/progress` 264, `/study/[id]` 227, `/lessons/[id]` 226, `/plan` 214, `/import` 214, simple pages (`/history`, `/tracks`, `/achievements`) 206, `/auth/signin` 192, `/admin` 135.

Reproduced problems (evidence, not assumptions):

1. **Shared client weight.** `primary-nav.tsx` (every authenticated page) imports `zod` to parse `/api/profile` → a 63 KB gzip chunk on all shell routes, plus one client profile request per document and a late pop-in of ADMIN links. Lessons/sessions also ship the Programming Lab panel and AI control statically; measured app code there is ~20 KB and full zod is required anyway by response validation, so splitting them was reverted as churn without benefit.
2. **Math glyph fallback.** next/font serves Archivo's `latin` range only (U+0000–00FF, U+2000–206F …). `¹²³` render in Archivo, but `⁰⁴–⁹ ⁺ ⁻ ⁽ ⁾ ᵐ ⁿ`, `√ ≤ ≥ ≠ ≈ π Δ ∞` come from a system fallback font. MAT-09 at 390 px shows `2⁴ × 2³` with mismatched exponent size/baseline. Fractions, roots and step lists are plain text (`Paragraphs`).
3. **Accents/ç.** Bounded encoding scan already clean (see the previous audit). All Portuguese accented letters fall inside the served Archivo/JetBrains Mono ranges (verified from built `@font-face` unicode-ranges); visible rendering is checked in Stage 2. Risky line boxes are display headings with `line-height < 1` (Today 0.9, sign-in 0.96, admin 0.95, score 0.9) where a second line's capital diacritics can touch the previous line. No string transformation strips accents in rendered text.
4. **Motion outside the DS.** Adapted React Bits `Reveal` uses `blur(4px)`, 500 ms and 14 px travel; DS rule 7/8 forbids blur and limits interface motion to 180 ms / 2–4 px.
5. **Lesson mobile hierarchy.** At 412 px the lesson's progress panel (three tall cards, one orphaned) pushes the first lesson step below the fold.

React Bits review: the project already adapts ClickSpark, AnimatedList (Reveal), CountUp and Code Slots under ADR-level rules (Estudisc tokens/motion, reduced motion, CSP-safe). Most remaining catalog items rely on blur/glass/gradients, WebGL or continuous decoration (forbidden by DS §5.7–5.8). Adopted only as pattern sources when they solve a demonstrated state problem; never as visual identity.

## Math notation contract (v1)

Presentation-only, applied by the shared text renderer to authored lesson/Question text. Source strings, answers, evaluators and hashes are untouched. Every recognized span keeps the exact original text for assistive technology and copy; anything unrecognized stays exactly as authored.

- **Superscript runs** (`⁰-⁹ ⁺ ⁻ ⁼ ⁽ ⁾ ⁿ ⁱ ᵃ-ᶻ` subset) after a base → `<sup>` with the equivalent Archivo characters. Fixes font fallback; `cm²`, `10⁻²`, `aᵐ⁺ⁿ`.
- **Numeric fractions** `a/b` where both sides are integers (denominator may carry a superscript run), not adjacent to another `/`, `:`, `.`, letter or digit (excludes dates `10/10/2026`, URLs, `km/h`, code paths, decimals) and not year-shaped (`2027/1`, `2020/2021`) → inline stacked fraction.
- **Square roots** `√` followed by a digit run, a single letter/Greek letter, or a balanced parenthesized group, not immediately continued by a letter/digit (`√2x` is ambiguous → plain) → radical with an overline radicand.
- **Numbered step lines**: inside one paragraph, optional lead lines, then ≥2 consecutive `n. text`/`n) text` lines, then optional closing lines ("Conferência: …") → lead paragraph, ordered list with the authored start number, closing paragraph. Any other shape stays plain.
- Not recognized: TeX, `^`, letters-over-letters fractions, `÷`, mixed numbers, money/dates/URLs/code. Long expressions wrap at operators; fractions/radicals never break internally.

## Increments

1. Shared base: server-side shell profile (no client zod/profile fetch), DS-compliant entrance motion, heading line boxes, styles split by surface in existing cascade order.
2. Lessons/Questions/sessions/lab: math renderer applied through `Paragraphs` and question/choice/hint/feedback text; lesson header/progress hierarchy; step controls and reading rhythm.
3. Today/Plan/Learn/Review/Mistakes/Concept/Progress: targeted hierarchy, empty/error states, chart text equivalents.
4. Map/assessments/history/achievements/admin: save-state clarity and listing/readability fixes.
5. Acceptance: lint, typecheck, test, packs, build, full serial E2E and flagged regressions; 320/390/1440 and WebKit where available; docs/changelog; protected release.

## Increment results

1. **Shared base.** The navigation profile is resolved per request on the server by `AppShell` (async Server Component) and passed to the client navigation, removing the client `/api/profile` request and the only schema bundle on simple routes. A first attempt with `zod/mini` was measured and rejected: it saved 2 KB and added 8 KB where full zod already ships. Admin links remain presentation only; routes/APIs keep enforcing roles. Entrance motion (adapted React Bits Reveal/CountUp, Week strip) now uses the Web Animations API with canonical tokens (`--estudisc-motion-slow`, travel max, easing): no blur, no scale/spring, ≤180 ms, so `motion` no longer ships for Today entrances. Sign-in buttons were unstyled in Google mode because the control vocabulary was scoped to `.main-surface` only; it now also covers `.auth-surface`. The selected profile gains a check icon (second non-color channel). Wrapping headings with `line-height < 1` (sign-in, admin review) use 1.05. `interactions.css` split into nine surface modules whose ordered concatenation is byte-identical to the original.
2. **Lessons/questions.** Math notation contract v1 implemented in the shared `Paragraphs`/`MathText` (no parallel renderer) and applied to block text, stimuli, stems, choices, ordering/matching labels, hints, feedback, static/educational activities, exam stems and figure captions. Repository corpus scan (22,793 strings): 1,385 exponent runs, 791 fractions, 227 roots, 137 worked-step lists recognized; two year-shaped false positives found and excluded by rule. Lesson progress summary compacted on phones (counts side by side, mastery as a reading-size state). Lesson titles scale between display tokens with Portuguese hyphenation, fixing `Porcentagem / : parte` at 320 px. Discrete linear explorers keep typed values on the authored step grid ([handoff response](handoffs/2026-10-11-fraction-explorer-input-frontend-response.md)).
3. **Today/Plan/Learn/Concept/Progress/Map.** Session-row link styling no longer captures the "Organizar minha semana" link. Plan now shows sessions, then "Preparar uma sessão", then the weekly routine below an ink rule (an existing session never requires routine setup; the wizard's Continue is visually apart from session access); its headings and routine fields regained styling (selects/inputs had no border). Track progress uses label/value rows on phones. Concept page labels are Portuguese ("Domínio", "Política mastery.v1" still visible) with correct plurals; knowledge-map list titles are readable text buttons instead of half-styled boxes, with correct plurals; catalog counts pluralized.
4. **Narrow reflow.** A parallel worker observed a horizontal scrollbar at 320 px on Windows. Cause: `html { min-width: 320px }` with a classic 15 px scrollbar (`clientWidth` 305). Removed; then `/progress` (ladder tread + 48 px H1) and `/knowledge-map` ("conhecimento" at 36 px) still overflowed at 305 px — panel H1s now scale between display tokens with Portuguese hyphenation and the ladder tread/padding shrink on narrow screens. New `tests/e2e/narrow-reflow.spec.ts` checks `scrollWidth <= clientWidth` with real scrollbars.
5. **Accessible names.** The first math rendering hid the authored text with `position:absolute`, which made Chrome/WebKit compute "representa 1/4 ?" (caught by the mobile percentage E2E). Authored text is now hidden inline (`.math-source`), restoring exact names in both engines.

Glyph check (Chromium, 320 and 1440 px, MAT-12): `document.fonts.check` true for Archivo 400/700/900 and JetBrains Mono with `ação fração equação solução ciência força posição não revisão ÇÃÉÍÓÚÂÊÔÀÕ`; zero clipped text elements with overflow hidden/clip. Repository SVG figures: 28 with text, UTF-8 without mojibake; inside `<img>` they use their declared Arial/Helvetica fallback (web fonts cannot load in image context).

6. **Assessments.** Save state shows text plus a static shape (Circle, CircleDot, LoaderCircle, CircleCheck, CircleAlert — the React Bits *Status Mark* idea without a spinner): "Sem resposta salva", alterada, "Salvando resposta…", "Resposta salva", falha. Explicit save is unchanged (no autosave).

## Performance before/after

Initial JavaScript per route, gzip, from production build manifests (`route-js` analysis of `page_client-reference-manifest`; framework floor 127 KB unchanged):

| Route | Before | After | Δ |
| --- | ---: | ---: | ---: |
| / (Hoje) | 234 | 210 | −24 |
| /tracks, /tracks/[id] | 207 / 206 | 144 / 143 | −63 |
| /progress | 264 | 197 | −67 |
| /history, /achievements, /projects | 206 | 143 | −63 |
| /knowledge-map, /exports | 210 / 208 | 147 / 145 | −63 |
| /plan, /review, /mistakes, /import | 214 / 208 / 210 / 214 | unchanged (±0) | 0 |
| /lessons/[id], /study/[id] | 226 / 227 | 228 / 229 | +2 (notation renderer) |
| /auth/signin | 192 | 193 | +1 |

Routes still at ~208–229 KB keep full zod because their client components validate API responses (repository rule); not changed. Requests: the per-document `GET /api/profile` is gone from every shell route (measured on /, /tracks, /progress, /lessons/MAT-03, /plan). Repeated-load layout shift on Today: 0 (first-compile dev load showed 0.025 once, not reproducible).

## Limitations

- WebKit: real-page flow on the local HTTP harness is still blocked by the production CSP upgrading assets to HTTPS (unchanged, not weakened). WebKit was checked by rendering actual server HTML/CSS via `setContent`: fractions, exponents and accessible names render correctly; web fonts cannot load in that harness (cross-origin), so glyph appearance in Safari with Archivo remains unverified locally.
- Pre-existing E2E failures reproduced identically on the untouched baseline worktree: `admin-metadata` blueprint match when run after `admin-authoring` (shared memory harness), `review-mistake-loop` alternate-question submission, and `session-navigation` when combined with other planner specs (passes alone, as in the previous release). Running every flag at once is not a valid configuration (legacy-shell specs expect the four-item navigation).
- Not changed: lesson enrichment, authoring pipelines, grading, mastery, review scheduling, session composition, Pack schemas.

## Verification log

- Baseline build `DATABASE_URL=memory://local pnpm build` PASS; baseline `pnpm test` 475 PASS / 3 optional SKIP.
- After increments 1–2: `pnpm typecheck` PASS, `pnpm lint` PASS, `pnpm test` 491 PASS / 3 SKIP (includes the parallel content worker's new tests).

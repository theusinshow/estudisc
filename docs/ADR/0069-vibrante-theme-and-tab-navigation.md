# ADR 0069 — Vibrante theme by default and tab navigation

Status: Accepted
Date: 2026-10-17
Supersedes the visual layer of ADR 0067 ("caderno de prova"). Tokens, domain rules and contracts of earlier ADRs are unchanged.

## Context

The owner found the cream/beige "caderno de prova" look washed out (low contrast, light body type, heavy uniform cards) and asked for a livelier, mobile-first interface for 14-year-old students that stays easy to read. A design lab (`/admin/lab`, spec `docs/superpowers/specs/2026-10-17-vibrant-theme-lab-design.md`) compared directions; the owner reviewed every design-system piece and chose palette "Limão" with Archivo heavy, the sticker card, 3D-key answers, the bottom result banner, the hint card and the motion set. Navigation hid mock and past exams behind a "Mais" menu.

## Decision

1. **Theme.** `themes.vibrante` in `design-system/design-tokens.json` (lime frame `#D4FF4F`, white sheets, ink outlines, one color per subject: Matemática coral, Ciências green, Português purple, Geografia e História yellow; radius 8/12/16/24/32/pill; body weight 500, display 900) is emitted as `[data-theme="vibrante"]` overrides and applied to `<html>` for everyone. Component treatments (pill buttons, fields, checkbox/radio, focus, reading sheet, dark bottom bar) live in `src/styles/themes/vibrante.css`. Every text/background pair passes WCAG AA (unit-tested).
2. **Navigation.** Four tabs around one central action: Hoje · Estudar · (▶ Continuar) · Provas · Você. `/continuar` resolves the destination only when tapped: an unfinished lesson, then due reviews, then the next lesson, otherwise Today. `/provas` gathers mock and past exams; `/voce` gathers progress, achievements, map, history, review, mistakes, plan, account, support and (ADMIN only) administration. The "Mais" menu and the profile sheet are removed. Wide screens show the same items as a sidebar with Continuar first.
3. **Interactions.** Motion uses the installed `motion` library only (no new dependency); interactive pieces render after hydration so no inline styles reach the CSP-protected server HTML; reduced motion disables animation; every drag has a tap/keyboard path.

## Consequences

- Students see the new look and navigation on the next deploy; no data, content or domain rule changes.
- The lab's theme toggle and cookie are removed; the lab remains the catalog of record.
- Lesson-level activity types shown in the lab (number line, ordering, classification, balance, graph, time zones, sentence builder, evidence highlighter) need their own ADR, Pack schema change and content before use in lessons. The confidence check changes review priority and needs an ADR with domain tests.
- Rollback: remove the `data-theme` attributes from the root layout (one line) to return to the ADR 0067 look; navigation rollback is the previous `primary-nav.tsx`.

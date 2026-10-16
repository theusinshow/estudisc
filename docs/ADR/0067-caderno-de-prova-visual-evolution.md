# ADR 0067 — "Caderno de prova" visual evolution

Status: Accepted
Date: 2026-10-16

## Context

The ADR 0030 neo-brutalist identity (warm paper, ink, solid shadow) works, but screens apply it uniformly: almost every block is a bordered card with a shadow. The hierarchy is flat, the dominant action competes with secondary content and paragraphs carry chrome that the Lesson spec already says they do not need. The user asked for a studio-level evolution anchored in real exam objects (answer sheet, answer key, grid notebook, correction stamp) without redesigning the approved identity or touching content, domain logic, routes or contracts.

The previous motion contract (≤ 180 ms, 2–4 px travel) does not allow the requested state-communicating gestures: a 24 px horizontal question transition, a 200 ms rotating feedback stamp and a 90 ms press.

## Decision

Evolve the canonical tokens to version 4.1.0 (additive; no token removed or renamed):

- **Elevation, three levels only:** `elevation.structure` (2 px rule, no shadow), `elevation.surface` (2 px border + 4 px solid shadow) and `elevation.action` (3 px border + 6 px solid shadow + 4 px press travel to zero shadow). Paragraphs and lists use structure; interactive blocks and examples use surface; only the dominant action uses action.
- **Type scale:** `typography.scale` 14 / 17 / 22 / 32 / 48 / 72 px (18 px reading on wide screens), `typography.width` for the Archivo `wdth` axis (expanded only for screen titles and large numbers), reading measure 66ch and leading 1.55. Archivo and JetBrains Mono remain the only families, loaded through `next/font` (two variable files, latin subset, `display: swap`).
- **Pattern:** `pattern.grid` (24 px cell, 1 px line, ink at 6 % opacity) for exercise and worked-example areas only.
- **Layout:** `layout.grid` with 4 mobile columns and a 20 px margin; 12 desktop columns with a central reading column and a notebook margin.
- **Motion:** `motion.uiFast/ui/uiSlow` (150/200/250 ms), `motion.press` (90 ms), `motion.stamp` (200 ms, −6°), `motion.questionTravel` (24 px) and `motion.easeOut` (no overshoot). Only `transform` and `opacity` animate. The ≤ 180 ms / 2–4 px rule continues to apply to ordinary interface feedback; the new tokens are limited to the press, the answer bubble fill and stamp, the question transition and progress growth. `prefers-reduced-motion` shows the final state immediately.
- **Focus:** `focus.width`/`focus.offset` become 3 px, matching what the application already rendered.
- **Signal:** `color.signal` marks only the dominant action of a screen and always carries `signalInk` text. Subject surfaces become identification tabs/stripes, not card fills.

Shared opt-in classes live in `src/styles/application/caderno.css`. Screens adopt them in later increments (session/lesson, Today/review, landing/sign-in, progress).

## Implementation notes

- Question/step transitions use the Web Animations API on the step that becomes visible instead of `AnimatePresence`: lesson steps stay mounted so answers and feedback survive navigation, so there is no exit to animate, and no motion code ships for it.
- Answer bubbles and the stamp are CSS (transform/opacity) in `caderno-study.css`.

## Consequences

- No Pack, schema, route, server action, domain rule or feature-flag change.
- Existing screens keep rendering; adoption is incremental and reversible per screen.
- `ClickSpark` leaves the study flow; achievement-only use stays allowed.
- Motion remains a single library (`motion`), loaded only in interactive islands.
- The `DESIGN_SYSTEM_INDEX.md` motion rule and `MOTION.md` reference this ADR for the scoped exceptions.

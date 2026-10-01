# ADR 0030: Neo-brutalist visual refresh

Status: Accepted (user request, 2026-10-01)

## Context

The owner rejected the previous student UI. Problems found on mobile and desktop:

- unstyled study buttons;
- a bottom navigation that wrapped onto two rows;
- boxes nested three levels deep;
- English and technical copy ("TODAY", "A ordem é determinística");
- the Archivo font was never actually loaded.

The owner asked for a full UI/UX refactor in a neo-brutalist direction, with references uiarc, spaceui, componentry, skecher-ui, useplanes and a neo-brutalism moodboard.

## Decision

- Tokens v4.0.0 in `design-system/design-tokens.json`:
  - violet-tinted ink on warm paper;
  - saturated surface roles (`color.surface.*`: violet, pink, lime, orange, sky, yellow);
  - 3px ink rules;
  - 4/6px solid offset shadows;
  - rounder radii (10–24px).
- Archivo (with the `wdth` axis) and JetBrains Mono are self-hosted with `next/font`, so the CSP `font-src 'self'` still holds.
- One control vocabulary: every button and action link in the main surface shares the same border, shadow and press behavior (`:where` base). Hover lift applies only on `hover: hover` devices.
- Shell:
  - sticky top bar;
  - four-item bottom bar on mobile, with a pill on the active item;
  - bordered sidebar on desktop from 900px;
  - no index numbers and no technical status badge.
- Pages sit directly on paper, without wrapper boxes. Color carries meaning:
  - recommendation kind (continue violet, review lime, mistake pink, project orange);
  - lesson block role (concept violet, example sky, warning orange, summary lime);
  - answer result (correct lime ✓, retry pink ↺, solution sky). The text label always stays.
- Today: one decision ("Quanto tempo você tem agora?"), a resume card, the next action and a plain queue.

Learning semantics, rendering engines, Attempts and mastery are unchanged. This is a presentation-only change.

## Consequences

- The legacy shell/panel/action CSS was removed instead of being overridden. Remaining feature CSS (Lab, import, admin) inherits the new tokens but has not had a dedicated pass yet.
- Contrast: ink (#17141F) on every surface fill passes AA for body text. Saturated fills never carry white text.
- The `prefers-reduced-motion` and 44px+ touch-target rules still apply.

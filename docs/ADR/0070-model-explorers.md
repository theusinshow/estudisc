# ADR 0070 — Model explorers in lessons

Status: Accepted
Date: 2026-10-17
Extends ADR 0050 (numeric-explorer modes) and ADR 0069 (vibrante interactions). The Pack block enum, Question contracts and evaluators are unchanged.

## Context

The design lab (blocks 8 and 9) showed tactile models that help a 14-year-old see an idea before answering: a 10×10 percent grid, a number line, an equation balance and a time-zone slider. Lessons only had the percentage and linear explorers. Ordering, classification, matching and evidence highlighting already exist as Question and activity types and got new renderers in the same phase without contract changes.

## Decision

1. **Four new `numeric-explorer` modes**, validated by `numericExplorerSchema` (bounded; nested entries strict):
   - `percent-grid`: `initial` and an optional `target` (0–100 cells). It shows the same value as %, fraction over 100 and decimal.
   - `number-line`: `min`, `max`, `divisions` (2–40), `initial`, optional `target` with a required `targetLabel` (for example "3/4"), and labelled `ticks`.
   - `balance`: `coefficient · x + constant = result`, accepted only when x is a whole number from 1 to 9. Students remove equal weights from both sides, divide when needed and try values of x.
   - `time-zones`: `initialUtc` and 2–6 places with whole UTC offsets. Each place shows its local time, whether it is day or night, and any change of date.
2. **Exploration only.** The modes record no Attempt, no ConceptEvidence and no score. A "Conferir" in a challenge is local feedback, like the existing explorers. The lesson's Questions still own practice and mastery.
3. **Resume.** A new interaction-state kind, `explorer`, stores `{ position, step, checked }` in the existing lesson resume snapshot. Older snapshots stay valid.
4. **Rendering.** Positions come from SVG attributes and data-attributes, not inline styles, so the server HTML keeps the strict CSP. Each mode works by touch (tap or drag) and by keyboard (range input or buttons). Reduced motion turns off transitions.
5. **Delivery.** New blocks reach published lessons only as the next lesson version through the existing lesson-version import (ADR 0063 path) and Admin Direct. Added `numeric-explorer` blocks are validated by this schema at import time.

## Consequences

- Existing percentage and linear payloads still parse (compatibility tests).
- Authors can add the models to any lesson without branching on track names. A mode that needs a scored answer must remain a Question.
- An explorer gives no evidence, so it never changes mastery, review priority or planner decisions.

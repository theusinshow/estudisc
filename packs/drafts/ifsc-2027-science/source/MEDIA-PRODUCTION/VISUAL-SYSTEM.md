# VECTA Science — Visual System

## Goal
Visual assets must improve comprehension. Decoration is secondary. A lesson must remain understandable without generated imagery.

## Shared look
- Educational editorial illustration, modern and clean.
- Strong silhouette and clear foreground/background separation.
- Mobile-first composition with generous empty margins.
- Avoid photorealistic clutter unless realism is pedagogically useful.
- Avoid glossy 3D "AI app" aesthetics, random gradients, excessive bloom, fake UI, floating icons and decorative particles.
- Keep a consistent visual family across all CIE lessons.
- Prefer one clear idea per asset over dense infographics.

## Text
Do not bake explanatory text, formulas, labels or legends into generated images.
Labels should be rendered by VECTA as HTML/SVG so they remain editable, accessible and reviewable.

## Scientific accuracy
Generative imagery is allowed only for conceptual/contextual illustrations.
Never use a generative image as the authoritative representation of:
- equations or numerical charts;
- electric circuit topology;
- atomic/molecular structures requiring exact counts;
- mitosis/meiosis stages;
- cell/anatomical labeling;
- optical ray diagrams;
- Punnett squares;
- Solar System scale;
- stellar-evolution flowcharts;
- maps requiring geographic precision.

Those must be deterministic SVG/HTML/Canvas/data-driven components.

## People and cultures
For lessons involving Indigenous and Quilombola peoples, prefer licensed documentary/educational sources from public institutions. Do not generate stereotyped people, clothing, rituals or territories.

## Accessibility
- Target contrast must remain understandable when displayed at phone width.
- Alt text is required.
- The visual must not be the only carrier of a fact needed to answer a question.
- Avoid color-only distinctions when categories matter.

## Production states
`PENDING → GENERATED → VISUAL_REVIEWED → FACTUAL_REVIEWED → APPROVED`

The image generator may only advance to `GENERATED`.
It must never mark its own output `FACTUAL_REVIEWED` or `APPROVED`.

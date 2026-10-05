# Prompt — Implement VECTA Science deterministic visual assets

Read:
- `MEDIA-PRODUCTION/VISUAL-SYSTEM.md`
- `MEDIA-PRODUCTION/DETERMINISTIC-ASSET-QUEUE.json`
- the current VECTA component library/design tokens
- the corresponding lesson/source-pack for each request

Implement or reuse deterministic SVG/HTML/Canvas/data-driven components. Do not generate scientific diagrams as raster AI imagery.

Priorities:
1. Reuse an existing VECTA component when it already satisfies the request.
2. Keep facts/data separate from presentation.
3. Responsive mobile-first rendering.
4. Accessible labels and controls.
5. Static fallback for interactive components.
6. Unit tests for calculations and discrete state logic.
7. Do not alter editorial lesson text merely to fit a component.

Process pilot assets first:
- CIE-06 circuit open/closed;
- CIE-07 electricity-consumption calculator;
- CIE-10 atom Z/A/p/n/e;
- CIE-18 mitosis/meiosis comparison;
- CIE-25 Punnett square;
- CIE-31 optical ray diagram;
- CIE-38 Earth-Moon phases/eclipses;
- CIE-40 stellar evolution.

After the pilot passes visual and functional QA, process the remaining queue.

At the end report:
- reused components;
- new components;
- tests added;
- unresolved requests;
- any scientific uncertainty that needs editorial review.

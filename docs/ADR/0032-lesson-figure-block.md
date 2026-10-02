# ADR 0032: Lesson figure block

Status: Accepted (user request, 2026-10-02)

## Context

Lessons can only show text and a few interactions. Geography maps, science diagrams, mathematics graphs and historical images are central to the IFSC exam, and the owner asked for images inside lessons. Question images already exist, but they are private exam-page assets served through an authenticated route and tied to official sources (`/api/question-assets`). Authored teaching figures have different needs: they belong to a lesson version, travel with the Pack and are not protected material.

Pack v2 already reserves `map`, `graph`, `table` and `hotspot` block names, but none is implemented.

## Decision

- Add one registered block type, `figure` (schema version 1). Specialised visuals (maps, graphs) are figures for now; the reserved names stay unregistered until they need interaction.
- Payload: `src`, `alt`, `caption`, optional `credit`, optional `longDescription`, `width`, `height`.
  - `src` is a base64 data URI of SVG, PNG, WebP or JPEG. The image is part of the immutable lesson version and is covered by its content hash. There are no external URLs or loose files.
  - Size limit: 200 kB decoded per figure.
  - SVG is rejected if it contains scripts, event handlers, `foreignObject`, external references or `javascript:` URLs. It also renders only through `<img>`, where scripts never run.
  - `alt` is required (at least 12 characters). Diagrams that carry information also need a `longDescription`, which is shown in a disclosure as the structured text equivalent required by PRODUCT.md.
  - `credit` records provenance ("Ilustração própria", or author/licence/source for public-domain material). Reserved official assets must never become figures.
- The CSP already allows `img-src data:`; nothing changes there.
- Draft authoring references SVG files under `packs/seeds/ifsc-2027.lesson-drafts/figures/`. The expander embeds them as data URIs, so the authored files stay reviewable as SVG source.

## Consequences

- Packs grow with their images. The size cap and SVG-first authoring keep a typical lesson under a few hundred kilobytes.
- Existing Packs are unaffected: this is an additive block type with schema, renderer, validation and tests in the same change.
- Changing a figure creates a new lesson version, like any other content change.

## Rejected alternatives

- Reusing `/api/question-assets`: it is built for protected exam pages behind authentication, not for portable authored content.
- Files in `public/`: not part of the imported Pack, not versioned with the lesson, and they would bypass import validation.
- Inline SVG markup rendered into the DOM: it needs a full sanitiser, and the `<img>` data URI is safe by construction.

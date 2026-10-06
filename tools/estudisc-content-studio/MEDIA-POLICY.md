# Media and copyright policy

Media improves understanding; it is not a mandatory decoration. Research proposes candidates, Author selects useful candidates, Reviewer checks rights/relevance/accessibility. A lesson must remain understandable without a video, external link or commercial book.

## Licensing states

| `licenseStatus` | Meaning | Allowed lesson use |
| --- | --- | --- |
| `APPROVED_EMBED` | Specific reuse permission and attribution verified | Embed a produced safe figure after validation |
| `LINK_ONLY` | Legitimate public reference without verified embedding permission | Supplemental link only |
| `REQUIRES_REVIEW` | Rights or intended usage need a decision | Candidate/task only |
| `UNKNOWN` | No trustworthy license verification | Candidate/task only; never embed |
| `REJECTED` | Rights, accuracy, quality or alignment unacceptable | Do not select |

A URL, Creative Commons logo, public organization or generated label alone does not establish embedding rights. Verify the exact asset/license/version, attribution obligations and any restrictions. Prefer public-domain or compatible Creative Commons material from Wikimedia Commons, Openverse-compatible providers, universities and official public institutions. Store `title`, source URL, source organization, author when known, license, attribution, usage status, lesson purpose, alt-text draft and last verification timestamp.

Unselected unknown-license candidates can remain in the Media Pack for future research. Selected embedded media with unknown/review/rejected/link-only status blocks approval. Never change a status merely to pass the validator; record the real evidence for the decision.

## Runtime figure constraints

Estudisc's `figure` requires a produced base64 data URI of SVG, PNG, WebP or JPEG, maximum 200,000 decoded bytes. External image URLs do not render as a figure. SVG scripts, event handlers, external references and `foreignObject` are rejected. The figure requires useful alt text (runtime minimum 12 characters), caption and positive width/height up to 4,000; preserve credit and a long description when needed.

Do not fetch unlicensed assets into public/static directories. Store local editorial candidates in the job workspace. When embedding is approved, the authored figure source must correspond to that candidate and its attribution. Alt text should convey what learners need, not merely say "image". Do not use color as the only distinction. A complex diagram needs a readable textual equivalent; labels must remain legible on mobile.

## Generated illustrations

Set media `sourceType: "GENERATED"` and retain the generation prompt/specification, labels, style constraints, alt-text draft and generator/run information when known. Use an actual produced figure source before embedding. A `GENERATED_IMAGE_REQUEST` is an unfulfilled production task, not proof an image exists or has passed review.

Generated art still needs factual review, rights/attribution review, accessibility and safe figure validation. Never silently mark a hypothetical generated image `APPROVED_EMBED`. A hand-authored schematic must identify its real origin; do not invent a third-party creator or license.

## Videos

Store title, creator/channel, legitimate URL, duration, useful start/end seconds, Concept IDs, age/level fit, reason selected and last verification date. Inspect the actual content/segment when research capability permits. Reject factual problems, excessive length, excessive difficulty, poor visual/audio clarity and superficial keyword matches.

Videos are supplemental recommendations in editorial metadata. Estudisc has no dedicated video block in this foundation. A text block may display a legitimate plain-text URL; its renderer does not create clickable links or parse Markdown. Request a safe resource-links component when needed; do not invent an iframe/video component. If the video disappears, the explanation, example and practice must still work.

## Books and readings

Store title, author, publisher, edition/year when known, chapter/topic, pages only when legitimately known, recommendation rationale and a legitimate link when available. Record unknown bibliographic fields as unknown/omitted rather than guessing.

Commercial books may be recommended and cited. Do not copy textbook pages, protected diagrams/book images or long excerpts into lessons. Prefer a concise original explanation and a supplemental chapter recommendation. The lesson cannot require purchasing or accessing the book. Books/readings remain editorial metadata or authored text with a plain URL; there is no dedicated book block or automatic clickable-link renderer.

## Protected official exams

Exam assets/text follow Estudisc's provenance and reservation policy. Keep protected sources private. Do not embed reserved historical assets, place them in public static assets, copy official stems into research notes/prompts or export them as generated questions. Historical metadata may guide reasoning style without exposing protected content. Author new transfer problems and label their actual provenance.

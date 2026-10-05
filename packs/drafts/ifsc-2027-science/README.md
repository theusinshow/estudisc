# IFSC Science — forty draft lessons

This versioned snapshot preserves CIE-01 through CIE-40 and 320 generated shared Questions. It is an importable **draft**, separate from the public Pack catalog and production student state. Committing it does not import or publish it in the application.

- `science.pack.json`: sealed Pack v2, snapshot 7; 1,046,767 bytes; raw SHA-256 `a44180849db02d397efc4da100267889ae5132c39218ea2184e2966ceb3b91e2`; canonical content hash `722f1deeb98c55cb121f988931596830a68c5bd4ab15fcf7754f49ebe574bc27`.
- `editorial-sidecar.json`: complete original editorial arrangement and integration mappings.
- `source/`: all 620 supplied JSON/Markdown source files, preserved byte for byte; source archive SHA-256 `0b382a3d8ea73d4b8cabb36ddcba9ddf8bc707ce8bddeb61d1969c5ce2f4a30f`.
- `media/`: thirteen deterministic static SVG drafts and their hash-pinned asset manifest. They are supplemental drafts, not factual/visual approval or implementations of requested interactions.

The package resolves 240 Concepts (nine existing, 231 intentional additions) and 538 blocks. Thirteen figure-bearing lessons use runtime version 3; the other 27 lessons and all Questions retain version 2. Original editorial version 2 is unchanged. Prior published versions must remain immutable.

The local development import was rechecked on 2026-10-05 in a read-only transaction: forty current draft lessons, 320 Questions, seven snapshots, zero orphan joins or duplicate Question versions, and zero student Attempts/events/evidence. Existing Mathematics/IFSC data and the 380 baseline Questions were preserved. That database is deliberately excluded from Git.

Pending: human factual/editorial/publication review, forty stale upstream manifest hashes, official syllabus crosswalk, prerequisite/pacing review, eleven deterministic components and thirteen Antigravity illustrations. The importer limit leaves only 1,809 bytes of headroom; enrich through a compatible new version rather than altering this sealed file.

Validate with `pnpm exec vitest run tests/science-import-tooling.test.ts tests/science-qa-import.test.ts tests/science-qa-render.test.tsx`. Tooling: [Science integration](../../../tools/science-import/README.md). No production import, publication or deployment is included in this delivery.

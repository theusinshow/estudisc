# IFSC Science — forty draft lessons

This versioned snapshot preserves CIE-01 through CIE-40 and 320 generated shared Questions. It is an importable **draft**, separate from the public Pack catalog and production student state. Committing it does not import or publish it in the application.

- `science.pack.json`: Pack v2, snapshot 8; 1,041,289 bytes; raw SHA-256 `8f7446fd3eca1150e26d15f7f9a7b7f41bc196303a7974582638c85cff4c403a`; canonical content hash `83bc36270957427f7d84748a6688ac7f39e6e7ec382fcef4a0fe91ceb2ad883a`.
- `editorial-sidecar.json`: complete original editorial arrangement and integration mappings.
- `source/`: 620 tracked JSON/Markdown files. The 40 author lessons and 40 approved lesson packs now contain 160 source-checked misconception/correction pairs; the original supplied archive hash remains `0b382a3d8ea73d4b8cabb36ddcba9ddf8bc707ce8bddeb61d1969c5ce2f4a30f`.
- `media/`: thirteen deterministic static SVG drafts and their hash-pinned asset manifest. They are supplemental drafts, not factual/visual approval or implementations of requested interactions.

The package resolves 240 Concepts (nine existing, 231 intentional additions) and emits 514 blocks; 24 blocks containing only media placeholders are omitted. All 40 runtime lessons use version 3 and the 13 figure-bearing lessons use version 4. The 320 Questions remain version 2 and byte-for-byte unchanged. Original source lesson version 2 remains recorded.

Historical local development import QA on 2026-10-05 covered the earlier snapshot 7: forty draft lessons, 320 Questions, no orphan joins or duplicate Question versions, and no student Attempts/events/evidence. Snapshot 8 is validated through the disposable content-QA suite; no persistent integration database was changed by this task.

Pending: official syllabus crosswalk, prerequisite/pacing mapping, eleven deterministic interactions and thirteen generative illustrations. The static figures keep factual/visual review states in hidden metadata; the Pack remains a draft and makes no readiness certification.

Regenerate with `python tools/science-import/media/build_assets.py`, copy its `assets.json` to this package's `media/assets.json`, then run `pnpm exec tsx tools/science-import/critical-cleanup.ts`. Validate with `pnpm exec vitest run tests/science-import-tooling.test.ts tests/science-qa-import.test.ts tests/science-qa-render.test.tsx`. Tooling: [Science integration](../../../tools/science-import/README.md). No production import, publication or deployment is included in this delivery.

# Estudisc — Phase 7 teaching-asset metadata/authoring increment

Date: 2026-10-07. Base checkpoint: `57be5e6`. User authorized continuing local work with current model/effort and no additional agents. No actual license, independent review, publication, protected storage or production operation is fabricated.

## Contract and actual inventory

[ADR 0045](../ADR/0045-teaching-asset-metadata-and-reuse.md) extends the existing Studio Media Pack. Optional teachingAsset metadata records explicit version/type, subjects/Concepts/tags, dimensions/text equivalent, reusable/interactive-ready intent, rights-evidence reference, teaching/protected exposure and optional pinned content hash. Old candidates parse exactly, without injected defaults or rewritten hashes.

Read-only inventory of the actual current local Studio workspace found 19 jobs, four produced image candidates: two APPROVED_EMBED, two REQUIRES_REVIEW. None has new explicit reusable metadata; reusable/interactive-ready counts remain zero. No status/rights/review or source artifact was changed. Metadata alone is not a licence certificate; source, permission, attribution and verification remain the actual editorial record.

Reuse requires cleared verified embedding rights/attribution, safe produced source, explicit teaching/reuse/evidence metadata and matching hashes. Unknown/link-only/review/rejected, unproduced, protected or mismatched/stale candidates fail closed. InteractiveReady remains declared intent plus usable text, not pedagogical certification. Source-artifact, content, metadata and policy/dependency hashes are distinct; unchanged bytes cannot hide a licence withdrawal. Duplicate identities are rejected rather than selected ambiguously.

The registry never scans/copies the Question asset table, reserved source originals, private learner data or bytes into public assets. Its metadata-only index omits src/base64. Protected Question storage/exposure APIs, auth, CSP, learner Pack envelopes, databases and published corpus remain unchanged. Existing Studio root/job/symlink checks remain the local file boundary.

## Concrete consumer

`pnpm estudisc-content assets` lists at most 20 metadata rows plus counts, with `--query`, `--subject`, `--concept`, `--type`, `--reuse-only`. Search normalizes accents without changing stored labels. `assets-index` writes `.teaching-assets-index.json` inside the existing ignored workspace. It is a local derived inventory, not publication or mutation of jobs/approval history.

`referenceForTeachingAsset` creates the strict version/content/metadata/source/policy reference. `resolveTeachingAsset` rebuilds/rechecks current source hashes/rights and rereads the source before returning a candidate for local authoring. Stale or protected selection is rejected. No automatic insertion into a lesson, publication, external asset fetching/generation or approval occurs. Admin library UI/production distribution remain later consumers; this increment has no new student/admin screen to imply an installed public catalogue.

Existing visual provenance validation now applies to all sources in figure, comparison, hotspot and map. A licensed primary does not clear a second image. Each source needs its own matching produced APPROVED_EMBED candidate, alt and preserved attribution; protected candidates and declared content-hash mismatch block use. Unknown unselected candidates remain available for future research.

## Validation

- `pnpm exec vitest run tests/unit/teaching-assets.test.ts tests/unit/content-studio.test.ts tests/science-qa-render.test.tsx` — 36 PASS: exact legacy candidate parsing, licence/production/protected rejection, search/hash binding, same-byte rights withdrawal/stale rejection, duplicate identities, separate composite licensing, and actual published corpus rendering.
- `pnpm estudisc-content assets` — four actual metadata candidates, zero reusable, zero invalid; `assets --reuse-only` — zero selected; `assets --query 'triângulo'` — two actual labelled candidates with distinct current rights.
- `pnpm estudisc-content assets-index` — metadata-only ignored workspace output, four entries/zero reusable/zero issues; no job/approval/source mutation. `pnpm estudisc-content schemas` refreshes ignored generated schemas; runtime refinements still require validator execution.
- `pnpm test` — 346 PASS / 3 optional real-PostgreSQL SKIP; `pnpm lint` and focused `pnpm typecheck` PASS; `pnpm packs:verify` PASS (one catalog Pack).
- Final default `pnpm test:e2e` — 44 PASS / 18 intentional flag-gated SKIP (22/9 per fresh desktop/mobile server).
- Final all-on `pnpm test:e2e tests/e2e/interactive-blocks.spec.ts tests/e2e/lesson-resume.spec.ts tests/e2e/adaptive-session.spec.ts` — 12 PASS / 2 intentional off-case SKIP.
- Final foundation/routine/resume/interactive on, adaptive off: `pnpm test:e2e tests/e2e/foundation-evolution.spec.ts tests/e2e/routine-planner.spec.ts tests/e2e/lesson-resume.spec.ts tests/e2e/interactive-blocks.spec.ts` — 18 PASS / 2 intentional off-case SKIP. Fresh serial desktop/mobile servers use DATABASE_URL=memory://local; default flags all false, on combinations as described.
- Final `pnpm build` and `pnpm typecheck` PASS. `node .local/teaching-assets/verify-evidence.mjs` PASS: eight current code/test hashes, 39 actual prior Phase 6 comparisons, 12 unchanged source files and four actual current media-file hashes; source/corpus/storage/auth/CSP/engines/dependencies unchanged. [Evidence](TEACHING-ASSETS-EVIDENCE.json); previous receipts are historical and not rewritten. `git diff --check` PASS. No new frontend visual direction; Phase 6 geometry/accessibility is rechecked through the on suites, not claimed from old screenshots alone.

## Compatibility and continuation

No DDL/backfill/Pack transform or actual asset promotion. Current source/edit/review bytes remain immutable where already published; new candidates/metadata require actual review. Local file references are authoring inputs, not portable public storage URLs. Rights evidence is an explicit recorded editorial reference, not automatic legal inference or independent QA. Production migration/deployment, storage providers/exposure, new assets and publication remain separate authorization/domain boundaries.

This metadata/authoring increment is accepted locally. NEXT ACTION: checkpoint, then Phase 8 local blueprint extraction/summaries/clusters with version/source/dependency/policy hashes. Do not send the 132 full lessons to a stronger model or republish them; escalate only precise low-confidence pedagogical exceptions.

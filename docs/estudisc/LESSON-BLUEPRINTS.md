# Phase 8 — Local Lesson Blueprint proposals

Date: 2026-10-07. Base checkpoint: `a70b98d`. Contract: [ADR 0046](../ADR/0046-local-lesson-blueprint-proposals.md); deterministic rules/cache policy: [BLUEPRINT-POLICY.md](../../tools/estudisc-content-studio/BLUEPRINT-POLICY.md). Proposal-generation increment accepted locally; actual hashes/aggregate are in [evidence](LESSON-BLUEPRINTS-EVIDENCE.json).

## Actual sources and output

`pnpm estudisc-content blueprints` reads the four exact local import artifacts identified by the historical production audit, validating their normalized canonical hashes and lesson counts. It extracts all 132 version-bound lessons: Mathematics 19, Science 40, History/Geography 49 and Portuguese 24. Their original draft status remains unchanged; historical audited publication is labelled separately and does not imply a fresh production read or independent pedagogical/rights review.

Each compact sidecar contains track/lesson versions, title/subject/Concepts, actual objectives, block/Activity types and counts, whitelisted teaching-text word count, source IDs/caveats, proposed archetypes/blocks, visual/configuration needs, confidence/reasons and current eligible metadata-only asset references. Full block payloads, Question stems/choices/answers, source originals and image bytes are never exported. Goals remain null for 113 lessons with no explicit objectives. Common mistakes stay empty rather than invented. All 132 proposals are UNREVIEWED; even a high heuristic confidence requires actual review.

Deterministic title/Concept/objective cues propose reusable existing map/list, timeline, numeric explorer, guided process, classification, text highlight and comparison patterns. Numeric/map/timeline/process configuration still needs an approved concrete blueprint; no custom simulation, geographic provider or new renderer is installed. Clusters and frequencies are deterministic; 117 proposals have explicit review/source findings. Missing objectives need human source review before a precise unresolved pedagogical exception merits Terra. No Sol High escalation is justified by this mechanical extraction.

The existing inventory yields zero explicitly reusable asset matches, preserving all actual licence states. No asset, blueprint, lesson or Question was approved or published. Admin Blueprint Viewer/enrichment remain later consumers.

## Cache and file boundary

Ignored Studio `lesson-blueprints/` holds one current identified artifact per lesson version plus metadata-only index/report. Filename binds identity and complete input hash, retaining older generations. Source/corpus hashes, curriculum/catalog dependency hash, implementation/schema/policy hash and actual current asset inventory/rights hash prevent source-only false skips. Unchanged validated proposals keep their original timestamp; corrupted files, invented review states and source/dependency/policy/asset changes cannot reuse stale proposals. The four audited source pins fail closed on content changes pending explicit reconciliation.

Index contains actual artifact hashes and source pins; report contains clusters, interaction/component/asset frequencies and compact exceptions. Both are reconstructed deterministically, not trusted from cache. Output uses existing Studio path/symlink checks and atomic writes, confined to the default ignored workspace or `.local/`; public/committed workspace output is rejected. No network, database, content import, publication or learner-state write.

## Validation

- `pnpm exec vitest run tests/unit/lesson-blueprints.test.ts tests/unit/teaching-assets.test.ts tests/unit/content-studio.test.ts` — 38 PASS: actual 132-version extraction, absent-goal boundaries, deterministic totals/classification, unresolved/cyclic prerequisites, independent hash changes, real unchanged cache/timestamp preservation, corrupted/forged-review repair, real inventory/rights withdrawal invalidation, previous generation retention and changed audited-source rejection.
- `pnpm estudisc-content blueprints` — 132 current proposals; 113 missing objectives; 117 flagged for review; zero reusable asset matches. Repeated unchanged runs must report generated=0/skipped=132.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm packs:verify` — PASS. Initial typecheck caught a nonexistent fixture field `requiredLevel`; using the existing prerequisite `strength` contract resolved it before acceptance.
- `pnpm test` — 351 PASS / 3 optional real-PostgreSQL SKIP (115 passed files / three skipped files).
- `pnpm test:e2e` — 44 PASS / 18 gated SKIP, fresh owned serial servers for chromium/mobile-chrome (22 PASS / nine SKIP each). `DATABASE_URL=memory://local`; `FEATURE_STUDY_PLANNER`, `FEATURE_HOME_TODAY`, `FEATURE_INTERACTIVE_LESSONS`, `FEATURE_ADAPTIVE_SESSION` explicitly false. No frontend/flags change; previous accepted flagged receipts remain historical, with actual source/test hashes compared.
- `pnpm estudisc-content blueprints` twice — first 132 generated / zero skipped; second zero generated / 132 skipped. Final proposals: levels 1=59 / 2=73 / 3=0; archetype counts can overlap (chronological 13, classification nine, comparison 13, explanation 59, interpretation 20, numeric 15, process 12, spatial 13). Missing objectives 113, review exceptions 117, reusable asset matches zero.
- `pnpm estudisc-content schemas` and `pnpm exec eslint tools/estudisc-content-studio/cli.ts` — PASS; blueprint JSON Schema included, semantic refinement still requires the actual validator.
- `pnpm exec tsx .local/blueprints/verify-evidence.mjs` and `git diff --check` — actual current/prior/spec/media/corpus/artifact/link/frozen-runtime verification. Evidence contains current hashes, 47 actual prior accepted comparisons, 12 unchanged source documents, four unchanged media inputs and four actual source packs/132 proposals. Generated Next/type/token churn is restored after verification; no authored runtime change.

## Remaining boundary and continuation

This is a proposal-generation gate, not approval or content-enrichment completion. Review explicit objectives/source/prerequisite findings and a bounded pilot before Phase 9 draft enrichment. Existing published versions remain immutable; reviewed new content remains draft until authorized publication. Admin/distribution, MapLibre/provider work, production rollout and optional real-PostgreSQL validation retain their existing boundaries.

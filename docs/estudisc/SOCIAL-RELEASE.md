# Social-project release rule and current activation state

Date: 2026-10-07. Base checkpoint: `86b85f9`. Policy/candidate increment accepted locally. Explicit user instruction: [ADR 0048](../ADR/0048-social-project-direct-release.md), persisted in [AGENTS](../../AGENTS.md) and [AUTONOMY](../../AUTONOMY.md). Actual current/prior/source/output hashes: [evidence](SOCIAL-RELEASE-EVIDENCE.json).

## Effective rule

Estudisc is a social project. Users review usage/content after launch. Do not require Matheus to spend time on human/independent editorial review or repeatedly approve authorized launches. Complete engineering validation and use the existing authenticated Admin Direct path, with the actual actor/reason and standing owner authorization. Preserve historical Editorial Reviewed evidence; never fabricate it. This applies to the current enrichment pilot and future in-scope releases.

Current candidate metadata is ADMIN_DIRECT_AUTHORIZED, blueprint editorial evidence stays UNREVIEWED, independentQaRecorded=false, and community feedback is pending. The release request targets only MAT-07 v5 and carries the explicit user instruction as its reason. Old REVIEW_REQUIRED generations and receipts are retained as history; the new generation is selected by complete policy/input hashes. No extra publication mode, reviewer identity, approval workflow, core engine, security boundary or Pack contract has been added.

## What actually changed

- Persistent repository operating rule and ADR; current Phase 9/pipeline policy reconciled.
- `social-release-policy.ts` records the explicit instruction; candidate preparation emits `release-request.json` and the existing `publish_lessons_direct` payload, preserving native percentage behavior, 14 original blocks, 18 activities and twelve Question identities/versions/hashes.
- Forged editorial approval data is repaired to the truthful authorized direct-release request, not to an editorial/human approval gate. Actual source/policy/asset dependencies invalidate old output generations; repeated unchanged execution writes zero files.

No production deployment/import/publication was performed. Authorization metadata is not a claim of completed release.

## Technical continuation

The Track Pack repository currently inserts a new Track aggregate at `applyTrackPack`; caderno.lesson.v1 uses the legacy lesson contract. Neither provides the needed targeted v2 lesson-version append with existing shared Questions/Concepts in the live collection. Full re-import or a duplicate studio Track would violate the approved source/version constraints. This is a concrete engineering prerequisite, not editorial review.

[Terra handoff and exact next prompt](handoffs/2026-10-07-targeted-enrichment-import.md): define/implement compatible targeted import identity/version/idempotence, existing references and transaction boundaries; preserve old published rows/sessions/resume and run database/compatibility gates, then activate via existing Admin Direct under standing authorization. No additional user editorial approval. No model switch/additional agent performed here. Sol High is unnecessary for this policy change; actual high-risk data transformation would need its own risk assessment.

## Verification

- `pnpm exec vitest run tests/unit/enrichment-preview.test.tsx tests/unit/lesson-blueprints.test.ts tests/unit/teaching-assets.test.ts tests/unit/content-studio.test.ts` — 42 PASS; direct-publication schema, no fabricated QA/Reviewer, actual unchanged Question/content hashes and cache/repair/rejection checked.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm packs:verify`, `pnpm estudisc-content schemas` — PASS.
- `pnpm test` — 355 PASS / 3 optional real-PostgreSQL SKIP (116 passed files/three skipped).
- `pnpm estudisc-content enrichment-preview --request tools/estudisc-content-studio/recipes/percentage-calculation.v1.json` twice — four new-generation files written, then zero; ADMIN_DIRECT_AUTHORIZED / twelve retained Question references.
- `pnpm test:e2e` — 46 PASS / 18 gated SKIP, fresh serial chromium/mobile-chrome servers (23 PASS/nine SKIP each); DATABASE_URL=memory://local and FEATURE_NEW_TODAY/STUDY_PLANNER/INTERACTIVE_LESSONS/ADAPTIVE_SESSION explicitly false. No new student UI/behavior. Earlier screenshots/on-browser receipts remain historical; current runtime/renderer/test targets are actually hash-compared.
- `pnpm exec tsx .local/social-release/verify-evidence.mjs` — four current code/test hashes, 58 actual unique prior accepted comparisons, twelve unchanged source documents, four media inputs/four published-source packs, actual release output hashes/twelve Question references and local links verified. No fabricated QA or runtime/engine/auth/Pack/dependency changes. `git diff --check` PASS; generated Next/type/token churn restored, final `pnpm typecheck` PASS.

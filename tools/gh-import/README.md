# GH V2 importer — persistent technical context

Integrates the supplied VECTA-GH-CONTENT-IFSC-2027-1-v2 package without research, editorial rewriting or question generation. Reuses the Science adapter (`buildEditorialPack`, `mapBlock`, Concept validator, preservation auditor and static mobile preview), existing Pack v2 schema, transactional importer, shared Question Bank, core renderer/evaluators and publication gates. Science defaults and its sealed snapshot remain unchanged. No UI, schema, input-limit or learning-engine changes.

## Inputs and identities

Portable source: `packs/drafts/ifsc-2027-gh/source/`, all 753 original files. ZIP SHA256: `229d63e537a83d5305d8c0954ef3f93f9199d328211aad9507e5572084b086bf`; every extracted file was compared against its ZIP entry with zero differences. `source-baseline.json` pins every file; `.gitattributes` disables line-ending conversion to preserve sealed bytes across clones. `editorial-sidecar.json` retains the complete original lessons, Questions, source library, Concept map, media queues and defaults. Nothing is placed in public assets or the public Pack catalog.

Stable source IDs collide semantically with existing lessons: source GH-02 is Cartography; existing GH-02 covers Santa Catarina peoples. ADR 0037 uses runtime GH-V2-01..49 and the same prefix for Questions/blocks/activities. Original IDs remain intact in source and the sidecar's explicit map. Runtime Lessons use version 3 for the compact projection, source Lessons remain version 2; Questions retain version 2.

There are 293 editorial atoms, including five in GH-06 and six in each other lesson. Three safe existing mappings: GH-01-CON-01 -> GH.GEO.SPACE; GH-04-CON-03 -> GH.HIST.MEMORY; GH-15-CON-01 -> GH.BR.SLAVERY.RESISTANCE. The other 290 are explicit new atoms. Existing canonical titles/summaries/importance are retained. Source name/target inconsistencies are not repaired or silently merged: all remain visible for human taxonomy review. Official curriculum crosswalk and prerequisites remain unverified; inventory does not establish planner-ready coverage.

## Projection and media

The adapter validates IDs, local Concept references, ordered blocks, eight Questions per lesson, distinct A–E alternatives and exactly one answer. It preserves every educational string, stem, choice, key and explanation. Reasoning arrays and string answer guides become text using Science's existing block mapper. Only verbatim repeated strings within one block are deduplicated; their complete original arrangement remains in source/sidecar. COMPONENT_REQUEST becomes a pending deterministic note. RECALL -> recall; SOURCE_ANALYSIS -> analyze; TRANSFER -> apply; generated provenance never becomes official or human-created. Estimated minutes 30, core kind and new-Concept importance medium are disclosed integration defaults. Open-text exit tickets remain notes; no official attempt, mastery or fabricated machine evaluation is created.

The initial full projection exceeded the existing 1 MiB transport limit (1,150,549 bytes). Compact projection keeps redundant block ID/hash/type provenance and complete source metadata in the sealed sidecar rather than repeating it in runtime payloads. Renderer-required type/title/content and source identities remain. Source URLs are retained in original records but absent from runtime links. The final raw Pack is 1,046,064 bytes, leaving 2,512 bytes of headroom; do not enrich or modify a sealed version in place. Future assets require a compatible versioned packaging plan within the unchanged limit.

Media pipelines remain separate:

- AUTHENTIC-MEDIA-QUEUE.json: 42 authentic requests, pending license/provenance review; no links or embeds.
- DETERMINISTIC-ASSET-QUEUE.json: 29 exact maps/timelines/charts/components, pending source/data validation and implementation.
- ANTIGRAVITY-QUEUE.json: six non-documentary conceptual illustrations, pending factual/visual review and generation. AI images must never represent photographs, documents or historical evidence.

No external media service was invoked. Runtime status is preview and all Lessons/Questions are draft, not LIVE. No human approval is recorded.

## Commands and recovery

Run from the repository root with pnpm available. In this shell pnpm was absent, so each command prepended `C:\Users\matheus.mendes\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback` to PATH; no credentials were read. Dependencies were resolved from the unchanged lockfile.

```powershell
pnpm exec tsx tools/gh-import/cli.ts preflight --stage pilot
pnpm exec tsx tools/gh-import/cli.ts import --stage pilot
pnpm exec tsx tools/gh-import/cli.ts validate --stage pilot
$env:GH_QA_PACK='.local/gh-integration-final/pilot/gh.pack.json'
pnpm exec vitest run tests/gh-import.test.tsx tests/science-import-tooling.test.ts tests/science-qa-render.test.tsx tests/unit/ifsc-week-pack.test.ts
$env:DATABASE_URL='memory://local'
pnpm exec playwright test tests/e2e/gh-qa-mobile.spec.ts --project=mobile-chrome
```

Eight pilots are GH-02/08/15/21/24/30/44/49. Schema/renderer/evaluator and mobile/keyboard PASS evidence is bound to the exact pilot hash. Each subsequent `batch1` through `batch5` runs the same preflight/import/validate commands. The CLI refuses advancement without previous validated receipt and matching pilot QA. Cumulative totals: 8/64 -> 16/128 -> 25/200 -> 32/256 -> 42/336 -> 49/392. Every import is immediately retried to prove idempotence. Pilot and five batches preserve a baseline with 52 Lessons, 460 Questions and three reused Concept definitions (tracked IFSC Week 1 plus Science). Optional additional local Mathematics pack is included only when available; it was absent in this run.

Owned persistent development DB: `.local/gh-integration-final/db`, existing migrations applied only there. Per-stage sealed Pack, sidecar, receipt and preservation report live under `.local/gh-integration-final/<stage>/`. The earlier oversized-projection pilot DB remains isolated under `.local/gh-integration/db`; the intermediate compact preflight remains under `.local/gh-integration-compact`. Neither is the final imported candidate and neither was destroyed. For a fresh clone, run pilots/tests before the same batches; no Downloads or ignored DB is required.

Final portable Pack: `packs/drafts/ifsc-2027-gh/gh.pack.json`, snapshot 6; canonical SHA256 `9b1c25c167c85449e47a498a68dccd22d298dc53e2a78b6e9702b5c3b998a858`; raw SHA256 `a0e6c36d26fbe5e264e5cbe419ef74ee77b940a372b38e69a71c57537f5c6729`. Actual persisted Questions and blocks are compared against the candidate; baseline fingerprints and learner-state counts must remain unchanged. Expected latest content: 49 draft Lessons, 392 draft Questions, 293 mapped atoms, 670 blocks.

## Validation log

Initial pilot preflight/import/validate and mobile smoke PASS. Initial focused checks: four files / ten tests PASS; typecheck and scoped lint PASS. Final compact pilot preflight/import/validate PASS; the same ten focused tests and eight-pilot mobile smoke PASS. Original 753-file ZIP comparison PASS. Five subsequent batch preflight/import/validate steps PASS; strengthened final persistent block/Question/Concept validation PASS.

First full GH integration test correctly observed importer status `conflict` but expected the wrong label `version_conflict`; only the test expectation was corrected. An exploratory `pnpm exec tsx -e` probe lost quotes through the Windows command wrapper; direct `node --import tsx -e` worked and exposed the size exception. Both were resolved without changing core contracts. The full 49-lesson migration/import/rollback fixture uses a 120-second test timeout (its isolated run took 57 seconds); its assertions remain intact.

Final commands/results:

- `pnpm exec vitest run tests/gh-import.test.tsx tests/gh-qa-import.test.ts`: 3 passed; immutable conflict/atomic rollback and source/render/evaluator/draft checks PASS.
- `pnpm exec tsx tools/gh-import/cli.ts validate --stage batch5`: PASS, including exact persisted 670 blocks, 392 Questions and 293 Concept references.
- `pnpm lint`: PASS, no warnings after unused-import cleanup. Targeted `pnpm exec eslint tools/gh-import tests/gh-import.test.tsx tests/gh-qa-import.test.ts tests/e2e/gh-qa-mobile.spec.ts`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: 77 files passed, one skipped; 193 tests passed, one real-PostgreSQL test skipped. Log `.local/gh-integration-final/full-test.log`.
- `$env:DATABASE_URL='memory://local'; pnpm test:e2e`: 24 passed / 14 failed in 5.2 minutes. Both GH pilot and both Science pilot preview cases passed; broader E2E gate remains unaccepted. Log `.local/gh-integration-final/full-e2e.log`.
- `pnpm build`: PASS; Next compiled and checked types successfully. Log `.local/gh-integration-final/build.log`.
- Six-receipt/source-pin audit with direct `node --import tsx -e`: PASS, exact saved pack hashes/counts/idempotence/draft/state flags. `git check-attr text eol -- packs/drafts/ifsc-2027-gh/source/workspace/GH-02/approved/pack.json packs/drafts/ifsc-2027-gh/gh.pack.json`: text unset, preserving sealed bytes. `git diff --check`: PASS.

The 14 E2E failures are sign-in design/motion (four), legacy import UI flows (six), catalog/progress continuation (two), mobile percentage session (one) and mobile Lab RUN (one). These categories were previously documented in the repository, but the precise comparison baseline log is absent in this checkout: no claim of zero new failure names. No unrelated runtime/test repair was made. Static pilot QA establishes semantics/layout/native keyboard behavior only, not a hydrated study session or publication review.

Next build regenerated next-env.d.ts; its two development-type imports were restored to preserve the pre-existing dirty file. The pre-existing SCIENCE-CURRICULUM-MAP.md was untouched. Generated design tokens match HEAD; no unrelated source changes, credentials, database or public media were added.

The initial integration ended with preview drafts. Subsequent genuine owner authorization (2026-10-05): "Aulas revisadas, pode ja aplicar no software". This authorizes applying/publishing these exact49lessons/392Questions; no unrelated deployment, production migration, credential handling or media approval is inferred.

## Reviewed application recovery

Repository checkpoint validation after explicit commit/push authorization: `pnpm exec vitest run tests/gh-import.test.tsx tests/gh-qa-import.test.ts tests/integration/gh-reviewed-publication.test.ts tests/science-import-tooling.test.ts tests/science-qa-render.test.tsx tests/unit/ifsc-week-pack.test.ts` PASS6files/12tests (64.50seconds); `pnpm lint`, `pnpm typecheck` and `git diff --cached --check` PASS. A Git-index byte audit verified the sealed runtime Pack hash and every753source-file SHA256 pin; pre-existing next-env.d.ts and SCIENCE-CURRICULUM-MAP.md remain excluded. No further full-suite/build/E2E repetition for the commit-only request; earlier limitations remain applicable. Production application still requires ADMIN login.

`reviewed-release.ts` pins the portable Pack rawSHA256 and exact49GH-V2 version3 Lessons/392version2Questions, then builds two existing `publish_lessons_direct` payloads40+9 with the genuine owner reason. No content is rewritten or forged editorial reviews supplied. `pnpm exec tsx tools/gh-import/prepare-reviewed.ts` writes ignored `.local/gh-application/application-plan.json` and `publish-batch-1.json` / `publish-batch-2.json`; the plan explicitly records production import/publication as false until actual execution is verified.

Focused validation: `pnpm exec vitest run tests/integration/gh-reviewed-publication.test.ts` PASS1 (25.54seconds), actual disposable migrated PGlite imports Week1 baseline plus the sealed GH Pack and publishes49/392with441audit events. Retried batches add no events; canonical Questions and baseline release statuses remain unchanged, no QA reviews/student events/attempts/evidence fabricated. `pnpm exec eslint tools/gh-import/reviewed-release.ts tools/gh-import/prepare-reviewed.ts tests/integration/gh-reviewed-publication.test.ts` and `pnpm typecheck` PASS. Production results must not be inferred from this fixture.

Current production blocker: opened Orca tab f7d01aff-95a9-4e0b-a2d1-10bd01353b28 at https://vecta-three.vercel.app/auth/signin?callbackUrl=%2Fadmin requests Matheus's access code. Owner login requested directly in that tab; no code/cookie/real secret extracted. No production import/publication or infrastructure change has occurred. Existing direct-action deployment/migration readiness remains unverified while unauthenticated.

NEXT ACTION: after genuine ADMIN login, use existing authenticated `/api/import/track/preview` and `/api/import/track` for the exact pinned Pack, then `/api/admin/content-qa` with prepared batches40+9. Verify each response and actual49/392published; record partial failures and retry idempotently. If live functionality/migration0018 is absent, stop and report the separate activation prerequisite. Media stays pending and broad E2E remains unaccepted; do not silently expand approval to media generation, deployment or schema migration.

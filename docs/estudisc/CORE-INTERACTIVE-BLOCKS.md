# Estudisc — Phase 6 core interactive blocks

Date: 2026-10-06. Base: `2259874`. Continuous local implementation is authorized; current model/effort retained, no additional agents or independent model/editorial approval is claimed. No production migration, deployment or content publication.

Core increment accepted locally: 2026-10-07.

## Contracts and boundaries

[ADR 0044](../ADR/0044-typed-exploratory-interactions.md) extends the existing block dispatcher, Activity registry and scoped lesson resume. No parallel renderer/evaluator/mastery engine. FEATURE_INTERACTIVE_LESSONS remains default off. Existing percentage blocks, native ordering/matching and ADR 0032 figure formats remain compatible.

Resume data adds optional typed interactions keyed by target kind (block/activity) and stable ID. The field has no injected default, preserving old payload bytes/hashes. Server checks the actual immutable lesson/version source, allowed response IDs/shapes, help limit and source kind; question-only session composition rejects undisplayed lesson blocks. Existing owner/revision/mutation lock remains authoritative. An absent field from an old client retains newer interaction state; its reply omits that field so strict legacy clients can parse it. Identical retries stay idempotent.

Snapshot JSON contains bounded responses/parameters/check phases/help usage, never grades, scores, canonical answers or evidence. Local feedback is recomputed with the existing educational.v1 evaluator; partial cues preserve its failed outcome. Only shared Question submissions append assessed evidence. Completing/exploring/helping never establishes Concept mastery. New four-stage exploratory assistance is explicit authored content; legacy hints keep their existing meaning. Canonical Question hint/solution weighting and review rules are unchanged.

## Supported contracts

| Family | Source/config and stored response | Feedback/evidence | Touch, keyboard and fallback |
|---|---|---|---|
| Prediction | Existing titled-text/static prediction; optional authored observation/explanation; bounded prediction and phase | Observe/explain after prediction; no graded Attempt | Textarea/radio, native buttons, ordinary titled text with flag off |
| Matching/classification | Existing educational config; partial assignments checked against source item/destination IDs | Existing local evaluator; computed partial/correct/incorrect cue | Native labelled selects; no drag required |
| Ordering/timeline | Existing permutation/expected order; retained learner permutation | Local educational.v1; no grade/evidence persistence | Vertical list and stable-key up/down buttons with keyboard |
| Guided steps/highlight | Existing steps/segments; typed partial response and checked/help state | Existing local evaluator; four explicit authored help stages where provided | Inputs/selectable buttons, limits and recoverable stale state |
| Percent explorer | Unchanged initial value/percentage; bounded raw editing strings | Immediate validated calculation; no graded feedback | Numeric fields plus enabled native range; text result |
| Linear explorer | Explicit mode, bounded min/max/step/initial/slope/intercept, authored labels/units/explanation; raw input | Fixed trusted arithmetic only; no arbitrary formula/code execution or score | Native range/numeric input, invalid-value message, static initial result with flag off |
| Atomic diagram | Existing atom schema; particle inputs/prediction/reveal | Existing derived values, local prediction check | Native fields and textual table; valid integer/range guards |
| Figure/comparison | Existing safe figure plus optional second safe image/description; position 0–100 | Explanation only | Range, before/after buttons, separate images and text; first-image off fallback |
| Hotspot | Already-declared V2 type; safe figure and unique whole image-percentage points (0–100); selected point/zoom | Authored description, no assessment | 44px markers, zoom quarter-steps, list alternative, image failure/retry |
| Authored map pilot | Already-declared map type; image-percent coordinates and labelled points; selected point | Authored offline diagram/list; no geographic or mastery inference | Image/list buttons, readable descriptions with flag off/failure |

MapLibre is not integrated. Geographic tile/provider/worker/exposure decisions need a justified approved blueprint; no remote map request, new CSP allowance or dependency was introduced. More complex simulations wait for blueprint demand. The map diagram/list is the accessible pilot/fallback foundation, not geographic rendering.

## Pack and rollout compatibility

Pack V1/V2 envelopes/enums, published lesson/question bytes, IDs and versions are unchanged. Comparison and explicit model/help payload fields are compatible authored extensions; hotspot/map types were already declared and now gain semantic validation/rendering. Invalid/unsafe sources, missing fields, duplicate/out-of-range points and unknown kinds are rejected. Existing safe figure description markup/paragraphs are retained. New demonstrations are generated only inside disposable test fixtures.

Migration plan: no backfill/data transform/DDL; retain existing JSON table and optional readers. Deploying/activating production still requires its separate authorization and previously pending migrations. Newly authored content stays draft pending real review/publication. Disable interactive presentation to retain static images/descriptions and canonical Questions; do not rewrite existing published versions or claim old binaries understand every new payload variant.

Geometry respects existing CSP: `scripts/generate-interaction-geometry.mjs` produces finite static rules for percentage clipping/point positions and quarter-step zoom. JSX uses data attributes; no inline style or CSP relaxation. `node scripts/generate-interaction-geometry.mjs --check` verifies the artifact. Essential point centering uses margins so reduced-motion rules that disable transforms cannot displace markers. Tests assert actual marker count/center coordinates, frame zoom ratio and non-empty clipping, beyond control values/target bounds.

## Validation

- Contract increments: `pnpm exec vitest run tests/unit/interaction-state.test.ts tests/unit/lesson-resume.test.ts tests/unit/educational-interactions.test.ts` — 8 PASS; legacy hash/no default, identity collisions, wrong-but-valid responses, permutations/kind/help and synthetic-grade rejection.
- Scoped clients/SQL/memory: `pnpm exec vitest run tests/integration/lesson-resume.test.ts tests/unit/interaction-state.test.ts tests/component/interaction-resume.test.tsx tests/component/visual-interactions.test.tsx tests/component/lesson-resume-provider.test.tsx` — 13 PASS; old-client retain/project/retry, actual membership, no evidence, idle/navigation and assistance/response reload.
- Model/visual fixtures: `pnpm exec vitest run tests/unit/visual-interactions.test.ts tests/unit/linear-explorer.test.ts tests/component/linear-explorer.test.tsx tests/component/visual-interactions.test.tsx` — 8 PASS. Compatible import boundary, invalid data URIs/points/modes, model bounds/step and local feedback semantics.
- Published corpus compatibility: `pnpm exec vitest run tests/science-qa-render.test.tsx tests/unit/content-studio.test.ts tests/component/lesson-figure.test.tsx` — 42 PASS.
- Full `pnpm test` — 343 PASS / 3 optional real-PostgreSQL SKIP; `pnpm lint` PASS; `pnpm packs:verify` PASS (one catalog Pack).
- Final default `pnpm test:e2e` — 44 PASS / 18 intentional flag-gated SKIP (22/9 per fresh browser server).
- All-on `pnpm test:e2e tests/e2e/interactive-blocks.spec.ts tests/e2e/lesson-resume.spec.ts tests/e2e/adaptive-session.spec.ts` — 12 PASS / 2 intentional off-case SKIP (6/1 per fresh desktop/mobile server).
- Final foundation/routine/resume/interactive on, adaptive off: `pnpm test:e2e tests/e2e/foundation-evolution.spec.ts tests/e2e/routine-planner.spec.ts tests/e2e/lesson-resume.spec.ts tests/e2e/interactive-blocks.spec.ts` — 18 PASS / 2 intentional off-case SKIP after the CSP/reduced-motion fixes (9/1 per browser). Default and all-on commands above were also repeated successfully against the corrected geometry.
- `node scripts/generate-interaction-geometry.mjs --check` PASS; final `pnpm lint`, `pnpm build` and `pnpm typecheck` PASS; Impeccable `detect --json --target src/features/lessons/blocks/visual-locations.tsx` reports no findings.
- `node .local/interactive-blocks/verify-evidence.mjs` PASS: 39 current code/test/style/generator hashes, 30 actual prior Phase 5 comparisons, 12 unchanged source files and unchanged corpus/assets/Pack envelopes/migrations/schema/engines/dependencies/flags. [Evidence](CORE-INTERACTIVE-BLOCKS-EVIDENCE.json); previous receipts remain historical. `git diff --check` PASS. No remote CI or production success is claimed.

E2E always uses DATABASE_URL=memory://local and fresh serial servers per browser project. Foundation/Today/interactive/adaptive flags are false for default, all true for combined on, and adaptive false for foundation/routine on. The new interaction flow proves forecast/response/help/parameter/selection reload, keyboard/no-drag paths, image failure/list continuation, no /api/activities submission, reduced motion and 320/360/390/430/1280 layouts with 44px markers. Visual refinement was limited to range theming/media sizing; subsequent required functional geometry checks repaired CSP/reduced-motion incompatibility rather than initiating further design polish. Logs/screenshots are ignored local artifacts.

Corrections recorded: the initial browser test queried generated region/label references unreliably; explicit authored region names and semantic textbox/combobox locators resolve the displayed controls. Saved forecast was present, not lost. Full QA caught a missing legacy figure-description class, restored before acceptance; the “unregistered block” fixture now uses graph because map is supported. Geometry inspection found blocked inline styles placing markers outside the image; bounded CSS fixes this without weakening CSP. Reduced motion then removed transform-based centering; margin centering plus real coordinate assertions fixes that path. Existing real corpus QA remains intact; no source was rewritten to make tests pass.

## Continuation

NEXT ACTION: checkpoint this accepted core increment, then Phase 7 licensed teaching-asset metadata/rights/reuse inventory through existing Question asset/Studio boundaries. Actual MapLibre/provider, complex pedagogy/evidence, production changes and publication remain separate gates.

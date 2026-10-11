# MODEL HANDOFF — scored enrichment through existing Questions

MODEL ESCALATION REQUIRED

## Current task / problem

The next substantive increment is independent scored retrieval for the circular-measure teaching complement, then suitable classified/matched/highlighted practice for other lessons. Existing MAT-16 v4 teaches circumference/circular area but adds no scored Questions. Twelve additional source-defined predictions were actually released during this continuation; do not keep forcing prediction into every remaining lesson.

## Why escalation is recommended

Recommended model: **Terra**. Risk HIGH for changing the persisted enrichment/publication contract, not for the number of lessons or CSS. The current targeted importer hashes all original fields/Activities/Concepts and requires exactly the original Question refs/hashes. Scored new practice needs a defined path for new immutable Question versions and new lesson bindings while preserving original refs, old published versions, frozen sessions/resume, provenance, exposure, owner/transaction boundaries and evidence semantics. Do not weaken these guards by trial and error or republish the full corpus.

First inspect the already-existing Question/lesson authoring/import paths. This handoff does not assert that every possible legacy import path is absent. Choose the smallest compatible extension; no parallel registry, renderer, assessment, mastery or review engine.

## What has already been established / architecture

- Software through Phase 14 is delivered. The actual current-edital audit maps all 24 program groups to published content; it is not independent depth/mapping certification.
- MAT-16 v4/MAT-17 v4 teaching complements are LIVE. Eight Question refs per science/Portuguese source lesson and all original math refs were retained by subsequent exploration-only enrichments.
- `resolveLessonVersionContext` rejects changed Activities/Concepts/source fields and any Question-ref set/hash delta. It admits non-assessed text/code, existing numeric explorers and strictly source-bound prediction.
- Registered educational renderers/schemas already support classification, matching, ordering, text-highlight and guided steps. The block panel checks feedback locally, saves typed owned resume and explicitly labels its check exploratory; it does not make a block's response an official Attempt. Reuse it where exploration is the right purpose, but do not advertise that as independently scored retrieval.
- New scored practice should use the shared versioned Question/Activity evaluator/Attempt pipeline. AI/proposal text cannot set canonical mastery or official scores. Correctness/help/independence, reserved official assets and provenance remain authoritative.
- Actual release authorization is standing Admin Direct after engineering checks. No Matheus/independent editorial review gate, forged reviewer, or new permission question is needed for authorized releases. This escalation is engineering/model routing only.

## Relevant files

- `src/features/import/application/lesson-version-policy.ts` — exact source/ref retention and projection.
- `src/features/import/application/lesson-version-contracts.ts`, `src/features/content-qa/authoring-contracts.ts` — current targeted packet/builder.
- `src/db/repositories/track-import-repository.ts` and existing import/generation routes — investigate reuse before adding a contract.
- `src/features/questions/contracts.ts`, `src/features/activities/application/question-reference.ts` — authoritative shared Questions/version refs.
- `src/features/activities/application/educational-activity.ts`, `src/features/activities/components/educational-activity-panel.tsx`, `src/features/lessons/blocks/lesson-block-renderer.tsx` — existing exploratory types/response/feedback.
- `tools/estudisc-content-studio/enrichment-contracts.ts`, `enrichment.ts`, `lesson-version-export.ts` — retained recipe v1/v2 and source binding.
- `docs/ADR/0049-targeted-lesson-version-import.md`, ADR 0058 and current Question/publication ADRs — verify exact existing ADR filenames with search before reading.
- `docs/estudisc/GEOMETRY-COMPLEMENT-RELEASE.md`, current batch receipts and `PLANS.md`/`PROJECT_STATUS.md` — actual current state.

## Changes already made

LIVE v3: CIE-12, CIE-13, CIE-14; CIE-15, CIE-16, CIE-19; CIE-21, CIE-23, CIE-35; CIE-38, POR-03, POR-13. One explicitly source-derived proposed-goal prediction each. Original missing goals/links, historical content/Questions and study fingerprints preserved. All real ADMIN preview/import/direct publication audits and mobile readers passed; each batch has a protected updated full backup.

The existing long CIE-21 title overflow was fixed through scoped heading wrapping. Protected PR #20 passed eight required checks and merged `88d8f1ff53d1417239adfb9a688e687590003971`; actual production `dpl_3SneFiforJZaoWRKfUoWqw34qjbF` is READY/aliased with that commit. Original Aiven Free cutover is complete; original Neon remains retained/read-only. Do not roll back blindly after newer target writes.

## Tests / status

Source-defined focused suites: 12, 15, 18 and 21 PASS as each batch was added; actual per-lesson before/after original payload/block/Activity, whole Question/version/Attempt/evidence/study-event fingerprints passed. Original identities remain 132. No production answers or new official Attempts/evidence were submitted by validation.

Full local software acceptance for the heading release: lint/typecheck, 464 PASS/three optional real-PG SKIP, packs/build, serial browser 58 PASS/38 flag-gated SKIP. Final data-only continuation: full lint and 467 tests PASS/three optional real-PG SKIP; current typecheck/packs and actual new-content mobile/representative desktop passed. No application runtime changes after the approved heading release.

## Open questions / constraints

1. How are additional Questions appended through existing authoritative import/publication modules without a full Track/corpus re-import or new registry?
2. How should a new immutable lesson bind additional Questions/Activities while retaining every original version/ref and keeping frozen sessions valid?
3. Which provenance/evidence/pacing contracts apply to generated/derived circular practice? Do not mislabel agent-authored content as official or independently human reviewed.
4. Which interactions should remain local exploration versus official practice? Source quotes/hashes prove binding, not semantic correctness of an arbitrary answer key.

Concept is the atomic target; completion/exploration never implies mastery. Attempts immutable, evidence/events append-only. No reserved assets in public/training, source/rights/mapping caveats visible, private ADMIN/STUDENT isolation retained. A public Pack-schema change needs ADR, migration/compatibility plan, fixtures and tests; prefer a versioned authoring contract if the existing envelope is sufficient.

## Recommended next action / exact next prompt

> Continue Estudisc from this compact handoff and the current PLANS/PROJECT_STATUS using Terra for the scored-enrichment contract. Start with MAT-16 v4 circular-measure retrieval only. Inspect existing Question/Activity/import/publication/resume modules and define the smallest compatible append path for a few new shared, correctly provenanced Questions plus a new immutable lesson binding, preserving every existing ref/version and frozen session. Specify transaction/idempotence/conflict/exposure/owner/evidence behavior and ADR/compatibility fixtures before implementation; do not weaken source-retention checks or use full-corpus re-import as a shortcut. Reuse existing evaluators and explicit Admin Direct authorization, with no independent editorial gate or fabricated reviewer. Choose explorer versus scored practice deliberately; provide a precise contract and bounded implementation tasks for economical Luna Max execution. Do not feed all 132 full lessons to a stronger model. Sol High is reserved for genuinely critical persisted-data changes or an unresolved exceptional risk, not this task's size.

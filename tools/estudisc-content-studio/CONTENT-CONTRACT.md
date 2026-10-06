# Content contract

This is the authoring guide, not a replacement schema. Run `pnpm estudisc-content schemas` and use its JSON Schemas in `tools/estudisc-content-studio/schemas/` for exact required input fields/enums. JSON Schema does not encode every Zod refinement or renderer payload rule; CLI validation remains mandatory. `contracts.ts` imports the runtime Zod contracts and defines Studio metadata.

## Artifact contracts

| Contract | Artifact / purpose |
| --- | --- |
| `LessonGenerationRequest` | `request.json`: lesson intent, canonical curriculum/Concept context, exit-ticket rule, DEMO flag, revision limit |
| `JobState` | `state.json`: transitions, owner claim, prompt/model metadata, hashes and approvals; CLI-owned |
| `SourcePack` / `Source` | Research evidence, runtime ContentSource records, assertions and unresolved items |
| `MediaPack` | Proposed images/diagrams, videos and books; optional supplements |
| `ImageCandidate` | Origin, organization/author, license/status, attribution, purpose, alt text, verification and generated prompt |
| `VideoCandidate` | Creator/link/duration/selected segment, Concepts, level, selection rationale and verification |
| `BookRecommendation` | Bibliographic metadata, chapter/topic/pages when known and recommendation rationale |
| `LessonArchitecture` | Learning sequence, block/Question targets and provenance sidecar |
| `Lesson` | Actual Pack v2 Lesson Zod object, extracted from runtime schema |
| `QuestionSet` | `{ "questions": [...] }`, using the production `questionSchema` |
| `UnsupportedComponentRequest` | Deferred reusable interaction or generated-image production specification |
| `QAReport` / `QAFinding` | Independent review decision, exact input hashes, severity/category/target/evidence/fix |

## Canonical context

Read the job's pinned `catalog.json` and `request.json`. Use exact Concept, lesson, module, subject and curriculum requirement IDs. Titles alone do not prove curriculum coverage. A prerequisite Concept may exist without teaching content; retain that gap. Never invent an official mapping or convert historical guidance into verified target-edition coverage.

The request configures what to teach. The catalog proves which references exist. A configured request can select existing canonical references; it does not inject a new catalog. Restore the canonical private curriculum inventory when the smaller Golden fallback lacks a requested Concept. New runtime capabilities or curriculum changes belong to a separate implementation task.

## Runtime Lesson

The production object includes `id`, positive `version`, `title`, `kind`, `estimatedMinutes`, `status`, `concepts`, `prerequisiteConceptIds`, `objectives`, `sourceIds`, `exitTicketQuestionIds`, `blocks` and `activities`. Author `status: "draft"`; Studio cannot authorize publication. Use a new version for changed content rather than editing a published version.

Blocks have `id`, `type`, `schemaVersion`, `conceptIds` and `payload`. Payload fields must match the renderer's actual validator. Do not add arbitrary properties to the strict Lesson object. Put Studio provenance in architecture records, not invented production Lesson fields.

The usable block set is:

```text
text concept note warning code example prediction summary worked-example
numeric-explorer guided-steps text-highlight classification ordering timeline
diagram matching figure
```

`diagram` currently means the registered atom model. It is not a generic canvas. `timeline` uses the existing ordering interaction. Schema enum names such as `graph`, `table`, `map`, `hotspot` and `exit-ticket` are not permission to author unsupported rendered blocks. Use an `UNSUPPORTED_COMPONENT_REQUEST` instead.

Registered activities include prediction, multiple-choice, code/debug, numeric, ordering, classification, matching, text-highlight, guided-steps and shared `question` references. Prefer the shared Question system for assessed practice. The renderer/evaluator must accept the config. An activity cannot refer to a Question whose Concepts are outside the lesson, or to reserved/annulled exam training material.

Exit tickets use `exitTicketQuestionIds`, not an invented `exit-ticket` block. If the request requires an exit ticket, its IDs must resolve to eligible Questions and architecture includes an `EXIT_TICKET` phase. Each ticket Question needs a rendered `question` activity with `config.phase: "exit_ticket"`. Shared Question configs pin `questionVersion` to the actual authored version and support at most three hints. Lesson completion does not set mastery.

## Architecture and provenance

`lesson-architecture.json` includes a summary, learning sequence entries `{ id, phase, targetIds, sourceIds, mediaIds }` and provenance entries `{ targetId, sourceIds, mediaIds, factual }`. Every authored block/activity/Question needs a sequence entry and provenance record. Targets resolve to authored IDs. Mark learner prompts honestly; factual explanations/examples/answers need verified evidence. A vague source at lesson level is insufficient for fact-checking.

Production `lesson.sourceIds` and `question.sourceIds` resolve to runtime ContentSource IDs included in the Source Pack. Media IDs resolve to Media Pack candidates; a selected figure must match its approved, produced candidate. Sources and media remain traceable in the export's `editorial.json`, avoiding citations after every student-facing sentence.

The adapter adds evidence/media IDs to the existing open block `payload.contentStudio` metadata; the production importer preserves it. Question source IDs must include their architecture evidence references. Full research candidates/recommendations and QA are retained in the editorial sidecar because the current importer does not persist arbitrary Track metadata. Pack recommendation metadata includes selected media only and never repeats figure bytes.

## Source Pack

A Studio source wraps an existing runtime `ContentSource` as `content`, with `organization`, optional `url`, optional `verifiedAt`, `verification: "VERIFIED" | "RESEARCH_REQUIRED"` and `notes`. Runtime source types are exactly:

```text
official_curriculum official_exam reference human_created ai_generated
```

Record evidence assertions as `FACT`, `INFERENCE` or `EDITORIAL_RECOMMENDATION` with `sourceIds`. Do not make an inference sound like a source quotation. Source records identify evidence; `FACT` records summarize supported claims. Put research gaps in explicit items `{ id, status: "RESEARCH_REQUIRED", message, blocking }`. Research may hand off honestly incomplete evidence; a blocking gap prevents Author completion/review readiness. Reset research to resolve it rather than letting Author rewrite researcher-owned files. Record inaccessible browsing or unverified target-edition mappings truthfully.

Generated content provenance is not factual evidence. An `ai_generated` source with `metadata.authorRunId` identifies the authoring run for Estudisc release attribution; it must not impersonate a scientific reference. Factual author targets need a `VERIFIED` non-AI source in the Source Pack. A canonical catalog source may be copied into a verification wrapper, but its `content` object must remain exactly identical to the pinned canonical source.

## Questions

Runtime question types: `multiple_choice`, `numeric`, `ordering`, `classification`, `matching`. Runtime enum values are lower case:

```text
difficulty: foundation direct applied ifsc challenge
cognitiveOperations: recall identify interpret calculate compare infer apply analyze evaluate
provenance.type: generated human_created derived official_exam
```

Map every Question to canonical `conceptIds` and `primaryConceptId`. Generated questions record their real `generationRunId`; handwritten questions use `human_created`. Inspired items use `derived` and retain the original reference, subject to import/reference/exposure rules. Never assign `official_exam` to generated text or copy protected source material to satisfy a derivation reference.

The current runtime validator requires a derived Question's original to be present in the same Pack. Studio does not export official Questions or their private assets, so derivation from an official item cannot currently produce a standalone Studio import. Keep that need visible as an editorial/integration request; do not relabel a derived item as generated to evade the reference requirement. Use independent generated transfer questions for this foundation.

Multiple choice needs distinct choices, exactly one correct option, and an `answer.choiceId` matching it. Store targeted error and internal rationale for plausible distractors. Numeric answers use finite `value`, nonnegative `tolerance` and optional unit. Ordering/classification/matching require labeled items and valid complete answer mappings. Keep explanation and full solution correct; unsupported free-form question formats belong to a component request.

Author curated progressive hints through existing activity config (`config.hints`) where supported: conceptual direction, first step, partial solution. The full resolution belongs in the existing explanation/feedback contract. There is no independent production Question `hints` field; do not add one.

## Unsupported and media-production requests

`author/unsupported-components.json` is `{ "requests": [...] }`. Use `UNSUPPORTED_COMPONENT_REQUEST` with proposed type, pedagogical reason, reusable lessons and minimum behavior. Do not emit JSX, HTML execution, components or imports in a Lesson.

Use `GENERATED_IMAGE_REQUEST` with purpose, Concepts, prompt, style constraints, required labels and alt-text draft. A request is not a produced asset. It cannot back a `figure` until a real safe source and licensing/attribution decision exist. Media policy is canonical in [MEDIA-POLICY.md](MEDIA-POLICY.md).

Videos/books have no dedicated blocks. Recommendations remain in editorial metadata; a text block can show a plain-text URL, but the current `Paragraphs` renderer does not parse Markdown or create clickable links. Request a safe supplemental resource-links block when a clickable student-facing recommendation section is needed; do not invent HTML/Markdown support.

## Deterministic gate

The CLI checks schema shape, stable ID uniqueness, canonical Concept/requirement references, provenance targets, source/media existence, renderer capabilities/payloads, Question answers, exit tickets, figure accessibility and licensing, structural URLs, and exam reservation/provenance restrictions. It adapts the draft and runs Estudisc's existing Pack semantic validation before review/promotion. Passing these checks does not prove factual correctness; independent review still checks the evidence.

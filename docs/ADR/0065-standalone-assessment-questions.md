# ADR 0065 — Standalone assessment Questions and cross-subject simulados

Status: Accepted
Date: 2026-10-16

## Context

Full IFSC simulados (`FULL_SIMULATION`: 28 multiple-choice Questions, seven per area MAT/POR/CIE/GH, 240 minutes) need Questions that students have not practised. Every published Question so far came in through a lesson Pack and is bound to a lesson activity, so practice, review and the planner can serve it. The release registry (`ContentReleaseRepository.register`) only finds Questions inside imported Pack manifests.

Two more gaps:

- The published content is split into one Track per subject (`ifsc-2027-mathematics`, `ifsc-2027-portuguese`, `ifsc-2027-science`, the History-Geography Track), plus the combined `ifsc-2027` Track (week-1 baseline, exam settings).
- `AssessmentRepository.assertTrackScope` requires every Question Concept to belong to the template's single `trackId`. A cross-subject template could not pass that check.

## Decision

### Standalone Question sets

A **standalone Question** is a shared, versioned Question that no imported Pack lists, no lesson activity references and no lesson exit ticket names.

- `StandaloneQuestionRepository.importSet(actor, { trackId, questions })` is ADMIN-only. Each Question must:
  - pass `questionSchema`;
  - be `draft`;
  - have non-official provenance;
  - not be `reservedForAssessment`;
  - have no assets;
  - use only Concepts of `trackId` (`track_concept_settings`).
- In one transaction, the import stores the drafts through `DrizzleQuestionRepository.importVersions`, which links Concepts and sources. It then registers one `content_releases` row per Question version, hashed over the canonical Question. Re-running the same set is idempotent. Different content for an existing release or version is refused. Any id bound to a Pack, an activity or an exit ticket is refused.
- `ContentPublicationService.publishStandaloneQuestionsDirect(actor, { questions:[{id,version}], reason })` is ADMIN-only:
  - it re-checks the standalone guard and locks the releases in a stable order;
  - it publishes through the existing private `publishRelease` with the Admin Direct payload, so each release gets one `content_publication_events` row (`mode = admin_direct`, actor, reason);
  - a retry publishes nothing new and writes no extra events.

  This path never creates or changes lessons or activities. Editorial Reviewed stays a separate path.
- Admin API: `POST /api/admin/standalone-questions` with `action: "import"` or `"publish_direct"` (1.5 MB body limit).
- Ids from authoring tools carry the `SIM-` prefix. The real guarantee is the standalone check, not the prefix.

### No leak into practice

Lesson practice (`QuestionStudyRepository.context`/`isAvailable`), planner sessions (legacy and adaptive), targeted review/remediation and AI context only select Questions through published lesson activities. Standalone Questions therefore stay unseen until a simulado freezes them. An integration test proves this for targeted review, both planners and direct activity access.

### Cross-subject template scope

`assessmentTemplateSchema` gains an optional `scopeTrackIds` (1–8 unique Track stable ids). `assertTrackScope` checks that `trackId` and every scope Track exist, and that each Question Concept belongs to at least one of them. Templates without the field hash and behave exactly as before.

IFSC simulados use `trackId: "ifsc-2027"`, the combined IFSC exam Track that owns the exam settings. `scopeTrackIds` lists the live subject Tracks that own the Concepts. The integrator must confirm those stable ids in the target database before importing templates.

### Tooling

- `tools/estudisc-content-studio/simulado-questions.ts` converts authoring JSON:
  - **ChatGPT format.** The lesson's first Concept is the primary and only Concept. `IFSC_APPLICATION` maps to `ifsc` and `IFSC_REASONING` to `challenge`. A trailing interrogative paragraph becomes the stem and the text before it the stimulus. Visual items are refused.
  - **Codex mathematics format.** A documented `topic` → MAT Concept table; unmapped topics are refused. Free-text distractor diagnoses map to canonical error categories, and the text is kept as rationale when no rationale exists.
  - Provenance is always `generated`, with a run id. Reference ids such as `IFSC-PROVAS` are background style only and are not stored as content sources.
- `tools/estudisc-content-studio/simulado-builder.ts` builds `ifsc-simulado-<n>` v1 templates (title `Simulado IFSC <n>`, FULL_SIMULATION, 240 min, shuffled choices, published). It validates them with the engine's own `validateAssessmentComposition`. It partitions a bank into disjoint simulados: explicit `simulado` assignments are honoured; other Questions are picked at even spacing and dealt round-robin.
- `tools/estudisc-content-studio/simulado-prepare.ts` is an offline CLI. It writes per-Track standalone sets and templates to files and never touches a database.

## Consequences

- Simulados can use Questions students have never practised, and they publish through the audited Admin Direct path.
- Publication is still not planner readiness or editorial certification. Generated provenance and the editorial caveats stay visible.
- Standalone Questions earn Concept evidence only through finalized assessments, the same as other assessment Attempts.
- A later lesson Pack cannot adopt a standalone id without failing the standalone guard on the next standalone operation. Moving a Question into a lesson needs a new identity.
- Official or reserved benchmark Questions never use this path. `OFFICIAL_EXAM` keeps its own rules.

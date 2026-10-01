# Appendix A — Data Model Delta

Status: **Implementation contract**
Purpose: exact relational additions expected for the IFSC expansion. Names may be adjusted to existing repository naming conventions, but semantic responsibilities must remain.

## New content-side tables

### `curriculum_requirements`

Suggested fields:

- `id uuid pk`
- `stable_id text unique`
- `track_stable_id/text or track FK`
- `subject_code text`
- `parent_stable_id nullable`
- `label text`
- `source_id uuid`
- `source_locator jsonb`
- `status text`
- `created_at`

### `curriculum_requirement_concepts`

- requirement FK
- concept FK
- mapping type/notes optional
- composite unique key

### `concept_prerequisites`

- concept FK
- prerequisite concept FK
- strength `required|recommended`
- unique pair
- reject self-reference and invalid cycles at semantic-validation layer

### `track_concept_settings`

Track-specific attributes without polluting global Concept identity:

- track FK
- concept FK
- curriculum importance
- optional subject/domain metadata
- active/retired status

### `content_sources`

- id
- stable_id
- type: official_curriculum / official_exam / reference / human / generated
- title
- metadata jsonb
- content hash if applicable

### `content_source_links`

Generic provenance relationship to lesson/question/requirement versions as supported by repository conventions.

## Question Bank

### `questions`

Stable identity:

- id
- stable_id
- current/publishing metadata

### `question_versions`

Immutable published version:

- id
- question FK
- version
- type
- subject code
- difficulty
- cognitive operations jsonb
- stimulus jsonb
- stem jsonb
- answer definition jsonb
- explanation jsonb
- provenance jsonb
- exposure policy jsonb
- status
- created/published timestamps

### `question_choices`

- question_version FK
- stable choice id
- order index
- content
- correct boolean
- error target nullable
- rationale nullable

### `question_concepts`

- question_version FK
- concept FK
- role `primary|secondary`
- evidence weight/config optional

## Learner question exposure

### `question_exposures`

- owner FK
- question FK/version where appropriate
- first_seen_at
- last_seen_at
- times_seen
- last_context
- indexes by owner/question

This is operational history, not mastery itself.

## Study planning

### `study_plans`

- id
- owner FK
- policy version
- exam date/context
- generated_at
- valid_from/valid_until as useful
- configuration snapshot
- status

### `study_sessions`

- id
- owner FK
- study_plan FK nullable
- planned duration
- status planned/active/completed/abandoned
- policy version
- planned_at
- started_at
- completed_at
- frozen_at

### `study_session_items`

- session FK
- order index
- kind review/lesson/practice/assessment/etc.
- target stable ID / typed reference
- frozen configuration jsonb
- status

## Assessments

### `assessment_templates`

- stable id
- kind
- title
- subject distribution
- timing rules
- feedback rules
- exposure constraints
- status

### `assessment_template_items`

For fixed official assessments or explicit item sets.

### `assessment_instances`

- owner FK
- template FK
- kind
- frozen question-version/order snapshot
- started/finalized timestamps
- status
- duration config
- policy version

### `assessment_responses`

Mutable until finalization:

- instance FK
- question-version FK
- response jsonb
- first answered/last updated
- flagged/skipped optional

Unique per instance/question.

Finalization creates immutable Attempts/evidence exactly once.

## Content QA

### `qa_reviews`

- target type
- target version id
- reviewer type/id
- layer structural/factual/pedagogical/ifsc
- decision
- findings jsonb
- severity max
- created_at

## Identity mapping

### `owner_identities`

- owner FK
- provider
- provider subject / normalized email as approved
- role `ADMIN|STUDENT`
- active
- unique provider identity

Do not store more identity data than required.

## Existing tables to preserve

Do not replace:

- attempts
- concept_evidence
- review_schedules
- mistakes
- study_events
- Pack import history
- XP/badge historical state

Add new fields/tables through normal Drizzle migrations and keep historical policy versions interpretable.

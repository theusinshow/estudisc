# 11 — Content Pipeline

Status: **Accepted**
Source of truth for: AI/human content production workflow.

## Pipeline

`CurriculumRequirement → Concept mapping → LessonSpec → SourcePack → Author → QuestionAuthor/Interaction design → Deterministic validation → Factual review → Pedagogical review → IFSC alignment review → QA decision → Publish`

## Roles

- Curriculum Mapper
- Lesson Author
- Question Author
- Content Reviewer
- Fact Checker
- IFSC Alignment Reviewer

These are responsibilities, not necessarily separate models or permanent agents.

## Source grounding

History/Geography/Science factual content should use approved SourcePacks rather than unconstrained model memory.

Mathematics also uses source/spec grounding, with additional deterministic calculation validation.

## LessonSpec

A LessonSpec is an editorial contract defining:

- required Concepts;
- prerequisites;
- target duration;
- kind;
- required pedagogical stages;
- permitted interaction capabilities;
- minimum practice;
- transfer/IFSC requirements;
- exit-ticket requirement.

A good-looking lesson that violates its LessonSpec is incomplete.

## AI generation

AI can draft content but cannot:

- publish its own content;
- create unregistered React components;
- bypass schema validation;
- label generated questions as official;
- change curriculum mappings silently.

## Generation provenance

Store:

- provider/model;
- prompt version;
- generation run ID;
- input/spec hash;
- source references;
- raw/structured output;
- validation/review state;
- token/cost metadata when available.

## Scale strategy

First make four Golden Lessons excellent. Then generate high-priority curriculum, then complete the remaining official scope. Do not wait for an advanced visual CMS before creating useful validated content.

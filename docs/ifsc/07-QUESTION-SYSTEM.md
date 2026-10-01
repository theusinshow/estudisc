# 07 — Question System

Status: **Accepted**
Source of truth for: shared Question Bank and question provenance.

## Question is reusable content

A Question may be used by:

- Lesson;
- Practice;
- Review;
- Diagnostic;
- Simulation;
- Official exam representation.

Do not duplicate the same question into separate page code or lesson payloads.

## Core metadata

A Question version contains:

- stable ID;
- version;
- subject;
- primary Concept;
- optional secondary Concepts;
- type;
- difficulty;
- cognitive operations;
- optional stimulus;
- stem;
- choices/answer definition;
- explanation;
- provenance;
- exposure policy;
- publication status.

## Initial types

- `MULTIPLE_CHOICE`
- `NUMERIC`
- `ORDERING`
- `CLASSIFICATION`
- `MATCHING`

Open-ended AI-scored questions are not required for the IFSC MVP.

## Distractors

Where feasible, incorrect choices include an internal error target and rationale. Distractors should reflect plausible learner errors rather than random values.

## Deterministic evaluation

Prefer deterministic scoring.

Numeric evaluator may normalize comma/dot, currency markers and configured units/tolerances. Equivalent units are accepted only when the question explicitly defines equivalence.

## Provenance

- `OFFICIAL_EXAM`
- `GENERATED`
- `HUMAN_CREATED`
- `DERIVED`

A derived question is never displayed or stored as official.

## Exposure policy

May include:

- minimum days between exposures;
- maximum training exposures;
- `reservedForAssessment`;
- unlock/release time.

Per-student exposure history records first seen, last seen, times seen and context.

## Attempt to evidence

One Attempt may produce multiple ConceptEvidence records with different polarity/strength.

Attempt remains the immutable fact. Evidence is the pedagogical interpretation and may be recalculated under a new policy without changing the Attempt.

## Question lifecycle

`DRAFT → AUTO_VALIDATED → IN_REVIEW → APPROVED → PUBLISHED → RETIRED`

Ambiguous answer keys or multiple defensible answers block publication.

## Coverage health

Admin must show per Concept counts by difficulty/provenance/review eligibility so “curriculum covered” cannot hide “no valid practice questions.”

# Appendix C — Planner Policy v1

Status: **Implementation policy draft**

## Candidate sources

Generate candidates from:

1. due/urgent reviews;
2. active repeated mistakes;
3. required prerequisite gaps;
4. next planner-ready Lessons;
5. Concept practice needs;
6. mixed/transfer practice;
7. scheduled assessments.

## Priority model

A conceptual scoring model:

`priority = reviewUrgency + weakness + curriculumImportance + prerequisiteBlocking + examPressure`

Then apply constraints rather than using score alone.

## Hard constraints

- content must be planner-ready;
- reserved Question cannot appear in normal training;
- required prerequisites below configured readiness can block or replace dependent new content;
- ACTIVE StudySession cannot be rebuilt;
- session duration cannot exceed selected budget beyond a small configured tolerance.

## Soft constraints

- subject balance;
- avoid too many new Concepts in one session;
- prefer question novelty;
- prefer varied cognitive operations;
- avoid repeating the same error pattern with near-identical questions;
- maintain momentum/continuity when appropriate.

## Session construction order

Recommended deterministic layers:

1. reserve any scheduled assessment;
2. reserve critical reviews;
3. address blocking prerequisites;
4. choose new content;
5. rebalance subjects;
6. add mixed practice;
7. fill remaining time with safe practice.

## Time estimation

Use historical median durations once enough data exists. Initially use editorial estimates.

## Exam phase

Planner configuration switches gradually:

### FOUNDATION
more prerequisite/new learning.

### BUILD
balanced new content/practice/review.

### CONSOLIDATE
less new content, more retrieval and interleaving.

### EXAM_PREP
high-value gaps + mixed practice + assessments.

## Explainability

Planner should be able to return reasons such as:

- “review is due”;
- “this Concept blocks percentage”;
- “this subject has received less study time this week”;
- “this Lesson is high importance and not yet covered.”

AI may rephrase these reasons but not invent them.

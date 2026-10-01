# 08 — Study Planner

Status: **Accepted**
Source of truth for: deterministic planning and StudySession generation.

## Authority

Planner is deterministic and auditable. AI may explain a plan but does not own canonical scheduling.

## Inputs

- exam date;
- learner availability/time budget;
- curriculum graph;
- Concept mastery;
- retention/review urgency;
- active mistakes;
- prerequisite state;
- curriculum importance;
- completed/published content;
- question availability/exposure;
- reserved assessments;
- subject balance.

## Candidate generation

Candidate kinds:

- critical review;
- prerequisite remediation;
- new Lesson;
- Concept practice;
- mixed practice;
- assessment preparation.

The existing recommendation engine remains useful as a candidate source; Planner is an organizing layer above it.

## Priority dimensions

Conceptual score:

`review urgency + weakness + curriculum importance + prerequisite blocking + exam pressure`

The exact numeric weights are configuration and versioned policy, not immutable pedagogy.

## Constraints

- respect session time;
- avoid new content whose critical prerequisites are not ready;
- cap excessive new-content load;
- preserve four-subject balance;
- use only planner-ready content;
- never select reserved official questions for training;
- never mutate an ACTIVE StudySession.

## Subject balance

Because the exam is 7/7/7/7, no single area may consume the plan indefinitely. Weak subjects receive more attention but the plan keeps all four areas alive.

Suggested soft weekly bands:

- Mathematics: 25–35%
- Portuguese: 20–30%
- Science: 20–30%
- Geography/History: 20–30%

These are balancing bands, not fixed quotas.

## Exam phases

- `FOUNDATION`: more prerequisite/new learning.
- `BUILD`: balanced learning and practice.
- `CONSOLIDATE`: less new content, more review/mixed practice.
- `EXAM_PREP`: assessments, review, high-value gaps.

Planner chooses phase from date/progress configuration, not from AI judgment.

## Missed day behavior

Do not accumulate “overdue lessons.” Recompute the future. Real review urgency remains part of the next candidate set.

## Readiness display

Planner may expose curriculum/mastery/retention/assessment summaries. It must not convert them into a predicted probability of admission.

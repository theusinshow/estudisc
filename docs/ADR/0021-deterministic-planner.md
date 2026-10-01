# ADR 0021 — Keep the Study Planner deterministic

Status: Accepted

## Context

The student needs a daily plan based on review urgency, weaknesses, prerequisites, exam proximity and subject balance.

An opaque AI planner would be difficult to reproduce, test and audit.

## Decision

StudyPlan and StudySession composition are produced by versioned deterministic policy. AI may explain the plan, not own it.

## Consequences

Planner rules require tests and configurable weights. Recommendations can remain a candidate source under the Planner.

## Rejected alternatives

- AI-generated authoritative schedules;
- static calendar independent of learning evidence.

## Implementation constraints

ACTIVE StudySessions are immutable in composition. Missed days trigger recomputation rather than task debt.

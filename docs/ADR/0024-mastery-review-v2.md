# ADR 0024 — Add mastery.v2 and review.v2 without rewriting v1 history

Status: Accepted

## Context

Current mastery.v1/review.v1 are deterministic and already in use. IFSC preparation needs richer evidence dimensions and retention handling.

## Decision

Preserve v1 policies and introduce versioned v2 policies. v2 may consider independence, hint/solution exposure, difficulty, mode/context, delayed retrieval, transfer, retention and confidence. review.v2 supports adaptive intervals including an initial +1/+3/+7/+14/+30 progression.

## Consequences

Historical data remains interpretable. New policy code requires deterministic golden tests.

## Rejected alternatives

- overwrite v1 semantics;
- AI-generated mastery score.

## Implementation constraints

Passage of time may create `REVIEW_DUE`/lower retention without silently rewriting historical mastery evidence.

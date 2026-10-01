# Appendix B — Mastery v2 and Review v2

Status: **Policy specification**
Implementation must remain deterministic and versioned.

## Evidence event inputs

For each ConceptEvidence derived from an Attempt, capture where available:

- correctness/outcome;
- difficulty;
- learning mode/context;
- hint level;
- whether full solution was revealed;
- response time metadata, used cautiously;
- transfer/new-context flag;
- delayed-review flag;
- source/provenance.

## Evidence strength

Do not hardcode these example multipliers directly into UI. Store configuration in policy code/config and test behavior.

Initial tuning candidates:

### Difficulty
- foundation: 0.70
- direct: 0.85
- applied: 1.00
- IFSC: 1.15
- challenge: 1.20

### Context
- learn: 0.60
- practice: 0.85
- review: 1.00
- assessment: 1.10

### Independence
- no hint: 1.00
- hint 1: 0.80
- hint 2: 0.60
- hint 3: 0.40
- solution revealed: 0.15

These are **starting configuration**, not scientifically privileged constants.

## Mastery state

Preserve user-facing ordinal states compatible with v1:

- Unseen
- Introduced
- Understood
- Practicing
- Strong
- Mastered

v2 may additionally expose internal normalized mastery/retention/confidence values, but the UI should not imply false precision.

## Mastered guardrails

Mastered should require evidence such as:

- sufficient accumulated independent evidence;
- at least one APPLIED or IFSC-level independent success;
- delayed retrieval on a later day;
- sufficient confidence/evidence diversity.

One immediate correct answer is insufficient.

## Retention

Retention answers: “How fresh is our evidence that the learner can retrieve this now?”

Time affects retention/review urgency. It does not erase the fact that mastery was previously demonstrated.

Example:

- Mastery: Strong
- Retention: low
- State flag: REVIEW_DUE

## Confidence

Confidence grows with independent, varied evidence. It prevents a lucky single answer from producing a strong conclusion.

## Review v2 state

Suggested stored scheduling metadata:

- lastReviewedAt
- nextReviewAt
- reviewCount
- recentQuality
- stabilityDays
- stage
- policyVersion

## Initial intervals

Baseline ladder:

`+1d → +3d → +7d → +14d → +30d`

Adaptation:

- poor/failed retrieval → next day and/or reduced stability;
- assisted success → smaller increase;
- strong independent success → advance/increase stability;
- repeated stable success may extend beyond 30 days.

## Backlog rule

Daily review uses a **time budget**. It does not demand that every due item be completed in one day.

## Recalculation

Attempts and ConceptEvidence are durable facts. Mastery/retention projections can be recalculated when policy changes, with policy-version tracking.

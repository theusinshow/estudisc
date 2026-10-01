# 13 — AI Tutor

Status: **Accepted**
Source of truth for: optional contextual tutoring.

## Role

Tutor helps the learner understand approved content. It does not own mastery, scoring, review scheduling or Planner decisions.

## Modes

- `SOCRATIC`
- `EXPLAIN`
- `REVIEW`
- `QUESTION_HELP`

Tutor is disabled in `EXAM`.

## Context

Provide only the context needed:

- current Lesson/Block;
- relevant Concept states;
- current Question;
- attempts/hints for the current item;
- approved explanation/solution where allowed;
- mode and permitted actions.

Avoid sending broad unrelated personal history.

## Behavior

In LEARN mode, prefer guiding the next reasoning step rather than immediately exposing the final answer.

Student actions may include:

- Give me a hint
- Explain this step
- Explain differently
- Help me start

## Answer leakage

If the tutor reveals a solution, record solution exposure so later evidence from the same item is weaker/appropriately classified.

## Failure modes

Guard against:

- contradicting approved content;
- answer leakage;
- excessive verbosity;
- hallucinated facts.

Published lesson/question content is the canonical source when the tutor disagrees.

## Cost/control

Use an AI Gateway. No provider calls scattered across UI/features. Cache safe explanations where useful and use model tiers appropriate to task complexity.

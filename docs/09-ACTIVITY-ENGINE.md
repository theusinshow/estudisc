# 09 — Activity Engine

## Approved educational registry extensions

Add deterministic numeric, ordering, classification, matching, text-highlight and guided-step interactions plus numeric exploration. Activities reference shared Question versions. Schema, response, scorer, feedback/evidence mapping and touch/keyboard alternatives are required. Hint ladder: conceptual direction → first step → partial solution → full solution. Persist assistance and solution exposure. EXAM disables assistance and immediate correctness. See ifsc/06-LESSON-SYSTEM.md and ifsc/07-QUESTION-SYSTEM.md.

## Contract

Every activity type provides:

- renderer;
- validated configuration;
- response model;
- validator/scorer;
- feedback model;
- evidence mapping;
- accessibility behavior.

## Initial types

- prediction
- multiple-choice
- explain
- complete-code
- code
- debug
- project-challenge

Future types can include SQL, terminal, diagram, calculation, flashcard and architecture activities without changing the core Attempt model.

## Hints

Hints are progressive:

1. direction;
2. relevant concept;
3. near-solution guidance;
4. full solution only when permitted.

Hint use is recorded as evidence metadata. It may affect XP or mastery evidence strength but must not erase a successful result.

## Attempts

An Attempt stores response, outcome, timing, hint usage, attempt number, evaluator version and relevant output. It is immutable.

## Validation

Deterministic validation is preferred. Free-text explanations may initially use self-check or rubric-assisted review without making an AI service mandatory.

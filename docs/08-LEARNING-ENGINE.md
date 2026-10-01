# 08 — Learning Engine

## IFSC learning loop

Active recall precedes recaps. Learning follows context → concept → worked example → guided practice → independent practice → transfer. Repeated errors trigger alternate explanations/micro-exercises and prerequisite remediation. Exit tickets include direct, applied and transfer items. StudySessions organize existing lessons/reviews/practice; completion never confers mastery. Recommendations remain candidate input to the deterministic Planner. See ifsc/04-PEDAGOGY.md.

## Purpose

The Learning Engine sequences content and records progress without confusing completion with knowledge.

## Content model

Lessons are ordered collections of blocks and activities. Concepts may appear in multiple lessons and tracks. A lesson can introduce, reinforce or apply a concept.

## Block types

Initial renderer contracts:

- text
- concept
- note
- warning
- code
- terminal
- diagram
- comparison
- example
- project-example
- interactive
- quiz
- challenge
- exercise
- debug
- prediction
- checkpoint
- summary

Pack content names a block type and validated configuration. Packs never contain arbitrary React code.

## Progress

Track and lesson progress describe navigation/completion. ConceptProgress describes evidence and review status. Completing a lesson can contribute evidence but cannot automatically mark every concept mastered.

## Recommendations

The recommendation engine initially uses deterministic rules:

1. due reviews;
2. current lesson continuation;
3. weaknesses with sufficient activity coverage;
4. next planned lesson;
5. project application suggestions.

Any future AI recommendation is optional and cannot overwrite the deterministic source state.

# 06 — Lesson System

Status: **Accepted**
Source of truth for: IFSC extension of existing Lesson Blocks and Activities.

## Existing architecture

Extend the existing Lesson Block Renderer and Activity Registry. Do not create a second renderer.

## Definitions

- `Lesson`: versioned editorial implementation.
- `Block`: presentation or interaction unit inside a Lesson.
- `Activity`: learner action that can collect a response/evidence.
- `Question`: reusable assessment content that an Activity/Assessment can reference.

Interactive does not automatically mean assessable.

## Lesson metadata

IFSC lessons add:

- `kind`;
- `estimatedMinutes`;
- Concept objectives;
- prerequisite Concepts;
- source mappings;
- publication status;
- exit-ticket references;
- QA state.

## MVP block/activity capabilities

Initial:

- text;
- concept;
- note;
- warning;
- summary;
- worked-example;
- multiple-choice;
- numeric-input;
- guided-steps;
- classification;
- ordering;
- text-highlight;
- numeric-explorer;
- exit-ticket.

Follow-up:

- timeline;
- diagram;
- graph;
- table;
- map;
- hotspot;
- matching.

Advanced blocks such as geometry canvas or circuit builder are added only for a concrete learning need.

## Registry rule

Pack content may invoke only approved registered types. No arbitrary JSX, browser scripts or generated components are accepted from content.

Each assessable Activity type defines:

- schema;
- response model;
- evaluator;
- feedback model;
- evidence mapping;
- mobile behavior;
- keyboard behavior;
- accessibility behavior.

## Mobile-first requirement

Every new interaction is validated first in a student mobile viewport.

Drag interactions always have an equivalent non-drag control, such as tap-select/tap-destination or move buttons.

## Published versions

Published lesson versions are immutable. Corrections create a new version. Historical Attempts must remain interpretable against the version used at submission time.

## Golden regression fixtures

The canonical regression lessons are:

- MAT-07 Percentage
- POR-01 Comprehension and inference
- CIE-06 Atomic structure
- GH-06 Slavery/resistance/abolition

Major renderer changes must keep these fixtures valid.

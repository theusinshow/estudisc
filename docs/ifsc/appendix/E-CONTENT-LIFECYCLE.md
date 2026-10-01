# Appendix E — Content Lifecycle and Publication

Status: **Implementation contract**

## Lesson lifecycle

`DRAFT → GENERATED/EDITED → AUTO_VALIDATED → IN_REVIEW → APPROVED → PUBLISHED → RETIRED`

Repository naming may collapse intermediate states, but publishing gates must remain explicit.

## Question lifecycle

`DRAFT → AUTO_VALIDATED → IN_REVIEW → APPROVED → PUBLISHED → RETIRED`

Official imports may enter through a separate trusted import path but still require structural validation and provenance checks.

## Published immutability

Published version content is read-only through normal application workflows.

To change content:

1. create next version;
2. edit;
3. validate/review;
4. publish;
5. optionally retire previous version from new selection.

## QA issue structure

Suggested fields:

- code;
- layer;
- severity;
- path/location;
- message;
- evidence/source;
- suggested correction optional;
- status open/resolved/waived;
- waiver reason/actor where allowed.

## Publication blockers

Always block:

- invalid schema;
- missing required references;
- wrong answer;
- ambiguous multiple defensible answers;
- factual contradiction in required content;
- unregistered executable/interactive type;
- reserved-question exposure violation;
- missing critical source for source-required factual lesson.

## Planner-ready

Published is necessary but not always sufficient. Planner-ready requires minimum practice/review coverage and QA state defined in the IFSC specification.

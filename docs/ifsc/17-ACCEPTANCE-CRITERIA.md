# 17 — IFSC Acceptance Criteria

Status: **Accepted**
Source of truth for: objective completion gates.

## Curriculum

- every Anexo V requirement is represented;
- zero `UNMAPPED` requirements before curriculum-complete status;
- prerequisite graph has no invalid cycles;
- every Concept belongs to the correct Track/Module context;
- coverage status is derived, not inferred from Lesson titles.

## Lesson system

- all MVP Blocks validate with Zod/approved schema;
- invalid/unsupported Block fails safely;
- Lesson resumes after reload;
- published versions are immutable;
- mobile primary interaction works at small viewport;
- keyboard/touch alternatives exist;
- Lesson completion does not set mastery directly.

## Question system

- deterministic types score deterministically;
- official/generated/derived provenance cannot be confused;
- question versions used by Attempts remain reconstructable;
- reserved questions cannot be selected for training;
- annulled official questions cannot score or emit mastery evidence.

## Attempts/evidence

- submit is idempotent against retry/double tap;
- official Attempt is immutable;
- one Attempt may emit multiple ConceptEvidence records;
- Attempt + evidence/review updates are transactionally consistent;
- solution exposure/hints are persisted.

## Mastery v2

- same evidence + policy version produces same result;
- independent success is stronger evidence than heavily hinted success;
- a single immediate answer cannot create Mastered;
- delayed retrieval and transfer can strengthen state;
- retention can become review-due without erasing historical mastery;
- v1 history remains interpretable.

## Review v2

- new learned Concept can schedule review;
- failure schedules earlier review;
- stronger independent recall increases interval;
- review uses time budget rather than punitive unbounded backlog.

## Planner

- required weak prerequisite affects dependent scheduling;
- reviews and active weaknesses are considered;
- four subjects remain represented over time;
- reserved questions never leak;
- ACTIVE StudySession is not mutated;
- missed days trigger recomputation rather than lesson debt.

## Assessment

- instance freezes exact question versions/order;
- EXAM mode has no hints/tutor/immediate correctness;
- finalization is idempotent;
- full simulation can represent 28 questions / 7 per area / 4h;
- in-progress responses may change before finalization;
- finalization emits evidence once.

## Diagnostic

- broad diagnostic covers all four areas;
- targeted diagnostic only expands where uncertainty warrants;
- result feeds Planner without claiming false precision.

## Content QA

- structural failures block publication;
- wrong/ambiguous answer key blocks publication;
- factual, pedagogical and IFSC-alignment findings are stored;
- authoring run cannot self-approve;
- planner-ready requires QA approval and sufficient question coverage.

## Tutor

- disabled in EXAM;
- cannot directly mutate mastery/planner/scoring;
- answer reveal is recorded;
- uses current approved content/solution context;
- external AI receives minimized context.

## Mobile/design

- student primary flows designed and tested mobile-first;
- minimum touch target follows Design System accessibility rules;
- no critical action depends on hover;
- one primary action per decision context;
- bottom navigation does not crowd the learning viewport;
- reduced motion remains functional;
- state is not color-only.

## Security/privacy

- Admin and Student owner state cannot cross;
- student routes cannot access Admin publication functions;
- no secrets/client AI provider keys;
- no arbitrary executable Pack components;
- logs avoid raw sensitive learning content by default.

## Regression fixtures

All four Golden Lessons render and complete successfully after changes to Lesson/Activity infrastructure.

# Estudisc — Acceptance & QA

# 1. Global definition of done

A phase is not done unless:
- lint passes;
- typecheck passes;
- relevant tests pass;
- build passes;
- mobile behavior is validated;
- accessibility is checked;
- docs are updated;
- no known regression is introduced.

# 2. Core commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Adapt to existing project scripts if needed.

# 3. UX acceptance

Every primary flow must:
- work first at ~390px;
- not require hover;
- not require drag;
- have touch targets >= 44px;
- have loading state;
- have empty state;
- have recoverable error state;
- support reduced motion;
- expand to desktop without becoming a different IA.

# 4. Learning acceptance

- exploration does not create strong mastery evidence;
- hints reduce evidence strength;
- AI does not decide mastery;
- real simulation has no hints;
- mistakes feed review;
- review does not fabricate urgency;
- planner respects availability;
- existing content remains usable.

# 5. Interactive Block acceptance

Each new block needs:
- clear pedagogical purpose;
- mobile interaction;
- accessible fallback;
- keyboard path where applicable;
- reduced motion;
- loading;
- error;
- analytics/event hooks;
- tests;
- documentation.

# 6. AI acceptance

Every AI function must:
- receive minimal context;
- use validated structured outputs when possible;
- have timeout;
- have fallback;
- not block learning;
- avoid sensitive data;
- track usage/cost where possible;
- not alter published content automatically.

# 7. Regression checks

Preserve:
- published lessons;
- questions;
- lesson IDs;
- question IDs;
- attempts;
- evidence;
- mastery;
- study sessions;
- imports;
- exports;
- auth;
- historical publication data.

# 8. Critical E2E flows

## First use

```text
Sign in
→ Planner onboarding
→ Plan created
→ Today
→ Start session
→ Lesson
→ Complete session
→ Summary
```

## Mistake loop

```text
Incorrect answer
→ Mistake captured
→ Mistake notebook
→ Targeted practice
→ New evidence
```

## Review

```text
Due review
→ Review session
→ Complete
→ Mastery/review state updated
```

## Simulation

```text
Start real simulation
→ Answer
→ Navigate
→ Flag
→ Final review
→ Submit
→ Result
→ Mistakes/review integration
```

# 9. Performance

Lazy-load heavy experiences:
- maps;
- knowledge graph;
- complex simulations.

Avoid duplicate queries.

Audit N+1.

# 10. Mobile QA

Minimum widths:
- 320;
- 360;
- 390;
- 430.

Check:
- safe area;
- sticky actions;
- sheets;
- keyboard;
- landscape where relevant.

# 11. Accessibility QA

At minimum:
- keyboard;
- screen reader semantics;
- contrast;
- focus;
- reduced motion;
- no color-only meaning;
- alt text;
- drag alternatives.

# 12. Content QA

For enriched lesson batches:
- content meaning unchanged unless explicitly edited;
- facts verified;
- interaction matches learning goal;
- image supports content;
- alt text present;
- sources/licenses recorded when needed;
- existing questions preserved unless intentionally revised.

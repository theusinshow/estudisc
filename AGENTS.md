# KNOW/OS — Repository Instructions for Agents

## Approved IFSC expansion

The user authorized IFSC-00 through IFSC-15 continuously; the approved roadmap is docs/ifsc/16-IMPLEMENTATION-PLAN.md. Private ADMIN/STUDENT profiles are approved by ADR 0026, not a public SaaS scope expansion. Retain production approval boundaries.

- Extend existing core modules; no parallel renderer, activity registry, mastery, review or assessment engines.
- Concept remains the atomic mastery target; lesson completion never sets mastery.
- Attempts are immutable; ConceptEvidence is append-only.
- AI cannot own canonical mastery, retention, planner decisions or official scores.
- Reserved official questions/assets never enter training or public static assets before release.
- Published lesson/question versions are immutable.
- Use shared versioned Questions with distinct official/generated/human/derived provenance.
- Every interaction defines schema, renderer, response, evaluator where applicable, feedback/evidence and touch/keyboard behavior.
- Student UI is mobile-first; retain Programming Lab progressive enhancement.
- Prefer generic content/configuration over IFSC track-name branches.


Read this file before making changes.

## Agent operating mode

This repository uses **high autonomy with guardrails**.

Read `AUTONOMY.md` for the complete authorization, continuation loop, decision policy, phase gates, recovery rules, and stop conditions.

For an authorized build/change/fix task, continue through routine in-scope local work without asking for confirmation at every step. Do not wait for the user to select the next step when `PLANS.md`, `PROJECT_STATUS.md`, or the roadmap already defines it.

## Read order

For any non-trivial task, read only the documents relevant to the task:

1. `AUTONOMY.md`
2. `PROJECT_STATUS.md`
3. `PLANS.md`
4. `docs/02-SCOPE.md`
5. the relevant domain or architecture document in `docs/`
6. applicable ADRs in `docs/ADR/`
7. `design-system/DESIGN_SYSTEM_INDEX.md` for any UI work

Do not treat HTML prototypes as normative specifications.

## Non-negotiable architecture rules

- Keep the application a modular monolith until an ADR approves otherwise.
- Keep imported content separate from user state.
- Attempts and study events are append-only.
- Concept mastery is deterministic, explainable, and evidence-based.
- The core product must work without an AI dependency.
- The learning core must not be hardcoded to JavaScript.
- `RUN` never records an official attempt. `SUBMIT SOLUTION` always records one.
- Never execute learner code in the main browser context.
- Do not change a Pack schema without an ADR, migration plan, fixtures, and compatibility tests.
- Do not redesign the approved Design System.

## Engineering rules

- TypeScript strict mode is mandatory.
- Prefer feature modules and domain boundaries over generic utility dumping grounds.
- Validate external input with Zod or the approved schema validator.
- Never commit secrets, credentials, private user data, generated databases, or `.env` files.
- Use English for code, database objects, routes, and technical identifiers. UI copy is initially Portuguese.
- Add or update tests for every changed domain rule.
- Update documentation and `CHANGELOG.md` when behavior, contracts, architecture, or public workflows change.
- Create an ADR for durable decisions with meaningful tradeoffs.
- Prefer the smallest reversible implementation that satisfies current acceptance criteria.

## Working method

For tasks expected to touch multiple modules or take several steps:

1. Update `PLANS.md` before implementation.
2. State assumptions and acceptance criteria.
3. Work in the smallest testable increments.
4. Run the narrowest relevant validation after each increment.
5. Repair failures before advancing.
6. Run the full required checks before a phase gate.
7. Update `PROJECT_STATUS.md`, documentation, and changelog.
8. Continue automatically to the next defined increment or approved roadmap phase.
9. Leave a resumable `NEXT ACTION` when interrupted.

Use subagents only for independent workstreams with clear ownership. The main agent remains responsible for integration and verification. Multiple agents must not edit the same files concurrently.

## Approval boundaries

Routine local repository edits, compatible dependency installation, tests, builds, disposable development migrations, and local checkpoint commits are authorized.

User confirmation is required before external writes, pushes, pull requests, deployment, publishing, purchases, real-secret handling, destructive non-disposable data operations, work outside approved roots, or material scope expansion.

## Definition of done

A task or phase is not complete until:

- acceptance criteria are satisfied;
- relevant tests pass;
- lint and type checking pass when configured;
- accessibility and responsive requirements are checked for UI work;
- no unrelated files were changed;
- documentation, project status, plan, and changelog are updated when required;
- the repository can be resumed without rediscovery;
- the final response lists exact commands run and any unresolved risk.

## Commands

Phase 0 established the application scaffold. Canonical local commands are:

```text
pnpm install --frozen-lockfile
pnpm dev
pnpm generate:tokens
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm db:generate
```

Playwright uses port `3210` through `playwright.config.ts` with an owned server and one worker. Keep it serial while `DATABASE_URL=memory://local` is the E2E harness, because that disposable repository is process-global across browser projects.

Do not invent success. If a command cannot run because of the local environment, record the exact command, error and next safe action in `PLANS.md` and `PROJECT_STATUS.md`.

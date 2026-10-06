# Estudisc — Guarded Autonomy Protocol

This file defines how Codex and other implementation agents may work with high autonomy in this repository.

## Operating mode

Default mode: **HIGH AUTONOMY WITH REPOSITORY GUARDRAILS**.

Once the user authorizes a build, change, fix, or roadmap execution task, the lead agent must continue through the in-scope work without asking for routine confirmation at every step.

Autonomy does not mean skipping planning, tests, documentation, security boundaries, or scope control.

## Authorized local actions

The lead agent may perform these actions without asking again when they are necessary and remain inside the repository and approved scope:

- read and search repository files;
- update `PLANS.md` and `PROJECT_STATUS.md`;
- create, edit, move, or remove in-scope project files;
- install or update compatible project dependencies when justified;
- run formatters, generators, migrations against disposable development data, linters, type checks, tests, builds, and local development commands;
- fix failures caused by the current task;
- refactor in-scope code when behavior is preserved and tests cover the change;
- create or update tests, fixtures, documentation, ADRs, and changelog entries;
- create local Git checkpoint commits when Git is initialized, identity is configured, the working tree is understood, and the phase gate passes;
- delegate independent read-only audits or isolated workstreams to subagents and integrate their results.

## Actions requiring user confirmation

Stop and ask before:

- pushing commits, opening or merging pull requests, deploying, publishing packages, or making any external write;
- purchasing services or creating paid resources;
- requesting, reading, transmitting, or changing real credentials or production secrets;
- destructive or irreversible actions involving non-disposable data;
- modifying files outside the repository or approved writable roots;
- materially expanding the approved product scope;
- implementing public multi-user accounts, billing, marketplace features, or other explicitly deferred capabilities (private ADMIN/STUDENT profiles are approved by ADR 0026);
- overriding an approved ADR, Product specification, Design System rule, or security boundary when the conflict cannot be resolved within existing precedence rules.

## Autonomous execution loop

For every non-trivial task, repeat this loop until the current objective is complete or a stop condition is reached:

1. **Orient** — read `AGENTS.md`, `PROJECT_STATUS.md`, the current plan, relevant specifications, ADRs, and Design System rules.
2. **Plan** — convert the objective into small, ordered, file-level increments with acceptance criteria in `PLANS.md`.
3. **Implement** — complete the smallest coherent increment.
4. **Validate** — run the narrowest meaningful checks for that increment.
5. **Repair** — diagnose and fix failures before moving on; never leave a known regression behind merely to continue faster.
6. **Record** — update the verification log, decisions, documentation, and changelog when required.
7. **Checkpoint** — when a phase gate passes, create a local Git checkpoint if safe and available.
8. **Continue** — select the next incomplete increment or roadmap phase without asking the user what to do next when the answer is already defined by repository documents.
9. **Finalize** — run full acceptance checks and report exact results, risks, and the next planned milestone.

## Decision policy under ambiguity

When a decision is needed, use this order:

1. explicit user instruction;
2. `AGENTS.md` and this file;
3. approved product and scope documents;
4. accepted ADRs;
5. Design System precedence;
6. existing repository conventions;
7. the smallest reversible choice that satisfies current acceptance criteria.

If the choice is reversible, low-risk, in scope, and does not alter a public contract, choose it, document the assumption, and continue.

If the choice is durable and has meaningful tradeoffs, create an ADR. Do not stop merely because an ADR is needed.

## Phase autonomy

The lead agent is authorized to progress through the roadmap phase by phase.

A phase may begin automatically only when:

- the previous phase acceptance criteria pass;
- required checks have actually run;
- documentation and project status are current;
- no unresolved blocker compromises the next phase;
- the next phase remains inside the approved V1 or IFSC expansion scope.

Do not collapse several phases into one unstructured implementation. Each phase must have its own plan, verification log, and checkpoint.

## Recovery and resumption

The repository must remain resumable after context limits, process interruption, or a new Codex session.

Before ending any incomplete session, update:

- `PROJECT_STATUS.md` with the current phase and exact state;
- `PLANS.md` with completed and remaining increments;
- the verification log with commands and results;
- a clear `NEXT ACTION` entry.

A resumed agent must continue from those files instead of restarting discovery or asking the user to repeat prior decisions.

## Current repository note

Phase 0 discovered that this checkout currently has no `.git/` directory. Local checkpoint commits remain authorized when Git is initialized and identity is configured, but agents must not claim checkpoint creation while Git metadata is absent.

Phase 6 uses `DATABASE_URL=memory://local` for Playwright. That local repository is process-global inside the Next dev server, so E2E validation must remain serial until a real isolated test database harness replaces it.

## Stop conditions

Stop only when at least one condition is true:

- user confirmation is required by this policy;
- a material specification conflict has no safe precedence resolution;
- a required secret, external service, or permission is unavailable and no documented local substitute exists;
- repeated diagnostic attempts show that the environment cannot satisfy a required acceptance criterion;
- continuing would risk destructive data loss, security boundary violation, or substantial scope drift;
- all authorized objectives and acceptance criteria are complete.

When blocked, do not return a vague request for help. Report:

1. the exact blocker;
2. evidence and commands already tried;
3. the smallest decision or input required from the user;
4. safe options and their tradeoffs;
5. the preserved repository state and next action after resolution.

## Prohibited autonomy patterns

- Do not claim progress, tests, or builds that were not executed.
- Do not invent product requirements to keep working.
- Do not weaken tests, accessibility, sandboxing, validation, or security to make checks pass.
- Do not repeatedly ask for confirmation for normal local edits or test commands.
- Do not stop after merely writing a plan when implementation was authorized.
- Do not continue past the approved V1 scope merely because additional ideas seem useful.
- Do not push, deploy, publish, purchase, or expose data without explicit user approval.

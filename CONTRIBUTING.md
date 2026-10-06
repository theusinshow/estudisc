# Contributing to Estudisc

The project is currently private and single-maintainer, but changes should follow professional repository practices.

## Branches

- `main`: stable and reviewable.
- `feat/<scope>`: new capability.
- `fix/<scope>`: defect correction.
- `refactor/<scope>`: behavior-preserving restructuring.
- `docs/<scope>`: documentation only.
- `chore/<scope>`: tooling or maintenance.

## Commits

Use Conventional Commits:

```text
feat: add lesson pack importer
fix: prevent duplicate lesson version import
docs: document mastery evidence
refactor: isolate activity validator
test: cover append-only attempts
chore: configure CI
```

## Pull requests

Each PR should contain:

- problem and scope;
- design or architecture references;
- screenshots for visible changes;
- tests and commands run;
- migration or compatibility notes;
- remaining risks.

Do not combine unrelated architecture, product and styling changes in one PR.

# Security Policy

## Current support

Estudisc is pre-release. Security reports apply to the current `main` branch.

## Core security invariants

- Learner code never executes in the main browser context.
- Imported Packs are untrusted input and must be parsed and validated before persistence.
- Pack content cannot inject executable UI components.
- Imports are atomic: all accepted changes commit or none do.
- Secrets exist only in environment variables or approved secret stores.
- Logs, exports and error reports must not expose secrets or unnecessary personal study data.
- Database queries must preserve content/user-state boundaries.
- Any future repository integration uses least-privilege permissions.

## Reporting

Do not publish a suspected vulnerability in a public issue. Record it privately with reproduction steps, affected versions and impact. A formal reporting channel will be added before public release.

See `docs/16-SECURITY-ARCHITECTURE.md` for threat boundaries and required controls.

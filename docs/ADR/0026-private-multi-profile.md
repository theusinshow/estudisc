# ADR 0026 — Evolve single-owner use into private multi-profile access

Status: Accepted
Supersedes: ADR 0008 for the single-owner constraint.

## Context

The IFSC use case has at least two distinct identities: an administrator managing content and a student owning learning state. Mapping both Google accounts to one owner would mix progress and authorization.

## Decision

Retain a private allowlisted product but map authenticated identities to distinct owner profiles and roles:

- ADMIN
- STUDENT

Auth.js/Google OAuth/Vercel/Neon remain unchanged.

## Consequences

Owner-scoped data isolation becomes mandatory. Admin publishing functions require explicit authorization.

## Non-goals

No public sign-up, organizations, classroom SaaS, billing or social profiles.

## Rejected alternatives

- share one owner ID;
- introduce a public account system.

## Implementation constraints

ADR 0015 remains authoritative for infrastructure; this ADR refines identity mapping.

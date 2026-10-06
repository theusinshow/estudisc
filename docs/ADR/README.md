# Architecture Decision Records

## IFSC expansion

ADRs 0017–0029 are Accepted. ADR 0026 supersedes ADR 0008 for private multi-profile access. ADR 0015 remains authoritative for Vercel, Neon, Auth.js and Google OAuth. ADR 0030 records the neo-brutalist refresh. ADR 0031 adds dev-created code accounts, which take precedence over Google OAuth when `KNOW_OS_ACCOUNTS` is set. See [IFSC ADR delta](README-IFSC-DELTA.md).

ADRs document durable decisions with meaningful alternatives and consequences.

[ADR 0036](0036-direct-admin-publication.md) permits explicit audited ADMIN publication by code without editorial reviews, while preserving the existing reviewed workflow.

Status values: Proposed, Accepted, Superseded, Rejected.

Create a new ADR when changing architecture, trust boundaries, persistence, Pack compatibility, runtime isolation, authentication or a major cross-feature contract. Do not rewrite accepted history; supersede it with a new ADR.

[ADR 0038](0038-track-pack-request-limit.md) raises only Track Pack preview/apply limits to2MiB.

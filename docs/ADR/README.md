# Architecture Decision Records

[ADR 0049](0049-targeted-lesson-version-import.md) adds an exact source/reference-bound targeted lesson-version append, immutable history and compatible read projections, no DDL or parallel engine.

[ADR 0048](0048-social-project-direct-release.md) records the explicit social-project owner instruction: launch technically validated authorized features/content directly through existing Admin Direct; users review usage/content. Human/independent editorial release gates are superseded, never fabricated.

[ADR 0047](0047-source-bound-enrichment-review-previews.md) defines source/hash-bound enrichment review candidates, explicit pending review and preserved original/Question identities without an alternate approval or import path.

[ADR 0046](0046-local-lesson-blueprint-proposals.md) defines local UNREVIEWED, version/hash-bound teaching proposals, compact extraction, explicit source gaps and conservative cache invalidation without corpus publication.

[ADR 0042](0042-adaptive-session-snapshots-and-readiness.md) extends the existing planner with adaptive budgets, actual editorial readiness, frozen cross-track membership and factual summaries without changing evidence rules.

[ADR 0043](0043-owner-scoped-lesson-resume.md) separates scoped mutable step/Question drafts from canonical Attempts and assistance, with revision/idempotence and stale-answer guards.

[ADR 0044](0044-typed-exploratory-interactions.md) defines source-bound exploratory state/help, compatible legacy snapshot saves and visual/linear block fallback through the existing registries.

[ADR 0045](0045-teaching-asset-metadata-and-reuse.md) keeps teaching-asset rights/reuse/version hashes in the existing Studio authoring boundary, with metadata-only inventory and per-source visual validation; protected storage is unchanged.

[ADR 0041](0041-weekly-study-routine-and-checked-previews.md) defines owner-scoped weekly time allocation, explicit revision/dependency-checked preview/apply and compatible session limits.

[ADR 0040](0040-evolution-shell-and-runtime-compatibility.md) defines flagged five-destination navigation, shared Focus layout and compatible runtime step projection without changing Pack schemas.

## IFSC expansion

ADRs 0017–0029 are Accepted. ADR 0026 supersedes ADR 0008 for private multi-profile access. ADR 0015 remains authoritative for Vercel, Neon, Auth.js and Google OAuth. ADR 0030 records the neo-brutalist refresh. ADR 0031 adds dev-created code accounts, which take precedence over Google OAuth when `KNOW_OS_ACCOUNTS` is set. See [IFSC ADR delta](README-IFSC-DELTA.md).

ADRs document durable decisions with meaningful alternatives and consequences.

[ADR 0036](0036-direct-admin-publication.md) permits explicit audited ADMIN publication by code without editorial reviews, while preserving the existing reviewed workflow.

[ADR 0034](0034-file-based-content-studio.md) defines the local file-based Content Studio, runtime contract reuse and the separate human export/publication gates.

Status values: Proposed, Accepted, Superseded, Rejected.

Create a new ADR when changing architecture, trust boundaries, persistence, Pack compatibility, runtime isolation, authentication or a major cross-feature contract. Do not rewrite accepted history; supersede it with a new ADR.

[ADR 0038](0038-track-pack-request-limit.md) raises only Track Pack preview/apply body limits to 2 MiB while preserving other JSON limits and Pack compatibility.

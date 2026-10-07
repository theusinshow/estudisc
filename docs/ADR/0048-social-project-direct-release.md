# ADR 0048 — Social-project direct release and community feedback

Status: Accepted by explicit owner instruction, 2026-10-07.

## Instruction

Matheus states that Estudisc is a social project, does not want to spend time reviewing, and users themselves will review usage/content. Authorized features/enrichment awaiting editorial approval may be launched directly after engineering validation. This is standing authorization for the corresponding release/publication; do not repeatedly request his review.

## Decision

Use the existing Admin Direct publication path and actual authenticated ADMIN audit actor/reason. Record this instruction as the authorization basis. Do not create Reviewer identities, independent QA approvals or an additional publication mode. UNREVIEWED remains a truthful description of editorial evidence, not a release blocker. Community feedback can drive later immutable versions.

The human/independent editorial gates in ADRs 0046/0047 and the evolution Phase 9 plan are superseded for these authorized releases. Studio's Editorial Reviewed workflow remains available and historically accurate; actual independent review records are never fabricated or retroactively rewritten. Engineering tests, input validation, source/rights/reservation disclosures, security, immutable published versions and append-only learner evidence still apply.

## Boundaries

Standing authorization covers in-scope software releases/content activation, not unrelated external writes, purchases, new scope, real-secret handling or destructive data operations. A genuine implementation/runtime/data compatibility issue must be fixed before release; it is not an editorial gate. Existing 132 lessons/1,144 Questions must not be re-imported/republished merely to activate one enriched version. Production release is reported only after actual deployment/import/publication succeeds.

## Current application

MAT-07 candidate metadata now carries Admin Direct standing authorization, community feedback status and a valid existing direct-publication request. No actual deployment/import/publication is claimed. The current Track Pack importer creates a new Track aggregate; a compatible targeted lesson-version import is a separate technical prerequisite for activating v5 while preserving the existing collection and Questions.

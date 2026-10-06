# Estudisc evolution — architecture entry point

Audit date: 2026-10-06. This execution covers audit and planning only.

Read [the supplied product architecture](source-pack/01_PRODUCT_ARCHITECTURE.md), [the gap analysis](IMPLEMENTATION-GAP-ANALYSIS.md), [the implementation plan](IMPLEMENTATION-PLAN.md), and [model routing](MODEL-ROUTING-POLICY.md). Specialized source documents are preserved unchanged in `source-pack/`; do not duplicate them into competing specifications.

Source archive: `C:\Users\Matheus\Downloads\estudisc_codex_pack.zip`.
SHA-256: `4ccd11ce2fa160b589688082d8e9388e3750d7bde57f87827e50d812a3fae862`.
The archive contains eleven Markdown documents and its manifest. They were all read during this audit. [Audit evidence](AUDIT-EVIDENCE.json) pins the inspected implementation and source documents by hash.

The pack extends the existing Next.js/React/Drizzle/PostgreSQL/Auth.js modular monolith. It proposes the cycle routine → Today → session → interactive lesson → practice → evidence → mastery → review/mistakes → new recommendation. Existing feature modules implement substantial parts of this cycle; they remain the extension points.

Precedence and reconciliations:

- The user's first-execution limit overrides the pack's later instruction to continue implementation. No large phase, import, publication, push, deployment or production migration is authorized by this audit.
- Preserve [approved scope](../02-SCOPE.md), [IFSC roadmap](../ifsc/16-IMPLEMENTATION-PLAN.md) and accepted [ADRs](../ADR/README.md). Evolution phases 0–15 below are a new planning sequence, not a claim that existing IFSC milestones are missing.
- [Design System index](../../design-system/DESIGN_SYSTEM_INDEX.md) and `design-system/VERSION` remain canonical. Current version is 4.0.0. The proposed five-tab navigation evolves the accepted four-item shell; document that change in a follow-up ADR and screen specifications before implementing it. Suggested spacing/motion values in the pack do not replace approved tokens.
- `LessonSection`, `LearningPurpose` and resumable steps need a compatibility decision before changing persisted Pack contracts. Extend the current block renderer and Activity registry. Any Pack schema change requires an ADR, migration strategy, fixtures and compatibility tests.
- The 132 lessons / 1,144 Questions remain published and immutable. Enrichment produces new draft versions with the same stable identities, rather than editing or republishing existing versions. Actual editorial reviews and Admin Direct audit records retain their distinct meanings.
- Publication is not certification of rights, official curriculum mapping, pacing or planner readiness. Keep current caveats visible and decide eligibility explicitly before changing selection policy.
- Concept is the mastery target. Attempts and ConceptEvidence remain immutable/append-only. Exploration, lesson completion and AI prose cannot establish canonical mastery or official scores.
- Provider credentials, external model calls and production operations remain separate authorization boundaries. Future model names below are routing recommendations; this session did not switch models or recruit agents.

Offline/advanced experiences are listed in the source architecture but lack detailed acceptance contracts. Phase 15 is deferred until its scope is defined.

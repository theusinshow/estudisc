# ADR 0040 — Progressive study navigation and compatible lesson projection

Status: Accepted for local implementation (explicit architecture pack and implementation request, 2026-10-06).

## Context

ADR 0030 and Design System 4.0.0 define a four-item mobile navigation. The supplied architecture adds Plano and promotes Revisar, asks for Focus mode, and proposes a Section/Step/purpose hierarchy. Existing lessons, activities, published Packs and Attempts already have stable contracts.

## Decision

- Retain the canonical tokens, fonts and visual identity. `FEATURE_STUDY_PLANNER` enables Hoje/Plano/Aprender/Revisar/Progresso on mobile and desktop; secondary destinations and account actions move to a topbar sheet. With the flag off, the accepted four-item shell remains.
- `/plan` initially presents existing persisted session composition, resume and current 15/30/60-minute planning controls. It does not claim a weekly routine, availability or rebalance algorithm. Routine semantics are a later Terra decision.
- AppShell supports a Focus variant through the same layout. Lesson and ACTIVE study routes use it under `FEATURE_INTERACTIVE_LESSONS`; ACTIVE assessment uses it under `FEATURE_REAL_EXAM`. It keeps the skip link, main landmark, brand and explicit exit while removing global navigation. Exit only navigates; it never abandons, completes or submits learner work.
- Central Zod-validated rollout flags default off and accept only `true`/`false` or an absent/blank setting. Only explicit non-sensitive booleans cross the server/client boundary. Flags are presentation rollout, never authentication, question exposure or editorial approval.
- Keep Section/Step as a runtime projection over existing lesson blocks/activities. No Pack-schema or published-version migration is made here. LearningPurpose and durable resume/evidence changes require their own versioned contract/ADR before persistence. Reuse the block renderer and Activity registry.
- Reusable dialogs/sheets use native modal focus containment; tabs/selection controls use semantic keyboard interaction and canonical tokens. Registry entries document current consumers rather than establishing another learning engine.

## Consequences

The new shell can be disabled without changing stored sessions or historical content. The five destinations have real routes while weekly planning remains pending. A temporary hybrid rollout is explicit; a flag alone does not certify the entire architecture phase. Server-side gating controls route exposure, while existing owner/auth boundaries remain authoritative.

## Rejected alternatives

Replace the current Design System; expose a placeholder weekly calendar as a real routine; create another lesson renderer or persist a new Pack hierarchy without compatibility fixtures; let navigation change session status; send full server environment configuration to the client.

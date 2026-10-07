# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Private allowlisted students preparing for IFSC Integrated admission and an administrator managing content quality. The student studies primarily on a phone; the administrator needs denser editorial tools. Programming learners retain the existing Lab.

## Product Purpose

Today answers what to study now. Short coherent sessions teach, collect attempts, give feedback and schedule retrieval. Concepts, curriculum coverage and assessments describe progress; completion and XP never substitute for knowledge evidence.

## Positioning

A private study tool that connects curriculum, available study time and recorded learning evidence to explainable next actions. It extends the existing programming learning core and IFSC preparation paths. This is product intent, not a claim about competitors, admission odds or measured learning outcomes.

## Operating Context

Students primarily read, practice and review on a phone; desktop expands the same study paths and preserves the Programming Lab. The administrator uses import/preview, source/media records, Content Studio and actual editorial/publication audits. UI language is Portuguese; code and technical identifiers are English. Browser experiences use touch and keyboard, with optional enhancement rather than mandatory dragging, hover, AI or advanced visuals.

## Capabilities and Constraints

- Reuse the existing modular monolith, shared versioned Questions, lesson block renderer, Activity registry and deterministic planner/mastery/review/assessment policies.
- Private ADMIN/STUDENT profiles isolate owner state. No public signup, organizations, billing or social product.
- Attempts and study events are append-only; ConceptEvidence is append-only. Concept is the mastery target; lesson completion and XP are not mastery.
- Published lesson/question versions are immutable. New enrichment creates draft versions; actual review records and Admin Direct publication remain distinct. Publication alone does not certify rights, official mapping, pacing or planner readiness.
- Real exam mode hides hints, tutor and correctness feedback until finalization. Reserved official Questions/assets remain protected and never become unrestricted AI input or public static assets.
- AI is optional/contextual and cannot own canonical recommendations, mastery, review, official scores or publication. Learner code remains isolated; RUN does not record an official Attempt and SUBMIT does.
- Preserve canonical Design System authority, content identities/hashes and historical compatibility. Feature flags introduce changes progressively; external/production writes need explicit authorization.
- Flagged weekly routine now implements availability/modes/overrides/focus and checked preview/apply (ADR 0041). Open contracts remain Adaptive Session composition/readiness, version-compatible persisted interaction resume and purpose/evidence semantics. Planned time is not measured time or proof of learning.

## Brand Commitments

Estudisc is the current identity. Use functional, concrete and supportive Portuguese copy. Existing brand assets and canonical Design System documents own visual decisions; this product record does not replace tokens, typography or screen specifications.

## Brand Personality

Functional, clear, tactile. Portuguese UI uses concrete feedback and supportive next actions. The system is a study instrument, with visible structure and restrained emphasis.

## Anti-references

No noisy portfolio styling, ornamental 3D, glassmorphism, diffuse SaaS shadows, punitive debt/streak messaging, fabricated admission probabilities or paragraphs wrapped in repeated cards.

## Product Principles

- One primary action per decision context.
- Teach the minimum needed to support an attempt, then give specific feedback.
- Evidence and review remain deterministic and explainable.
- Mobile controls work by touch and keyboard; hover and dragging are optional.
- Learning feedback precedes gamification.

## Evidence on Hand

- [Product definition](docs/01-PRODUCT.md) and [approved scope](docs/02-SCOPE.md): users, jobs, boundaries and accepted IFSC extension.
- [Architecture entry point](docs/estudisc/PRODUCT_ARCHITECTURE.md), [gap analysis](docs/estudisc/IMPLEMENTATION-GAP-ANALYSIS.md) and [implementation plan](docs/estudisc/IMPLEMENTATION-PLAN.md): preserved supplied pack, current extension points and remaining work.
- [Foundation report](docs/estudisc/EVOLUTION-FOUNDATION.md) and [ADR 0040](docs/ADR/0040-evolution-shell-and-runtime-compatibility.md): tested flagged navigation/Focus/Today/session-only Plano; the default rollout remains off.
- [Design System index](design-system/DESIGN_SYSTEM_INDEX.md) and [component registry](design-system/COMPONENT_REGISTRY.md): incumbent visual/component/accessibility authority.
- `tests/unit/estudisc-content-preservation.test.ts` and its baseline fixture: current corpus identities and exact original Pack bytes. Existing domain, integration, content QA and desktop/mobile E2E suites provide implementation evidence.
- Source-rights, official-mapping and editorial caveats remain in actual content/source/audit records. Do not fabricate independent reviews, cleared licenses, testimonials, benchmarks or learning/admission guarantees.

## Accessibility & Inclusion

Follow design-system/ACCESSIBILITY.md, visible focus, semantic controls, at least 44px touch targets, non-color state cues and reduced motion. Visual models have structured text equivalents. These answers come from the approved repository/IFSC documents, not a new design direction.

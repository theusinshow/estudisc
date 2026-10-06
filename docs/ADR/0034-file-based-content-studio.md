# ADR 0034: File-based Content Studio outside the learning runtime

Status: Accepted for local implementation (user request, 2026-10-02)

## Context

VECTA needs a versioned editorial production workspace operated by specialized Maestri agent terminals. Existing Pack v2, shared Questions, Concept curriculum, renderer, import validation and publication QA already define the runtime contracts. AI generation must not become a student-runtime dependency or bypass human release approval. Current IFSC teaching gaps and unverified official mappings must remain visible.

## Decision

Add `tools/vecta-content-studio/` as local filesystem/TypeScript CLI tooling, with four roles: Orchestrator, Researcher, Author and independent Reviewer. Agents read compact pinned curriculum context and write disjoint structured artifacts. Claims, atomic state operations, stage hashes, explicit prompt versions and recoverable stage resets coordinate terminals. No model API, agent SDK, queue or database is introduced.

Reuse the nested production Pack v2 Lesson Zod schema and shared Question schema. Studio-specific schemas cover requests, research/media/provenance, architecture, QA and state. Deterministic validation precedes independent agent review. Unsupported interactions become production requests rather than invented runtime components.

Reviewer approval is an editorial candidate at `HUMAN_REVIEW_REQUIRED`. An explicit human local approval is required for promotion. Export a validated `caderno.track.v2` draft package and an editorial audit sidecar/manifest; never import or publish automatically. Existing runtime human publication QA and immutable-version rules remain unchanged. DEMO-only simulated promotion is explicitly labeled and cannot count as independent approval.

Single-lesson exports use preview-scoped track IDs and preserve canonical lesson IDs/new versions. Required prerequisite inventory stays explicitly incomplete. A requirement is emitted in the pack only when its complete canonical Concept mapping resolves in the export; broader references remain in sidecar/metadata. Do not narrow authoritative mappings to manufacture coverage.

## Consequences

Maestri workers can resume from files without rereading the repository or requiring paid API credentials. Role ownership plus hashes detects conflicting/stale handoffs, but it is a collaboration protocol rather than a filesystem access-control boundary. Human inspection must still establish factual/copyright suitability and real publication QA.

The draft pack is runtime-compatible and previewable through the existing importer. It does not automatically merge a one-lesson preview into the full IFSC curriculum; deliberate import/version review remains necessary. Media/QA audit stays in a sidecar where production contracts lack those editorial fields. Books/videos remain supplemental metadata because the renderer has no dedicated blocks for them; plain text does not provide clickable Markdown links.

Future specialists can contribute to existing artifact contracts under disjoint ownership. New runtime components, schema changes and production integration require separate scoped work and the existing approval boundaries.

## Alternatives considered

- Model API orchestration: adds cost, secrets and runtime coupling contrary to the requested terminal workflow.
- New editorial database/services: unnecessary for this local foundation and harder to resume/audit.
- A second Lesson schema or renderer: drifts from actual renderable content and duplicates the learning core.
- Agent approval recorded as human publication QA: fabricates independent approval and violates repository policy.

# Architecture

## Existing Estudisc architecture

Estudisc is a TypeScript strict Next.js 16 App Router modular monolith with React, pnpm, Zod 4 and Drizzle/PostgreSQL. Vitest covers contracts/domain/tooling; Playwright uses an owned, serial local server. Content imports and student state are separate. Concept mastery, immutable Attempts and append-only evidence remain entirely in the learning core.

| Area | Existing source of truth |
| --- | --- |
| Production Lesson import shape | `src/features/import/application/track-pack-v2-schema.ts` |
| Import semantics/references/payloads | `src/features/import/application/track-pack-v2-validation.ts` |
| Shared versioned Questions | `src/features/questions/contracts.ts` |
| Sources/requirements/prerequisites | `src/features/curriculum/contracts.ts` and `validation.ts` |
| Actual block renderer | `src/features/lessons/blocks/lesson-block-renderer.tsx` |
| Safe figures | `src/features/lessons/blocks/block-schemas.ts`, ADR 0032 |
| Activity dispatch/evaluation | `src/features/activities/` and `src/features/questions/interaction.ts` |
| Import workflow | `src/features/import/`, `/import`, `/api/import/track` |
| Editorial publication QA | `src/features/content-qa/policy.ts`, `/admin/review`, ADR 0033 |
| Existing curriculum and lessons | `packs/`, private IFSC source inventory and build scripts in `scripts/` |

The Pack v2 schema contains the production Lesson shape inline. Studio extracts that Zod object rather than restating it. The shared Question contract is imported directly. The Studio adds only editorial contracts and a pack adapter. Production schemas, database models, admin UI and student runtime are unchanged.

IFSC inventory distinguishes mapped curriculum from authored teaching. Historical question sources/assets can be protected; reservation does not authorize training use. Target-edition official mappings remain unverified where the existing inventory says so. Studio retains these limitations in pinned context and export metadata.

## Local components

`contracts.ts` defines editorial Zod schemas and aliases the runtime Lesson/Question contracts. Catalog/context tooling takes a compact snapshot of current lessons, Concepts, requirement mappings, source metadata and eligible historical metadata. No official question text or protected assets are exposed in that snapshot.

Filesystem coordination persists requests, state, claims and artifact hashes. Validators read artifacts and combine Studio checks with runtime Pack validation. The adapter writes a runtime-compatible draft pack and an editorial sidecar. The CLI wraps these operations; Maestri terminals provide all intelligence.

```text
workspace/JOB/
  request.json                  immutable editorial intent
  catalog.json                  pinned compact runtime context
  state.json                    CLI-owned state/claim/stage history
  research/
    source-pack.json
    media-pack.json
    research-notes.md
  author/
    lesson-architecture.json
    lesson.json                 actual runtime Lesson shape
    questions.json
    unsupported-components.json
  review/
    qa-report.json
    revision-*.json             retained review history
  approved/
    pack.json                   caderno.track.v2, all content draft
    editorial.json              evidence/media/QA/approval audit
    manifest.json               immutable snapshot hashes
```

Do not make parallel copies of every intermediate artifact for orchestration. Completed stages record hashes and compact status; stage reset archives superseded work rather than destroying research.

## State and ownership

```text
NEW → RESEARCH_READY → RESEARCH_IN_PROGRESS → RESEARCH_DONE
    → AUTHOR_READY → AUTHOR_IN_PROGRESS → DRAFT_DONE → VALIDATION
    → REVIEW_READY → REVIEW_IN_PROGRESS
      ├─ NEEDS_REVISION → REVISION_IN_PROGRESS → REVIEW_READY
      └─ HUMAN_REVIEW_REQUIRED → APPROVED → IMPORT_READY
```

Intermediate states are recorded by transitions; a command may advance through several bookkeeping states. Deterministic failure cannot advance a draft to review. Rejection or revision exhaustion also requires human intervention. Default automatic revision allowance is three; the validated request configures it.

One active claim is allowed per job. Exclusive filesystem coordination protects concurrent CLI operations; state writes are atomic. A claim records role, owner, timestamps, optional model, prompt version and input hashes. Completion must use the same owner and validates required outputs. The Author and Reviewer owners must differ. Review reports are bound to the exact input hashes of the review claim, so changing a reviewed artifact invalidates that approval path.

Claims also compare completed upstream hashes before accepting a handoff; editing completed research requires resetting/recompleting its owning stage. `next` prints the job directory and retains the selected workspace in its command. `status` shows compact run metadata by default; `--verbose` exposes the full stored hashes when an audit needs them.

| Owner | Writes |
| --- | --- |
| ORCHESTRATOR through CLI | State, claims, audit/promotion metadata |
| RESEARCHER | `research/*` |
| AUTHOR | `author/*` |
| REVIEWER | `review/*` |
| Promotion tooling | `approved/*` |

Filesystem ownership is a collaboration protocol, not an operating-system security sandbox. Agents with direct filesystem access can violate it; prompts prohibit this and hashes detect stale handoffs. Coordinate all transitions through CLI commands. Do not edit state manually or run duplicate active agents for one role.

## Approval and export

Agent review `APPROVED` means the draft is ready for human inspection. The explicit local `approve` command records a human identity/note bound to the artifacts; agents must not fabricate this action. `promote` revalidates approved artifacts and produces a draft Pack. A DEMO-only simulated approval is labeled simulation and cannot establish production QA.

The export uses a preview-scoped track ID `studio-JOB`, retains the canonical target lesson ID and creates its proposed new version. Required prerequisite Concepts may travel in visibly incomplete draft inventory lessons so the pack resolves references. These skeletons are not teaching coverage. A requirement is included in the runtime pack only if all of its canonical mapped Concepts are in scope; other authoritative requirement references remain in the editorial sidecar and track metadata. The adapter never narrows a requirement mapping to make a small pack appear complete.

The preview track is not an automatic merge into the full IFSC track. Use existing import preview to inspect IDs/version conflicts and plan a deliberate full-track merge when needed. Import is a separate owner action. Runtime release QA and human publication remain separate and unchanged.

Selected block evidence/media IDs also travel in `block.payload.contentStudio`; the existing importer persists this payload metadata, so traceability survives import. Questions retain canonical `sourceIds`. The importer currently does not persist arbitrary Track metadata; the complete architecture, recommendations, research candidates and QA remain durable in `editorial.json`. Pack metadata includes selected recommendations without duplicating figure bytes; unselected media stays only in the editorial audit. A future admin integration should consume that audit explicitly.

## Future responsibility splits

Keep artifacts stable when adding specialists. Research can split into curriculum analysis, evidence and media; authoring into architecture, Lesson and Questions; review into factual, pedagogical and IFSC checks. Assign disjoint file/subartifact ownership or let one existing owner assemble contributions before completion. Do not have several terminals replace the same JSON file or bypass the final independent review/human gate.

There is no new service, queue, database, model SDK, transcript store or runtime AI dependency. Stage input/output hashes, prompt versions and timestamped state history are the observability layer.

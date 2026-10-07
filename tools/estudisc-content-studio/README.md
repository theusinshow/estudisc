# Estudisc Content Studio

Teaching-asset metadata inventory (ADR 0045): `pnpm estudisc-content assets` lists current candidates without bytes; filter with `--query`, `--subject`, `--concept`, `--type`, `--reuse-only`. `assets-index` writes a metadata-only `.teaching-assets-index.json` inside the existing ignored workspace. It does not approve rights, alter jobs, publish or transfer protected Question assets. Version/content/metadata/source/policy hashes are checked again by `resolveTeachingAsset` before local authoring reuse. Optional `teachingAsset` metadata must record actual rights evidence, teaching exposure and explicit reusable/interactive-ready intent; legacy candidates are not promoted automatically.

Content Studio is Estudisc's local, versioned editorial workspace. Four Maestri terminals research, author, review and coordinate lessons through files. The repository supplies contracts, a CLI, deterministic validation and an export adapter. It calls no model API and needs no API key.

Generation lives outside the student runtime. The Studio imports Estudisc's existing Zod contracts; it does not introduce another Lesson format, renderer, Question engine or mastery policy. A successful export is a **draft Pack v2**, never a published lesson.

## Start

Run from the Estudisc repository root:

```powershell
pnpm estudisc-content init CIE-06
pnpm estudisc-content next CIE-06
```

Open four Maestri terminals at that same root. Paste the corresponding versioned prompt from `agents/`: `orchestrator.md`, `researcher.md`, `author.md`, `reviewer.md`. Follow [RUNBOOK-MAESTRI.md](RUNBOOK-MAESTRI.md) for claims, handoffs, revisions and recovery.

Jobs live in `tools/estudisc-content-studio/workspace/` by default. A job pins compact curriculum context in `catalog.json`; agents do not rediscover the repository for each lesson. `init` uses the existing private source pack when available, otherwise the checked-in Golden pack, which includes CIE-06. Other lessons may require restoring the canonical private inventory; a missing lesson in the smaller fallback is an explicit error. A configured request can target Concepts already present in the selected catalog, but cannot invent missing references.

## Pipeline

```text
Maestri terminals
  → research evidence/media
  → runtime-shaped draft Lesson + Questions
  → deterministic validation
  → independent agent review/revision
  → human local export approval
  → IMPORT_READY draft Pack + editorial audit
  → separate Estudisc import preview and human publication QA
```

Reviewer `APPROVED` is an editorial recommendation. It stops at `HUMAN_REVIEW_REQUIRED`. Only an explicit human action records local export approval; this does not replace Estudisc publication QA. CLI commands never import, publish, deploy or write a database.

## Commands

Current release rule: [ADR 0048](../../docs/ADR/0048-social-project-direct-release.md). Estudisc is a social project: launch technically validated authorized features/content via existing Admin Direct and collect user feedback, without requiring Matheus/independent editorial approval. Current enrichment-preview outputs ADMIN_DIRECT_AUTHORIZED and release-request.json with real standing authorization, no fabricated QA. Previous review-only descriptions are historical. Existing published versions remain immutable; compatible targeted import and actual deployment/publication must still execute successfully.

`pnpm estudisc-content enrichment-preview --request tools/estudisc-content-studio/recipes/percentage-calculation.v1.json` prepares MAT-07 v5 as an isolated REVIEW_REQUIRED candidate: one existing percentage explorer after authored example E03, unchanged original lesson/Activity content and twelve hash-bound shared Question references. The request lists all seven existing Studio review dimensions and source caveats. It creates no QA approval or import-ready Pack and does not change role/state/publication authority. See [preview policy](ENRICHMENT-PREVIEW-POLICY.md) and [pilot report](../../docs/estudisc/ENRICHMENT-PREVIEW.md). Only ignored default workspace or `.local/` outputs are permitted.

`pnpm estudisc-content blueprints` extracts the 132 historically audited local lesson versions into ignored, version/hash-bound UNREVIEWED proposals and a compact aggregate/exception report. No full lesson payloads, Question content or image bytes are exported; no source is rewritten/imported/published. Unchanged complete inputs skip; source, curriculum, policy or current asset-rights changes invalidate. See [BLUEPRINT-POLICY.md](BLUEPRINT-POLICY.md) and [local pipeline report](../../docs/estudisc/LESSON-BLUEPRINTS.md). Missing objectives require human source review; confidence never supplies approval. Use only the default ignored workspace or `.local/`.

| Command | Purpose |
| --- | --- |
| `pnpm estudisc-content init CIE-06` | Create a job; reject duplicates. |
| `pnpm estudisc-content init JOB --request path/to/request.json` | Create from validated configured intent. |
| `pnpm estudisc-content list` | List jobs and their states. |
| `pnpm estudisc-content status CIE-06` | Read compact state, claims and completed work; `--verbose` includes all recorded hashes. |
| `pnpm estudisc-content next CIE-06` | Print next role, exact claim/handoff commands, files and prompt. |
| `pnpm estudisc-content claim CIE-06 RESEARCHER --owner research-session-1` | Claim exclusive work; optional `--model` records the model. |
| `pnpm estudisc-content validate CIE-06` | Validate on disk without advancing state. |
| `pnpm estudisc-content complete CIE-06 RESEARCHER --owner research-session-1` | Validate owned outputs, record hashes and advance. |
| `pnpm estudisc-content reset-stage CIE-06 author --reason 'Resume after interruption'` | Archive the selected stage/downstream output, preserve upstream work. |
| `pnpm estudisc-content recover-lock CIE-06` | Recover a stale command lock only when its process is dead. |
| `pnpm estudisc-content approve CIE-06 --by Matheus --note 'Reviewed the exact draft and evidence'` | Human-only local export approval. |
| `pnpm estudisc-content promote CIE-06` | Produce validated `approved/pack.json`, audit sidecar and manifest. |
| `pnpm estudisc-content demo --workspace .local/content-studio-demo` | Exercise synthetic CIE-06 research/revision; stop at the human gate. |
| `pnpm estudisc-content demo --workspace .local/content-studio-demo-export --simulate-approval` | DEMO-only structural promotion proof in a fresh workspace, explicitly simulated. |
| `pnpm estudisc-content schemas` | Export JSON Schemas for file authoring. |

Use `--workspace path` to select a different workspace **inside this repository**. Do not put real jobs in the committed fixture directory or student static assets. Keep local jobs out of Git unless an explicit editorial delivery requires selected, sanitized artifacts.

## Canonical references

- [ARCHITECTURE.md](ARCHITECTURE.md): discovered Estudisc contracts, state/locking, export boundaries.
- [CONTENT-CONTRACT.md](CONTENT-CONTRACT.md): artifact contracts, supported blocks and provenance.
- [MEDIA-POLICY.md](MEDIA-POLICY.md): licensing, accessible figures, supplemental recommendations.
- [QA-RUBRIC.md](QA-RUBRIC.md): review decisions and blocking findings.
- `context/`: short role-specific reading pointers and pedagogy/IFSC rules.

The CIE-06 fixture is **DEMO / NOT PRODUCTION CONTENT**. Its schematic, research and review prove structure; they are not independent factual approval, verified licensing or a production-ready atomic-structure lesson.

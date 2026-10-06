# Maestri operator runbook

## Four terminals

Point all four Maestri terminals at `C:\Dev\pessoal\vecta` (the repository root). Install existing dependencies if needed with `pnpm install --frozen-lockfile`. No AI API credentials are required. Model selection happens in Maestri/Codex, outside this CLI; `--model` is observational metadata. Use GPT-6.1 Sol with HIGH reasoning when available.

| Terminal | Prompt to paste | Responsibility |
| --- | --- | --- |
| ORCHESTRATOR | `tools/estudisc-content-studio/agents/orchestrator.md` | CLI coordination, compact state, valid handoffs |
| RESEARCHER | `tools/estudisc-content-studio/agents/researcher.md` | Sources, media candidates and notes |
| AUTHOR | `tools/estudisc-content-studio/agents/author.md` | Architecture, runtime Lesson and Questions |
| REVIEWER | `tools/estudisc-content-studio/agents/reviewer.md` | Independent findings; no lesson rewriting |

Paste one complete prompt in each terminal, then supply a job ID and a unique session owner. Prompts contain all required reading/write boundaries. The configured real canvas team and its connections are recorded in [MAESTRI-TEAM.md](MAESTRI-TEAM.md). When canvas communication is authorized, the orchestrator sends the printed `next` output through `maestri ask` to the assigned worker; that worker responds through the same conversation. Workers do not recruit or reconfigure the team. Without canvas communication, the operator can route the same handoff text manually.

## Initialize the first real job

In the orchestrator terminal:

```powershell
pnpm estudisc-content init CIE-06
pnpm estudisc-content status CIE-06
pnpm estudisc-content next CIE-06
```

This creates real editorial intent for Estrutura Atômica using canonical catalog IDs. Read the request before assigning work. The current IFSC inventory may contain unverified official target-edition mappings; the researcher must keep them visible, not label them verified because they were in a seed.

The checked-in Golden fallback includes CIE-06, so this first job works without the private inventory. For other lesson IDs unavailable in that fallback, restore the canonical private inventory at `.local/ifsc-official/track.source-pack.v2.json`. A validated configured request (`--request path/to/request.json`) can author a lesson using Concepts/modules/requirements already present in the selected catalog; it does not add missing catalog references. Run `pnpm estudisc-content schemas` for exact request fields. Do not copy the demo request into a real job or silently substitute demo Concepts.

To use a second workspace, append `--workspace .local/content-studio` consistently to every command. It must stay inside the repository. Keep the same workspace across all four terminals.

## Research handoff

The first `next` prints `NEXT AGENT: RESEARCHER`, read/write paths and its prompt. Give that output and a unique owner to the researcher. The worker claims before writing:

```powershell
pnpm estudisc-content claim CIE-06 RESEARCHER --owner cie06-research-1 --model 'gpt-6.1-sol/high'
```

Researcher reads the pinned context and writes only:

```text
research/source-pack.json
research/media-pack.json
research/research-notes.md
```

A valid Source Pack distinguishes facts, evidence, inferences and recommendations. No browsing capability means explicit `RESEARCH_REQUIRED`, not imaginary sources. Media may be empty when it offers no learning benefit. Complete with the same owner:

```powershell
pnpm estudisc-content validate CIE-06
pnpm estudisc-content complete CIE-06 RESEARCHER --owner cie06-research-1
pnpm estudisc-content next CIE-06
```

`validate` reports issues without changing state. `complete` validates, records stage hashes and advances to the Author handoff. Research may complete with honestly recorded `RESEARCH_REQUIRED` items, including blocking gaps; the Author gate will refuse review-ready completion until those blocking items are resolved. To obtain missing evidence, reset `research`, then have the Researcher resolve it; this archives dependent content for deliberate reauthoring. Do not manually edit `state.json` or remove an unresolved item merely to bypass it.

## Author handoff

```powershell
pnpm estudisc-content claim CIE-06 AUTHOR --owner cie06-author-1 --model 'gpt-6.1-sol/high'
```

Author writes `author/lesson-architecture.json`, `author/lesson.json`, `author/questions.json` and `author/unsupported-components.json`. Follow the real renderer contract and Source Pack. Question answers, Concept mappings and progressive hints need intentional authored content. Unsupported interactions become requests, never invented block types.

```powershell
pnpm estudisc-content validate CIE-06
pnpm estudisc-content complete CIE-06 AUTHOR --owner cie06-author-1
pnpm estudisc-content next CIE-06
```

Completion runs deterministic validation before making review available. Fix every structural error in the Author terminal. A sourced image candidate with an unknown license cannot be embedded; select an approved asset or omit the figure while retaining the production task.

## Reviewer handoff and revision

Use a different owner and a genuinely separate reviewer session from the Author:

```powershell
pnpm estudisc-content claim CIE-06 REVIEWER --owner cie06-review-1 --model 'gpt-6.1-sol/high'
```

The Reviewer reads `state.json` after the claim, copies `state.active.inputHashes` exactly into the QA report, and sets `reviewerId` to `cie06-review-1`. Its `dimensions` array includes all seven rubric categories. It reviews the corresponding files, not a prior version. Its only authored output is `review/qa-report.json` (and scoped review history when instructed).

```powershell
pnpm estudisc-content complete CIE-06 REVIEWER --owner cie06-review-1
pnpm estudisc-content next CIE-06
```

`NEEDS_REVISION` returns work to AUTHOR. The Author claims again, reads the latest QA report, changes only the targeted author artifacts, and completes. Research stays on disk and does not repeat. The Reviewer then makes a new claim/report for the new input hashes. HIGH or CRITICAL findings block approval; contradictions in a report are errors. After the configured revision allowance, the CLI stops at `HUMAN_REVIEW_REQUIRED` instead of looping forever.

`REJECTED` requires human intervention. An agent `APPROVED` report also stops at `HUMAN_REVIEW_REQUIRED`: it recommends export review, it does not publish or impersonate a human.

## Human export approval

The owner examines the exact request, lesson/questions, research, media, QA and any remaining nonblocking gaps. When satisfied, **the human operator** runs:

```powershell
pnpm estudisc-content approve CIE-06 --by Matheus --note 'Reviewed the exact draft, sources, media rights and QA for local export'
pnpm estudisc-content promote CIE-06
pnpm estudisc-content status CIE-06
```

Agents must stop before `approve`; they must not run it with your name just because the tool is local. Revisions or rejection do not become approved merely by entering a note; a valid independent candidate and deterministic gate are still required. If more work is needed, reset the relevant stage and run the normal review cycle.

Promotion writes `approved/pack.json`, `approved/editorial.json` and `approved/manifest.json`, then records `IMPORT_READY`. Every runtime Lesson and Question remains `draft`. Inspect the manifest/audit sidecar alongside the pack.

## Entering Estudisc

The Studio performs no import. The existing Estudisc importer accepts `approved/pack.json` as a `caderno.track.v2` payload. On an explicitly selected local/disposable Estudisc environment, sign in as ADMIN, open `/import`, use the existing JSON import flow and inspect the preview/conflicts before applying. The equivalent existing preview/apply endpoints are `POST /api/import/track/preview` and `POST /api/import/track`; they are application operations, not Studio commands.

The export track is preview-scoped (`studio-CIE-06`), not a complete replacement IFSC track. Stable lesson IDs and new versions are retained; review any collision/ownership implications before merging into the full curriculum. Prerequisite inventory skeletons and requirements omitted from the runtime pack remain explicitly recorded in the editorial sidecar. They are not planner-ready teaching coverage.

After an authorized import, use `/admin/review` for real independent human publication QA. Runtime publication is a separate explicit owner action. Do not import the demo into production. This bootstrap authorizes neither production import, publication, remote push nor deployment.

## Resume after a dead terminal

First inspect:

```powershell
pnpm estudisc-content status CIE-06
pnpm estudisc-content next CIE-06
```

If the owning session is recoverable, resume it with the same owner and stage prompt; keep its valid artifacts and complete normally. If a replacement agent needs to continue the same claimed work, use the recorded owner only after the original session has stopped and you have explicitly transferred responsibility. Do not have both sessions writing concurrently.

To restart a stage, stop its worker and use:

```powershell
pnpm estudisc-content reset-stage CIE-06 author --reason 'Author session ended; regenerate author output' --abandon-owner cie06-author-1
pnpm estudisc-content next CIE-06
```

Use `--abandon-owner` only if a claim is active; its value must match the existing owner. Without it the CLI refuses to cancel active work. Reset archives superseded artifacts and invalidates downstream review/export approval. Reset `author` preserves completed research; reset `review` preserves completed research/author output; reset `research` invalidates downstream content because its evidence changed. Never remove a lock or edit state to make an active stage disappear. If a process-level lock persists after a crash, run `pnpm estudisc-content recover-lock CIE-06`; it checks the recorded process and refuses recovery while that process is alive. A recovered command lock does not cancel an agent claim.

## Dry run

```powershell
pnpm estudisc-content demo --workspace .local/content-studio-demo
```

This loads synthetic CIE-06 material, exercises a QA finding and revision, and ends at the human gate. For an automated structural proof of export only:

```powershell
pnpm estudisc-content demo --workspace .local/content-studio-demo-export --simulate-approval
```

Use a fresh workspace for each dry run; the command refuses to overwrite an existing CIE-06 job. These separate directories avoid collisions with the real lesson job. Simulated approval is allowed only for DEMO content. It proves Pack compatibility, not factual/media clearance or independent human approval. It neither publishes nor calls an API.

## Add a fifth agent later

Keep the same contracts. For example, a Media Curator can prepare a contribution under a new explicitly assigned research subdirectory; the existing RESEARCHER remains the sole owner assembling `media-pack.json`. Update the role prompt and prompt version, record it in claims, and add deterministic validation/tests for any new handoff. Do not create two owners of the same output or relax the independent Reviewer/human approval boundary.

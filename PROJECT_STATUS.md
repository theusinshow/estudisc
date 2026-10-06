# Estudisc — Current project status

```text
Product: Estudisc
Production: live
Published lessons: 132
Questions: 1,144
```

## Current production

Production URL: https://vecta-three.vercel.app. Preserve this existing alias during the identity migration. Publication evidence: [all subjects live](docs/all-subjects-live-20261006.md). Current validation: [consolidation report](docs/migrations/ESTUDISC-CONSOLIDATION-RESULTS.md).

## Current architecture

Next.js, Drizzle, Neon, Vercel and Auth.js remain a modular monolith with private ADMIN/STUDENT profiles. Attempts and evidence are append-only. Mastery, retention and planner decisions are deterministic. The learning core works without AI. Estudisc environment parsing, legacy session and backup readers preserve existing production contracts.

## Current content

| Subject | Published lessons | Questions |
|---|---:|---:|
| Mathematics | 19 | 240 |
| Science | 40 | 320 |
| History / Geography | 49 | 392 |
| Portuguese | 24 | 192 |
| Total | 132 | 1,144 |

Do not repeat content imports or publication. Stable IDs, versions, source files, hashes and learner state remain unchanged.

## Known issues

Editorial source caveats about rights, official curriculum mapping, pacing and quarantined Portuguese Concept labels remain recorded. Publication does not certify these matters. Consolidation acceptance and remote results are being finalized in the linked report; do not infer remote CI success from local tests.

## Current priorities

Finish final acceptance and remote identity migration; preserve the production alias, authentication and existing catalog. Current Design System version is defined only in `design-system/VERSION`.

## Next action

Follow [PLANS.md](PLANS.md) and [.estudisc-agent-context/NEXT.md](.estudisc-agent-context/NEXT.md). Historical implementation logs are in `docs/history/`; they do not define the current import or publication queue.

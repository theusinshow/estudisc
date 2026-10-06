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

Editorial source caveats about rights, official curriculum mapping, pacing and quarantined Portuguese Concept labels remain recorded. Publication does not certify these matters. Local acceptance, main CI and full E2E are green; exact evidence is in the consolidation report.

## Current priorities

Consolidation is implemented and accepted. The supplied architecture pack has now been audited against the existing implementation; this execution produces documentation only. Read [architecture](docs/estudisc/PRODUCT_ARCHITECTURE.md), [gap analysis](docs/estudisc/IMPLEMENTATION-GAP-ANALYSIS.md), and [implementation/model-routing plan](docs/estudisc/IMPLEMENTATION-PLAN.md). No large phase has been implemented, and no content has been imported or republished.

Current local audit checks: lint, typecheck, build and pack validation PASS; tests 262 PASS / 3 optional real-PostgreSQL SKIP; full E2E 38 PASS / 0 FAIL. Initial dependency auto-install failed with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; `$env:CI = 'true'; pnpm install --frozen-lockfile` repaired the local environment before successful reruns. Exact commands, source provenance and validation limits: [audit verification](docs/estudisc/AUDIT-VERIFICATION.md). No new remote/production acceptance is claimed.

Open contracts for future implementation: five-tab navigation reconciliation with the approved four-item shell, weekly routine/override semantics, version-compatible resume and purpose/step projection, readiness independent of mere publication, and help-aware assessed interactions. These are planning findings, not changes to current production behavior. Luna Max handles routine implementation; Terra handles domain/security/architecture decisions; Sol High is conditional critical review. The active session did not switch models or recruit agents.

Preserve the production alias, authentication and existing catalog; use protected main for future authorized evolution. Current Design System version is defined only in `design-system/VERSION` (4.0.0).

## Next action

The requested first execution ends at audit/planning. After separately authorized implementation, start with remaining Phase 0 reconciliation and a small Phase 1 increment; see [PLANS.md](PLANS.md) and [.estudisc-agent-context/NEXT.md](.estudisc-agent-context/NEXT.md). Do not automatically continue into the large phases. Historical implementation logs are in `docs/history/`; they do not define the current import or publication queue.

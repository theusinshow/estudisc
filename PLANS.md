# Estudisc current plan

## Current task — architecture pack audit (2026-10-06)

User scope for this execution: read `estudisc_codex_pack.zip`, audit the existing implementation, write `docs/estudisc/IMPLEMENTATION-GAP-ANALYSIS.md` and `docs/estudisc/IMPLEMENTATION-PLAN.md`, and route future phases by model. Do not implement the large phases or perform external/production writes.

Assumptions: the pack is an evolution proposal, existing accepted ADRs and immutable published content remain constraints, and example phase lists must be reconciled with actual code. The active session cannot switch its own model; requested future routing is Luna Max → Terra when justified → Sol High exceptionally. No additional agents.

Acceptance: every pack area has code/test evidence or an explicit unverified finding; phases have dependencies, acceptance gates and concrete model-escalation reasons; source provenance and unresolved conflicts are visible; documentation validation and configured final checks have actual results recorded.

- [x] Preserve and read all eleven source-pack documents and manifest; inventory current architecture and relevant ADRs.
- [x] Audit each requested capability against targeted implementation and tests.
- [x] Write gap analysis and phased implementation/model-routing plan.
- [x] Complete documentation hash/link/diff checks and configured final application checks; record results and resumable next action.

Verification: frozen install PASS after initial `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; lint/typecheck/build/pack validation PASS; tests 262 PASS / 3 optional PostgreSQL SKIP; full E2E 38 PASS / 0 FAIL (19 per project). Exact commands and limitations: [audit verification](docs/estudisc/AUDIT-VERIFICATION.md). No runtime implementation, production operation or model switch.

Audit acceptance: complete. Document checks PASS: 94 source/implementation hashes, 12 byte-identical source files, 18 local links, all 16 phases and documentation-only diff; `git diff --check` PASS.

NEXT ACTION: this first-execution audit is complete. Future implementation must be separately authorized and starts with the remaining Phase 0 navigation/flag/compatibility reconciliation using Luna Max. Read [architecture](docs/estudisc/PRODUCT_ARCHITECTURE.md), [gaps](docs/estudisc/IMPLEMENTATION-GAP-ANALYSIS.md), and [plan/model routing](docs/estudisc/IMPLEMENTATION-PLAN.md); use Terra for concrete domain decisions, Sol High exceptionally. Large phases and corpus enrichment remain pending.

## Historical consolidation — complete

Authorized scope: rename, stabilize and consolidate. Preserve 132 published lessons, 1,144 Questions, stable IDs, immutable content, migration hashes and learner state. No re-import, republication or production reset.

- [x] Inventory historical names and classify branding, compatibility contracts and immutable history; preserve a local hash/archive checkpoint.
- [x] Reconcile remote main and existing local work without losing source bytes.
- [x] Centralize canonical environment aliases; preserve signed legacy sessions and backup restore.
- [x] Modularize memory domains, importer panels/hooks, QA release/bundle/publication responsibilities and ordered CSS.
- [x] Add the Today coordinator, deterministic recommendation reasons and bulk mastery reads.
- [x] Expose publication mode and actual audit information; validate critical API responses and add safe structured operational logging.
- [x] Reconcile current docs, agent context, branding and the canonical Design System version.
- [x] Separate CI fast checks, integration/content QA and critical E2E; fix the heavy test setup and isolate browser projects.
- [x] Complete final lint, typecheck, tests, build and full E2E; record exact results.
- [x] Rename the existing GitHub repository after green local gates; update origin, verify actual remote CI and configure main protection where permitted.
- [x] Verify Vercel Git integration and preserve the production URL; verify the catalog read-only.
- [x] Record exact rename counts, legacy exceptions, remote results and unavoidable manual follow-ups.

Acceptance: all configured local gates pass, no known E2E failures, explicit compatibility tests pass, immutable content checks pass, actual remote results are distinguished from local results. Private receipts and diagnostic logs remain in `.local/estudisc-consolidation-audit/`.

NEXT ACTION: use protected main for the next explicitly approved evolution. Consolidation and identity migration are complete; the final Today queue correction follows the same mandatory remote release gates. Do not repeat imports or publication. Historical plans are in `docs/history/`.

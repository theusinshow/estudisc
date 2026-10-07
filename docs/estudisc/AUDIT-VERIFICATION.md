# Architecture pack audit — verification

Date: 2026-10-06. Base `d38f640`, `main`. Only documentation is intentionally changed. Logs remain private/ignored in `.local/architecture-pack-audit/`.

| Exact command | Current result |
|---|---|
| `pnpm lint` (initial launch) | BLOCKED before lint: `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` |
| `pnpm test` (initial launch) | BLOCKED before tests: same dependency auto-install error |
| `$env:CI = 'true'; pnpm install --frozen-lockfile` | PASS; local modules reconciled, lockfile unchanged |
| `pnpm lint` (after install) | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` (after install) | PASS: 90 files / 262 tests; 3 optional real-PostgreSQL tests skipped |
| `$env:DATABASE_URL = 'memory://local'; pnpm build` | PASS; token generation and Next build completed |
| `pnpm packs:verify` | PASS: `pack_catalog_validation:passed:packs=1` |
| `$env:DATABASE_URL = 'memory://local'; pnpm test:e2e` | PASS: 38 tests / 0 failures; 19 desktop + 19 mobile |
| `node .local/architecture-pack-audit/validate-docs.mjs` | PASS: 94 evidence hashes, 12 source entries, 18 local links, 16 phases and documentation-only diff |
| `git diff --check` | PASS |

Archive-entry comparison with .NET ZipFile and SHA-256: PASS, all 12 extracted files are byte-identical to the supplied ZIP. No source document was normalized or edited.

`pnpm test` includes `tests/unit/estudisc-content-preservation.test.ts`: all 132 lesson identities, 1,144 Question identities and exact original Pack SHA-256 bytes match the existing baseline. `packs:verify` reports one catalog entry; do not misrepresent that output as a new production corpus verification.

PostgreSQL opt-in tests were not directed at production or a real credential. The memory harness does not establish SQL-locking/concurrency acceptance for future changes. No auth/provider keys were read or used. No external model/API, GitHub/Vercel write, content import/publication or migration was performed.

Full Playwright uses owned serial servers on port 3210 and separate desktop/mobile processes. Current routes' responsive/keyboard semantics are tested; new five-tab navigation, routine/Quick Review/maps/graph/offline and full manual screen-reader QA remain future acceptance work.

Historical remote/production evidence is linked from PROJECT_STATUS and the consolidation report, not rerun or re-certified here. Source/archive hashes and targeted implementation hashes appear in [AUDIT-EVIDENCE.json](AUDIT-EVIDENCE.json). New docs/plan are self-contained and record unresolved scope/contracts.

Next/Playwright and the token generator may regenerate `next-env.d.ts` and generated CSS while running. Restore only those verified tooling changes after the checks so the final diff contains the requested documentation only.

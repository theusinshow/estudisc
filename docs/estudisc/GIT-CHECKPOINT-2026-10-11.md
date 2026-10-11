# Git preservation checkpoint — 2026-10-11

The user explicitly requested committing and pushing all completed work.

- `checkpoint/shared-work-20261011` preserves the shared checkout's frontend,
  content recipes, tests and release receipts. Its base is `d4c6f1b`; many files
  are already represented in merged PRs 22/23. This is a preservation snapshot,
  not a replacement for current `main` or a new production release. Compare
  against current `main` before integrating any remaining differences.
- `fix/lesson-question-reflow-20261011` preserves the isolated continuation,
  handoffs and Terra's bounded assessed-enrichment contract (ADR 0060).
  MAT-16 scored content remains prepared locally, not published.
- Private `.local` artifacts, credentials, database dumps and dependencies are
  excluded. Changed public paths passed a private-artifact and credential-pattern
  check before staging.

Verification for the contract: `pnpm exec vitest run
tests/integration/assessed-lesson-version-import.test.ts
tests/unit/mat16-circle-retrieval-recipe.test.ts` passed five tests in two files.
The preceding same-checkout `pnpm typecheck` passed. Terra's recorded complete
suite has one environment failure: native MXC denies the deliberately created
junction in the existing linked-path security test. Keep that test intact and
finish the canonical gate on protected, provisioned Linux CI before merging
or releasing the new contract. This checkpoint does not assert that gate passed.

NEXT ACTION: complete protected CI for the assessed contract, then follow
`MAT16-SCORED-RETRIEVAL-RELEASE-PLAN.md` using a fresh authenticated source context.

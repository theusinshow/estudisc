# Student session access check

User reports Kauã can access other sessions/parts of the site; the particular failing URL/error is unknown. Checked on 2026-10-10 local time (2026-10-11 UTC).

Public site: https://vecta-three.vercel.app. Profile picker: https://vecta-three.vercel.app/auth/signin?callbackUrl=%2F. Both configured profiles appear. The `lab-estudisc-theusinshows-projects.vercel.app` alias redirects anonymous visitors to Vercel authentication; do not send it as the student entry point or disable protection as a workaround.

Database health 200/ok. Actual authenticated ADMIN profile and existing ACTIVE study session 200. Actual `/tracks`, `/plan`, `/history`, `/review`, `/progress` and profile picker 200 without an application-error page. These do not substitute for actual STUDENT browser acceptance.

Read-only repeatable-read PostgreSQL audit checked all 14 saved sessions across two owners: snapshot schema, exact frozen lesson/track/version, published lesson metadata, referenced activities and Question versions passed. Requested student's 12 sessions include one ACTIVE session. No private identifiers/responses are included here; diagnostics remain Git-ignored. No student impersonation, production answers, evidence changes or deployment.

Commands run (log outputs redirected to ignored private files):

```text
vercel logs --environment production --no-branch --since 3h --status-code 5xx --limit 35 --json --scope theusinshows-projects
vercel logs --environment production --no-branch --since 3h --query '/study/ OR /api/study-sessions' --limit 80 --json --scope theusinshows-projects
pnpm exec tsx .local/database-migration/private/session-access-audit-20261010.mts
pnpm exec vitest run tests/integration/adaptive-sessions.test.ts tests/integration/lesson-resume.test.ts tests/unit/code-accounts.test.ts
pnpm exec vitest run tests/integration/account-session-route.test.ts tests/unit/auth-readiness.test.ts tests/unit/today-dashboard.test.ts
git diff --check
git status --short
```

Tests: 27 PASS plus 9 PASS, six files. Logs returned no entries; retention/filter limits prevent treating this as proof no incident occurred. First `.ts` diagnostic execution failed because top-level await used CJS output; corrected to `.mts`. A task-owned per-item read-only process was stopped to replace repeated queries with batched reads; the completed batch audit passed. Guessed `/learn` returned 404; actual Aprender route `/tracks` passed.

No reproduced runtime defect or runtime edits. Full build/lint/E2E were not repeated for read-only diagnostics. NEXT ACTION: normal Kauã sign-in using the public site; if failure persists, inspect the specific affected URL/error or reproduce through normal authenticated student access. Preserve owner isolation and frozen ACTIVE content; do not silently replace historical versions.

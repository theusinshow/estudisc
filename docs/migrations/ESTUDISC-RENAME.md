# Estudisc identity migration

## Canonical name and renamed surfaces

Estudisc is the current product, application, brand and repository identity. Vecta, KNOW/OS, KNOW OS and their code variants are historical names. ADR [0039](../ADR/0039-estudisc-identity.md) defines the compatibility policy.

Package metadata, application metadata, the live wordmark, accessible branding, current documentation, agent prompts, internal configuration and new export identifiers use Estudisc. `.vecta-agent-context` became `.estudisc-agent-context`; the Content Studio lives in `tools/estudisc-content-studio`. The deprecated `vecta-content` command remains a thin forwarding alias.

## Environment migration

`src/lib/env.ts` is the only environment compatibility boundary:

| Canonical, preferred | Deprecated fallback |
|---|---|
| ESTUDISC_ALLOWED_GOOGLE_EMAILS | KNOW_OS_ALLOWED_GOOGLE_EMAILS |
| ESTUDISC_ADMIN_GOOGLE_EMAILS | KNOW_OS_ADMIN_GOOGLE_EMAILS |
| ESTUDISC_OWNER_ID | KNOW_OS_OWNER_ID |
| ESTUDISC_ACCOUNTS | KNOW_OS_ACCOUNTS |

An explicitly set canonical value wins, including empty allowlists or accounts. Invalid canonical configuration fails closed. Internal consumers only see `env.ESTUDISC_*`. Deprecation logs include variable names, never values. Existing Vercel variables keep working without a coordinated secret rewrite. `NEXT_PUBLIC_APP_NAME=Estudisc` is the example value. `AUTH_TRUST_HOST` is parsed as a boolean and controls Auth.js; when absent, Vercel supplies the platform default. The disposable E2E harness explicitly trusts its own local host.

The optional real-PostgreSQL test flag follows the same boundary: `ESTUDISC_RUN_REAL_POSTGRES_TESTS` takes priority over `KNOW_OS_RUN_REAL_POSTGRES_TESTS`. Account and demo scripts consume the canonical parser; new account configuration writes the canonical key.

## Cookie and session migration

New code-account sessions write `estudisc_session`. Valid signed `kos_session` cookies remain readable with their original account fingerprint, expiry and HMAC rules. Sign-in removes the legacy cookie; sign-out clears both. Auth.js provider cookies are independent external contracts and remain unchanged. The legacy `kos:attempt-recorded` browser event is accepted during cached-client transition; new events use `estudisc:attempt-recorded`.

## Export and backup compatibility

New exports identify `estudisc.export.v1`. The v1 payload shape is unchanged, so a payload version bump has no benefit. Restore recognizes both this identifier and `know-os.export.v1`, without rewriting incoming bytes before checksum/dry-run validation. New preview/dry-run names use the Estudisc namespace. Compatibility fixtures exercise genuine legacy envelopes.

## Content and database compatibility

Pack IDs, lesson/Question/Concept stable IDs, content versions, hashes, original source provenance, catalog schemas and executed migrations are not branding. Preserve `vecta.*`, `ORIGINAL_VECTA_*`, `know-os.pack-catalog.v1`, source-library paths and other frozen identifiers where they are persisted. Database table names and existing Neon data remain unchanged. No content re-import, republication or learner-state mutation is part of this migration.

New Studio jobs declare the Estudisc namespace; legacy requests retain their original adapter output, namespace and source title. Existing `.maestri` views and Studio workspace state are local runtime/history, remain uncommitted and do not override current canonical prompts. Source-library filenames such as `EVALUATION-VECTA.md` remain historical provenance, with their original paths and bytes.

Publication mode is a complementary read model from `content_publication_events` and actual reviews. Direct events remain direct. New reviewed publications record the real publisher, mode and time using the existing audit table. Historical missing actor/time stay unknown; no reviews or timestamps are invented.

## Branding and Design System

The existing geometric mark is retained provisionally. `BrandLockup` renders the live Estudisc wordmark; canonical asset names start with `estudisc-`. Legacy public asset URLs remain deprecated aliases for cached clients. Historical design exploration stays in `docs/history/`. No new visual identity was invented. `design-system/VERSION` is the only current version source; shipped token values and CSS rule order are preserved.

## GitHub and Vercel

Rename the existing `theusinshow/vecta` repository to `theusinshow/estudisc` after green local gates. Keep its repository ID, history and Git integration. Do not create a second repository. Update origin, current links and badges; verify actual Actions and branch protection. Exact results are recorded in [the consolidation report](ESTUDISC-CONSOLIDATION-RESULTS.md).

Preserve `https://vecta-three.vercel.app` and existing aliases. Rename the visible Vercel project only when the API permits preserving those URLs and the Git connection. Remote settings and deploy results are recorded separately from local build results.

## Rollback

Redeploy the previous application build or revert source changes; do not restore/reset the database or overwrite content. Keep legacy environment configuration and session readers throughout the rollback window. Renaming the repository back preserves its identity; preserve both public aliases whenever changing platform names. New exports remain supported by the migrated reader, and older backups remain supported. A previous pre-migration build may need a compatible export reader before consuming new Estudisc envelopes.

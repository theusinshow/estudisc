# Direct lesson publication by code

An authenticated ADMIN can publish imported lessons and their Questions without entering the four editorial reviews. The existing review-based action remains available. See [ADR 0036](ADR/0036-direct-admin-publication.md).

## API

POST `/api/admin/content-qa` using the ADMIN's existing authenticated session:

```json
{
  "action": "publish_lessons_direct",
  "lessons": [{ "lessonId": "POR-01", "version": 1 }],
  "reason": "Publicação direta autorizada pelo responsável pelo conteúdo."
}
```

The reason must have 20–3000 characters. Choose one explicit version for each of 1–40 unique lesson IDs. Request JSON cannot supply an actor, reviews, credentials or a role. Failed access returns 403; invalid input or a blocked transition returns 409; input over 64000 characters returns 413. All lessons publish together or the entire batch rolls back.

Example for the Science snapshot, executed in an authenticated ADMIN browser context with `pack` containing the exact imported JSON:

```ts
const lessons = pack.track.modules.flatMap(module =>
  module.lessons.map(lesson => ({ lessonId: lesson.id, version: lesson.version }))
);
const response = await fetch("/api/admin/content-qa", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "publish_lessons_direct",
    lessons,
    reason: "Publicação das quarenta aulas autorizada pelo responsável."
  })
});
if (!response.ok) throw new Error((await response.json()).message);
const receipt = await response.json();
// { published: true, lessons: 40, releases: 360, newlyPublished: 360 }
```

Use the snapshot's actual versions: thirteen Science lessons are version 3, the others version 2. The function publishes existing imported data; it does not import the Pack. Repeating a successful call returns `newlyPublished: 0` and adds no duplicate audit events.

## Server function

Inside an authenticated server request:

```ts
const admin = await requireAdmin();
const receipt = await new ContentQaRepository().publishLessonsDirect(admin, {
  lessons: [{ lessonId: "POR-01", version: 1 }],
  reason: "Publicação direta autorizada pelo responsável pelo conteúdo."
});
```

`admin` must come from `requireAdmin()`, never from the request body. The repository also rejects STUDENT profiles. Direct publication does not change mastery or record study activity.

## Database and operation

Migration `0018_cultured_omega_flight.sql` adds `content_publication_events`; it must be applied before this function runs against a persistent database. Generate/verify locally with `pnpm db:generate`; the integration tests apply the migration only to disposable PGlite. Deployment and production migration require their own explicit authorization.

Each newly published release records its real ADMIN identity and reason in the audit table. No four-layer reviews are fabricated. Retired versions remain blocked, referenced source assets must exist, and any configured exit tickets must resolve. Required objective/exit-ticket counts and Concept training-pool coverage are waived for this administrative operation. Reserved material remains governed by the existing exposure rules; original content and metadata omissions remain visible.

## Validation (2026-10-05)

Commands ran in the existing workspace, preserving the unrelated work already present:

- `pnpm db:generate`: PASS; migration0018 adds only `content_publication_events`, with no changes to existing table definitions. The migration was applied only by the disposable PGlite test harness.
- `pnpm exec vitest run tests/integration/direct-publication.test.ts tests/unit/direct-publication-route.test.ts tests/integration/lesson-review.test.ts tests/integration/content-release.test.ts`:13passed. Actual40Science lessons/320Questions published in disposable PGlite,360audit events, zero fabricated reviews, idempotent retry, original content/baseline/state preserved, whole-batch rollback, access denial, retirement, reservation and normal QA gate covered.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`:237passed/3skipped (78files passed/3skipped).
- `pnpm build`: PASS.
- `$env:DATABASE_URL='memory://local'; pnpm test:e2e`:21passed/15failed. The actual fifteen failure names match `.local/progress-version-e2e.log` exactly; zero new names. The full application release gate remains unaccepted. Logs `.local/direct-publication-e2e.log` and `.local/direct-publication-e2e-comparison.json`.
- Focused `git diff --check` and whitespace checks for all new files: PASS.

Code implementation is complete and the user explicitly authorized commit/push to origin/main. No deployment, production migration, authenticated production import or publication was executed for this feature. Prior user authorization for the forty Science lessons persists; activating this new function requires separately authorized deployment/migration and an authenticated ADMIN session.

Pre-push verification of the exact staged export (excluding unrelated dirty work): the same focused four-file Vitest command passed13tests; `pnpm typecheck` and scoped ESLint passed. Exported15files match the index; migration snapshot confirms only the audit table is added. Reports `.local/direct-publication-push-focused.log`, `.local/direct-publication-push-typecheck.log`, `.local/direct-publication-push-lint.log`.

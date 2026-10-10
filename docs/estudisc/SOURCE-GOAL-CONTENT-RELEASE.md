# Source-goal content activation — 2026-10-10

CIE-03 v3 and POR-02 v3 are published on https://vecta-three.vercel.app. The real Matheus ADMIN session supplied authenticated authoring context, preview, targeted import and Admin Direct publication. Standing social-project authorization was recorded as the reason; no independent editorial review was invented.

Each lesson adds one source-derived prediction block with the visible label **Objetivo proposto desta exploração**. Original absent objectives remain absent. All original fields, blocks, Activities, Concepts and eight Question references per lesson are retained. Proposed goals do not certify rights, official mappings or original author intent.

## Actual acceptance

- Both latest source v2 hashes and actual author bindings matched before import. Preview returned 200/ready and targeted import returned 201/imported for both v3 packets.
- Each direct publication returned 200, nine releases and exactly one newly published version. SQL audit confirms published v3, `admin_direct`, actual author match and zero editorial reviews. CIE-03 was published at 15:29:51.699Z; POR-02 at 15:31:57.231Z.
- Before/after fingerprints match for original v2 payloads, blocks and Activities, Questions/version rows, all 106 Attempts, 127 ConceptEvidence rows and 129 StudyEvents. All 132 lesson identities remain. Historical published versions were not rewritten or retired; the corpus was not re-imported.
- Both authenticated lesson readers display the proposed-goal label without data-unavailable errors. Authenticated `/`, `/history`, `/progress` and `/plan` return 200 without sign-in or unavailable-data pages. No answers were submitted during validation.
- A complete private post-publication Aiven backup was produced and its archive table of contents parsed successfully (328 lines). SHA-256: `42ea75fe51a08a8936a0bffc693d594537243221b5d3bdaf942616f4a944a236`.

The existing application deployment remains `dpl_FTN5bU7Mgb9gynsBxxenDro3dE6H`, unchanged code `62e6bf1dfb6e8344037c676432c4cf08b5f86bd9`. This content activation required no code deployment. Full application acceptance already passed on that code: lint, typecheck, 447 unit tests, 58 browser tests, packs, build and isolated real-PostgreSQL smoke; optional/gated skips remain documented in the database recovery receipt.

## Focused commands and operations

```text
node .local/database-migration/private/content-checkpoint.mjs before
node .local/database-migration/private/content-checkpoint.mjs after-cie
node .local/database-migration/private/content-checkpoint.mjs after-por
node .local/database-migration/private/content-audit.mjs
.local/postgresql-client/bin/pg_dump.exe --dbname=service=estudisc-final --format=custom --file=.local/database-migration/private/post-content-20261010.dump
.local/postgresql-client/bin/pg_restore.exe --list .local/database-migration/private/post-content-20261010.dump
git diff --check
```

Authenticated browser operations used the existing `/api/admin/authoring-context`, `/api/import/lesson/preview`, `/api/import/lesson` and `/api/admin/content-qa` routes. Raw contexts, packets with actual author IDs, credentials, backup and detailed invariant inventories stay private and ignored.

## Next action

Resume remaining bounded source/content exceptions from [the compact handoff](handoffs/2026-10-08-content-goal-exceptions.md), excluding these two newly live versions and all earlier published enrichments. Software phases through 14 are delivered; enrichment of the whole 132-lesson corpus is still partial. The 113 original lessons without declared objectives still lack original objectives: explicitly proposed goals do not change that historical fact. Use Luna Max for specified recipes and Terra only for concrete unresolved pedagogical decisions.

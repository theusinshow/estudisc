# Science V2 integration

Local, draft-only integration of the supplied `VECTA-SCIENCE-CONTENT-IFSC-2027-1-v2.zip`. This tooling reuses VECTA's Pack v2 validation, shared Questions, deterministic evaluators, renderers, migrations and transactional importer. It does not research, author, approve, publish or deploy content.

## Inputs and persistent memory

The committed snapshot lives in `packs/drafts/ifsc-2027-science/`: sealed runtime Pack, complete editorial sidecar, all 620 immutable source files and thirteen hash-pinned SVG drafts. Tooling and QA now default to these tracked inputs, so a fresh clone needs no Downloads archive or ignored local Mathematics package. When the local Mathematics candidate exists, the preservation test additionally audits it. `SCIENCE_QA_PACK` still selects an explicit candidate; databases and working outputs remain local and ignored. The draft is deliberately absent from the public Pack catalog.

Optional archive recovery: extract the supplied archive into `.local/science-package/`, producing `.local/science-package/VECTA-SCIENCE-CONTENT-v2/`. Normal validation uses the committed source copy. Original ZIP SHA-256: `0B382A3D8EA73D4B8CABB36DDCBA9DDF8BC707CE8BDDEB61D1969C5CE2F4A30F`.

```powershell
Expand-Archive -LiteralPath 'C:\Users\Matheus\Downloads\VECTA-SCIENCE-CONTENT-IFSC-2027-1-v2.zip' -DestinationPath '.local/science-package'
```

Start resumption with `.vecta-agent-context/CURRENT-STATUS.md` and `NEXT.md`. The project/content/media/validation contracts and Concept/block maps in that directory contain the one-time architecture discovery. Keep the source package immutable. The QA source baseline pins all 620 source files; stale upstream manifest hashes are disclosed rather than replaced in the source.

## Commands and gates

Run commands from the repository root. The owned persistent development database is `.local/science-integration/db`; no production connection or credential is used. Import creates it with the existing migrations, seeds the unchanged full IFSC release and available approved Mathematics pack, and applies Science with the actual core importer.

```text
node tools/science-import/qa/source-audit.mjs
pnpm exec tsx tools/science-import/cli.ts preflight --stage pilot
pnpm exec tsx tools/science-import/cli.ts import --stage pilot
pnpm exec tsx tools/science-import/cli.ts validate --stage pilot
```

The pilot is CIE-04/10/18/22/30/33/38/40: eight lessons, 64 Questions. Independent fidelity, renderer, evaluator, draft visibility, preservation and mobile smoke checks must pass before batching.

For each stage `batch1`, `batch2`, `batch3`, `batch4`, `batch5`, run the same `import` then `validate` commands with that stage. These cumulatively add the requested ranges CIE-01…08, 09…16, 17…24, 25…32, 33…40, retaining already imported pilot lessons. Latest snapshot totals are 15/120, 22/176, 28/224, 35/280 and 40/320 lessons/Questions. Track snapshots are versions 1…6; source Lesson/Question versions remain 2. A successful exact reimport makes no changes; changed content under an existing identity/version fails.

```text
python tools/science-import/media/build_assets.py
node tools/science-import/media/verify_assets.mjs
pnpm exec tsx tools/science-import/cli.ts import --stage media --media .local/science-integration/media/assets.json
pnpm exec tsx tools/science-import/cli.ts validate --stage media --media .local/science-integration/media/assets.json
pnpm exec tsx tools/science-import/qa/persistent-receipt-audit.ts
```

Media uses cumulative snapshot 7. Its 13 figure-bearing lessons use runtime version 3; the other 27 lessons and all 320 Questions retain runtime version 2. Original editorial version 2 remains unchanged in the source and sidecar. Prior lesson versions remain immutable history. Both track and lesson versions must advance when their content changes. Keep pack JSON compact: the complete media candidate is close to the existing 1 MiB importer limit.

## QA and artifacts

Each stage directory in `.local/science-integration/` contains `science.pack.json`, the complete original editorial/source-library sidecar, preflight, import receipt, independent audit and baseline preservation report. Receipts verify exact saved-pack identity, draft state, idempotence, unchanged baseline content and immutable student state. Final database QA also checks the persisted latest snapshot directly.

```powershell
$env:SCIENCE_QA_PACK='.local/science-integration/media/science.pack.json'
pnpm exec vitest run tests/science-qa-render.test.tsx tests/science-qa-import.test.ts
$env:DATABASE_URL='memory://local'
pnpm exec playwright test tests/e2e/science-qa-mobile.spec.ts --project=mobile-chrome
```

The browser smoke uses static core SSR and actual application CSS at 344px. It checks all eight pilot lessons, radio keyboard behavior, overflow and figure disclosures; it does not claim hydrated routes or publication acceptance. The manual checklist is `qa/MOBILE-CHECKLIST.md`. Final full application commands and unresolved baseline E2E failures are recorded in `PLANS.md` and the validation log.

## Content and media limitations

All 240 editorial Concepts have explicit mappings: nine existing canonical targets and 231 intentional new targets. Ordered source blocks, original questions/options/answers/explanations, difficulty, source metadata and raw taxonomy are retained. Runtime normalization and integration defaults are disclosed in `CONTENT-SCHEMA.md`; full original records stay in the sidecar. Official curriculum mapping, prerequisite inventory, pacing and upstream name/mastery-target discrepancies remain visible for human review.

The 13 deterministic SVGs are static draft fallbacks with complete text equivalents, not factual approval or completion of requested interactive components. Eleven deterministic requests need exact data, reviewed geometry or licensed inputs. Thirteen generative requests are `ANTIGRAVITY_MANUAL_REQUIRED`; the exact queue and prompt are preserved in `.local/science-integration/antigravity-handoff/`. No image service was invoked. Pending media renders explicit notes; core source text/questions remain available.

No new Pack schema, learning engine, production migration or public assets are introduced. Every imported Science lesson and Question remains draft. Human editorial/factual/publication review and explicit authorization for external writes remain required.

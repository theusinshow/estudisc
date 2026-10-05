# Science pilot QA gate

Pilot source scope: CIE-04/10/18/22/30/33/38/40, 8 lessons / 64 Questions / 48 Concepts. Current saved-JSON canonical preflight contentHash `9cdd67a7491c12704ff073ad6fb8d2e87e0add87e1f38ec88bb42c1a706290a7`. Earlier in-memory hash `380c7e...` included undefined metadata keys; integrator corrected hashing to saved JSON without changing artifact bytes or renderer inputs.

Passed independent targeted QA: exact Question stems/options/correct keys/explanations/difficulty/provenance conversion/cognitive operation/mapped Concepts; exact full source sidecar; canonical block hashes; all distinct educational strings retained; all block counts retained; all 620 source files unchanged. Duplicate sentences contained in another source paragraph may render once, while exact original arrangement remains in the sidecar. Canonical Question stem remains exact when question-reference activity label uses its ID.

Passed existing core renderer SSR for all pilot blocks and 64 Questions; five radio choices/question; evaluator accepts only the source correct option; student projection hides answer/explanation/correct flags; draft exposure blocked in training/review/assessment.

Passed disposable migrated database import: Questions persisted draft; content releases unpublished; publication rejected without independent reviews; no owners, attempts, study events, ConceptEvidence, lesson progress, question exposures or study sessions created. Persistent local import is proven separately by Worker receipts, not this disposable test.

Passed mobile-chrome static SSR at 344px for all eight pilot lessons with actual app CSS and lesson/step wrapper classes; no overflow, all 40 radios/lesson, Space/ArrowDown keyboard behavior. Initial mobile failure from unbroken media URLs was corrected by root generic grid/text wrapping CSS. Initial adapter invalid-block failure was corrected by integrator payload type/id. No editorial source changed.

Exact passing commands (PowerShell env scoped to each shell):

`$env:SCIENCE_QA_PACK='.local/science-integration/pilot/science.pack.json'; pnpm exec vitest run tests/science-qa-render.test.tsx tests/science-qa-import.test.ts` — 2 files / 4 tests passed.

`$env:SCIENCE_QA_PACK='.local/science-integration/pilot/science.pack.json'; pnpm exec playwright test tests/e2e/science-qa-mobile.spec.ts --project=mobile-chrome` — 1 passed.

`pnpm exec eslint tools/science-import/qa/adapted-pack-audit.ts tools/science-import/qa/render-mobile-preview.tsx tests/science-qa-render.test.tsx tests/science-qa-import.test.ts tests/e2e/science-qa-mobile.spec.ts` — passed before final hash/label contract alignment; root final lint remains required.

All40 cumulative adapted artifact `.local/science-integration/batch5/science.pack.json`: `pnpm exec vitest run tests/science-qa-render.test.tsx tests/science-qa-import.test.ts` passed 2 files / 4 tests before preservation expansion; all 40 lessons / 320 Questions rendered and source/sidecar/correct answers checked. Then `pnpm exec vitest run tests/science-qa-import.test.ts` passed after expanded full IFSC + Mathematics preservation checks.

Preservation helper: `tools/science-import/qa/preservation-audit.ts`; core CLI calls it using its existing owned database connection before/after Science import. Independent disposable test seeds `packs/releases/ifsc-week-1.pack.json` and `.local/mathematics-production/application/mathematics.pack.json`, then imports all40 Science. Normalized baseline pack manifests/hashes/status; lesson titles/metadata/version; block payloads; activities/config/evaluator; Question content/hash/version/status; and all nine existing canonical Concept title/summary definitions remain identical. Earlier golden-only baseline omitted three reused Concepts; the helper detected that gap and the integrator corrected the baseline selection. Persistent receipts remain Worker evidence.

Limits: static SSR smoke does not prove hydration or authenticated route gates; no human scientific figure approval, editorial rereview, publication or external writes. Known source manifest hash defects remain disclosed. NEXT: verify Worker persistent preservation receipts and any media-enabled final variant; root final acceptance.

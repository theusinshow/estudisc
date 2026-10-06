# Portuguese integration — final technical QA

Status: local draft integration complete; editorial findings quarantined; full application gate FAIL (14existing E2E failures,zero new failure names). No human approval, publication or live-site application.

Candidate: packs/drafts/ifsc-2027-portuguese/portuguese.pack.json, snapshot6,476916diskbytes; canonical content hash4c5c598e32df714456a7dc0cd3761ad0dec09b50a645702f81575338beb120f3; fileSHA25656184aa794ae0bf6b118beee50ff666a1a1bbc03be350e26e72a1110b9eae157. ZIP hash2fa313382a51d1d39dcad0d38129671652765e496029f3d6a5bd90c28d1db9a5. Source164files pinned byte-for-byte,24draft lessons/192draftQuestions/144explicit targets/264blocks.

The adapter reuses Science machinery and existing caderno.track.v2/schema/validator/core importer/shared Questions/renderer/publication state. Geography/History integration tooling is absent in this checkout; its existing IFSC curriculum is preserved with the baseline. Work ran in this session as integrator/mechanical import/deterministic QA, with no extra agents or fabricated independent approval.

Pilot2:8lessons/64Questions. Cumulative batch1..4:13/104,17/136,20/160,24/192; snapshots3..6. Every actual import was immediately reimported and returned already_imported, then validated. Source-defined runtime pacing is preserved. Runtime lessons2 avoid global POR-01/02@1 collisions; Questions1 retain distinct source IDs. Unapplied pilot1 hit Immutable content conflict and was quarantined under .local/portuguese-integration/pilot-rejected-v1; baseline-only pack imports remained intact. Strict source schema also caught initial unrecognized concepts/qa fields; the adapter now validates/retains them. Initial tooling type errors were fixed before pilot acceptance. No source/answer correction or production operation was attempted.

Direct read-only persistent audit PASS:5snapshots,24latest lessons,192Questions,144lesson Concept links,264blocks and192activities. Stored Question content/keys/options and block payloads match the final source-bound pack; no orphan joins/duplicateQuestionversions. All700baselineQuestions and original IFSC/Mathematics/Science tracks/blocks/activities/Questions are hash-preserved; total892Questions. Original global PORlesson1 releases are retained. Attempts/events/evidence remain0. Preservationhash14762c483bda787f83921861aac94674b2f8886702bd9f593c34e735612b3e6a. Receipts and direct audit are tracked in packs/drafts/ifsc-2027-portuguese/qa/.

Portuguese QA: A–E choices unique, one declared key per Question, no duplicate correct-option text, source statements/stimuli/explanations and accents/curly quotes/punctuation preserved, no replacement-character/mojibake findings. Pilot pronoun-reference ambiguity (POR19), regency/crase (POR11), connectors (POR13), verbal modes (POR08), argumentation/irony/variation (POR17/16/23) retained. Additional targeted active/passive examplePOR12 retains the same event, changed focus and agent omission. This is a semantic spot-check and deterministic fidelity/evaluator QA, not independent factual approval of192Questions. Search normalization probe confirms diacritic-insensitive equivalence without altering displayed text or implementing a new application search feature. Existing Paragraphs/QuestionPanel render literal text, escaping HTML/Markdown-like syntax;8pilotmobilelessons at344px pass layout/native radio Space+ArrowDown. Actual screenshots ofPOR11 andPOR19 were inspected for wrapping/diacritics. Scope is private static coreSSR/appCSS, without hydrated-route publication claims.

Editorial quarantine: confirmed POR-01-C03 finalidade, C05 interlocutor and C06 modalidade labels do not match their target descriptions. See qa/editorial-quarantine.json in the draft collection. Similar labels cannot certify target equivalence;144distinct source-defined targets stay intentional_new, preserving canonical POR definitions. Human name/target reconciliation, generic distractor/Q07 feedback review, rights/official syllabus mapping/prerequisites remain pending. Missing media remains visible:15deterministic requests,2optional Antigravity requests and2authentic LINK_ONLY references; none fetched/generated. Textual comprehension is complete without these assets. Draft inventory is not planner-ready curriculum. Any editorial correction requires a new immutable version.

Exact commands run (PowerShell, repository root):

```powershell
pnpm exec tsx tools/science-import/cli.ts preflight --subject portuguese --stage pilot
pnpm exec tsx tools/science-import/cli.ts import --subject portuguese --stage pilot
pnpm exec tsc --noEmit --project tools/science-import/tsconfig.json
pnpm exec vitest run tests/science-import-tooling.test.ts
pnpm exec vitest run tests/portuguese-import.test.tsx tests/science-import-tooling.test.ts
pnpm exec eslint tools/science-import/mapper.ts tools/science-import/portuguese.ts tools/science-import/cli.ts tools/science-import/qa/preservation-audit.ts tools/science-import/qa/portuguese-audit.ts tools/science-import/qa/render-mobile-preview.tsx tests/portuguese-import.test.tsx tests/e2e/science-qa-mobile.spec.ts
$env:DATABASE_URL='memory://local'
$env:SCIENCE_QA_PACK='.local/portuguese-integration/pilot/portuguese.pack.json'
$env:EDITORIAL_QA_PILOT='POR-01,POR-08,POR-11,POR-13,POR-16,POR-17,POR-19,POR-23'
$env:EDITORIAL_QA_OUTPUT='.local/portuguese-integration/qa-mobile'
pnpm exec playwright test tests/e2e/science-qa-mobile.spec.ts --project=mobile-chrome
# Independent shell invocations do not retain the pilot env overrides.
foreach ($portugueseStage in @('batch1','batch2','batch3','batch4')) {
  pnpm exec tsx tools/science-import/cli.ts import --subject portuguese --stage $portugueseStage
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  pnpm exec tsx tools/science-import/cli.ts validate --subject portuguese --stage $portugueseStage
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
pnpm exec tsx tools/science-import/qa/portuguese-db-audit.ts
pnpm lint
pnpm typecheck
pnpm test
pnpm build
$env:DATABASE_URL='memory://local'
pnpm test:e2e
git diff --check -- tools/science-import tests/e2e/science-qa-mobile.spec.ts tests/portuguese-import.test.tsx .estudisc-agent-context
```

Checks: focused7PASS, Science regression4PASS, full240PASS/3SKIPPED (79passedfiles/3skipped), strict toolingtsc/scopedlint/full lint/typecheck/buildPASS, mobilepilot8PASS, directDBauditPASS. Full serial E2E:22PASS/14FAIL, exit1. Compared exact failure names against the actual .local/direct-publication-e2e.log baseline (21PASS/15FAIL):all14are previously failing names,zero new names; one previous vertical-slice failure now passes. Comparison: packs/drafts/ifsc-2027-portuguese/qa/e2e-baseline-comparison.json. Failures remain auth/import/motion/percentage/mobileprogress surfaces. This local draft integration is complete, but the full application release gate remains FAIL. Logs:.local/portuguese-{focused,tooling-tsc,tooling-lint,pilot-import,pilot-mobile,final-lint,final-typecheck,final-test,final-build,final-e2e}.log. Hash-bound code/dependency evidence:.estudisc-agent-context/portuguese/VALIDATION.json. Core migration/dependency changes: none. No new learner state, publication, push, deployment or production migration.

NEXT ACTION: human editorial resolution of quarantined name/target pairings and source/distractor/mapping review before any explicitly authorized publication; application E2E repair is a separate existing task. Reuse hash-bound artifacts, not new research/authoring or duplicate imports.

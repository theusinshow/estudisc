# History/Geography v2 and 2MiB Track Pack limit — final QA

Local technical status: complete,single49lesson/392Question/293Conceptdraftcollection. Live application: not yet imported;the actual site preview returns413/maxBytes1048576. Portuguese remains imported24/192drafts,publication409atcontent_publication_events INSERT. Pending explicit narrow2MiBdeployment and only0018productionauditmigration/connection authorization;import/publication instructions for both packs persist. No production deployment/migration/real-secret read was performed.

GHZIPsource229d63e537a83d5305d8c0954ef3f93f9199d328211aad9507e5572084b086bf,753files pinned byte-identically. Final singlepack1192969diskbytes,SHA2568867dae0f40a5a88aabc690b4ced0c4ebbd1312f9ef33a33fed404b705d41771,canonicalhash9443099ce452556ee2053ce479bbf12faf266b46336eab3cbc298a3aa20604a7. Source/editorial/runtime versions2;tracksnapshot7. Original GH-06has5Concepts,allothers6;293explicitnewtargets,UNKNOWN0,nofabricated294thConcept,no title-only merge/canonicalmasterychange. Source block order/teachingstrings,392stems/A–Eoptions/keys/explanations retained. Reasoning arrays andanswer-guide strings are normalized only structurally and retained in complete original sidecar;component requests use existing notes with original source hashes.8pilots from upstreammanifest;no historical educational logs/all49lessontext was loaded into model context. No researcher/author/reviewer/newagents.

Actual owned persistent imports pilot+batch1..6 create snapshots1..7;counts8/64,14/112,21/168,27/216,34/272,42/336,49/392 (lessons/Questions). Each actualimport is reimported foralready_imported thenvalidated. Initialsinglefullcandidate failed previous1MiBlimit(1192968bytes);unappliedtwo-partfallbackpreviews were superseded whenuserauthorized2MiB. No splitcollections were imported. GenericJSONreaderdefault remains1MiB;onlyPOSTtrackpreview/applypass2MiBexplicitly. Requests at exact2MiB withaccentedUTF8pass;onebyteabove,falselysmallContent-Lengthanddeclaredoversize remain rejected. Actual completeGHpackabove1MiB is previewed/applied/idempotent through real core routes in memory tests,not mocked schema/importsuccess. See ADR0037.

Direct read-only persistent auditPASS:49latestdraftlessons/392Questionversions2/293Conceptlinks/670blocks/392activities;allstoredQuestioncontentandblockpayloadmatchsource-boundpack.0orphanjoins/duplicateQuestionversions,892baselineQuestions unchanged(includingIFSC/Math/Science/Portuguese),1284total,0attempts/events/evidence. Baselinehash76312e3388132ec6edcab47aca3f861ccbe615a5905ee2eae87c9f40c41064f8. OriginalGHlesson1releases preserved;no productionstate query implied. Metadata/rightsmapping/prerequisites/pacingremainuncertified;30minlessondefault.29deterministic/6image requests and42authenticmediareviewitems pending;coretextdoesnotdependongeneratedimages.

Focused16testsPASS,full246PASS/3SKIPPED(81passedfiles/3skipped),lint/typecheck/buildPASS,stricttoolingtscPASS,mobile8pilotsat344pxPASS(nativeSpace/ArrowDownradios,zerooverflow,existingcoreSSR/CSSscope). FullserialE2E22PASS/14FAIL;exact14namesmatchactualPortuguese22/14baseline,0newnames. Fullapplicationreleasegate remainsFAIL. qa/e2e-baseline-comparison.json retains names;hash-boundvalidation:.estudisc-agent-context/history-geography/VALIDATION.json.

Exact primary commands (PowerShell,root):

```powershell
pnpm exec tsx tools/science-import/cli.ts preflight --subject history-geography --stage pilot
pnpm exec tsx tools/science-import/cli.ts preflight --subject history-geography --stage batch6
pnpm exec tsx tools/science-import/cli.ts import --subject history-geography --stage pilot
pnpm exec vitest run tests/unit/import-request.test.ts tests/unit/track-import-size-route.test.ts tests/history-geography-import.test.tsx tests/portuguese-import.test.tsx tests/science-import-tooling.test.ts
pnpm exec tsc --noEmit --project tools/science-import/tsconfig.json
$env:DATABASE_URL='memory://local'
$env:SCIENCE_QA_PACK='.local/history-geography-integration/pilot/history-geography.pack.json'
$env:EDITORIAL_QA_PILOT='GH-02,GH-08,GH-15,GH-21,GH-24,GH-30,GH-44,GH-49'
$env:EDITORIAL_QA_OUTPUT='.local/history-geography-integration/qa-mobile'
pnpm exec playwright test tests/e2e/science-qa-mobile.spec.ts --project=mobile-chrome
foreach ($ghStage in @('batch1','batch2','batch3','batch4','batch5','batch6')) {
  pnpm exec tsx tools/science-import/cli.ts import --subject history-geography --stage $ghStage
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  pnpm exec tsx tools/science-import/cli.ts validate --subject history-geography --stage $ghStage
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
pnpm exec tsx tools/science-import/qa/history-geography-db-audit.ts
pnpm exec tsx .local/history-geography-integration/application/publication-preflight.ts
pnpm exec eslint tools/science-import/history-geography.ts tools/science-import/qa/history-geography-db-audit.ts .local/portuguese-integration/application/publication-preflight.ts
pnpm lint
pnpm typecheck
pnpm test
pnpm build
# New independent shell;pilot overrides are not inherited.
$env:DATABASE_URL='memory://local'
pnpm test:e2e
```

ExactGHpublicationfixturePASS (disposablePGliteonly):actual49versions/392Questionspublish40+9batches,441realfixtureauditrows,0fabricatedreviews,retry0newrecords,892fixturebaselineQuestionspreserved. Missingaudit-tablefixture reproducesfailedinsertandtotalrollback;exact0018DDL repairs it. OriginalSQLhash050694dadb9c2a36e7228d86f122fecd48d8fac665629d08c90094d5a9bc8555. Actualhumaninstructionreview/publish is recorded at application/human-authorization.json andtwoexactpublication-request files;no actor spoofing in liveAPI.

Narrow deploy candidate:.local/gh-limit-deployment-candidate,basecommit48bebdbab860f826c57c1a081d23d61416784318,only3changedruntimefiles(importrequest+trackpreview/apply),requestboundarytests/ADR0037. No unrelateddirtyfiles/real.envcopied;dependenciesmatchHEAD/root. Explicitfilemanifest:.local/gh-limit-deployment-manifest.json. Candidatevalidation4requesttestsPASS/scopedlintPASS/webpackbuildPASS/typecheckPASS. Initialpnpmexecabortedauto-modulespurge(noTTY)beforedependencyremoval;usedmatchinginstalleddependencies via junction/directNodebins instead. InitialTurbopackbuild rejected junction outsidecandidatefsroot;Webpackbuild succeeded. No sharednode_modulespurge or dependency/schemachange. Candidatecommands: 

```powershell
# cwd: .local/gh-limit-deployment-candidate
node node_modules/vitest/vitest.mjs run tests/unit/import-request.test.ts
node node_modules/eslint/bin/eslint.js src/features/import/application/import-request.ts src/app/api/import/track/route.ts src/app/api/import/track/preview/route.ts tests/unit/import-request.test.ts
node scripts/generate-design-tokens.mjs
node node_modules/next/dist/bin/next build --webpack
node node_modules/typescript/bin/tsc --noEmit
```

Actualsitepreviewproof:.local/history-geography-integration/application/site-preview.json. Orcabrowserpagec5b26ad1-c8dd-4cef-9f91-a17f7547fd9a stayed at/import;uploadedexactsealedGHbytesusingfileinput,verifiedSHA256,onlyreadonlypreviewPOSTperformed(noGHapply). Fullsnapshotoverlargeloadedtextarea hit runtime_unavailable;boundedCSSupload/eval recovered without restart or desktop/secretaccess. MaestriCLIabsent;OrcaCLIwasused.

NEXT ACTION: afterexplicitpermission deploytheisolated2MiBpatchandapplyonly0018productionmigrationonconfirmedconfiguredtarget,thenpreview/importtheexactGHsnapshotandpublish40+9versions. Retryalready-importedPortuguese24publication. Verify49+24studentlessons/392+192Questionsandpriorcontent/state;noanswersubmissions. Do not claimliveactivationfromlocalchecks. No additionalroutineimplementationwork remains.

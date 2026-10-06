# Integrator handoff

Architecture discovered once; all requested contracts/maps persisted. Implemented tools/science-import/contracts.ts, mapper.ts, cli.ts, tsconfig.json and tests/science-import-tooling.test.ts. Temporary discovery scripts removed. No core app/schema/renderer/DB migration/source prose/publication changes. Source9existing+231intentionallynew Concepts; all240 mapped. Source40stale manifest hashes retained/disclosed.

Final sealed candidates (build only):
- pilot version1:8lessons/64Questions/48Concepts,200671diskbytes,9cdd67a7491c12704ff073ad6fb8d2e87e0add87e1f38ec88bb42c1a706290a7
- batch5 version6:40/320/240,960192diskbytes,be4d3b7b921cd213449c7ca57082cf28a2f4b4bbb62c1d4c95bbe61fb563bf68
- media version7:40/320/240,13draft figures+24pendingmedia,1046593diskbytes,fb7c2b36e87fc89fd1fa03ad1762e8db06917fe7b6564c6049653a121b0feb95

After pilot QA PASS Worker runs `pnpm exec tsx tools/science-import/cli.ts import --stage pilot` then `pnpm exec tsx tools/science-import/cli.ts validate --stage pilot`. Import/validate batch1..batch5 sequentially after corresponding QA; finally import/validate `--stage media --media .local/science-integration/media/assets.json`. Each uses same `.local/science-integration/db` PGlite persisted storage and existing production core importer; imports unchanged fullIFSC/Math baseline first, exact Science snapshot second, verifies unchanged attempts/events/evidence and no-change reimport. Same-version changed content blocked. Real local DB receipts still worker responsibility, never replace with candidate reports. No prod/env/secret access.

Commands actually PASS:
- `pnpm exec tsx tools/science-import/cli.ts preflight --stage pilot`
- `pnpm exec tsx tools/science-import/cli.ts preflight --stage batch5`
- `pnpm exec tsx tools/science-import/cli.ts preflight --stage media --media .local/science-integration/media/assets.json`
- `pnpm exec vitest run tests/science-import-tooling.test.ts` (2passed)
- `pnpm exec tsc --noEmit -p tools/science-import/tsconfig.json`
- `pnpm exec eslint tools/science-import/contracts.ts tools/science-import/mapper.ts tools/science-import/cli.ts tests/science-import-tooling.test.ts`

Repaired preflight findings: incompatible custom source shape normalized through existing Packv2; renderer payload requiredtype explicitly included; canonical perblockhash handles Zod keyorder; actualcompactfilebytes checked; fullpackage exceeded1MiB when duplicate provenance/source/metadata prose present, compact pointers/sidecar resolved without raising cap. Text projection162blocks/282verbatim repeated occurrences described CONTENT-SCHEMA. Initial tooltsconfig missing Node types repaired. User batch4includes32, cumulative15/22/28/35/40.

Persistent retry repair: optional source metadata initially carried explicit undefined fields. Existing canonical JSON helper hashes undefined keys, while JSON file omits them. Mapper now omits undefined optional values so built/file/rebuilt/core hashes agree exactly; regression asserts serialized roundtriphash. Candidate bytes unchanged, accurate finalhashes above. QA preservation-audit helper is hooked after baseline imports and after actual Science/idempotence; perstage preservation-audit.json. Baseline uses unchanged packs/releases/ifsc-week-1.pack.json (all16existing Science Concepts) rather than golden seed (only7atom targets; same track/version cannot both import), plus unchanged availableMathpack. Validate verifies sealed baseline preservation hash too. Strict tooltsc/scopedlint passed after hook; repeatpreflight passed.

Risks: currentmedia7headroom1883bytes only;13AIimages and11deterministicrequests pending, draft figures lack human factual review; officialmapping/prerequisites/pacing uncertified; upstream conceptname/masteryTarget mismatches retained for editorialreview. Full acceptance/E2E/root docs still root responsibility. NEXT: QA finalsealedpilot, Worker actualpersistentpilotimport.

Exception repair 2026-10-05: Worker baseline+all5batches actualpersistentPASS40/320/240, v6. Media7failed Immutable content conflict because source lessonversion2was reused for changed figureblocks. Confirmed actualDBpack_imports version7count0, clientclosed; unimportedmedia7candidate regenerated, no priorv2overwrites. Mapper now ONLY13figure-bearing lessons runtimeversion3, unchanged27lessonversion2 and all320Questionversion2preserved, originaleditorialsource2stays metadata+sidecar. New currentmedia7hash722f1deeb98c55cb121f988931596830a68c5bd4ab15fcf7754f49ebe574bc27/1046767diskbytes/1809headroom. Regression asserts exactunchanged27lessons/320Questions, changedonlyblocks+13versions,1MiBcap. `pnpm exec vitest run tests/science-import-tooling.test.ts`3PASS; strict tooltsc/scopedlintPASS. RootQA accepts mixedversions; Workerretrymediaimport+validate, no broadsuite repeated.

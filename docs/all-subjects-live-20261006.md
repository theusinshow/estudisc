# All subject collections live — 2026-10-06

The owner reviewed the material and explicitly authorized production activation. The catalog at https://vecta-three.vercel.app/tracks now provides 132 current lessons and 1,144 subject Questions:

| Collection | Lessons | Questions |
| --- | ---: | ---: |
| Mathematics | 19 | 240 |
| Science | 40 | 320 |
| History/Geography | 49 | 392 |
| Portuguese | 24 | 192 |

Actual authenticated ADMIN imports/publications completed. All 132 study URLs returned HTTP 200 with the expected title and no invalid renderer. A read-only production audit verified published versions, original Question and block hashes, and preservation of prior content and learning records. No learner answers were submitted and no new independent editorial reviews were fabricated.

Track Pack preview/apply now accept 2 MiB; unrelated JSON limits remain 1 MiB. Only additive audit migration 0018 and its matching migration receipt were applied. The narrow code patch was deployed and pushed as `bd3fa56`, preserving remote GH integration `4fa1ed0`; the limit decision is ADR 0038 on origin/main. The old root branch and unrelated dirty work remain untouched; align them carefully before future source work.

The active GH collection is `ifsc-2027-history-geography`. Do not import the alternate draft as a duplicate collection. Exact canonical hashes: GH `9443099ce452556ee2053ce479bbf12faf266b46336eab3cbc298a3aa20604a7`; Science `722f1deeb98c55cb121f988931596830a68c5bd4ab15fcf7754f49ebe574bc27`; Portuguese `4c5c598e32df714456a7dc0cd3761ad0dec09b50a645702f81575338beb120f3`.

Validation: 246 tests passed/3 skipped; lint, typecheck, build and eight pilot mobile checks passed. Full serial E2E remains 22 passed/14 preexisting failures, with no new failure names. Source/media/curriculum disclosures remain applicable; this does not certify an official curriculum mapping or a complete application E2E gate.

Commands run include `vercel deploy --prod --yes --cwd C:/Dev/pessoal/vecta/.local/gh-limit-deployment-candidate`, `node .local/all-subjects-application/production-repair.cjs`, `python .local/all-subjects-application/browser-action.py start ...`, `pnpm exec tsx .local/all-subjects-application/verify-production.ts`, and `git push origin HEAD:main` in the isolated sync clone. Private operator receipts are under `.local/all-subjects-application/`; they are excluded from public documentation.

NEXT ACTION: none for this delivery. Separate optional work covers the existing E2E failures, pending source/media review, and safe local branch alignment. Do not repeat imports, publication or research.

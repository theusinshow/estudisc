# Long lesson title wrapping — actual release

The original CIE-21 H1 word exceeded the viewport: both historical v2 and new v3 produced a 378 px document at a 375 px viewport. Text-range inspection isolated the heading; original lesson content/data was unaffected. Scope `overflow-wrap: anywhere` to the existing lesson heading, keeping its text, font, tokens and semantic ID.

[Protected PR #20](https://github.com/theusinshow/estudisc/pull/20) passed lint, typecheck, unit, build, integration, content-qa, pack-validation and critical-e2e on exact head `d1d6055d2ac73db0931c904ec15217f123063e97`. It merged at 22:07:05Z on 2026-10-10 as `88d8f1ff53d1417239adfb9a688e687590003971`.

Actual Git-backed production deployment `dpl_3SneFiforJZaoWRKfUoWqw34qjbF` is READY with that commit and alias https://vecta-three.vercel.app. A fresh navigation verifies the stylesheet rule and no inline diagnostic style. Current CIE-21 title remains complete; measured document widths are 320/360/1425 at 320/375/1440 px viewports, matching the project's viewport-bound criterion. A private mobile visual inspection passed; Windows desktop scrollbars remain native browser UI.

Local acceptance before release: full `pnpm lint`, `pnpm typecheck`, `pnpm test` (464 PASS/three optional real-PostgreSQL SKIP), `pnpm packs:verify`, `pnpm build` and serial `pnpm test:e2e` (58 PASS/38 flag-gated SKIP). The source-defined environment batch's previously failed mobile-bound check now passes on the actual production reader; its lesson/Question/history fingerprints remain unchanged. The initial temporary browser diagnostic was used only to isolate the cause and was discarded by fresh navigation.

No local/private build artifacts were uploaded: the existing broad filesystem-tracing build warnings make the Git-backed deployment boundary important. Existing deprecated environment alias warnings remain. Generated tokens and next-env development churn were restored only after the owned checks; no canonical token change or code/data/auth migration occurred.

Relevant release commands:

```text
git push -u origin content/source-batches-title-wrap-20261010
gh pr create --base main --head content/source-batches-title-wrap-20261010 --title 'Fix long lesson titles on mobile and record content evolution' --body-file .local/database-migration/private/title-wrap-release-20261010/pr-body.md
gh pr checks 20 --json name,state,link
gh pr merge 20 --merge --match-head-commit d1d6055d2ac73db0931c904ec15217f123063e97
git fetch origin main
git merge --ff-only origin/main
vercel api /v13/deployments/dpl_3SneFiforJZaoWRKfUoWqw34qjbF?teamId=team_ffNsgkKpYXQdXR7eDiCM3G15 --method GET
git diff --check
```

Private deployment responses and diagnostic/layout records stay ignored. Continue content enrichment using the existing released runtime, retaining the separate full-topic/official-mapping and scored-question caveats.

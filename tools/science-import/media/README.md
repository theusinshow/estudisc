# Science V2 deterministic media delivery

Draft only. No scientific/editorial source rewrite, research, generative imagery, service calls, publication or factual approval.

`.local/science-integration/media/assets.json`contains 13 safe local SVG static fallbacks for CIE-06/07/09/10/17/18/22/25/27/30/33/34/40. `asset-status.json` covers every deterministic request, retaining limitations of static delivery and explicit pending reasons for the 11 requests without assets: CIE-08/11/13/15/16/29/31/32/37/38/39.

One source-driven SVG machinery implements mobile text cards, comparisons and flows. The only drawing exceptions are the requested open/closed circuit, the exact supplied Aa × Aa Punnett table, and the two mass-dependent stellar branches. Worked energy and atomic-count examples use only the supplied numbers. Model/classification comparisons do not introduce anatomical, molecular or exact phylogenetic geometry. The current figure renderer displays an image; live calculator/atom/crossing controls are not claimed.

All visible scientific text has a complete text equivalent in the manifest. Source/request metadata and exact source-file hashes are retained in `asset-status.json`. Original queues remain untouched. The exact manual Antigravity handoff remains in `.vecta-agent-context/WORKER-MEDIA-PREFLIGHT.md`; no Antigravity capability/model/generation is verified.

Canonical commands (run from repository root):

```text
python tools/science-import/media/build_assets.py
node tools/science-import/media/verify_assets.mjs
pnpm exec eslint tools/science-import/media/verify_assets.mjs
pnpm exec tsx -e "import { readFileSync } from 'node:fs'; import { mediaAssetsSchema } from './tools/science-import/contracts.ts'; const value = mediaAssetsSchema.parse(JSON.parse(readFileSync('.local/science-integration/media/assets.json', 'utf8'))); console.log('Media contract passed:', value.assets.length, 'draft assets');"
```

Passed: manifest contract, complete 24-request coverage, exact example arithmetic and Punnett combinations, XML parsing, 200000-byte ceiling, allowed SVG elements/attributes, raw-file hashes, viewBox/dimensions and complete text equivalents. Chromium verified all 13 images load at 320/360/1280px without horizontal overflow and all rendered text fits its SVG. Evidence: `validation.json` and `browser-validation.json`. Three preview PNGs are diagnostic artifacts, excluded from `assets.json`.

Initial source queue and Antigravity-prompt hashes were rechecked against the preflight and remain unchanged. Basic preview inspection found legible circuits/table/branch comparison; no scientific approval was recorded. Human visual and factual reviews remain PENDING for all assets. Missing authoritative geometry/data, detailed phase timelines, live interactions and licensed anatomy are not filled with invented content.

Both scripts resolve the repository root from their own paths, independent of the current working directory. Generated assets, manifests, validation reports and preview PNGs remain exclusively under `.local/science-integration/media/`. The local source package must already exist; these tools do not retrieve or regenerate editorial content.

Persistence validation passed: all 13 raw SVG SHA-256 hashes matched the pre-relocation baseline after rerunning the canonical builder. Output contract and paths are unchanged. Targeted ESLint for the persisted verifier passed. Evidence: `.local/science-integration/media/relocation-baseline.json` and `relocation-validation.json`.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { hashCanonicalJson } from "@/lib/canonical-json";

/** Local import artifacts matched by the historical production audit, not a fresh production query. */
export const blueprintSources = [
  { path: "packs/drafts/ifsc-2027-mathematics/mathematics.pack.json", canonicalHash: "6bdf9a7ee01b053f4a1c1ead741f62e34aab2098acb53ce1b436e8d1e09c4fb0", lessons: 19 },
  { path: "packs/drafts/ifsc-2027-science/science.pack.json", canonicalHash: "5393a6926e90910b1d3d93ee002b4db697ac9bce1cdd8d3e6c3479f1daf8239f", lessons: 40 },
  { path: "packs/drafts/ifsc-2027-history-geography/history-geography.pack.json", canonicalHash: "d04ca07d0707fba96731e6913acac8ff86483748b783b5f3ab3b36c6d79f5b28", lessons: 49 },
  { path: "packs/drafts/ifsc-2027-portuguese/portuguese.pack.json", canonicalHash: "941938d8f08dc148b4db0ed4f5031207a26edd8d7e511a4359187814665de391", lessons: 24 }
] as const;

export function loadBlueprintCorpus(root: string) {
  return blueprintSources.map(source => {
    const raw = readFileSync(join(root, source.path));
    const pack = trackPackV2Schema.parse(JSON.parse(raw.toString("utf8")));
    if (hashCanonicalJson(pack) !== source.canonicalHash || pack.track.modules.reduce((n, module) => n + module.lessons.length, 0) !== source.lessons) throw new Error(`Blueprint corpus differs from audited import: ${source.path}`);
    return { path: source.path, rawHash: createHash("sha256").update(raw).digest("hex"), canonicalHash: source.canonicalHash, pack };
  });
}

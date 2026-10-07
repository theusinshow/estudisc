import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { hashCanonicalJson } from "@/lib/canonical-json";

/** Local import artifacts matched by the historical production audit, not a fresh production query. */
export const blueprintSources = [
  { path: "packs/drafts/ifsc-2027-mathematics/mathematics.pack.json", canonicalHash: "bcf7c8ffa90dea94bcfaa4b52494fe291de6d22a8a6133fa33bcf06eb18af056", lessons: 19 },
  { path: "packs/drafts/ifsc-2027-science/science.pack.json", canonicalHash: "722f1deeb98c55cb121f988931596830a68c5bd4ab15fcf7754f49ebe574bc27", lessons: 40 },
  { path: "packs/drafts/ifsc-2027-history-geography/history-geography.pack.json", canonicalHash: "9443099ce452556ee2053ce479bbf12faf266b46336eab3cbc298a3aa20604a7", lessons: 49 },
  { path: "packs/drafts/ifsc-2027-portuguese/portuguese.pack.json", canonicalHash: "4c5c598e32df714456a7dc0cd3761ad0dec09b50a645702f81575338beb120f3", lessons: 24 }
] as const;

export function loadBlueprintCorpus(root: string) {
  return blueprintSources.map(source => {
    const raw = readFileSync(join(root, source.path));
    const pack = trackPackV2Schema.parse(JSON.parse(raw.toString("utf8")));
    if (hashCanonicalJson(pack) !== source.canonicalHash || pack.track.modules.reduce((n, module) => n + module.lessons.length, 0) !== source.lessons) throw new Error(`Blueprint corpus differs from audited import: ${source.path}`);
    return { path: source.path, rawHash: createHash("sha256").update(raw).digest("hex"), canonicalHash: source.canonicalHash, pack };
  });
}

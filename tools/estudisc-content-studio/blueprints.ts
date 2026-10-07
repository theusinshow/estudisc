import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { Studio, atomicJson } from "./workspace";
import { loadCatalog } from "./catalog";
import { teachingAssetInventory } from "./assets";
import { loadBlueprintCorpus } from "./blueprint-sources";
import { lessonBlueprintSchema, type LessonBlueprint } from "./blueprint-contracts";
import { createLessonBlueprint, blueprintReport } from "./blueprint-policy";

const policyFiles = ["tools/estudisc-content-studio/blueprints.ts", "tools/estudisc-content-studio/blueprint-sources.ts", "tools/estudisc-content-studio/blueprint-contracts.ts", "tools/estudisc-content-studio/blueprint-policy.ts", "tools/estudisc-content-studio/catalog.ts", "tools/estudisc-content-studio/adapter.ts", "src/features/import/application/track-pack-v2-schema.ts", "src/lib/canonical-json.ts", "tools/estudisc-content-studio/BLUEPRINT-POLICY.md"];
export function runBlueprintPipeline(studio: Studio, now = new Date().toISOString()) {
  const workspace = relative(studio.root, studio.workspace).replaceAll("\\", "/");
  if (!workspace.startsWith(".local/") && workspace !== "tools/estudisc-content-studio/workspace" && !workspace.startsWith("tools/estudisc-content-studio/workspace/")) throw new Error("Blueprints require an ignored authoring workspace");
  const corpus = loadBlueprintCorpus(studio.root), catalog = loadCatalog(studio.root), assets = teachingAssetInventory(studio);
  if (assets.issues.length) throw new Error("Blueprint asset inventory has unresolved invalid media inputs");
  const sources = corpus.map(({ path, rawHash, canonicalHash }) => ({ path, rawHash, canonicalHash }));
  const hashes = { corpusHash: hashCanonicalJson(sources), dependencyHash: hashCanonicalJson({ catalogHash: catalog.sha256, requirements: catalog.requirements, prerequisites: catalog.prerequisites }),
    policyHash: hashCanonicalJson(Object.fromEntries(policyFiles.map(file => [file, createHash("sha256").update(readFileSync(join(studio.root, file))).digest("hex")]))), assetHash: hashCanonicalJson(assets) };
  const directory = studio.dir("lesson-blueprints");
  if (existsSync(join(directory, "state.json"))) throw new Error("Blueprint sidecar directory conflicts with a Studio job");
  const blueprints: LessonBlueprint[] = [], manifest: { identity: LessonBlueprint["identity"]; path: string; inputHash: string; blueprintHash: string }[] = [];
  const identities = new Set<string>(); let generated = 0, skipped = 0;
  for (const { pack } of corpus) for (const moduleDefinition of pack.track.modules) for (const lesson of moduleDefinition.lessons) {
    let blueprint = createLessonBlueprint(pack, moduleDefinition.subjectCode, lesson, hashes, assets.entries, now);
    const key = hashCanonicalJson(blueprint.identity);
    if (identities.has(key)) throw new Error("Duplicate corpus lesson version");
    identities.add(key);
    const filename = `${key}.${blueprint.inputHash}.json`, file = join(directory, filename);
    let cached: LessonBlueprint | undefined;
    if (existsSync(file)) {
      try { cached = lessonBlueprintSchema.parse(JSON.parse(readFileSync(file, "utf8"))); } catch { /* Corrupt/untrusted sidecars are regenerated. */ }
    }
    if (cached && hashCanonicalJson(cached) === hashCanonicalJson({ ...blueprint, generatedAt: cached.generatedAt })) { blueprint = cached; skipped++; }
    else { atomicJson(file, blueprint); generated++; }
    blueprints.push(blueprint);
    manifest.push({ identity: blueprint.identity, path: filename, inputHash: blueprint.inputHash, blueprintHash: hashCanonicalJson(blueprint) });
  }
  if (blueprints.length !== 132) throw new Error("Expected exactly 132 audited lesson versions");
  const report = blueprintReport(blueprints);
  const index = { schemaVersion: 1, ...hashes, sources, items: manifest, reportHash: hashCanonicalJson(report) };
  for (const [name, value] of [["index.json", index], ["report.json", report]] as const) {
    const file = join(directory, name);
    if (!existsSync(file) || readFileSync(file, "utf8") !== JSON.stringify(value, null, 2) + "\n") atomicJson(file, value);
  }
  return { generated, skipped, directory, report, index };
}

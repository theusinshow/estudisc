import { parseArgs } from "node:util";
import { resolve, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { z } from "zod";
import * as contracts from "./contracts";
import { Studio, atomicJson } from "./workspace";
import { readJson, validateJob } from "./validation";
import { runDemo } from "./demo";
import { teachingAssetInventory, searchTeachingAssets } from "./assets";
import { runBlueprintPipeline } from "./blueprints";
import { lessonBlueprintSchema } from "./blueprint-contracts";
import { prepareEnrichmentPreview } from "./enrichment";
import { enrichmentRecipeSchema } from "./enrichment-contracts";
import { exportLessonVersion } from "./lesson-version-export";

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  workspace: { type: "string" }, request: { type: "string" }, owner: { type: "string" }, model: { type: "string" },
  by: { type: "string" }, note: { type: "string" }, reason: { type: "string" }, "abandon-owner": { type: "string" },
  "simulate-approval": { type: "boolean", default: false }, verbose: { type: "boolean", default: false }
  , query: { type: "string" }, subject: { type: "string" }, concept: { type: "string" }, type: { type: "string" }, "reuse-only": { type: "boolean", default: false }
} });
const [command, jobId, stage] = positionals;
function required(value: string | undefined, name: string) { if (!value) throw new Error(`Required ${name}`); return value; }
function printState(state: contracts.JobState) {
  console.log(JSON.stringify(values.verbose ? state : {
    jobId: state.jobId, status: state.status, revisionCount: state.revisionCount, gateReason: state.gateReason,
    active: state.active, approval: state.approval ? { by: state.approval.by, at: state.approval.at, simulated: state.approval.simulated } : undefined,
    runs: state.runs.map(r => ({ role: r.role, owner: r.owner, status: r.status, startedAt: r.startedAt, completedAt: r.completedAt, model: r.model, promptVersion: r.promptVersion })),
    resets: state.resets
  }, null, 2));
}
try {
  const root = process.cwd();
  if (!existsSync(join(root, "AGENTS.md")) || !existsSync(join(root, "tools/estudisc-content-studio/contracts.ts"))) throw new Error("Run from Estudisc repository root");
  const studio = new Studio(root, values.workspace);
  switch (command) {
    case "enrichment-export": {
      const result = exportLessonVersion(studio, readJson(resolve(root, required(values.request, "--request RECIPE"))));
      console.log(`TARGETED LESSON PACK: ${result.packet.lesson.id} v${result.packet.lesson.version}; Question references=${result.packet.questionReferences.length}; written=${result.written}; hash=${result.contentHash}.`);
      console.log(`File: ${result.file}; import into existing collection, then activate with the existing authenticated Admin Direct request. No actual publication performed by this command.`);
      break;
    }
    case "enrichment-preview": {
      const result = prepareEnrichmentPreview(studio, readJson(resolve(root, required(values.request, "--request RECIPE"))));
      console.log(`ENRICHMENT PREVIEW: ${result.preview.lesson.id} v${result.preview.lesson.version}; added blocks=${result.preview.newBlocks.length}; retained Questions=${result.preview.questionReferences.length}; written=${result.written}; ${result.reviewRequest.gate}.`);
      console.log(`Local release candidate: ${result.directory}; standing Admin Direct authorization recorded; actual compatible import/deployment/publication remains to execute.`);
      break;
    }
    case "blueprints": {
      const result = runBlueprintPipeline(studio);
      console.log(`BLUEPRINTS: ${result.report.lessons}; generated=${result.generated}; skipped=${result.skipped}; missing objectives=${result.report.missingObjectives}; deep review=${result.report.needsDeepReview}; reusable assets=${result.report.reusableAssetMatches}.`);
      console.log("Local UNREVIEWED proposals and metadata-only index/report saved in Studio lesson-blueprints/. No rewriting, import or publication.");
      break;
    }
    case "init": console.log("Job created.", JSON.stringify(studio.init(required(jobId, "JOB"), values.request ? readJson(resolve(root, values.request)) : undefined), null, 2)); break;
    case "list": console.log(studio.list().map(s => `${s.jobId}\t${s.status}\trevisions=${s.revisionCount}`).join("\n") || "No jobs."); break;
    case "assets": {
      const inventory = teachingAssetInventory(studio);
      console.log(`ASSETS: ${inventory.entries.length}; reusable=${inventory.entries.filter(entry => entry.reusable).length}; interactive=${inventory.entries.filter(entry => entry.interactiveReady).length}; invalid media=${inventory.issues.length}`);
      for (const entry of searchTeachingAssets(inventory.entries, { query: values.query, subject: values.subject, concept: values.concept, type: values.type, reuseOnly: values["reuse-only"] })) console.log(`${entry.jobId}/${entry.candidateId}\tv${entry.version}\t${entry.licenseStatus}\t${entry.contentHash.slice(0, 12)}\t${entry.reusable ? "REUSABLE" : entry.reasons.join(",")}\t${entry.title}`);
      break;
    }
    case "assets-index": {
      const inventory = teachingAssetInventory(studio);
      atomicJson(join(studio.workspace, ".teaching-assets-index.json"), inventory);
      console.log(`Metadata index saved inside Studio workspace; entries=${inventory.entries.length}; reusable=${inventory.entries.filter(entry => entry.reusable).length}; issues=${inventory.issues.length}. No bytes or publication.`);
      break;
    }
    case "status": printState(studio.state(required(jobId, "JOB"))); break;
    case "next": {
      const next = studio.next(required(jobId, "JOB"));
      console.log(`JOB: ${next.jobId}\nDIRECTORY: ${next.directory}\nSTATE: ${next.state}\nNEXT AGENT: ${next.agent}\nPROMPT: ${next.prompt}\nREAD:\n${next.read.join("\n")}\nWRITE:\n${next.write.join("\n")}\nCOMMAND: ${next.command}\nGATE: ${next.gateReason ?? "none"}\nINPUT HASHES:\n${JSON.stringify(next.inputHashes, null, 2)}`); break;
    }
    case "validate": {
      const id = required(jobId, "JOB"); const state = studio.state(id);
      const result = validateJob(studio.dir(id), ["RESEARCH_READY", "RESEARCH_IN_PROGRESS", "RESEARCH_DONE"].includes(state.status) ? "research" : "author");
      console.log(JSON.stringify({ ok: result.ok, issues: result.issues }, null, 2)); if (!result.ok) process.exitCode = 1; break;
    }
    case "claim": printState(studio.claim(required(jobId, "JOB"), contracts.roleSchema.parse(stage), required(values.owner, "--owner"), values.model)); break;
    case "complete": printState(studio.complete(required(jobId, "JOB"), contracts.roleSchema.parse(stage), required(values.owner, "--owner"))); break;
    case "approve": printState(studio.approve(required(jobId, "JOB"), required(values.by, "--by"), required(values.note, "--note"), values["simulate-approval"])); break;
    case "promote": printState(studio.promote(required(jobId, "JOB"))); break;
    case "reset-stage": printState(studio.resetStage(required(jobId, "JOB"), z.enum(["research", "author", "review"]).parse(stage), required(values.reason, "--reason"), values["abandon-owner"])); break;
    case "recover-lock": studio.recoverLock(required(jobId, "JOB")); console.log("Dead process lock recovered."); break;
    case "demo": console.log("DEMO / NOT PRODUCTION CONTENT"); printState(runDemo(studio, values["simulate-approval"])); break;
    case "schemas": {
      const output = resolve(root, "tools/estudisc-content-studio/schemas"); mkdirSync(output, { recursive: true });
      for (const [name, schema] of Object.entries({ ...contracts, lessonBlueprintSchema, enrichmentRecipeSchema })) if (name.endsWith("Schema") && schema instanceof z.ZodType) atomicJson(join(output, `${name}.json`), z.toJSONSchema(schema, { io: "input" }));
      console.log(`JSON Schemas exported to ${output}; refinements still require CLI validation.`); break;
    }
    default: console.log("pnpm estudisc-content init|status|next|validate|claim|complete|reset-stage|approve|promote|recover-lock JOB [ROLE/STAGE]\npnpm estudisc-content list|schemas|demo|assets|assets-index|blueprints\npnpm estudisc-content enrichment-preview --request RECIPE\nAsset filters: --query TEXT --subject CODE --concept ID --type TYPE --reuse-only\nOptions: --workspace PATH --request PATH --owner SESSION --model MODEL --reason TEXT --abandon-owner SESSION --by HUMAN --note TEXT\nDEMO only: --simulate-approval"); if (command) process.exitCode = 1;
  }
} catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { jsonFile, verifySourceUnchanged } from "./adapted-pack-audit";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${canonical(nested)}`).join(",")}}`;
  return JSON.stringify(value);
}
const hash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
const stages = ["pilot", "batch1", "batch2", "batch3", "batch4", "batch5", "media"];
const expectedLessons = [8, 15, 22, 28, 35, 40, 40];
const pending: string[] = [];
const checked = [];
let baselineHash: string | undefined;
for (const [index, stage] of stages.entries()) {
  const directory = `.local/science-integration/${stage}`;
  const receiptFile = `${directory}/import-receipt.json`;
  const preservationFile = `${directory}/preservation-audit.json`;
  if (!existsSync(receiptFile) || !existsSync(preservationFile)) { pending.push(stage); continue; }
  const receipt = jsonFile(receiptFile);
  const preservation = jsonFile(preservationFile);
  const pack = jsonFile(`${directory}/science.pack.json`);
  const lessons = pack.track.modules.flatMap((module: { lessons: unknown[] }) => module.lessons);
  assert.equal(lessons.length, expectedLessons[index], `${stage}: lesson count`);
  assert.equal(pack.questions.length, lessons.length * 8, `${stage}: Question count`);
  assert.equal(receipt.contentHash, hash(pack), `${stage}: receipt must bind saved pack`);
  assert.equal(receipt.lessons, lessons.length);
  assert.equal(receipt.questions, pack.questions.length);
  assert.equal(receipt.concepts, lessons.length * 6);
  for (const field of ["draftsOnly", "importPerformed", "idempotenceVerified", "studentStateUnchanged"]) assert.equal(receipt[field], true, `${stage}: ${field}`);
  assert.equal(receipt.publicationPerformed, false);
  assert.deepEqual(receipt.baselinePaths, ["packs/releases/ifsc-week-1.pack.json", ".local/mathematics-production/application/mathematics.pack.json"]);
  assert.equal(preservation.unchanged, true);
  assert.equal(preservation.beforeHash, preservation.afterHash);
  assert.equal(preservation.beforeHash, hash(preservation.sections), `${stage}: normalized preservation section hash`);
  baselineHash ??= preservation.beforeHash;
  assert.equal(preservation.beforeHash, baselineHash, `${stage}: baseline changes across batches`);
  assert.equal(preservation.sections.sharedConcepts.count, 9);
  assert.equal(preservation.sharedConceptDefinitions.length, 9);
  checked.push({ stage, lessons: lessons.length, questions: pack.questions.length, contentHash: receipt.contentHash, preservationHash: preservation.beforeHash, embeddedMedia: receipt.embeddedMedia, pendingMedia: receipt.missingMediaFallbacks });
}
const report = { scope: "Independent saved-artifact and persistent import/preservation receipt consistency; no database connection opened.", sourceFilesUnchanged: verifySourceUnchanged(), baselineHash, checked, pending, complete: pending.length === 0 };
mkdirSync(".local/science-integration/qa", { recursive: true });
writeFileSync(".local/science-integration/qa/persistent-receipt-audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ checked: checked.length, pending, baselineHash, sourceFilesUnchanged: report.sourceFilesUnchanged, complete: report.complete }));
if (pending.length) process.exitCode = 1;

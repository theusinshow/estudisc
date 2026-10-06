import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Catalog, type LessonGenerationRequest, type QAReport, categories, catalogSchema, lessonGenerationRequestSchema, lessonSchema } from "./contracts";
import { Studio, atomicJson, researchFiles, authorFiles } from "./workspace";
import { readJson } from "./validation";

export function demoArtifacts(root: string): { catalog: Catalog; request: LessonGenerationRequest; files: Record<string, unknown> } {
  const dir = join(root, "tools/estudisc-content-studio/fixtures/CIE-06");
  const files = [...researchFiles.filter(f => f.endsWith(".json")), ...authorFiles];
  return {
    catalog: catalogSchema.parse(readJson(join(dir, "catalog.json"))),
    request: lessonGenerationRequestSchema.parse(readJson(join(dir, "request.json"))),
    files: Object.fromEntries(files.map(file => [file, readJson(join(dir, file))]))
  };
}
export function demoReport(studio: Studio, decision: QAReport["decision"]): QAReport {
  const state = studio.state("CIE-06");
  return { decision, summary: "DEMO simulated reviewer output; no independent human/content approval.", reviewerId: "demo-reviewer", inputHashes: state.active!.inputHashes, dimensions: [...categories],
    findings: decision === "NEEDS_REVISION" ? [{ id: "demo-finding", severity: "HIGH", category: "PEDAGOGICAL", target: "demo-example", message: "Identify this worked example as a synthetic contract specification.", evidence: "The generic title does not explicitly mention the synthetic specification.", requiredFix: "Use title: Exemplo DEMO — especificação sintética" }] : [] };
}
export function runDemo(studio: Studio, simulateApproval = false) {
  const fixture = demoArtifacts(studio.root);
  studio.init("CIE-06", fixture.request, fixture.catalog);
  studio.claim("CIE-06", "RESEARCHER", "demo-researcher", "synthetic-fixture");
  for (const [file, data] of Object.entries(fixture.files).filter(([f]) => f.startsWith("research/"))) atomicJson(join(studio.dir("CIE-06"), file), data);
  writeFileSync(join(studio.dir("CIE-06"), "research/research-notes.md"), "# DEMO / NOT PRODUCTION CONTENT\nSynthetic specification: Z = number of protons. This exercises contracts only. Real research, curriculum coverage and QA remain required.\n");
  studio.complete("CIE-06", "RESEARCHER", "demo-researcher");
  studio.claim("CIE-06", "AUTHOR", "demo-author", "synthetic-fixture");
  for (const [file, data] of Object.entries(fixture.files).filter(([f]) => f.startsWith("author/"))) atomicJson(join(studio.dir("CIE-06"), file), data);
  studio.complete("CIE-06", "AUTHOR", "demo-author");
  studio.claim("CIE-06", "REVIEWER", "demo-reviewer", "synthetic-fixture");
  atomicJson(join(studio.dir("CIE-06"), "review/qa-report.json"), demoReport(studio, "NEEDS_REVISION"));
  studio.complete("CIE-06", "REVIEWER", "demo-reviewer");
  studio.claim("CIE-06", "AUTHOR", "demo-author", "synthetic-fixture");
  const lesson = readDemoLesson(studio);
  lesson.blocks.find(b => b.id === "demo-example")!.payload.title = "Exemplo DEMO — especificação sintética";
  atomicJson(join(studio.dir("CIE-06"), "author/lesson.json"), lesson);
  studio.complete("CIE-06", "AUTHOR", "demo-author");
  studio.claim("CIE-06", "REVIEWER", "demo-reviewer", "synthetic-fixture");
  atomicJson(join(studio.dir("CIE-06"), "review/qa-report.json"), demoReport(studio, "APPROVED"));
  studio.complete("CIE-06", "REVIEWER", "demo-reviewer");
  if (simulateApproval) { studio.approve("CIE-06", "SIMULATED_DEMO_OPERATOR", "DEMO pipeline simulation, never a real approval", true); studio.promote("CIE-06"); }
  return studio.state("CIE-06");
}
function readDemoLesson(studio: Studio) { return lessonSchema.parse(readJson(join(studio.dir("CIE-06"), "author/lesson.json"))); }

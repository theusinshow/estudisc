// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, mkdirSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { Studio, atomicJson, hashes, researchFiles, transition } from "../../tools/estudisc-content-studio/workspace";
import { demoArtifacts, demoReport, runDemo } from "../../tools/estudisc-content-studio/demo";
import { validateJob, readJson } from "../../tools/estudisc-content-studio/validation";
import { lessonSchema, mediaPackSchema, questionSetSchema, qaReportSchema, sourcePackSchema } from "../../tools/estudisc-content-studio/contracts";
import { toEstudiscPack } from "../../tools/estudisc-content-studio/adapter";
import { validateTrackPack } from "@/features/import/application/track-pack-validation";
import { importTrackPack, previewTrackPack } from "@/features/import/application/track-import-service";
import { requestIssues } from "../../tools/estudisc-content-studio/validation";

const root = resolve(process.cwd());
const folders: string[] = [];
afterEach(() => { for (const path of folders.splice(0)) { if (!path.startsWith(join(root, ".local"))) throw new Error("Unsafe cleanup path"); rmSync(path, { recursive: true, force: true }); } });
function setup(maxRevisions?: number) {
  mkdirSync(join(root, ".local"), { recursive: true });
  const path = mkdtempSync(join(root, ".local/studio-test-")); folders.push(path);
  const studio = new Studio(root, path);
  const fixture = demoArtifacts(root);
  if (maxRevisions !== undefined) fixture.request.maxRevisions = maxRevisions;
  studio.init("CIE-06", fixture.request, fixture.catalog);
  return { studio, fixture, dir: studio.dir("CIE-06") };
}
function researched(maxRevisions?: number) {
  const job = setup(maxRevisions);
  job.studio.claim("CIE-06", "RESEARCHER", "researcher");
  for (const [file, data] of Object.entries(job.fixture.files).filter(([f]) => f.startsWith("research/"))) atomicJson(join(job.dir, file), data);
  writeFileSync(join(job.dir, "research/research-notes.md"), "DEMO / NOT PRODUCTION CONTENT: synthetic test specification. Z equals proton count.");
  job.studio.complete("CIE-06", "RESEARCHER", "researcher");
  return job;
}
function authored() {
  const job = researched(); job.studio.claim("CIE-06", "AUTHOR", "author");
  for (const [file, data] of Object.entries(job.fixture.files).filter(([f]) => f.startsWith("author/"))) atomicJson(join(job.dir, file), data);
  job.studio.complete("CIE-06", "AUTHOR", "author"); return job;
}
function reviewed(decision: "APPROVED" | "NEEDS_REVISION" | "REJECTED" = "APPROVED") {
  const job = authored(); job.studio.claim("CIE-06", "REVIEWER", "demo-reviewer");
  atomicJson(join(job.dir, "review/qa-report.json"), demoReport(job.studio, decision));
  job.studio.complete("CIE-06", "REVIEWER", "demo-reviewer"); return job;
}

describe("Estudisc Content Studio", () => {
  it("initializes a real-catalog job, rejects duplicate job and returns Researcher", () => {
    const { studio, dir } = setup();
    expect(studio.state("CIE-06").status).toBe("RESEARCH_READY");
    expect(studio.next("CIE-06").agent).toBe("RESEARCHER");
    expect(existsSync(join(dir, "catalog.json"))).toBe(true);
    expect(() => studio.init("CIE-06")).toThrow("already exists");
    expect(studio.list()).toHaveLength(1);
  });
  it("rejects invalid transitions and wrong stage claims", () => {
    const { studio } = setup();
    expect(() => transition(studio.state("CIE-06"), "IMPORT_READY")).toThrow("Invalid transition");
    expect(() => studio.claim("CIE-06", "AUTHOR", "author")).toThrow("Cannot claim");
  });
  it("supports Researcher -> Author -> Reviewer transitions with run metadata", () => {
    const { studio } = authored();
    const state = studio.state("CIE-06");
    expect(state.status).toBe("REVIEW_READY"); expect(studio.next("CIE-06").agent).toBe("REVIEWER");
    expect(state.runs.map(r => r.promptVersion)).toEqual(["estudisc.researcher.v1", "estudisc.author.v1"]);
    expect(state.runs.every(r => r.completedAt && Object.keys(r.inputHashes).length && Object.keys(r.outputHashes).length)).toBe(true);
  });
  it("rejects malformed schemas including numeric contracts and MCQ answer count", () => {
    const { fixture } = setup();
    expect(sourcePackSchema.safeParse({ sources: [{}], assertions: [], unresolved: [] }).success).toBe(false);
    const questions = questionSetSchema.parse(fixture.files["author/questions.json"]);
    questions.questions[0].choices![1].correct = true;
    expect(questionSetSchema.safeParse(questions).success).toBe(false);
    const q = questions.questions[0]; q.type = "numeric"; q.answer = { kind: "numeric", value: 1, tolerance: -1 };
    expect(questionSetSchema.safeParse(questions).success).toBe(false);
  });
  it("detects missing Concept and curriculum references", () => {
    const { studio, dir } = authored();
    const request = studio.request("CIE-06"); request.conceptIds = ["MISSING"]; request.curriculumRequirementIds = ["MISSING-REQUIREMENT"];
    atomicJson(join(dir, "request.json"), request);
    const validation = validateJob(dir);
    expect(validation.ok).toBe(false);
    expect(validation.issues.some(i => i.message.includes("Unknown Concept"))).toBe(true);
    expect(validation.issues.some(i => i.message.includes("Unknown/misaligned requirement"))).toBe(true);
  });
  it("preserves required prerequisite edges and rejects stale Question versions", () => {
    const { studio, dir } = authored(); const catalog = demoArtifacts(root).catalog;
    catalog.prerequisites = [{ conceptId: "CIE.ATOM.Z", prerequisiteConceptId: "CIE.ATOM.PARTICLES", strength: "required" }];
    expect(requestIssues(studio.request("CIE-06"), catalog).some(i => i.message.includes("Missing required prerequisite"))).toBe(true);
    const q = questionSetSchema.parse(readJson(join(dir, "author/questions.json"))).questions[0];
    catalog.prerequisites = [];
    catalog.historicalQuestions = [{ id: q.id, version: q.version, subjectCode: q.subjectCode, difficulty: q.difficulty, cognitiveOperations: q.cognitiveOperations, provenance: "generated", reserved: false, status: "draft", conceptIds: q.conceptIds }];
    atomicJson(join(dir, "catalog.json"), catalog);
    expect(validateJob(dir).issues.some(i => i.message.includes("new immutable version"))).toBe(true);
  });
  it("rejects schema-advertised blocks with no renderer and arbitrary invented blocks", () => {
    const { dir } = authored();
    const lesson = lessonSchema.parse(readJson(join(dir, "author/lesson.json")));
    lesson.blocks[0].type = "map"; atomicJson(join(dir, "author/lesson.json"), lesson);
    expect(validateJob(dir).issues.some(i => i.message.includes("not registered"))).toBe(true);
    const invalid = { ...lesson, blocks: [{ ...lesson.blocks[0], type: "arbitrary-jsx" }] };
    expect(lessonSchema.safeParse(invalid).success).toBe(false);
  });
  it("UNKNOWN embedded media blocks deterministic completion, unused candidate remains allowed", () => {
    const { dir } = authored(); const media = mediaPackSchema.parse(readJson(join(dir, "research/media-pack.json")));
    media.images[0].licenseStatus = "UNKNOWN"; atomicJson(join(dir, "research/media-pack.json"), media);
    expect(validateJob(dir).issues.some(i => i.code === "media_license")).toBe(true);
    media.images[0].licenseStatus = "APPROVED_EMBED";
    media.images.push({ ...media.images[0], id: "unused", licenseStatus: "UNKNOWN" }); atomicJson(join(dir, "research/media-pack.json"), media);
    expect(validateJob(dir).ok).toBe(true);
  });
  it("rejects missing source/media references, alt text and answer contracts", () => {
    const { dir } = authored(); const lesson = lessonSchema.parse(readJson(join(dir, "author/lesson.json")));
    lesson.sourceIds.push("missing"); lesson.blocks[1].payload.alt = ""; atomicJson(join(dir, "author/lesson.json"), lesson);
    const result = validateJob(dir);
    expect(result.issues.some(i => i.message.includes("Unknown reference"))).toBe(true);
    expect(result.issues.some(i => i.code === "media_accessibility")).toBe(true);
  });
  it("cannot send invalid author artifacts to Reviewer", () => {
    const { studio, dir } = authored(); const lesson = lessonSchema.parse(readJson(join(dir, "author/lesson.json")));
    lesson.exitTicketQuestionIds = []; atomicJson(join(dir, "author/lesson.json"), lesson);
    expect(() => studio.claim("CIE-06", "REVIEWER", "reviewer")).toThrow("upstream artifacts changed");
    expect(validateJob(dir).issues.some(i => i.code === "missing_exit_ticket")).toBe(true);
  });
  it("HIGH finding blocks APPROVED even when reviewer claims approval", () => {
    const { studio, dir } = authored(); studio.claim("CIE-06", "REVIEWER", "demo-reviewer");
    const report = demoReport(studio, "NEEDS_REVISION"); report.decision = "APPROVED";
    atomicJson(join(dir, "review/qa-report.json"), report);
    expect(() => studio.complete("CIE-06", "REVIEWER", "demo-reviewer")).toThrow("HIGH/CRITICAL");
    expect(studio.state("CIE-06").status).toBe("REVIEW_IN_PROGRESS");
  });
  it("requires independent Reviewer identity and report input hashes", () => {
    const { studio, dir } = authored();
    expect(() => studio.claim("CIE-06", "REVIEWER", "author")).toThrow("independent");
    studio.claim("CIE-06", "REVIEWER", "demo-reviewer");
    const report = demoReport(studio, "APPROVED"); report.inputHashes = {}; atomicJson(join(dir, "review/qa-report.json"), report);
    expect(() => studio.complete("CIE-06", "REVIEWER", "demo-reviewer")).toThrow("exact inputHashes");
  });
  it("a previous Author cannot become Reviewer after another Author revises", () => {
    const { studio } = reviewed("NEEDS_REVISION");
    studio.claim("CIE-06", "AUTHOR", "second-author"); studio.complete("CIE-06", "AUTHOR", "second-author");
    expect(() => studio.claim("CIE-06", "REVIEWER", "author")).toThrow("independent from every Author");
  });
  it("unapproved job cannot promote; editorial approval stops at human gate", () => {
    const { studio } = reviewed();
    expect(studio.state("CIE-06").status).toBe("HUMAN_REVIEW_REQUIRED");
    expect(() => studio.promote("CIE-06")).toThrow("human-approved");
  });
  it("APPROVED promotes to IMPORT_READY with draft Estudisc-compatible adapter output", async () => {
    const { studio, dir } = reviewed(); studio.approve("CIE-06", "DEMO_HUMAN", "Synthetic operator test only", true);
    expect(studio.state("CIE-06").status).toBe("APPROVED");
    studio.promote("CIE-06"); expect(studio.state("CIE-06").status).toBe("IMPORT_READY");
    const pack = readJson(join(dir, "approved/pack.json")); const validation = validateTrackPack(pack);
    expect(validation.ok).toBe(true);
    if (!validation.ok || validation.pack.schema !== "caderno.track.v2") throw new Error("Invalid adapter output");
    expect(validation.pack.questions.every(q => q.status === "draft")).toBe(true);
    expect(validation.pack.track.modules.flatMap(m => m.lessons).every(l => l.status === "draft")).toBe(true);
    let applied = false;
    const repository = { findPackImport: async () => null, applyTrackPack: async () => { applied = true; return { trackStableId: validation.pack.track.id, importedLessons: 1, importedActivities: 1 }; } };
    expect((await previewTrackPack(pack, repository)).status).toBe("ready"); expect(applied).toBe(false);
    expect((await importTrackPack(pack, repository)).status).toBe("imported"); expect(applied).toBe(true);
    expect((readJson(join(dir, "approved/manifest.json")) as { simulatedApproval: boolean }).simulatedApproval).toBe(true);
  });
  it("detects conflicting agent and command claims and wrong completion owner", () => {
    const { studio, dir } = setup(); studio.claim("CIE-06", "RESEARCHER", "researcher");
    expect(() => studio.claim("CIE-06", "RESEARCHER", "other-terminal")).toThrow("Conflicting active stage");
    expect(() => studio.complete("CIE-06", "RESEARCHER", "other-terminal")).toThrow("matching active");
    writeFileSync(join(dir, ".mutation-lock.json"), JSON.stringify({ pid: process.pid }));
    expect(() => studio.claim("CIE-06", "AUTHOR", "author")).toThrow("Conflicting command");
    expect(() => studio.recoverLock("CIE-06")).toThrow("still alive");
  });
  it("dead terminal resume preserves completed research and current claim", () => {
    const { studio, dir } = researched(); const before = hashes(dir, researchFiles);
    studio.claim("CIE-06", "AUTHOR", "author-session");
    const resumed = new Studio(root, studio.workspace);
    expect(resumed.claim("CIE-06", "AUTHOR", "author-session").active?.owner).toBe("author-session");
    expect(hashes(dir, researchFiles)).toEqual(before);
    expect(resumed.state("CIE-06").runs[0].status).toBe("COMPLETED");
  });
  it("revision loop preserves research and archives previous QA", () => {
    const { studio, dir } = reviewed("NEEDS_REVISION"); const before = hashes(dir, researchFiles);
    studio.claim("CIE-06", "AUTHOR", "author"); expect(studio.state("CIE-06").revisionCount).toBe(1);
    studio.complete("CIE-06", "AUTHOR", "author"); studio.claim("CIE-06", "REVIEWER", "demo-reviewer");
    expect(existsSync(join(dir, "review/revision-01.json"))).toBe(true); expect(hashes(dir, researchFiles)).toEqual(before);
  });
  it("maximum revisions escalates and rejected reviews cannot be overridden", () => {
    const { studio, dir } = researched(0); studio.claim("CIE-06", "AUTHOR", "author");
    for (const [file, data] of Object.entries(demoArtifacts(root).files).filter(([f]) => f.startsWith("author/"))) atomicJson(join(dir, file), data);
    studio.complete("CIE-06", "AUTHOR", "author"); studio.claim("CIE-06", "REVIEWER", "demo-reviewer");
    atomicJson(join(dir, "review/qa-report.json"), demoReport(studio, "NEEDS_REVISION")); studio.complete("CIE-06", "REVIEWER", "demo-reviewer");
    expect(studio.state("CIE-06").status).toBe("HUMAN_REVIEW_REQUIRED");
    expect(() => studio.approve("CIE-06", "human", "No override")).toThrow("has not approved");
  });
  it("REJECTED review requires human intervention and cannot approve", () => {
    const { studio } = reviewed("REJECTED");
    expect(studio.state("CIE-06").status).toBe("HUMAN_REVIEW_REQUIRED");
    expect(() => studio.approve("CIE-06", "human", "Cannot override rejected report")).toThrow("has not approved");
  });
  it("reset only one stage preserves upstream, archives history and clears approval", () => {
    const { studio, dir } = reviewed(); const before = hashes(dir, researchFiles);
    studio.resetStage("CIE-06", "author", "Reauthor example");
    expect(studio.state("CIE-06").status).toBe("AUTHOR_READY"); expect(hashes(dir, researchFiles)).toEqual(before);
    expect(existsSync(join(dir, ".history"))).toBe(true); expect(existsSync(join(dir, "author/lesson.json"))).toBe(false);
    studio.claim("CIE-06", "AUTHOR", "author");
    expect(() => studio.resetStage("CIE-06", "author", "Recover dead terminal")).toThrow("--abandon-owner");
    studio.resetStage("CIE-06", "author", "Recover dead terminal", "author");
    expect(studio.state("CIE-06").runs.at(-1)?.status).toBe("ABANDONED");
  });
  it("blocks changed stage inputs, changed reviewed content and changed QA", () => {
    const research = researched(); research.studio.claim("CIE-06", "AUTHOR", "author");
    writeFileSync(join(research.dir, "research/research-notes.md"), "Changed");
    expect(() => research.studio.complete("CIE-06", "AUTHOR", "author")).toThrow("Inputs changed");
    const content = reviewed(); const lesson = lessonSchema.parse(readJson(join(content.dir, "author/lesson.json")));
    lesson.title += " changed"; atomicJson(join(content.dir, "author/lesson.json"), lesson);
    expect(() => content.studio.approve("CIE-06", "human", "Attempt changed artifact")).toThrow("changed after review");
    const qa = reviewed(); const report = qaReportSchema.parse(readJson(join(qa.dir, "review/qa-report.json")));
    report.summary += " edited"; atomicJson(join(qa.dir, "review/qa-report.json"), report);
    expect(() => qa.studio.approve("CIE-06", "human", "Attempt changed QA")).toThrow("QA report changed");
  });
  it("completed research cannot be silently changed before the next claim", () => {
    const { studio, dir } = researched(); writeFileSync(join(dir, "research/research-notes.md"), "Changed after handoff");
    expect(() => studio.claim("CIE-06", "AUTHOR", "author")).toThrow("Completed upstream artifacts changed");
  });
  it("approved content changes block promotion; DEMO source cannot enter a real job", () => {
    const { studio, dir } = reviewed(); studio.approve("CIE-06", "demo-human", "Simulated approval only", true);
    const report = qaReportSchema.parse(readJson(join(dir, "review/qa-report.json"))); report.summary += " tampered";
    atomicJson(join(dir, "review/qa-report.json"), report);
    expect(() => studio.promote("CIE-06")).toThrow("QA report changed");
    const second = authored(); const request = second.studio.request("CIE-06"); request.demo = false;
    atomicJson(join(second.dir, "request.json"), request);
    expect(validateJob(second.dir).issues.some(i => i.code === "demo_content")).toBe(true);
    expect(() => second.studio.approve("CIE-06", "human", "Simulation refused", true)).toThrow();
  });
  it("blocking research remains visible and prevents Author completion", () => {
    const { studio, dir } = researched();
    studio.resetStage("CIE-06", "research", "Need stronger evidence");
    studio.claim("CIE-06", "RESEARCHER", "researcher");
    const fixture = demoArtifacts(root);
    for (const [file, data] of Object.entries(fixture.files).filter(([f]) => f.startsWith("research/"))) atomicJson(join(dir, file), data);
    writeFileSync(join(dir, "research/research-notes.md"), "RESEARCH_REQUIRED: source verification unavailable");
    const sources = sourcePackSchema.parse(readJson(join(dir, "research/source-pack.json"))); sources.unresolved[0].blocking = true;
    atomicJson(join(dir, "research/source-pack.json"), sources); studio.complete("CIE-06", "RESEARCHER", "researcher");
    studio.claim("CIE-06", "AUTHOR", "author");
    for (const [file, data] of Object.entries(fixture.files).filter(([f]) => f.startsWith("author/"))) atomicJson(join(dir, file), data);
    expect(() => studio.complete("CIE-06", "AUTHOR", "author")).toThrow("research_required");
    expect(studio.state("CIE-06").status).toBe("AUTHOR_IN_PROGRESS");
  });
  it("reserved official sources/questions and unverified factual sources block draft", () => {
    const { dir } = authored(); const sources = sourcePackSchema.parse(readJson(join(dir, "research/source-pack.json")));
    sources.sources[0].content.type = "official_exam"; sources.sources[0].verification = "RESEARCH_REQUIRED";
    atomicJson(join(dir, "research/source-pack.json"), sources);
    const questions = questionSetSchema.parse(readJson(join(dir, "author/questions.json"))); questions.questions[0].exposurePolicy.reservedForAssessment = true;
    atomicJson(join(dir, "author/questions.json"), questions);
    const issues = validateJob(dir).issues;
    expect(issues.some(i => i.code === "protected_source")).toBe(true); expect(issues.some(i => i.code === "unverified_fact")).toBe(true);
    expect(issues.some(i => i.code === "official_provenance_misuse")).toBe(true);
  });
  it("canonical source comparison ignores key order while author-source IDs stay reserved", () => {
    const { dir, fixture } = authored(); const sources = sourcePackSchema.parse(readJson(join(dir, "research/source-pack.json")));
    const canonical = { ...sources.sources[0].content, locator: { section: "demo", page: 1 } };
    fixture.catalog.sources = [canonical]; atomicJson(join(dir, "catalog.json"), fixture.catalog);
    sources.sources[0].content.locator = { page: 1, section: "demo" }; atomicJson(join(dir, "research/source-pack.json"), sources);
    expect(validateJob(dir).ok).toBe(true);
    sources.sources[0].content.id = "src-studio-CIE-06-v2"; atomicJson(join(dir, "research/source-pack.json"), sources);
    expect(validateJob(dir).issues.some(i => i.code === "reserved_author_source")).toBe(true);
  });
  it("rejects path traversal, outside workspace and linked job artifacts", () => {
    const { studio, dir } = setup();
    expect(() => studio.dir("../escape")).toThrow("Invalid"); expect(() => studio.dir("CON")).toThrow("Invalid");
    expect(() => new Studio(root, "../outside")).toThrow("inside repository");
    const linked = join(dir, "linked-research"); symlinkSync(join(dir, "research"), linked, "junction");
    expect(() => studio.state("CIE-06")).toThrow("Symlink/junction");
  });
  it("full DEMO runs one revision and promotion without pretending human approval", () => {
    mkdirSync(join(root, ".local"), { recursive: true }); const path = mkdtempSync(join(root, ".local/studio-test-")); folders.push(path);
    const studio = new Studio(root, path); const state = runDemo(studio, true);
    expect(state.status).toBe("IMPORT_READY"); expect(state.revisionCount).toBe(1); expect(state.approval?.simulated).toBe(true);
  });
  it("adapter delegates production validation and records unverified scope", () => {
    const { dir } = authored(); const result = validateJob(dir);
    const pack = toEstudiscPack(result.artifacts!);
    expect(pack.packId).toMatch(/^estudisc\.studio\./);
    const { namespace: _namespace, ...legacyRequest } = result.artifacts!.request;
    void _namespace;
    const legacyPack = toEstudiscPack({ ...result.artifacts!, request: legacyRequest });
    expect(legacyPack.packId).toMatch(/^vecta\.studio\./);
    expect(legacyPack.questions).toEqual(pack.questions);
    expect(legacyPack.track.modules.map(module => module.lessons.map(lesson => lesson.id))).toEqual(pack.track.modules.map(module => module.lessons.map(lesson => lesson.id)));
    expect(validateTrackPack(pack).ok).toBe(true);
    expect((pack.track.metadata.contentStudio as { previewOnly: boolean; sourceScopeVerified: boolean }).previewOnly).toBe(true);
    expect((pack.track.metadata.contentStudio as { sourceScopeVerified: boolean }).sourceScopeVerified).toBe(false);
    const media = (pack.track.metadata.contentStudio as { media: { images: Array<Record<string, unknown>> } }).media;
    expect(media.images[0]).not.toHaveProperty("src");
    expect(readFileSync(join(dir, "state.json"), "utf8")).not.toContain("apiKey");
  });
});

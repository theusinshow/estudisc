import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, readdirSync, lstatSync, openSync, closeSync, realpathSync } from "node:fs";
import { resolve, join, relative, isAbsolute, dirname } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { catalogSchema, jobStateSchema, lessonGenerationRequestSchema, qaReportSchema, type JobState, type Role, type Catalog } from "./contracts";
import { defaultRequest, loadCatalog } from "./catalog";
import { validateJob, requestIssues, readJson } from "./validation";
import { toEstudiscPack } from "./adapter";

export const researchFiles = ["research/source-pack.json", "research/media-pack.json", "research/research-notes.md"];
export const authorFiles = ["author/lesson-architecture.json", "author/lesson.json", "author/questions.json", "author/unsupported-components.json"];
const baseFiles = ["request.json", "catalog.json"];
const stageInputs = { RESEARCHER: baseFiles, AUTHOR: [...baseFiles, ...researchFiles], REVIEWER: [...baseFiles, ...researchFiles, ...authorFiles], ORCHESTRATOR: baseFiles };
const stageOutputs = { RESEARCHER: researchFiles, AUTHOR: authorFiles, REVIEWER: ["review/qa-report.json"], ORCHESTRATOR: [] };
const transitions: Record<JobState["status"], JobState["status"][]> = {
  NEW: ["RESEARCH_READY"], RESEARCH_READY: ["RESEARCH_IN_PROGRESS"], RESEARCH_IN_PROGRESS: ["RESEARCH_DONE"],
  RESEARCH_DONE: ["AUTHOR_READY"], AUTHOR_READY: ["AUTHOR_IN_PROGRESS"], AUTHOR_IN_PROGRESS: ["DRAFT_DONE"],
  DRAFT_DONE: ["VALIDATION"], VALIDATION: ["REVIEW_READY"], REVIEW_READY: ["REVIEW_IN_PROGRESS"],
  REVIEW_IN_PROGRESS: ["NEEDS_REVISION", "HUMAN_REVIEW_REQUIRED"], NEEDS_REVISION: ["REVISION_IN_PROGRESS"],
  REVISION_IN_PROGRESS: ["VALIDATION"], HUMAN_REVIEW_REQUIRED: ["APPROVED"], APPROVED: ["IMPORT_READY"], IMPORT_READY: []
};
export function transition(state: JobState, next: JobState["status"]): JobState {
  if (!transitions[state.status].includes(next)) throw new Error(`Invalid transition ${state.status} -> ${next}`);
  return { ...state, status: next, updatedAt: new Date().toISOString() };
}
export function atomicJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${randomUUID()}.tmp`;
  const fd = openSync(tmp, "wx");
  try { writeFileSync(fd, JSON.stringify(value, null, 2) + "\n", "utf8"); } finally { closeSync(fd); }
  try { renameSync(tmp, path); } finally { if (existsSync(tmp)) unlinkSync(tmp); }
}
export function hashes(dir: string, files: readonly string[]) {
  return Object.fromEntries(files.map(f => [f, createHash("sha256").update(readFileSync(join(dir, f))).digest("hex")]));
}
export function sameHashes(a: Record<string, string>, b: Record<string, string>) {
  return Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[k] === v);
}
function assertNoLinks(path: string) {
  if (!existsSync(path)) return;
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw new Error(`Symlink/junction not allowed in Studio workspace: ${path}`);
  if (stat.isDirectory()) for (const entry of readdirSync(path)) assertNoLinks(join(path, entry));
}

export class Studio {
  readonly root: string;
  readonly workspace: string;
  constructor(root: string, workspace = "tools/estudisc-content-studio/workspace") {
    this.root = realpathSync(root);
    this.workspace = resolve(this.root, workspace);
    const rel = relative(this.root, this.workspace);
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error("Workspace must be strictly inside repository");
    let path = this.workspace;
    while (path !== this.root) {
      if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error("Workspace cannot traverse symlinks/junctions");
      path = dirname(path);
    }
  }
  dir(jobId: string) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(jobId) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(jobId) || /[.]$/.test(jobId)) throw new Error("Invalid/sensitive filesystem job ID");
    const dir = join(this.workspace, jobId);
    assertNoLinks(dir);
    return dir;
  }
  state(jobId: string) { return jobStateSchema.parse(readJson(join(this.dir(jobId), "state.json"))); }
  request(jobId: string) { return lessonGenerationRequestSchema.parse(readJson(join(this.dir(jobId), "request.json"))); }
  list() { return existsSync(this.workspace) ? readdirSync(this.workspace).filter(id => existsSync(join(this.workspace, id, "state.json"))).map(id => this.state(id)) : []; }
  private save(dir: string, state: JobState) { atomicJson(join(dir, "state.json"), jobStateSchema.parse(state)); }
  private locked<T>(jobId: string, action: (dir: string, state: JobState) => T): T {
    const dir = this.dir(jobId);
    const lock = join(dir, ".mutation-lock.json");
    let fd: number;
    try { fd = openSync(lock, "wx"); } catch { throw new Error("Conflicting command or stale mutation lock; use recover-lock after verifying process death"); }
    try { writeFileSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString() })); } finally { closeSync(fd); }
    try { return action(dir, this.state(jobId)); } finally { unlinkSync(lock); }
  }
  recoverLock(jobId: string) {
    const path = join(this.dir(jobId), ".mutation-lock.json");
    const lock = JSON.parse(readFileSync(path, "utf8")) as { pid: number };
    if (!Number.isInteger(lock.pid) || lock.pid <= 0) throw new Error("Malformed lock; inspect manually");
    try { process.kill(lock.pid, 0); } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ESRCH") throw e;
      unlinkSync(path); return;
    }
    throw new Error("Lock process still alive; recovery refused");
  }
  init(jobId: string, input?: unknown, pinned?: Catalog) {
    const dir = this.dir(jobId);
    const catalog = catalogSchema.parse(pinned ?? loadCatalog(this.root));
    const parsedRequest = lessonGenerationRequestSchema.parse(input ?? defaultRequest(jobId, catalog));
    const request = { ...parsedRequest, namespace: parsedRequest.namespace ?? "estudisc" as const };
    if (request.jobId !== jobId) throw new Error("Request/job ID mismatch");
    const issues = requestIssues(request, catalog);
    if (issues.length) throw new Error(JSON.stringify(issues));
    mkdirSync(this.workspace, { recursive: true });
    try { mkdirSync(dir); } catch { throw new Error(`Job already exists: ${jobId}`); }
    for (const folder of ["research", "author", "review"]) mkdirSync(join(dir, folder));
    atomicJson(join(dir, "request.json"), request);
    atomicJson(join(dir, "catalog.json"), catalog);
    const now = new Date().toISOString();
    const state = transition(jobStateSchema.parse({ schemaVersion: 1, jobId, status: "NEW", revisionCount: 0, createdAt: now, updatedAt: now, runs: [], resets: [] }), "RESEARCH_READY");
    this.save(dir, state);
    return state;
  }
  claim(jobId: string, role: Role, owner: string, model?: string) {
    return this.locked(jobId, (dir, previous) => {
      let state = previous;
      if (state.active) {
        if (state.active.role === role && state.active.owner === owner) return state;
        throw new Error(`Conflicting active stage: ${state.active.role} claimed by ${state.active.owner}`);
      }
      const upstream = role === "AUTHOR" ? "RESEARCHER" : role === "REVIEWER" ? "AUTHOR" : undefined;
      if (upstream) {
        const completed = [...state.runs].reverse().find(r => r.role === upstream && r.status === "COMPLETED");
        if (!completed) throw new Error(`Cannot claim ${role} before ${upstream} completes`);
        // Revision QA moves into retained history when the next Reviewer starts.
        const inputs = Object.fromEntries(Object.entries(completed.inputHashes).filter(([file]) => !file.startsWith("review/")));
        if (!sameHashes(completed.outputHashes, hashes(dir, stageOutputs[upstream])) || !sameHashes(inputs, hashes(dir, Object.keys(inputs)))) throw new Error("Completed upstream artifacts changed; reset the owning stage and complete it again");
      }
      if (role === "RESEARCHER" && state.status === "RESEARCH_READY") state = transition(state, "RESEARCH_IN_PROGRESS");
      else if (role === "AUTHOR" && ["RESEARCH_DONE", "AUTHOR_READY"].includes(state.status)) {
        if (state.status === "RESEARCH_DONE") state = transition(state, "AUTHOR_READY");
        state = transition(state, "AUTHOR_IN_PROGRESS");
      } else if (role === "AUTHOR" && state.status === "NEEDS_REVISION") {
        state = transition(state, "REVISION_IN_PROGRESS"); state.revisionCount++;
      } else if (role === "REVIEWER" && state.status === "REVIEW_READY") {
        this.assertValid(dir, "author");
        if (state.runs.some(r => r.role === "AUTHOR" && r.status === "COMPLETED" && r.owner === owner)) throw new Error("Reviewer must be independent from every Author of this job");
        const report = join(dir, "review/qa-report.json");
        if (existsSync(report)) {
          const archive = join(dir, `review/revision-${String(state.revisionCount).padStart(2, "0")}.json`);
          if (existsSync(archive)) throw new Error("Revision report archive already exists; inspect job");
          renameSync(report, archive);
        }
        state = transition(state, "REVIEW_IN_PROGRESS");
      } else throw new Error(`Cannot claim ${role} in ${state.status}`);
      const inputs = role === "AUTHOR" && state.status === "REVISION_IN_PROGRESS" ? [...stageInputs[role], "review/qa-report.json"] : stageInputs[role];
      state.active = { role, owner, model, promptVersion: `estudisc.${role.toLowerCase()}.v1`, startedAt: new Date().toISOString(), status: "IN_PROGRESS", inputHashes: hashes(dir, inputs), outputHashes: {} };
      this.save(dir, state); return state;
    });
  }
  private assertValid(dir: string, stage: "research" | "author") {
    const result = validateJob(dir, stage);
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));
    return result;
  }
  complete(jobId: string, role: Role, owner: string) {
    return this.locked(jobId, (dir, previous) => {
      let state = previous;
      const run = state.active;
      if (!run || run.role !== role || run.owner !== owner) throw new Error("Complete requires matching active role and owner");
      if (!sameHashes(run.inputHashes, hashes(dir, Object.keys(run.inputHashes)))) throw new Error("Inputs changed during stage; reset-stage and re-claim required");
      if (role === "RESEARCHER") {
        this.assertValid(dir, "research"); state = transition(state, "RESEARCH_DONE");
      } else if (role === "AUTHOR") {
        this.assertValid(dir, "author");
        if (state.status === "AUTHOR_IN_PROGRESS") state = transition(state, "DRAFT_DONE");
        state = transition(state, "VALIDATION"); state = transition(state, "REVIEW_READY");
      } else if (role === "REVIEWER") {
        this.assertValid(dir, "author");
        const report = qaReportSchema.parse(readJson(join(dir, "review/qa-report.json")));
        if (report.reviewerId !== owner || !sameHashes(report.inputHashes, run.inputHashes)) throw new Error("QA report must identify claimed Reviewer and exact inputHashes");
        const blocking = report.findings.some(f => f.severity === "HIGH" || f.severity === "CRITICAL");
        if (report.decision === "APPROVED" && blocking) throw new Error("HIGH/CRITICAL findings block approval");
        const request = this.request(jobId);
        const next = report.decision === "NEEDS_REVISION" && state.revisionCount < request.maxRevisions ? "NEEDS_REVISION" : "HUMAN_REVIEW_REQUIRED";
        state = transition(state, next);
        state.reviewedHashes = run.inputHashes;
        state.gateReason = report.decision === "APPROVED" ? "Editorial review passed; human export approval required" : report.decision === "REJECTED" ? "Reviewer rejected; human intervention required" : next === "HUMAN_REVIEW_REQUIRED" ? "Maximum automatic revisions reached" : "Author revision required";
      } else throw new Error("Orchestrator has no generated completion stage");
      state.runs.push({ ...run, completedAt: new Date().toISOString(), status: "COMPLETED", outputHashes: hashes(dir, stageOutputs[role]) });
      delete state.active;
      this.save(dir, state); return state;
    });
  }
  approve(jobId: string, by: string, note: string, simulated = false) {
    return this.locked(jobId, (dir, state) => {
      if (state.status !== "HUMAN_REVIEW_REQUIRED" || state.active) throw new Error("Human approval requires completed editorial review");
      if (simulated && !this.request(jobId).demo) throw new Error("Simulated approval allowed only for DEMO");
      this.assertValid(dir, "author");
      const report = qaReportSchema.parse(readJson(join(dir, "review/qa-report.json")));
      if (report.decision !== "APPROVED" || report.findings.some(f => ["HIGH", "CRITICAL"].includes(f.severity))) throw new Error("Reviewer has not approved; revise before human approval");
      this.assertReviewed(dir, state);
      const next = transition(state, "APPROVED");
      next.gateReason = "Human export approval recorded; runtime publication remains pending";
      next.approval = { by, note, at: new Date().toISOString(), simulated, hashes: hashes(dir, [...stageInputs.REVIEWER, "review/qa-report.json"]) };
      this.save(dir, next); return next;
    });
  }
  private assertReviewed(dir: string, state: JobState) {
    if (!state.reviewedHashes || !sameHashes(state.reviewedHashes, hashes(dir, stageInputs.REVIEWER))) throw new Error("Artifacts changed after review; fresh Reviewer required");
    const lastReview = [...state.runs].reverse().find(r => r.role === "REVIEWER" && r.status === "COMPLETED");
    if (!lastReview || !sameHashes(lastReview.outputHashes, hashes(dir, stageOutputs.REVIEWER))) throw new Error("QA report changed after review completion");
  }
  promote(jobId: string) {
    return this.locked(jobId, (dir, state) => {
      if (state.status !== "APPROVED" || !state.approval || state.active) throw new Error("Only human-approved jobs can promote");
      this.assertReviewed(dir, state);
      if (!sameHashes(state.approval.hashes, hashes(dir, [...stageInputs.REVIEWER, "review/qa-report.json"]))) throw new Error("Approved artifacts changed");
      const artifacts = this.assertValid(dir, "author").artifacts!;
      const pack = toEstudiscPack(artifacts);
      const output = join(dir, "approved");
      if (!existsSync(output)) {
        const staging = join(dir, `.promotion-${randomUUID()}`);
        mkdirSync(staging);
        atomicJson(join(staging, "pack.json"), pack);
        atomicJson(join(staging, "editorial.json"), { request: artifacts.request, catalog: artifacts.catalog, sources: artifacts.sources,
          media: artifacts.media, architecture: artifacts.architecture, unsupported: readJson(join(dir, "author/unsupported-components.json")),
          qaReport: readJson(join(dir, "review/qa-report.json")), approval: state.approval, runs: state.runs });
        atomicJson(join(staging, "manifest.json"), { schemaVersion: 1, jobId, status: "IMPORT_READY", runtimeStatus: "draft", demo: artifacts.request.demo,
          simulatedApproval: state.approval.simulated, createdAt: new Date().toISOString(), inputHashes: state.approval.hashes, outputHashes: hashes(staging, ["pack.json", "editorial.json"]) });
        renameSync(staging, output);
      } else {
        const manifest = readJson(join(output, "manifest.json")) as { inputHashes: Record<string, string>; outputHashes: Record<string, string> };
        if (!sameHashes(manifest.inputHashes, state.approval.hashes) || !sameHashes(manifest.outputHashes, hashes(output, ["pack.json", "editorial.json"]))) throw new Error("Existing promotion conflicts; reset review before re-export");
      }
      const next = transition(state, "IMPORT_READY"); next.gateReason = "Draft export ready for separate human import preview and publication QA"; this.save(dir, next); return next;
    });
  }
  resetStage(jobId: string, stage: "research" | "author" | "review", reason: string, abandonOwner?: string) {
    return this.locked(jobId, (dir, state) => {
      if (!reason.trim()) throw new Error("Reset requires reason");
      if (state.active && state.active.owner !== abandonOwner) throw new Error(`Active claim; reset requires --abandon-owner ${state.active.owner} after terminal stops`);
      if (stage !== "research") this.assertValid(dir, "research");
      if (stage === "review") this.assertValid(dir, "author");
      const archive = join(dir, ".history", `${Date.now()}-${randomUUID()}`); mkdirSync(archive, { recursive: true });
      atomicJson(join(archive, "state.json"), state);
      const folders = stage === "research" ? ["research", "author", "review", "approved"] : stage === "author" ? ["author", "review", "approved"] : ["review", "approved"];
      for (const folder of folders) {
        if (existsSync(join(dir, folder))) renameSync(join(dir, folder), join(archive, folder));
        if (folder !== "approved") mkdirSync(join(dir, folder));
      }
      if (state.active) state.runs.push({ ...state.active, status: "ABANDONED", completedAt: new Date().toISOString() });
      delete state.active; delete state.approval; delete state.reviewedHashes; delete state.gateReason;
      state.status = stage === "research" ? "RESEARCH_READY" : stage === "author" ? "AUTHOR_READY" : "REVIEW_READY";
      state.revisionCount = 0; state.updatedAt = new Date().toISOString();
      state.resets.push({ stage, reason, at: state.updatedAt }); this.save(dir, state); return state;
    });
  }
  next(jobId: string) {
    const state = this.state(jobId);
    const role = state.active?.role ?? (["RESEARCH_READY", "NEW"].includes(state.status) ? "RESEARCHER" : ["RESEARCH_DONE", "AUTHOR_READY", "NEEDS_REVISION"].includes(state.status) ? "AUTHOR" : state.status === "REVIEW_READY" ? "REVIEWER" : "ORCHESTRATOR");
    const dir = this.dir(jobId);
    const workspaceOption = ` --workspace '${relative(this.root, this.workspace).replaceAll("\\", "/").replaceAll("'", "''")}'`;
    return { jobId, directory: dir, state: state.status, agent: role, owner: state.active?.owner, prompt: `tools/estudisc-content-studio/agents/${role.toLowerCase()}.md`,
      read: role === "AUTHOR" && state.status === "NEEDS_REVISION" ? [...stageInputs[role], ...authorFiles, "review/qa-report.json"] : stageInputs[role],
      write: stageOutputs[role], inputHashes: hashes(dir, state.active ? Object.keys(state.active.inputHashes) : stageInputs[role]), gateReason: state.gateReason,
      command: state.active ? `pnpm estudisc-content complete ${jobId} ${role} --owner '${state.active.owner.replaceAll("'", "''")}'${workspaceOption}` : role !== "ORCHESTRATOR" ? `pnpm estudisc-content claim ${jobId} ${role} --owner YOUR_SESSION_ID --model gpt-6.1-sol-high${workspaceOption}` : state.status === "APPROVED" ? `pnpm estudisc-content promote ${jobId}${workspaceOption}` : state.status === "IMPORT_READY" ? `Human preview: ${join(dir, "approved/pack.json")}` : "Human review required; inspect QA and use approve only after an actual human decision" };
  }
}

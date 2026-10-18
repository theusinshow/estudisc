# Practice Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace time-budget study sessions with practice blocks of up to 5 Questions (Revisão and Erros), shown one Question at a time with a summary, and retire the planner, the session chooser and their flags.

**Architecture:** Approach 1 from the spec: the existing session engine stays underneath. A practice block is a targeted `study_sessions` row created ACTIVE, capped at 5 Questions, whose target is encoded in `policyVersion` (`practice-block.v1|{json}`), so resuming the same target needs no migration. `/study/[sessionId]` renders blocks with a client stepper over server-rendered question panels; any other session renders a read-only legacy summary. The engine's untargeted `plan()` (planner.v1/v2, routine constraints) stays as dormant code reachable only from tests; the product never calls it again.

**Tech Stack:** Next.js (repo's custom version), TypeScript strict, Zod, Drizzle/Postgres + in-memory repositories, Vitest (unit, component with Testing Library, PGlite integration), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-18-practice-blocks-design.md`

## Global Constraints

- Block size: **up to 5 Questions**; no time choice anywhere in the student UI.
- Student copy (Portuguese, exact): "Revisar agora", "Praticar este conceito", "Praticar este assunto", "2 de 5", "Próxima", "Ver resumo", "3 de 5 sem ajuda", "Mais 5", "Voltar", "Termine o simulado antes de praticar.", "Sem questões novas para este conceito agora. Volte amanhã ou revise a aula.", "Ver acesso completo".
- Never show to students: "Sessão de N min", "Roteiro da sessão", "Concluir sessão", "Começar sessão", "Tempo para cada prática", "Tempo para esta prática".
- No migration. `study_sessions`, planner and routine tables stay as history.
- Attempts immutable, ConceptEvidence append-only, mastery/spacing/achievements unchanged; remediation keeps excluding the missed Question.
- No parallel engine: blocks reuse `sqlTargetedSelection`/`memoryTargetedSelection`, `sqlAdaptiveChoices`/`memoryAdaptiveChoices`, `planCandidates`, the question panel and Attempt recording.
- SQL and memory repositories stay mirrored; integration tests run `describe.each(["memory","sql"])`.
- Mobile-first: check 390 and 320 px, no horizontal scroll, touch targets ≥ 44 px.
- Code/identifiers in English, UI copy in Portuguese, match the surrounding file's style (several files are dense one-liners).
- Before editing, run `git status -sb`; if another agent has uncommitted work in the same files, stop and tell the owner.
- No push without the owner's explicit approval; local commits are fine.

---

### Task 1: Practice block helpers

**Files:**
- Create: `src/features/study-sessions/practice-block.ts`
- Test: `tests/unit/practice-block.test.ts`

**Interfaces:**
- Consumes: `SessionItem`, `sessionItemsSchema` from `src/features/study-sessions/contracts.ts`; `countsAsIndependent`, `Confidence` from `src/features/review/confidence.ts`.
- Produces (used by Tasks 2–5):
  - `PRACTICE_BLOCK_POLICY = "practice-block.v1"`, `PRACTICE_BLOCK_SIZE = 5`, `PRACTICE_BLOCK_MINUTES = 60`
  - `practiceBlockTargetSchema` (Zod) and `type PracticeBlockTarget = { kind: "review"; conceptId?: string } | { kind: "remediation"; mistakeId: string }`
  - `practiceBlockPolicy(target: PracticeBlockTarget): string`
  - `readPracticeBlockTarget(policyVersion: string): PracticeBlockTarget | null`
  - `capBlockItems(items: readonly SessionItem[], size?: number): SessionItem[]`
  - `type BlockQuestion = { stableId: string; questionId: string; questionVersion: number; prompt: string; itemIndex: number }`
  - `blockQuestions(items: readonly SessionItem[]): BlockQuestion[]`
  - `type BlockAnswer = { questionId: string | null; outcome: string; hintLevel: number; solutionRevealed: boolean; confidence: string | null }`
  - `toBlockAnswer(context: unknown, outcome: string): BlockAnswer`
  - `type BlockMark = "independent" | "retry" | "open"`
  - `summarizeBlock(questions: readonly BlockQuestion[], answers: readonly BlockAnswer[]): { total: number; answered: number; independent: number; rows: Array<BlockQuestion & { mark: BlockMark }> }`
  - `blockConceptId(items: readonly SessionItem[]): string | null`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/practice-block.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sessionItemsSchema, type SessionItem } from "@/features/study-sessions/contracts";
import {
  PRACTICE_BLOCK_SIZE, blockConceptId, blockQuestions, capBlockItems, practiceBlockPolicy,
  readPracticeBlockTarget, summarizeBlock, toBlockAnswer, type BlockAnswer
} from "@/features/study-sessions/practice-block";

function item(lessonId: string, questionIds: string[], conceptIds: string[] = ["C1"]): SessionItem {
  return {
    lessonId, version: 1, title: lessonId, subjectCode: "MAT", minutes: 10, trackId: "track", intent: "review", delivery: "questions", conceptIds,
    activityIds: questionIds.map(id => `a-${id}`), questions: questionIds.map(id => ({ id, version: 1 })),
    activitySnapshots: questionIds.map((id, orderIndex) => ({ stableId: `a-${id}`, type: "question" as const, prompt: `Questão ${id}`, orderIndex, config: { questionId: id, questionVersion: 1, hints: [] } }))
  };
}
const answer = (questionId: string, outcome: string, extra: Partial<BlockAnswer> = {}): BlockAnswer => ({ questionId, outcome, hintLevel: 0, solutionRevealed: false, confidence: null, ...extra });

describe("practice block target", () => {
  it("round-trips every target through policyVersion", () => {
    for (const target of [{ kind: "review" as const }, { kind: "review" as const, conceptId: "MAT.PCT:x" }, { kind: "remediation" as const, mistakeId: "70000000-0000-4000-8000-000000000001" }]) {
      expect(readPracticeBlockTarget(practiceBlockPolicy(target))).toEqual(target);
    }
    expect(practiceBlockPolicy({ kind: "review" })).toBe('practice-block.v1|{"kind":"review"}');
  });
  it("treats legacy and malformed policy versions as not a block", () => {
    for (const policy of ["planner.v2", "planner.v2+routine.v1", "session.v1", "practice-block.v1|{", 'practice-block.v1|{"kind":"remediation","mistakeId":"nope"}']) {
      expect(readPracticeBlockTarget(policy)).toBeNull();
    }
  });
});

describe("capBlockItems", () => {
  it("keeps the composed order and trims to five Questions across items", () => {
    const capped = capBlockItems([item("L1", ["q1", "q2", "q3"]), item("L2", ["q4", "q5", "q6"]), item("L3", ["q7"])]);
    expect(blockQuestions(capped).map(question => question.questionId)).toEqual(["q1", "q2", "q3", "q4", "q5"]);
    expect(capped).toHaveLength(2);
    expect(() => sessionItemsSchema.parse(capped)).not.toThrow();
    expect(capped[1].activityIds).toEqual(["a-q4", "a-q5"]);
    expect(capped[1].questions).toEqual([{ id: "q4", version: 1 }, { id: "q5", version: 1 }]);
  });
  it("keeps fewer than five as they are and drops items without snapshots", () => {
    const lessonOnly = { ...item("L0", ["q0"]), activitySnapshots: undefined };
    expect(blockQuestions(capBlockItems([lessonOnly, item("L1", ["q1", "q2"])]))).toHaveLength(2);
    expect(capBlockItems([])).toEqual([]);
    expect(PRACTICE_BLOCK_SIZE).toBe(5);
  });
});

describe("summarizeBlock", () => {
  const questions = blockQuestions([item("L1", ["q1", "q2", "q3", "q4"])]);
  it("counts each Question by its first Attempt in the block", () => {
    const summary = summarizeBlock(questions, [
      answer("q1", "passed"),
      answer("q2", "failed"), answer("q2", "passed"),
      answer("q3", "passed", { hintLevel: 1 }),
      answer("q1", "failed")
    ]);
    expect(summary.rows.map(row => row.mark)).toEqual(["independent", "retry", "retry", "open"]);
    expect(summary).toMatchObject({ total: 4, answered: 3, independent: 1 });
  });
  it("does not count a revealed solution or a guess as without help", () => {
    const summary = summarizeBlock(questions, [answer("q1", "passed", { solutionRevealed: true }), answer("q2", "passed", { confidence: "guess" }), answer("q3", "passed", { confidence: "sure" })]);
    expect(summary.rows.map(row => row.mark)).toEqual(["retry", "retry", "independent", "open"]);
  });
  it("reads Attempt context written by the question repositories", () => {
    expect(toBlockAnswer({ questionId: "q1", hintLevel: 2, solutionRevealed: true, confidence: "guess", contextKey: "s" }, "passed")).toEqual(answer("q1", "passed", { hintLevel: 2, solutionRevealed: true, confidence: "guess" }));
    expect(toBlockAnswer(null, "failed")).toEqual({ questionId: null, outcome: "failed", hintLevel: 0, solutionRevealed: false, confidence: null });
  });
});

describe("blockConceptId", () => {
  it("returns the Concept every item shares, or null", () => {
    expect(blockConceptId([item("L1", ["q1"], ["C2", "C1"]), item("L2", ["q2"], ["C1"])])).toBe("C1");
    expect(blockConceptId([item("L1", ["q1"], ["C2"]), item("L2", ["q2"], ["C1"])])).toBeNull();
    expect(blockConceptId([])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/practice-block.test.ts`
Expected: FAIL — cannot resolve `@/features/study-sessions/practice-block`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/study-sessions/practice-block.ts`:

```ts
import { z } from "zod";
import { countsAsIndependent, confidenceSchema } from "@/features/review/confidence";
import type { SessionItem } from "./contracts";

/** ADR 0072: review and mistake practice run as blocks of up to five Questions, one at a time, with no time choice. */
export const PRACTICE_BLOCK_POLICY = "practice-block.v1";
export const PRACTICE_BLOCK_SIZE = 5;
/** Internal composition budget, never shown or chosen: wide enough for five Questions of any difficulty. */
export const PRACTICE_BLOCK_MINUTES = 60;

export const practiceBlockTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("review"), conceptId: z.string().trim().min(1).max(160).optional() }).strict(),
  z.object({ kind: z.literal("remediation"), mistakeId: z.uuid() }).strict()
]);
export type PracticeBlockTarget = z.infer<typeof practiceBlockTargetSchema>;

/** The block's target travels in policyVersion, so resuming the same target needs no migration. */
export function practiceBlockPolicy(target: PracticeBlockTarget) {
  const canonical = target.kind === "remediation" ? { kind: target.kind, mistakeId: target.mistakeId } : target.conceptId ? { kind: target.kind, conceptId: target.conceptId } : { kind: target.kind };
  return `${PRACTICE_BLOCK_POLICY}|${JSON.stringify(canonical)}`;
}

export function readPracticeBlockTarget(policyVersion: string): PracticeBlockTarget | null {
  const prefix = `${PRACTICE_BLOCK_POLICY}|`;
  if (!policyVersion.startsWith(prefix)) return null;
  try {
    const parsed = practiceBlockTargetSchema.safeParse(JSON.parse(policyVersion.slice(prefix.length)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Keeps the composed order and trims every item's parallel lists to the first `size` Questions. */
export function capBlockItems(items: readonly SessionItem[], size = PRACTICE_BLOCK_SIZE): SessionItem[] {
  const capped: SessionItem[] = [];
  let left = size;
  for (const item of items) {
    if (left <= 0) break;
    const snapshots = (item.activitySnapshots ?? []).slice(0, left);
    if (!snapshots.length) continue;
    const activityIds = new Set(snapshots.map(snapshot => snapshot.stableId));
    const questionIds = new Set(snapshots.map(snapshot => snapshot.config.questionId));
    capped.push({ ...item, activitySnapshots: snapshots, activityIds: item.activityIds.filter(id => activityIds.has(id)), questions: item.questions.filter(question => questionIds.has(question.id)) });
    left -= snapshots.length;
  }
  return capped;
}

export type BlockQuestion = Readonly<{ stableId: string; questionId: string; questionVersion: number; prompt: string; itemIndex: number }>;
export function blockQuestions(items: readonly SessionItem[]): BlockQuestion[] {
  return items.flatMap((item, itemIndex) => (item.activitySnapshots ?? []).map(snapshot => ({
    stableId: snapshot.stableId, questionId: snapshot.config.questionId, questionVersion: snapshot.config.questionVersion, prompt: snapshot.prompt, itemIndex
  })));
}

export type BlockAnswer = Readonly<{ questionId: string | null; outcome: string; hintLevel: number; solutionRevealed: boolean; confidence: string | null }>;
/** Attempt context as written by the question repositories (SQL and memory share the shape). */
export function toBlockAnswer(context: unknown, outcome: string): BlockAnswer {
  const value = (context ?? {}) as Record<string, unknown>;
  return {
    questionId: typeof value.questionId === "string" ? value.questionId : null, outcome,
    hintLevel: Number(value.hintLevel ?? 0), solutionRevealed: value.solutionRevealed === true,
    confidence: typeof value.confidence === "string" ? value.confidence : null
  };
}

export type BlockMark = "independent" | "retry" | "open";
/** Each Question counts by its first Attempt in the block: "sem ajuda" means right with no hint, no solution and no guess. */
export function summarizeBlock(questions: readonly BlockQuestion[], answers: readonly BlockAnswer[]) {
  const first = new Map<string, BlockAnswer>();
  for (const answer of answers) if (answer.questionId && !first.has(answer.questionId)) first.set(answer.questionId, answer);
  const rows = questions.map(question => {
    const answer = first.get(question.questionId);
    const confidence = confidenceSchema.safeParse(answer?.confidence);
    const mark: BlockMark = !answer ? "open"
      : answer.outcome === "passed" && countsAsIndependent({ hintLevel: answer.hintLevel, solutionRevealed: answer.solutionRevealed, confidence: confidence.success ? confidence.data : null }) ? "independent" : "retry";
    return { ...question, mark };
  });
  return { total: rows.length, answered: rows.filter(row => row.mark !== "open").length, independent: rows.filter(row => row.mark === "independent").length, rows };
}

/** The Concept every item of the block shares (remediation and single-Concept review), for the block title. */
export function blockConceptId(items: readonly SessionItem[]): string | null {
  if (!items.length) return null;
  const shared = items.map(item => item.conceptIds ?? []).reduce((left, right) => left.filter(id => right.includes(id)));
  return shared[0] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/practice-block.test.ts`
Expected: PASS (all tests). Note `blockConceptId([item(["C2","C1"]), item(["C1"])])` keeps the first item's order, so it returns `"C1"` only because `"C2"` is filtered out.

- [ ] **Step 5: Commit**

```bash
git add src/features/study-sessions/practice-block.ts tests/unit/practice-block.test.ts
git commit -m "feat(practice): practice block target, cap and summary helpers"
```

---

### Task 2: Repositories start, resume and report blocks

**Files:**
- Modify: `src/db/repositories/study-session-repository.ts` (add methods after `plan`, extend `result`)
- Modify: `src/db/repositories/memory-study-session-repository.ts` (same)
- Test: `tests/integration/adaptive-sessions.test.ts` (add tests inside the existing `describe.each`)

**Interfaces:**
- Consumes (Task 1): `PRACTICE_BLOCK_MINUTES`, `practiceBlockPolicy`, `capBlockItems`, `toBlockAnswer`, `PracticeBlockTarget`, `blockQuestions`, `summarizeBlock`, `PRACTICE_BLOCK_SIZE`.
- Produces (both repositories, same signatures):
  - `startBlock(ownerId: string, target: PracticeBlockTarget, now?: Date): Promise<StudySessionRow | null>` — returns the ACTIVE block for the same target if open; otherwise composes up to 5 Questions, abandons any ACTIVE/PLANNED session, inserts a new row with `status: "ACTIVE"`, `startedAt: now`, `budgetMinutes: PRACTICE_BLOCK_MINUTES`, `policyVersion: practiceBlockPolicy(target)`; `null` when nothing is eligible; throws `TargetedPracticeError` as today.
  - `blockHasMore(ownerId: string, target: PracticeBlockTarget, now?: Date): Promise<boolean>` — read-only; `false` on `TargetedPracticeError`.
  - `result(ownerId, id)` additionally returns `answers: BlockAnswer[]` in Attempt order.

- [ ] **Step 1: Write the failing tests**

In `tests/integration/adaptive-sessions.test.ts`, add to the imports:

```ts
import { PRACTICE_BLOCK_SIZE, blockQuestions, practiceBlockPolicy, summarizeBlock } from "@/features/study-sessions/practice-block";
```

Inside `describe.each(["memory", "sql"] as const)("adaptive sessions (%s)", kind => {`, right after its opening line, add the helper and two tests:

```ts
  async function dueNow(ctx: Awaited<ReturnType<typeof setup>>, conceptIds: readonly string[]) {
    if (ctx.database) {
      await ctx.database.db.insert(owners).values({ id: "learner", displayName: "Test learner" }).onConflictDoNothing();
      for (const stableId of conceptIds) {
        const [concept] = await ctx.database.db.select().from(concepts).where(eq(concepts.stableId, stableId));
        await ctx.database.db.insert(reviewSchedules).values({ ownerId: "learner", conceptId: concept.id, currentMasteryState: "learning", nextReviewAt: now, policyVersion: "review.v2", reviewCount: 0, recentQuality: 0 });
      }
    } else for (const stableId of conceptIds) ctx.store.reviewSchedules.push({ ownerId: "learner", conceptStableId: stableId, currentMasteryState: "learning", lastReviewedAt: null, nextReviewAt: now, reviewCount: 0, recentQuality: 0, policyVersion: "review.v2", updatedAt: now });
  }
  it("starts an ACTIVE practice block of up to five Questions, resumes the same target and replaces another", async () => {
    const ctx = await setup(kind);
    try {
      await dueNow(ctx, [...new Set(source.questions.flatMap(question => question.conceptIds))]);
      const whole = (await ctx.sessions.startBlock("learner", { kind: "review" }, now))!;
      expect(whole.status).toBe("ACTIVE");
      expect(whole.startedAt).not.toBeNull();
      expect(whole.policyVersion).toBe(practiceBlockPolicy({ kind: "review" }));
      expect(blockQuestions(sessionItemsSchema.parse(whole.items))).toHaveLength(PRACTICE_BLOCK_SIZE);
      expect((await ctx.sessions.startBlock("learner", { kind: "review" }, now))!.id).toBe(whole.id);
      const conceptId = "MAT.PCT.CALCULATE";
      const single = (await ctx.sessions.startBlock("learner", { kind: "review", conceptId }, now))!;
      expect(single.id).not.toBe(whole.id);
      expect((await ctx.sessions.get("learner", whole.id))?.status).toBe("ABANDONED");
      const questions = blockQuestions(sessionItemsSchema.parse(single.items));
      // Fewer than five eligible: the block holds what exists.
      expect(questions).toHaveLength(Math.min(PRACTICE_BLOCK_SIZE, source.questions.filter(question => question.conceptIds.includes(conceptId)).length));
      expect(questions.every(question => source.questions.find(row => row.id === question.questionId)?.conceptIds.includes(conceptId))).toBe(true);
      expect(await ctx.sessions.blockHasMore("learner", { kind: "review", conceptId }, now)).toBe(true);
      expect(await ctx.sessions.blockHasMore("other", { kind: "review", conceptId }, now)).toBe(false);
      await expect(ctx.sessions.startBlock("other", { kind: "review", conceptId }, now)).rejects.toMatchObject({ code: "review_not_due" });
    } finally { await ctx.database?.close(); }
  });
  it("reports each block Question's first Attempt for the summary", async () => {
    const ctx = await setup(kind);
    try {
      await dueNow(ctx, ["MAT.PCT.CALCULATE"]);
      const block = (await ctx.sessions.startBlock("learner", { kind: "review", conceptId: "MAT.PCT.CALCULATE" }, now))!;
      const [first] = blockQuestions(sessionItemsSchema.parse(block.items));
      const canonical = source.questions.find(question => question.id === first.questionId)!;
      const wrong = canonical.answer.kind === "numeric" ? String((canonical.answer.value ?? 0) + 999) : canonical.answer.kind === "multiple_choice" ? canonical.choices!.find(choice => !choice.correct)!.id : "invalid-response";
      await ctx.questions.view("learner", first.stableId, first.questionId, first.questionVersion, block.id);
      expect(await ctx.questions.interact("learner", first.stableId, { action: "submit", questionId: first.questionId, questionVersion: first.questionVersion, sessionId: block.id, submissionKey: crypto.randomUUID(), response: wrong })).toMatchObject({ correct: false });
      const result = (await ctx.sessions.result("learner", block.id))!;
      expect(result.answers).toHaveLength(1);
      const summary = summarizeBlock(blockQuestions(result.items), result.answers);
      expect(summary.rows[0].mark).toBe("retry");
      expect(summary).toMatchObject({ answered: 1, independent: 0 });
    } finally { await ctx.database?.close(); }
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run --config vitest.integration.config.ts tests/integration/adaptive-sessions.test.ts -t "practice block|first Attempt"`
Expected: FAIL — `ctx.sessions.startBlock is not a function` (TypeScript errors also show in `pnpm typecheck`).

- [ ] **Step 3: Implement in the SQL repository**

In `src/db/repositories/study-session-repository.ts`:

Add imports (keep the file's one-line style):

```ts
import { OpenSessionError, TargetedPracticeError, type TargetedPracticeRequest } from "@/features/study-sessions/targeted-selection";
import { PRACTICE_BLOCK_MINUTES, capBlockItems, practiceBlockPolicy, toBlockAnswer, type PracticeBlockTarget } from "@/features/study-sessions/practice-block";
```

(replace the existing `targeted-selection` import line with the first one.)

Insert after the closing `}` of `plan(...)` and before `async get(`:

```ts
  /** ADR 0072: a practice block is a targeted session of up to five Questions, created ACTIVE; the same target resumes it. */
  async startBlock(ownerId:string,target:PracticeBlockTarget,now=new Date()){
    return this.db.transaction(async tx=>{
      await tx.insert(owners).values({id:ownerId,displayName:"Private learner"}).onConflictDoNothing();
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const policyVersion=practiceBlockPolicy(target);
      const [open]=await tx.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.status,"ACTIVE")));
      if(open?.policyVersion===policyVersion)return open;
      const items=await this.blockItems(tx,ownerId,target,now);
      if(!items.length)return null;
      // A different target replaces the open block (or a dormant legacy session); its Attempts keep counting.
      await tx.update(studySessions).set({status:"ABANDONED",endedAt:now}).where(and(eq(studySessions.ownerId,ownerId),inArray(studySessions.status,["ACTIVE","PLANNED"])));
      const [session]=await tx.insert(studySessions).values({ownerId,trackId:items[0].trackId!,status:"ACTIVE",budgetMinutes:PRACTICE_BLOCK_MINUTES,items,policyVersion,startedAt:now,createdAt:now}).returning();return session;
    });
  }
  /** "Mais 5": whether the same target still composes a block now; writes nothing. */
  async blockHasMore(ownerId:string,target:PracticeBlockTarget,now=new Date()){
    try{return (await this.blockItems(this.db,ownerId,target,now)).length>0;}catch(error){if(error instanceof TargetedPracticeError)return false;throw error;}
  }
  private async blockItems(db:Database,ownerId:string,target:PracticeBlockTarget,now:Date){
    const selection=await sqlTargetedSelection(db,ownerId,target,now);
    const data=await sqlAdaptiveChoices(db,ownerId,PRACTICE_BLOCK_MINUTES,undefined,now,selection);
    const plan=planCandidates(data.choices.map(choice=>choice.candidate),PRACTICE_BLOCK_MINUTES,"FOUNDATION",data.subjectMinutes,undefined,true);
    return capBlockItems(plan.items.map(candidate=>data.choices.find(choice=>choice.candidate.id===candidate.id)!.item));
  }
```

In `result(...)`, change the final `return` to add `answers` (rows are already ordered by `createdAt, attemptNumber`):

```ts
    return {session,items:sessionItemsSchema.parse(session.items),attempts:rows.length,correct:[...unique.values()].filter(row=>row.outcome==="passed").length,answered:unique.size,summary,answers:rows.map(row=>toBlockAnswer(row.context,row.outcome))};
```

If TypeScript rejects passing `tx` where `Database` is expected, type the private parameter as `Parameters<typeof sqlTargetedSelection>[0]` instead.

- [ ] **Step 4: Implement in the memory repository**

In `src/db/repositories/memory-study-session-repository.ts`:

Replace the `targeted-selection` import and add one:

```ts
import { OpenSessionError, TargetedPracticeError, type TargetedPracticeRequest } from "@/features/study-sessions/targeted-selection";
import { PRACTICE_BLOCK_MINUTES, capBlockItems, practiceBlockPolicy, toBlockAnswer, type PracticeBlockTarget } from "@/features/study-sessions/practice-block";
```

Insert after `plan(...)` and before `async get(`:

```ts
  /** ADR 0072: mirrors StudySessionRepository.startBlock. */
  async startBlock(ownerId:string,target:PracticeBlockTarget,now=new Date()){
    const policyVersion=practiceBlockPolicy(target);
    const open=this.store.studySessions.find(row=>row.ownerId===ownerId&&row.status==="ACTIVE");
    if(open?.policyVersion===policyVersion)return open;
    const items=this.blockItems(ownerId,target,now);
    if(!items.length)return null;
    for(const old of this.store.studySessions.filter(row=>row.ownerId===ownerId&&(row.status==="ACTIVE"||row.status==="PLANNED"))){old.status="ABANDONED";old.endedAt=now;}
    const row={id:crypto.randomUUID(),ownerId,trackId:items[0].trackId!,status:"ACTIVE",budgetMinutes:PRACTICE_BLOCK_MINUTES,items,policyVersion,startedAt:now as Date|null,endedAt:null as Date|null,createdAt:now};this.store.studySessions.push(row);return row;
  }
  async blockHasMore(ownerId:string,target:PracticeBlockTarget,now=new Date()){
    try{return this.blockItems(ownerId,target,now).length>0;}catch(error){if(error instanceof TargetedPracticeError)return false;throw error;}
  }
  private blockItems(ownerId:string,target:PracticeBlockTarget,now:Date){
    const selection=memoryTargetedSelection(this.store,ownerId,target,now);
    const data=memoryAdaptiveChoices(this.store,ownerId,PRACTICE_BLOCK_MINUTES,undefined,now,selection);
    const plan=planCandidates(data.choices.map(choice=>choice.candidate),PRACTICE_BLOCK_MINUTES,"FOUNDATION",data.subjectMinutes,undefined,true);
    return capBlockItems(plan.items.map(candidate=>data.choices.find(choice=>choice.candidate.id===candidate.id)!.item));
  }
```

In `result(...)`, change the final `return`:

```ts
    return { session, items: sessionItemsSchema.parse(session.items), attempts: summary.attempts, correct: summary.correct, answered: summary.answered, summary, answers: rows.map(row => toBlockAnswer(row.context, row.outcome)) };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec vitest run --config vitest.integration.config.ts tests/integration/adaptive-sessions.test.ts`
Expected: PASS for memory and sql, including every pre-existing test (the engine's `plan()` is unchanged).

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/db/repositories/study-session-repository.ts src/db/repositories/memory-study-session-repository.ts tests/integration/adaptive-sessions.test.ts
git commit -m "feat(practice): start, resume and report practice blocks in both repositories"
```

---

### Task 3: `practice_block` API action

**Files:**
- Modify: `src/app/api/study-sessions/route.ts` (full rewrite below)
- Modify: `tests/unit/targeted-practice-routes.test.ts`

**Interfaces:**
- Consumes: `practiceBlockTargetSchema`, `PracticeBlockTarget` (Task 1); `repo.startBlock`, `repo.transition` (Task 2).
- Produces: `POST /api/study-sessions` accepts only `{ action: "practice_block", target }` and `{ action: "complete" | "abandon", sessionId }`. Responses: `200 { sessionId, status }`; `409 { code: "content_gap", message }`; `404 { code: "feature_disabled" }` when `FEATURE_SMART_MISTAKES` is off; `TargetedPracticeError` → `{ code, message }` (404 for `target_unavailable`, else 409); `400 invalid_request` for `plan`, `quick_review`, `practice_mistake`, `start` and unknown fields.

- [ ] **Step 1: Rewrite the route tests (failing)**

In `tests/unit/targeted-practice-routes.test.ts` replace the header mocks and the first three `it` blocks, and the `quick_review` call in the last test, so the file reads:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError } from "@/features/auth/owner";
import { TargetedPracticeError } from "@/features/study-sessions/targeted-selection";
import { POST as post } from "@/app/api/study-sessions/route";
import { POST as reflect } from "@/app/api/mistakes/reflection/route";

const mocks = vi.hoisted(() => ({ owner: vi.fn(), startBlock: vi.fn(), reflection: vi.fn(), enabled: true }));
vi.mock("@/features/auth/owner", async original => ({ ...await original<object>(), getOwnerId: mocks.owner }));
vi.mock("@/features/study-sessions/api", () => ({ studySessionRepository: () => ({ startBlock: mocks.startBlock }) }));
vi.mock("@/features/mistakes/api", () => ({ recordMistakeReflection: mocks.reflection }));
vi.mock("@/lib/feature-flags", async original => ({ ...await original<object>(), getFeatureFlags: () => ({ FEATURE_SMART_MISTAKES: mocks.enabled }) }));
const id = "70000000-0000-4000-8000-000000000001";
const request = (data: unknown) => new Request("http://localhost/api", { method: "POST", body: JSON.stringify(data) });
const block = (target: unknown) => request({ action: "practice_block", target });

describe("practice block and reflection HTTP boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.enabled = true;
    mocks.owner.mockResolvedValue("authenticated-owner");
    mocks.startBlock.mockResolvedValue({ id, status: "ACTIVE" });
    mocks.reflection.mockResolvedValue(id);
  });
  it("starts a block for the authenticated owner's target without accepting client selection, time or impersonation", async () => {
    expect((await post(block({ kind: "remediation", mistakeId: id }))).status).toBe(200);
    expect(mocks.startBlock).toHaveBeenCalledWith("authenticated-owner", { kind: "remediation", mistakeId: id });
    expect((await post(block({ kind: "review", conceptId: "MAT.X" }))).status).toBe(200);
    expect(mocks.startBlock).toHaveBeenLastCalledWith("authenticated-owner", { kind: "review", conceptId: "MAT.X" });
    const started = await post(block({ kind: "review" }));
    expect(await started.json()).toEqual({ sessionId: id, status: "ACTIVE" });
    mocks.startBlock.mockClear();
    for (const data of [
      { action: "practice_block", target: { kind: "review" }, ownerId: "other" },
      { action: "practice_block", target: { kind: "review", conceptIds: ["MAT.X"] } },
      { action: "practice_block", target: { kind: "review", excludedQuestionIds: [] } },
      { action: "practice_block", target: { kind: "review" }, budgetMinutes: 10 },
      { action: "practice_block", target: { kind: "remediation", mistakeId: "nope" } },
      { action: "quick_review", budgetMinutes: 10 },
      { action: "practice_mistake", budgetMinutes: 10, mistakeId: id },
      { action: "plan", budgetMinutes: 15 },
      { action: "start", sessionId: id }
    ]) expect((await post(request(data))).status).toBe(400);
    expect(mocks.startBlock).not.toHaveBeenCalled();
  });
  it("fails closed for foreign targets, active exams and no eligible Question", async () => {
    mocks.startBlock.mockRejectedValueOnce(new TargetedPracticeError("target_unavailable"));
    expect((await post(block({ kind: "remediation", mistakeId: id }))).status).toBe(404);
    mocks.startBlock.mockRejectedValueOnce(new TargetedPracticeError("exam_active"));
    const exam = await post(block({ kind: "review" }));
    expect(exam.status).toBe(409); expect(await exam.json()).toMatchObject({ code: "exam_active", message: "Termine o simulado antes de praticar." });
    mocks.startBlock.mockResolvedValueOnce(null);
    const missing = await post(block({ kind: "review", conceptId: "MAT.X" }));
    expect(missing.status).toBe(409);
    expect(await missing.json()).toMatchObject({ code: "content_gap", message: "Sem questões novas para este conceito agora. Volte amanhã ou revise a aula." });
    mocks.startBlock.mockResolvedValueOnce(null);
    expect(await (await post(block({ kind: "review" }))).json()).toMatchObject({ message: "Sem questões novas para revisar agora. Volte amanhã ou revise a aula." });
  });
  it("keeps practice blocks and reflections off before rollout", async () => {
    mocks.enabled = false;
    expect((await post(block({ kind: "review" }))).status).toBe(404);
    expect((await reflect(request({}))).status).toBe(404);
    expect(mocks.owner).not.toHaveBeenCalled(); expect(mocks.reflection).not.toHaveBeenCalled();
  });
```

Keep the two reflection tests (`records only a validated student report…` and `maps authorization…`) as they are, except in the last one replace

```ts
    expect((await plan(request({ action: "quick_review", budgetMinutes: 10 }))).status).toBe(403);
```

with

```ts
    expect((await post(block({ kind: "review" }))).status).toBe(403);
```

and close the `describe` as before.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run tests/unit/targeted-practice-routes.test.ts`
Expected: FAIL — `practice_block` returns 400 and `plan`/`quick_review` return 200/404.

- [ ] **Step 3: Rewrite the route**

Replace the whole content of `src/app/api/study-sessions/route.ts` with:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerId,AccessDeniedError } from "@/features/auth/owner";
import { studySessionRepository } from "@/features/study-sessions/api";
import { SessionStateError } from "@/db/repositories/study-session-repository";
import { getFeatureFlags } from "@/lib/feature-flags";
import { TargetedPracticeError } from "@/features/study-sessions/targeted-selection";
import { practiceBlockTargetSchema,type PracticeBlockTarget } from "@/features/study-sessions/practice-block";
import { denyWithoutFullAccess } from "@/features/payments/activity-access";
// ADR 0072: review and mistake practice start as blocks of up to five Questions; time-budget planning is retired.
const requestSchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("practice_block"),target:practiceBlockTargetSchema}).strict(),
  z.object({action:z.enum(["complete","abandon"]),sessionId:z.uuid()}).strict()
]);
const emptyMessage=(target:PracticeBlockTarget)=>target.kind==="review"&&!target.conceptId?"Sem questões novas para revisar agora. Volte amanhã ou revise a aula.":"Sem questões novas para este conceito agora. Volte amanhã ou revise a aula.";
const unavailable="A revisão ou o erro solicitado não está disponível para esta conta agora.";
const targetMessages:Record<TargetedPracticeError["code"],string>={exam_active:"Termine o simulado antes de praticar.",question_context_unavailable:"Este erro usa uma atividade do laboratório; abra o conceito para retomar essa prática.",target_unavailable:unavailable,review_not_due:unavailable};
export async function POST(request:Request){
  const input=requestSchema.safeParse(await request.json().catch(()=>null));if(!input.success)return NextResponse.json({code:"invalid_request"},{status:400});
  if(input.data.action==="practice_block"&&!getFeatureFlags().FEATURE_SMART_MISTAKES)return NextResponse.json({code:"feature_disabled"},{status:404});
  try{
    const ownerId=await getOwnerId(),repo=studySessionRepository(),data=input.data;
    if(data.action==="practice_block"){
      // Free preview (ADR 0061 §3): a new block needs full access; an open one can still be completed.
      const denied=await denyWithoutFullAccess("A prática de revisão e de erros faz parte do acesso completo do Estudisc.","study_session");if(denied)return denied;
      const block=await repo.startBlock(ownerId,data.target);
      return block?NextResponse.json({sessionId:block.id,status:block.status}):NextResponse.json({code:"content_gap",message:emptyMessage(data.target)},{status:409});
    }
    const session=await repo.transition(ownerId,data.sessionId,data.action);
    return NextResponse.json({sessionId:session.id,status:session.status});
  }catch(error){
    if(error instanceof TargetedPracticeError)return NextResponse.json({code:error.code,message:targetMessages[error.code]},{status:error.code==="target_unavailable"?404:409});
    if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});
    if(error instanceof SessionStateError)return NextResponse.json({code:"session_conflict"},{status:409});
    if(error instanceof Error&&error.message==="DATABASE_URL is not configured")return NextResponse.json({code:"database_not_configured",message:"Configure o banco de dados para iniciar sessões persistentes."},{status:503});
    throw error;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run tests/unit/targeted-practice-routes.test.ts`
Expected: PASS.

Run: `pnpm exec vitest run tests/unit tests/component`
Expected: only `tests/component/session-controls.test.tsx` may fail (it posts `plan`/`quick_review`); Task 5 and Task 6 remove it. Every other test passes. Record the result.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/study-sessions/route.ts tests/unit/targeted-practice-routes.test.ts
git commit -m "feat(practice): practice_block API action replaces session planning"
```

---

### Task 4: Practice screen and legacy summary

**Files:**
- Create: `src/features/study-sessions/practice-block-button.tsx` (client)
- Create: `src/features/study-sessions/practice-block-stepper.tsx` (client)
- Create: `src/features/study-sessions/practice-block-page.tsx` (server)
- Create: `src/features/study-sessions/legacy-session-summary.tsx` (server)
- Create: `src/styles/practice-block.css`
- Modify: `src/app/study/[sessionId]/page.tsx` (full rewrite)
- Test: `tests/component/practice-block.test.tsx`

**Interfaces:**
- Consumes: Task 1 helpers; `repo.result(...)` with `answers`, `repo.blockHasMore` (Task 2); `ATTEMPT_RECORDED_EVENT`, `AttemptRecordedDetail` from `src/features/progress/live-progress-summary.tsx` (detail `{ questionId, stem, correct }`); `openStudySession(id)` from `src/features/study-sessions/session-navigation.ts`; `ActivityList` (async server component); `getConcept(stableId)` from `src/features/concepts/api.ts`; `studentConceptLabel` from `src/features/concepts/student-label.ts`; `MathText` from `src/components/ui/paragraphs`.
- Produces (Task 5 uses the button):
  - `PracticeBlockButton({ target, label, ariaLabel?, variant?: "primary" | "secondary", lessonHref? })`
  - `PracticeBlockStepper({ sessionId, steps: { stableId; questionId; node }[], answeredQuestionIds: string[] })`
  - `PracticeBlockPage({ result, target })`, `LegacySessionSummary({ result })`

- [ ] **Step 1: Write the failing component tests**

Create `tests/component/practice-block.test.tsx`:

```tsx
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticeBlockButton } from "@/features/study-sessions/practice-block-button";
import { PracticeBlockStepper } from "@/features/study-sessions/practice-block-stepper";
import { ATTEMPT_RECORDED_EVENT } from "@/features/progress/live-progress-summary";

const navigation = vi.hoisted(() => ({ open: vi.fn() }));
vi.mock("@/features/study-sessions/session-navigation", () => ({ openStudySession: navigation.open }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
const sessionId = "11111111-1111-4111-8111-111111111111";
const steps = ["q1", "q2"].map(id => ({ stableId: `a-${id}`, questionId: id, node: <p>Questão {id}</p> }));
const answer = (questionId: string) => act(() => { window.dispatchEvent(new CustomEvent(ATTEMPT_RECORDED_EVENT, { detail: { questionId, stem: "", correct: true } })); });

describe("PracticeBlockStepper", () => {
  it("shows one Question at a time and moves on only after an answer", () => {
    render(<PracticeBlockStepper sessionId={sessionId} steps={steps} answeredQuestionIds={[]} />);
    expect(screen.getByText("1 de 2")).toBeVisible();
    expect(screen.getByText("Questão q1")).toBeVisible();
    expect(screen.getByText("Questão q2")).not.toBeVisible();
    expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();
    answer("q1");
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(screen.getByText("2 de 2")).toBeVisible();
    expect(screen.getByText("Questão q2")).toBeVisible();
    expect(screen.getByText("Questão q1")).not.toBeVisible();
  });
  it("resumes at the first unanswered Question, completes on the last answer and opens the summary", async () => {
    const fetch = vi.fn(async () => Response.json({ sessionId, status: "COMPLETED" }));
    vi.stubGlobal("fetch", fetch);
    render(<PracticeBlockStepper sessionId={sessionId} steps={steps} answeredQuestionIds={["q1"]} />);
    expect(screen.getByText("2 de 2")).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
    answer("q2");
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/study-sessions", expect.objectContaining({ body: JSON.stringify({ action: "complete", sessionId }) })));
    fireEvent.click(await screen.findByRole("button", { name: "Ver resumo" }));
    expect(navigation.open).toHaveBeenCalledWith(sessionId);
  });
  it("offers a retry when closing the block fails", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetch);
    render(<PracticeBlockStepper sessionId={sessionId} steps={steps} answeredQuestionIds={["q1", "q2"]} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível fechar o bloco");
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});

describe("PracticeBlockButton", () => {
  it("starts a block for its target with no time choice and opens it", async () => {
    const fetch = vi.fn(async () => Response.json({ sessionId, status: "ACTIVE" }));
    vi.stubGlobal("fetch", fetch);
    render(<PracticeBlockButton target={{ kind: "review", conceptId: "MAT.X" }} label="Praticar este conceito" ariaLabel="Praticar Porcentagem" />);
    expect(screen.queryByRole("combobox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Praticar Porcentagem" }));
    await waitFor(() => expect(navigation.open).toHaveBeenCalledWith(sessionId));
    expect(fetch).toHaveBeenCalledWith("/api/study-sessions", expect.objectContaining({ body: JSON.stringify({ action: "practice_block", target: { kind: "review", conceptId: "MAT.X" } }) }));
  });
  it("explains an empty target with a lesson link", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: "content_gap", message: "Sem questões novas para este conceito agora. Volte amanhã ou revise a aula." }, { status: 409 })));
    render(<PracticeBlockButton target={{ kind: "review", conceptId: "MAT.X" }} label="Praticar este conceito" lessonHref="/concepts/MAT.X" />);
    fireEvent.click(screen.getByRole("button", { name: "Praticar este conceito" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sem questões novas para este conceito agora.");
    expect(screen.getByRole("link", { name: "Revisar a aula" })).toHaveAttribute("href", "/concepts/MAT.X");
  });
  it("keeps the paywall link for accounts without full access", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: "paid_access_required", message: "A prática de revisão e de erros faz parte do acesso completo do Estudisc." }, { status: 403 })));
    render(<PracticeBlockButton target={{ kind: "review" }} label="Revisar agora" />);
    fireEvent.click(screen.getByRole("button", { name: "Revisar agora" }));
    expect(await screen.findByRole("link", { name: "Ver acesso completo" })).toHaveAttribute("href", "/upgrade");
  });
});
```

(`paidAccessRequiredResponse` in `src/features/payments/activity-access.ts` answers `403 { code: "paid_access_required", message }`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run tests/component/practice-block.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the button**

Create `src/features/study-sessions/practice-block-button.tsx`:

```tsx
"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { openStudySession } from "./session-navigation";
import { apiErrorSchema, readValidatedResponse, sessionResponseSchema } from "@/lib/api-response";
import type { PracticeBlockTarget } from "./practice-block";

type Props = Readonly<{ target: PracticeBlockTarget; label: string; ariaLabel?: string; variant?: "primary" | "secondary"; lessonHref?: string }>;
const subscribe = () => () => {};

/** ADR 0072: one tap starts (or resumes) a block of up to five Questions for this target; there is no time choice. */
export function PracticeBlockButton({ target, label, ariaLabel, variant = "primary", lessonHref }: Props) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [locked, setLocked] = useState(false), [empty, setEmpty] = useState(false);
  async function start() {
    if (busy) return;
    setBusy(true); setError(""); setLocked(false); setEmpty(false);
    try {
      const response = await fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "practice_block", target }) });
      if (!response.ok) {
        const failure = apiErrorSchema.safeParse(await response.json().catch(() => null));
        setLocked(failure.success && failure.data.code === "paid_access_required");
        setEmpty(failure.success && failure.data.code === "content_gap");
        throw new Error(failure.success ? failure.data.message ?? "Esta prática não está disponível agora." : "Não foi possível preparar a prática. Tente novamente.");
      }
      openStudySession((await readValidatedResponse(response, sessionResponseSchema)).sessionId);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Falha de conexão. Você pode tentar novamente.");
      setBusy(false);
    }
  }
  return <div className="practice-block-start" aria-busy={busy}>
    <button className={variant === "primary" ? "primary-button" : "secondary-button"} type="button" aria-label={busy ? undefined : ariaLabel} disabled={!ready || busy} onClick={() => void start()}>{busy ? "Preparando…" : label}</button>
    {error && <p role="alert">{error}{locked && <> <Link href="/upgrade">Ver acesso completo</Link></>}{empty && lessonHref && <> <Link href={lessonHref}>Revisar a aula</Link></>}</p>}
  </div>;
}
```

- [ ] **Step 4: Write the stepper**

Create `src/features/study-sessions/practice-block-stepper.tsx`:

```tsx
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ATTEMPT_RECORDED_EVENT, type AttemptRecordedDetail } from "@/features/progress/live-progress-summary";
import { openStudySession } from "./session-navigation";

type Step = Readonly<{ stableId: string; questionId: string; node: ReactNode }>;

/**
 * ADR 0072: one Question at a time. The question panel records each Attempt; this component only moves between
 * steps and completes the block once every Question has an Attempt (whichever tab answered it).
 */
export function PracticeBlockStepper({ sessionId, steps, answeredQuestionIds }: Readonly<{ sessionId: string; steps: readonly Step[]; answeredQuestionIds: readonly string[] }>) {
  const [answered, setAnswered] = useState(() => new Set(answeredQuestionIds));
  const [index, setIndex] = useState(() => { const open = steps.findIndex(step => !answeredQuestionIds.includes(step.questionId)); return open === -1 ? steps.length - 1 : open; });
  const [closed, setClosed] = useState(false), [error, setError] = useState("");
  const closing = useRef(false), progress = useRef<HTMLParagraphElement>(null);
  const total = steps.length, current = steps[index], count = steps.filter(step => answered.has(step.questionId)).length, done = count === total;
  useEffect(() => {
    const onAttempt = (event: Event) => {
      const detail = (event as CustomEvent<AttemptRecordedDetail>).detail;
      if (detail?.questionId) setAnswered(previous => new Set(previous).add(detail.questionId));
    };
    window.addEventListener(ATTEMPT_RECORDED_EVENT, onAttempt);
    return () => window.removeEventListener(ATTEMPT_RECORDED_EVENT, onAttempt);
  }, []);
  async function complete() {
    if (closing.current) return;
    closing.current = true;
    try {
      const response = await fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", sessionId }) });
      if (!response.ok) throw new Error("complete failed");
      setError(""); setClosed(true);
    } catch {
      closing.current = false;
      setError("Não foi possível fechar o bloco. Tente de novo.");
    }
  }
  useEffect(() => { if (done) void complete(); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  function next() {
    setIndex(index + 1);
    window.scrollTo({ top: 0 });
    progress.current?.focus();
  }
  if (!current) return null;
  return <div className="practice-block">
    <div className="practice-block-progress">
      <p ref={progress} tabIndex={-1} aria-live="polite">{index + 1} de {total}</p>
      <progress max={total} value={count} aria-label="Questões respondidas no bloco" />
    </div>
    {steps.map((step, position) => <div key={step.stableId} hidden={position !== index}>{step.node}</div>)}
    <div className="practice-block-next">
      {answered.has(current.questionId) && index < total - 1 && <button className="primary-button" type="button" onClick={next}>Próxima</button>}
      {done && (closed
        ? <button className="primary-button" type="button" onClick={() => openStudySession(sessionId)}>Ver resumo</button>
        : error ? <button className="primary-button" type="button" onClick={() => void complete()}>Tentar de novo</button>
        : <p role="status">Fechando o bloco…</p>)}
      {error && <p role="alert">{error}</p>}
    </div>
  </div>;
}
```

If the repo's ESLint config does not use `react-hooks/exhaustive-deps`, drop the disable comment; if it flags `complete` as a dependency, wrap `complete` in `useCallback` with `[sessionId]`.

- [ ] **Step 5: Run component tests**

Run: `pnpm exec vitest run tests/component/practice-block.test.tsx`
Expected: PASS.

- [ ] **Step 6: Write the server pages and CSS**

Create `src/features/study-sessions/practice-block-page.tsx`:

```tsx
import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import "@/styles/practice-block.css";
import { AppShell } from "@/components/layout/app-shell";
import { MathText } from "@/components/ui/paragraphs";
import { ActivityList } from "@/features/activities/registry";
import { getOwnerId } from "@/features/auth/owner";
import { getConcept } from "@/features/concepts/api";
import { studentConceptLabel } from "@/features/concepts/student-label";
import { getFeatureFlags } from "@/lib/feature-flags";
import type { SessionItem } from "./contracts";
import { studySessionRepository } from "./api";
import { blockConceptId, blockQuestions, summarizeBlock, type BlockAnswer, type BlockMark, type PracticeBlockTarget } from "./practice-block";
import { PracticeBlockButton } from "./practice-block-button";
import { PracticeBlockStepper } from "./practice-block-stepper";

export type BlockResult = Readonly<{ session: Readonly<{ id: string; status: string }>; items: SessionItem[]; answers: readonly BlockAnswer[] }>;
const markLabel: Record<BlockMark, string> = { independent: "Acertou sem ajuda", retry: "Volta na revisão", open: "Não respondida" };

/** ADR 0072: a practice block, one Question at a time while ACTIVE, then its summary. */
export async function PracticeBlockPage({ result, target }: Readonly<{ result: BlockResult; target: PracticeBlockTarget }>) {
  const { session, items } = result;
  const questions = blockQuestions(items), summary = summarizeBlock(questions, result.answers);
  const back = target.kind === "remediation" ? { href: "/mistakes", label: "Voltar para Erros" } : { href: "/review", label: "Voltar para Revisão" };
  const conceptId = target.kind === "review" ? target.conceptId ?? null : blockConceptId(items);
  const concept = conceptId ? await getConcept(conceptId) : null;
  const title = concept ? studentConceptLabel(concept.title) : target.kind === "review" ? "Revisão" : "Prática";
  const header = <header className="study-header"><p className="eyebrow">{target.kind === "remediation" ? "Erros" : "Revisão"}</p><h1>{title}</h1></header>;
  if (session.status === "ACTIVE") {
    const steps = questions.map(question => {
      const snapshot = items[question.itemIndex].activitySnapshots!.find(activity => activity.stableId === question.stableId)!;
      return { stableId: question.stableId, questionId: question.questionId, node: <ActivityList activities={[{ ...snapshot, studySessionId: session.id }]} /> };
    });
    return <AppShell mode={getFeatureFlags().FEATURE_INTERACTIVE_LESSONS ? "focus" : "page"} exit={back}>
      <article className="foundation-panel content-panel practice-block-page" data-status="ACTIVE">
        {header}
        <PracticeBlockStepper sessionId={session.id} steps={steps} answeredQuestionIds={summary.rows.filter(row => row.mark !== "open").map(row => row.questionId)} />
      </article>
    </AppShell>;
  }
  const hasMore = session.status === "COMPLETED" && await studySessionRepository().blockHasMore(await getOwnerId(), target);
  return <AppShell>
    <article className="foundation-panel content-panel practice-block-page" data-status={session.status}>
      {header}
      <section className="practice-block-summary" aria-labelledby="block-summary-title">
        <h2 id="block-summary-title"><strong>{summary.independent} de {summary.total}</strong> sem ajuda</h2>
        <p>{session.status === "ABANDONED" ? "Você trocou este bloco por outra prática. As respostas dadas continuam valendo." : "As questões marcadas com ↺ voltam na sua revisão."}</p>
        <ol className="practice-block-results" aria-label="Questões do bloco">
          {summary.rows.map(row => <li key={row.stableId} data-mark={row.mark}>
            <span className="practice-block-mark" aria-hidden="true">{row.mark === "independent" ? <Check /> : <RotateCcw />}</span>
            <span className="practice-block-result-text"><span className="practice-block-stem"><MathText text={row.prompt} /></span><small>{markLabel[row.mark]}</small></span>
          </li>)}
        </ol>
        <div className="practice-block-actions">
          {hasMore && <PracticeBlockButton target={target} label="Mais 5" />}
          <Link className={hasMore ? "secondary-action" : "primary-action"} href={back.href}>Voltar</Link>
        </div>
      </section>
    </article>
  </AppShell>;
}
```

Create `src/features/study-sessions/legacy-session-summary.tsx`:

```tsx
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

/** ADR 0072: time-budget sessions are retired; an old link shows what was answered and leads back to Hoje. */
export function LegacySessionSummary({ result }: Readonly<{ result: Readonly<{ session: Readonly<{ status: string }>; answered: number; correct: number }> }>) {
  return <AppShell>
    <article className="foundation-panel content-panel study-session" data-status={result.session.status}>
      <header className="study-header"><p className="eyebrow">Estudo anterior</p><h1>Este estudo foi encerrado</h1></header>
      <p>Agora você estuda pelas aulas e pratica revisões e erros em blocos curtos. As respostas que você deu aqui continuam valendo.</p>
      <ul className="session-tally">
        <li><strong>{result.answered}</strong> {result.answered === 1 ? "questão respondida" : "questões respondidas"}</li>
        <li><strong>{result.correct}</strong> {result.correct === 1 ? "correta" : "corretas"}</li>
      </ul>
      <Link className="primary-action" href="/">Ir para Hoje</Link>
    </article>
  </AppShell>;
}
```

Replace the whole content of `src/app/study/[sessionId]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import { z } from "zod";
import { getOwnerId } from "@/features/auth/owner";
import { studySessionRepository } from "@/features/study-sessions/api";
import { readPracticeBlockTarget } from "@/features/study-sessions/practice-block";
import { PracticeBlockPage } from "@/features/study-sessions/practice-block-page";
import { LegacySessionSummary } from "@/features/study-sessions/legacy-session-summary";
export const dynamic="force-dynamic";
/** ADR 0072: practice blocks render here; any other (legacy) session shows a read-only summary. */
export default async function StudyPage({params}:{params:Promise<{sessionId:string}>}){
  const {sessionId}=await params;if(!z.uuid().safeParse(sessionId).success)notFound();
  const result=await studySessionRepository().result(await getOwnerId(),sessionId);if(!result)notFound();
  const target=readPracticeBlockTarget(result.session.policyVersion);
  return target?<PracticeBlockPage result={result} target={target}/>:<LegacySessionSummary result={result}/>;
}
```

Create `src/styles/practice-block.css` (mirrors `src/styles/history.css` tokens):

```css
/* ADR 0072: practice blocks (Revisão, Erros) — progress, one Question at a time, summary. */
.practice-block-page { gap: var(--estudisc-spacing-8); }
.practice-block { display: grid; gap: var(--estudisc-spacing-6); }
.practice-block-progress { display: grid; gap: 6px; }
.practice-block-progress p { margin: 0; font-weight: 800; font-size: 0.9375rem; }
.practice-block-progress p:focus { outline: none; }
.practice-block-progress progress { width: 100%; height: 10px; appearance: none; border: 2px solid var(--estudisc-color-ink); border-radius: 999px; overflow: hidden; background: var(--estudisc-color-panel); }
.practice-block-progress progress::-webkit-progress-bar { background: var(--estudisc-color-panel); }
.practice-block-progress progress::-webkit-progress-value { background: var(--estudisc-color-surface-lime); }
.practice-block-progress progress::-moz-progress-bar { background: var(--estudisc-color-surface-lime); }
.practice-block-next { display: grid; gap: var(--estudisc-spacing-4); }
.practice-block-next .primary-button { min-height: 48px; width: 100%; }
.practice-block-summary { display: grid; gap: var(--estudisc-spacing-6); }
.practice-block-summary h2 { margin: 0; font-size: clamp(1.5rem, 7vw, 2rem); }
.practice-block-results { margin: 0; padding: 0; list-style: none; overflow: hidden; border: 3px solid var(--estudisc-color-ink); border-radius: 16px; background: var(--estudisc-color-panel); }
.practice-block-results li { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; }
.practice-block-results li + li { border-top: 2px solid color-mix(in srgb, var(--estudisc-color-ink) 15%, transparent); }
.practice-block-mark { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin-top: 2px; border: 2px solid var(--estudisc-color-ink); border-radius: 50%; }
.practice-block-mark svg { width: 16px; height: 16px; stroke-width: 3; }
.practice-block-results li[data-mark="independent"] .practice-block-mark { background: var(--estudisc-color-surface-lime); }
.practice-block-results li[data-mark="retry"] .practice-block-mark,
.practice-block-results li[data-mark="open"] .practice-block-mark { background: color-mix(in srgb, var(--estudisc-color-subject-accent-mathematics) 35%, var(--estudisc-color-panel)); }
.practice-block-result-text { display: grid; gap: 4px; min-width: 0; }
.practice-block-stem { font-weight: 700; line-height: 1.35; overflow-wrap: break-word; }
.practice-block-result-text small { color: var(--estudisc-color-dim); font-size: 0.8125rem; }
.practice-block-actions { display: grid; gap: var(--estudisc-spacing-4); }
.practice-block-actions .primary-button, .practice-block-actions a { min-height: 48px; }
.practice-block-start { display: grid; gap: var(--estudisc-spacing-3); }
.practice-block-start p[role="alert"] { margin: 0; }
```

Check that every `--estudisc-spacing-*` used exists in `src/styles/design-tokens.css` (`grep -o "estudisc-spacing-[0-9]*" src/styles/design-tokens.css | sort -u`); replace any missing step with the nearest existing one.

- [ ] **Step 7: Verify**

Run: `pnpm typecheck`
Expected: no errors. If `PracticeBlockPage` rejects `result` from the repository union, loosen `BlockResult.items` to `readonly SessionItem[]`.

Run: `pnpm exec vitest run tests/component/practice-block.test.tsx tests/unit/practice-block.test.ts`
Expected: PASS.

Run: `pnpm lint`
Expected: no errors in the new files.

- [ ] **Step 8: Commit**

```bash
git add src/features/study-sessions/practice-block-button.tsx src/features/study-sessions/practice-block-stepper.tsx src/features/study-sessions/practice-block-page.tsx src/features/study-sessions/legacy-session-summary.tsx src/styles/practice-block.css "src/app/study/[sessionId]/page.tsx" tests/component/practice-block.test.tsx
git commit -m "feat(practice): one-question practice screen, block summary and legacy session summary"
```

---

### Task 5: Revisão and Erros entry points

**Files:**
- Modify: `src/app/review/page.tsx:9` (import), `:49` (list button), `:66-79` (empty copy, queue head, provider)
- Modify: `src/features/review/review-deck.tsx:5`, `:41-42`
- Modify: `src/app/mistakes/page.tsx:9`, `:46-49`, `:55`, `:62`
- Delete: `src/features/study-sessions/targeted-practice-controls.tsx`
- Modify: `tests/component/session-controls.test.tsx` (drop the `TargetedPracticeControls` import and every test that renders it)

**Interfaces:**
- Consumes: `PracticeBlockButton` (Task 4).
- Produces: no new interfaces.

- [ ] **Step 1: Revisão page**

In `src/app/review/page.tsx` replace the import

```ts
import { PracticeMinutesProvider, TargetedPracticeControls } from "@/features/study-sessions/targeted-practice-controls";
```

with

```ts
import { PracticeBlockButton } from "@/features/study-sessions/practice-block-button";
```

Replace the list-item practice control

```tsx
            {enhanced?<TargetedPracticeControls kind="review" conceptId={review.conceptStableId} label={`Praticar ${studentConceptLabel(review.conceptTitle)}`} showTime={false}/>:<form action={completeReviewAction}>
```

with

```tsx
            {enhanced?<PracticeBlockButton target={{kind:"review",conceptId:review.conceptStableId}} label="Praticar este conceito" ariaLabel={`Praticar ${studentConceptLabel(review.conceptTitle)}`} variant="secondary" lessonHref={`/concepts/${review.conceptStableId}`}/>:<form action={completeReviewAction}>
```

Replace the empty-state sentence

```tsx
            <p>As revisões aparecem depois que você responde questões nas sessões de estudo.</p>
```

with

```tsx
            <p>As revisões aparecem depois que você responde questões nas aulas.</p>
```

Replace the queue block

```tsx
          <PracticeMinutesProvider>
            <div className="queue-head">
              <p className="queue-count"><strong>{dueReviews.length}</strong> <span>{dueReviews.length === 1 ? "conceito na fila" : "conceitos na fila"}</span></p>
              {enhanced&&<TargetedPracticeControls kind="review" label="Começar revisão rápida"/>}
            </div>
```

with

```tsx
          <>
            <div className="queue-head">
              <p className="queue-count"><strong>{dueReviews.length}</strong> <span>{dueReviews.length === 1 ? "conceito na fila" : "conceitos na fila"}</span></p>
              {enhanced&&<PracticeBlockButton target={{kind:"review"}} label="Revisar agora"/>}
            </div>
```

and the closing `</PracticeMinutesProvider>` (after the `review-list-toggle` line) with `</>`.

- [ ] **Step 2: Review deck**

In `src/features/review/review-deck.tsx` replace

```ts
import { TargetedPracticeControls } from "@/features/study-sessions/targeted-practice-controls";
```

with

```ts
import { PracticeBlockButton } from "@/features/study-sessions/practice-block-button";
```

and replace

```tsx
          {/* The time is chosen once, above the deck (PracticeMinutesProvider); the card uses it. */}
          <TargetedPracticeControls kind="review" conceptId={card.conceptId} label="Praticar este conceito" ariaLabel={`Praticar ${card.title}`} showTime={false} />
```

with

```tsx
          {/* ADR 0072: a block of up to five Questions of this Concept. */}
          <PracticeBlockButton target={{ kind: "review", conceptId: card.conceptId }} label="Praticar este conceito" ariaLabel={`Praticar ${card.title}`} lessonHref={`/concepts/${card.conceptId}`} />
```

- [ ] **Step 3: Erros page**

In `src/app/mistakes/page.tsx` replace

```ts
import { PracticeMinutesPicker, PracticeMinutesProvider, TargetedPracticeControls } from "@/features/study-sessions/targeted-practice-controls";
```

with

```ts
import { PracticeBlockButton } from "@/features/study-sessions/practice-block-button";
```

Replace

```tsx
        ) : enhanced ? <PracticeMinutesProvider>
          <p>Comece pelo assunto em que você errou mais vezes.</p>
          {/* One practice length for every subject below. */}
          <PracticeMinutesPicker />
```

with

```tsx
        ) : enhanced ? <>
          <p>Comece pelo assunto em que você errou mais vezes.</p>
```

Replace

```tsx
              {group.activeMistakeId&&<TargetedPracticeControls kind="remediation" mistakeId={group.activeMistakeId} showTime={false}/>}
```

with

```tsx
              {group.activeMistakeId&&<PracticeBlockButton target={{kind:"remediation",mistakeId:group.activeMistakeId}} label="Praticar este assunto" lessonHref={`/concepts/${encodeURIComponent(group.conceptId)}`}/>}
```

Replace the closing `</PracticeMinutesProvider> : (` with `</> : (`.

- [ ] **Step 4: Delete the old control and its tests**

```bash
git rm src/features/study-sessions/targeted-practice-controls.tsx
```

In `tests/component/session-controls.test.tsx` delete the line `import { TargetedPracticeControls } from "@/features/study-sessions/targeted-practice-controls";` and every `it(...)` that renders `TargetedPracticeControls` (search the file for `TargetedPracticeControls`).

- [ ] **Step 5: Verify**

Run: `git grep -n "TargetedPracticeControls\|PracticeMinutes\|practice-minutes-picker" -- src tests`
Expected: no matches in `src` or `tests` (CSS selectors for `.practice-minutes-picker` or `.targeted-practice-controls` may remain in `src/styles`; delete those rules too).

Run: `pnpm typecheck && pnpm exec vitest run tests/component tests/unit`
Expected: PASS except tests still bound to `SessionControls` posting `plan` (removed in Task 6). Record any failure output.

- [ ] **Step 6: Commit**

```bash
git add -A src/app/review/page.tsx src/features/review/review-deck.tsx src/app/mistakes/page.tsx src/features/study-sessions tests/component/session-controls.test.tsx src/styles
git commit -m "feat(practice): Revisar agora and Praticar este conceito/assunto start practice blocks"
```

---

### Task 6: Retire the planner surface

**Files:**
- Modify: `src/app/plan/page.tsx` (redirect only)
- Delete: `src/app/api/study-plan/route.ts`, `tests/unit/study-plan-route.test.ts`
- Delete: `src/features/study-sessions/routine-planner.tsx`, `tests/component/routine-planner.test.tsx`, `src/features/study-sessions/routine-api.ts`
- Delete: `src/features/study-sessions/session-controls.tsx`, `tests/component/session-controls.test.tsx`
- Delete: `src/features/today/today-plan.tsx`
- Delete: `src/styles/application/routine.css` (and its `@import` in `src/app/globals.css:22` and its line in `src/styles/README.md`) once no remaining file uses its classes
- Modify: `src/features/today/get-today-dashboard.ts` (full rewrite), `src/features/today/today-page.tsx` (full rewrite), `src/app/page.tsx` (legacy Hoje), `tests/unit/today-dashboard.test.ts`
- Modify: `tests/e2e/percentage-study.spec.ts` (study through lessons instead of "Estudar 15 min")

**Interfaces:**
- Consumes: nothing new.
- Produces: `getTodayDashboard()` returns `{ recommendations, nextAction, queue, dueReviews, mistakes, progress, week, flow }` — no `sessions`, no `routine`; `flow` is always present.

- [ ] **Step 1: Update the dashboard unit test (failing)**

In `tests/unit/today-dashboard.test.ts`:
- delete the `routine` hoisted mock, the `@/features/study-sessions/routine-api` mock and the `@/features/study-sessions/api` mock; remove `sessions` from `mocks`;
- replace the first three `it(...)` blocks (`shares uncapped recent session…`, `loads the continuous study flow only when its flag is on…`, `loads shared recommendation facts once…`) with:

```ts
  it("always loads the continuous study flow and never reads or creates sessions", async () => {
    mocks.inputs.mockResolvedValue({ dueReviews: [], mistakes: [], tracks: [], projects: [] });
    mocks.progress.mockResolvedValue({ ladder: [], cooling: [], week: [] });
    mocks.lessons.mockResolvedValue([]);
    const dashboard = await getTodayDashboard(new Date("2026-10-06T15:00:00Z"));
    expect(dashboard.flow.next?.lesson.id).toBe("MAT-02");
    expect(flow).toHaveBeenCalledWith("owner");
    expect(dashboard).not.toHaveProperty("sessions");
    expect(dashboard).not.toHaveProperty("routine");
    expect(dashboard.nextAction?.href ?? "").not.toMatch(/^\/study\//);
    for (const reader of Object.values(mocks)) expect(reader).toHaveBeenCalledTimes(1);
  });
```

Keep the remaining tests (they call `buildRecommendations` directly).

Run: `pnpm exec vitest run tests/unit/today-dashboard.test.ts`
Expected: FAIL (`flow` is null without the flag; `sessions` present).

- [ ] **Step 2: Rewrite the dashboard loader**

Replace `src/features/today/get-today-dashboard.ts` with:

```ts
import { getOwnerProfile } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { getRecommendationInputs } from "@/features/recommendations/api";
import { buildRecommendations } from "@/features/recommendations/recommendation-rules";
import { listRecommendationLessons } from "@/features/recommendations/lesson-candidates";
import { getProgressOverview } from "@/features/progress/api";
import { getStudyFlow } from "@/features/study-flow/api";

/** One request-scoped coordinator; reviews/mistakes/catalog/projects are each fetched once. */
export async function getTodayDashboard(now = new Date()) {
  const profile = await getOwnerProfile();
  // ADR 0072: Today follows the continuous lesson flow; open sessions and practice blocks are not study paths here.
  const [flow, inputs, progress, lessons] = await Promise.all([
    getStudyFlow(profile.ownerId), getRecommendationInputs(profile), getProgressOverview(now),
    getDatabaseUrl() ? listRecommendationLessons(profile.ownerId) : Promise.resolve([])
  ]);
  const masteryLevels = Object.fromEntries(progress.ladder.flatMap(rung => rung.concepts.map(concept => [concept.stableId, rung.level])));
  const recommendations = buildRecommendations({ ...inputs, lessons, masteryLevels, cooling: progress.cooling }).slice(0, 4);
  return { recommendations, nextAction: recommendations[0], queue: recommendations.slice(1), dueReviews: inputs.dueReviews, mistakes: inputs.mistakes, progress, week: progress.week, flow };
}
```

- [ ] **Step 3: Rewrite the Today page**

Replace `src/features/today/today-page.tsx` with:

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WeekStrip } from "@/features/progress/week-strip";
import type { getTodayDashboard } from "./get-today-dashboard";
import { formatTodayDate } from "./today-date";
import { ContinueStudy } from "@/features/study-flow/continue-study";
import { GoalTower } from "./goal-tower";

type Dashboard = Awaited<ReturnType<typeof getTodayDashboard>>;

export function TodayPage({ dashboard }: Readonly<{ dashboard: Dashboard }>) {
  const activeMistakes = dashboard.mistakes.filter(mistake => mistake.status === "active").length;
  // One count for Today and /review: Concepts due by schedule or with an active mistake.
  const toReview = dashboard.dueReviews.length;
  const withMistakes = dashboard.dueReviews.filter(review => review.hasActiveMistake).length;
  const overview = dashboard.progress;
  return <AppShell><div className="today today-evolution">
    <header className="today-header">
      <p className="today-date">{formatTodayDate()}</p>
      <h1>Hoje</h1>
    </header>
    {/* ADR 0060 / 0072: Today offers the continuous lesson flow; review and mistakes are practised in blocks on their pages. */}
    <ContinueStudy next={dashboard.flow.next} bySubject={dashboard.flow.bySubject} />
    {(toReview > 0 || activeMistakes > 0) && <section className="today-attention" aria-labelledby="attention-title">
      <h2 id="attention-title">Precisa da sua atenção</h2>
      <ul>
        {toReview > 0 && <li><Link href="/review">{toReview} {toReview === 1 ? "conceito para revisar" : "conceitos para revisar"}{withMistakes > 0 ? ` (${withMistakes} com erro)` : ""}<ArrowRight aria-hidden="true" /></Link></li>}
        {activeMistakes > 0 && <li><Link href="/mistakes">Ver meus erros<ArrowRight aria-hidden="true" /></Link></li>}
      </ul>
    </section>}
    <GoalTower answered={overview.week.find(day => day.isToday)?.count ?? 0} />
    <section className="today-week" aria-labelledby="week-title">
      <div className="today-week-head"><h2 id="week-title">Sua semana</h2><Link href="/progress">Ver progresso<ArrowRight aria-hidden="true" /></Link></div>
      <WeekStrip days={overview.week} />
      <p>{overview.activeDaysThisWeek === 0 ? "Nenhum dia com estudo ainda nesta semana. Responder uma questão já marca o dia."
        : `${overview.activeDaysThisWeek} ${overview.activeDaysThisWeek === 1 ? "dia com estudo" : "dias com estudo"} nesta semana.`}</p>
    </section>
  </div></AppShell>;
}
```

- [ ] **Step 4: Strip the legacy Hoje session chooser**

In `src/app/page.tsx`:
- change `import { ArrowRight, Play } from "lucide-react";` to `import { ArrowRight } from "lucide-react";`;
- delete the imports of `SessionControls` and `remainingRoutineMinutes`;
- delete the line `const openSessions = dashboard.sessions.filter(...)`;
- delete the `{openSessions.map(session => ( … ))}` block (the "Continuar de onde parou" / "Sessão de … min" resume cards);
- delete the comment `{/* Without anything to study, the session buttons could only fail; … */}` and the whole `{primaryRecommendation && <section className="time-card" …>…</section>}` block;
- change `formatTodayDate(dashboard.routine?.week?.today)` to `formatTodayDate()`;
- change `"Nenhum dia com estudo ainda nesta semana. Uma sessão curta já marca o dia."` to `"Nenhum dia com estudo ainda nesta semana. Responder uma questão já marca o dia."`.

- [ ] **Step 5: Retire /plan, the study-plan API, routine UI and session controls**

Replace `src/app/plan/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

/** ADR 0072: the planner is retired; old links and post-payment returns that point here land on Hoje. */
export default function PlanPage() {
  redirect("/");
}
```

Then:

```bash
git rm src/app/api/study-plan/route.ts tests/unit/study-plan-route.test.ts src/features/study-sessions/routine-planner.tsx tests/component/routine-planner.test.tsx src/features/study-sessions/routine-api.ts src/features/study-sessions/session-controls.tsx tests/component/session-controls.test.tsx src/features/today/today-plan.tsx
```

Check routine.css users: `grep -o "^\.[a-zA-Z0-9_-]*" src/styles/application/routine.css | sort -u | while read c; do git grep -q -- "${c#.}" -- src ':!src/styles/application/routine.css' && echo "used: $c"; done`. If nothing prints, `git rm src/styles/application/routine.css`, delete its `@import` line in `src/app/globals.css` and its line in `src/styles/README.md`; otherwise keep the file and note it in the commit message.

- [ ] **Step 6: Rewrite the percentage e2e to use lessons**

Replace `tests/e2e/percentage-study.spec.ts` with:

```ts
import { expect,test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
test("studies percentage on mobile through its lessons and keeps answers after reload",async({page,request})=>{
  const fixture=JSON.parse(JSON.stringify(source));fixture.questions.forEach((question:{status:string;exposurePolicy:{minimumDaysBetween:number}})=>{question.status="published";question.exposurePolicy.minimumDaysBetween=0;});fixture.track.modules[0].lessons.forEach((lesson:{status:string})=>lesson.status="published");
  const imported=await request.post("/api/import/track",{data:fixture});expect(imported.ok()).toBeTruthy();
  const openAll=async()=>{await page.getByRole("button",{name:"Ver tudo"}).first().waitFor();for(const toggle of await page.getByRole("button",{name:"Ver tudo"}).all())await toggle.click();};
  await page.goto("/lessons/MAT-PREREQ");await openAll();
  await expect(page.getByRole("img", {name:"Barra dividida em dez partes iguais, das quais três estão destacadas."})).toBeVisible();
  for(const [stem,value] of [["Qual número decimal representa 1/4?","0,25"],["Uma estudante completou 0,4 de uma lista de exercícios. Que porcentagem da lista ela completou?","40%"],["Uma receita usa 2 copos de leite para cada 5 colheres de açúcar. Mantendo a proporção, quantas colheres de açúcar serão usadas com 6 copos de leite?","15"]]){const exercise=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:stem,exact:true})});await exercise.getByRole("radio",{name:value,exact:true}).check();await exercise.getByRole("button",{name:"Enviar resposta"}).click();await expect(exercise.getByRole("status",{name:"Resultado da resposta"})).toContainText("Resposta correta");}
  await page.goto("/lessons/MAT-07");const url=page.url();await openAll();await expect(page.getByRole("heading",{name:"Explore a porcentagem"})).toBeVisible();
  const exercise=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Calcule 20% de 150.",exact:true})});
  await exercise.getByRole("textbox").fill("30");await exercise.getByRole("button",{name:"Enviar resposta"}).click();await expect(exercise.getByRole("status",{name:"Resultado da resposta"})).toContainText("Resposta correta");
  await expect(exercise.getByRole("button",{name:"Resposta registrada"})).toBeDisabled();const button=await exercise.getByRole("button",{name:"Resposta registrada"}).boundingBox();expect(button!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.reload();expect(page.url()).toBe(url);await openAll();
  await expect(page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Calcule 20% de 150.",exact:true})}).getByRole("status",{name:"Resultado da resposta"})).toContainText("Resposta correta");
});
```

- [ ] **Step 7: Verify**

Run: `git grep -n "SessionControls\|TodayPlan\|RoutinePlanner\|studyPlanRepository\|routine-api\|today-plan\|dashboard.sessions\|dashboard.routine" -- src tests`
Expected: no matches.

Run: `pnpm typecheck && pnpm exec vitest run tests/unit tests/component`
Expected: PASS.

Run: `pnpm test:e2e tests/e2e/percentage-study.spec.ts tests/e2e/shell.spec.ts`
Expected: PASS on chromium and mobile-chrome.

- [ ] **Step 8: Commit**

```bash
git add -A src tests
git commit -m "feat(practice): retire the planner, session chooser and /plan page (ADR 0072)"
```

---

### Task 7: Retire the planner, adaptive-session and continuous-study flags

**Files:**
- Modify: `src/lib/feature-flags.ts`, `tests/unit/feature-flags.test.ts`
- Modify: `src/features/study-sessions/api.ts`, `src/app/continuar/route.ts`, `src/app/tracks/page.tsx`, `src/app/voce/page.tsx`
- Delete: `src/features/tracks/learning-catalog.tsx`, `tests/component/learning-catalog.test.tsx`, `tests/e2e/learning-catalog.spec.ts`
- Delete: `tests/e2e/routine-planner.spec.ts`, `tests/e2e/session-navigation.spec.ts`, `tests/e2e/adaptive-session.spec.ts`
- Modify: `tests/e2e/foundation-evolution.spec.ts` (full rewrite), `tests/e2e/continuous-study.spec.ts:5`, `package.json` (`test:e2e:critical`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `FeatureFlags` no longer has `FEATURE_STUDY_PLANNER`, `FEATURE_ADAPTIVE_SESSION`, `FEATURE_CONTINUOUS_STUDY` (extra env keys are ignored by the schema).

- [ ] **Step 1: Update the flag test (failing)**

In `tests/unit/feature-flags.test.ts` replace the second test with:

```ts
  it("enables independent explicit flags without serializing unrelated configuration", () => {
    const flags = getFeatureFlags({ FEATURE_KNOWLEDGE_MAP: "true", FEATURE_NEW_TODAY: "false", AUTH_SECRET: "private" });
    expect(flags.FEATURE_KNOWLEDGE_MAP).toBe(true);
    expect(flags.FEATURE_NEW_TODAY).toBe(false);
    expect(flags).not.toHaveProperty("AUTH_SECRET");
    expect(getServerEnv({ FEATURE_INTERACTIVE_LESSONS: "true" }).FEATURE_INTERACTIVE_LESSONS).toBe(true);
  });

  it("ignores the flags retired by ADR 0072 even when production still sets them", () => {
    const flags = getFeatureFlags({ FEATURE_STUDY_PLANNER: "true", FEATURE_ADAPTIVE_SESSION: "true", FEATURE_CONTINUOUS_STUDY: "true" });
    for (const retired of ["FEATURE_STUDY_PLANNER", "FEATURE_ADAPTIVE_SESSION", "FEATURE_CONTINUOUS_STUDY"]) expect(flags).not.toHaveProperty(retired);
  });
```

Run: `pnpm exec vitest run tests/unit/feature-flags.test.ts`
Expected: FAIL on the retired-flags test.

- [ ] **Step 2: Remove the flags and their branches**

`src/lib/feature-flags.ts`: delete the three lines `FEATURE_STUDY_PLANNER: flag,`, `FEATURE_CONTINUOUS_STUDY: flag,`, `FEATURE_ADAPTIVE_SESSION: flag,`.

`src/features/study-sessions/api.ts`: replace the whole file with:

```ts
import { getDatabaseUrl } from "@/db/connection";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { MemoryStudySessionRepository } from "@/db/repositories/memory-study-session-repository";
// ADR 0072: the product only starts practice blocks; the engine's routine and adaptive planning modes stay off.
export function studySessionRepository(){return getDatabaseUrl()==="memory://local"?new MemoryStudySessionRepository():new StudySessionRepository();}
```

`src/app/continuar/route.ts`: delete the `getFeatureFlags` import and change

```ts
      getFeatureFlags().FEATURE_CONTINUOUS_STUDY ? getStudyFlow(profile.ownerId) : Promise.resolve(null),
```

to

```ts
      getStudyFlow(profile.ownerId),
```

and `next: flow?.next ?? null` to `next: flow.next ?? null`.

`src/app/tracks/page.tsx`: change the import `import { listTracks,getTrack } from "@/features/tracks/api";` to `import { listTracks } from "@/features/tracks/api";`; delete the `getFeatureFlags` and `LearningCatalog` imports; delete `const enhanced = …` and `const details = …`; change the redirect condition to `if (tracks.status === "ok" && tracks.items.length === 1)`; change `) : enhanced ? <LearningCatalog tracks={details}/> : (` to `) : (`.

`src/app/voce/page.tsx`: delete the `{ href: "/plan", label: "Plano", … }` entry from `STUDY`, delete the comment and the `studyLinks` function, change `<Section title="Para estudar" links={studyLinks(getFeatureFlags().FEATURE_STUDY_PLANNER)} />` to `<Section title="Para estudar" links={STUDY} />`; remove `CalendarDays` and `getFeatureFlags` imports if now unused.

```bash
git rm src/features/tracks/learning-catalog.tsx tests/component/learning-catalog.test.tsx tests/e2e/learning-catalog.spec.ts tests/e2e/routine-planner.spec.ts tests/e2e/session-navigation.spec.ts tests/e2e/adaptive-session.spec.ts
```

If `src/features/tracks/learning-catalog.tsx` had a CSS file or rules only it used (`git grep -n "learning-catalog" -- src/styles`), delete those rules too.

- [ ] **Step 3: Update the remaining e2e specs**

Replace `tests/e2e/foundation-evolution.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";

test.describe("flagged study foundation", () => {
  test.skip(process.env.FEATURE_NEW_TODAY !== "true" || process.env.FEATURE_INTERACTIVE_LESSONS !== "true", "Run this suite with the study foundation flags enabled.");

  test("keeps five touch destinations without horizontal scroll", async ({ page }) => {
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      const primary = page.getByRole("navigation", { name: "Navegação principal", exact: true });
      await expect(primary.getByRole("link")).toHaveCount(5);
      for (const link of await primary.getByRole("link").all()) {
        const bounds = await link.boundingBox();
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });

  test("redirects the retired planner to Hoje", async ({ page }) => {
    await page.goto("/plan");
    await expect(page).toHaveURL(/\/$/);
  });
});
```

In `tests/e2e/continuous-study.spec.ts` line 5 remove `process.env.FEATURE_CONTINUOUS_STUDY !== "true" || ` from the skip condition.

In `package.json` remove ` tests/e2e/session-navigation.spec.ts` from `test:e2e:critical`.

- [ ] **Step 4: Verify**

Run: `git grep -n "FEATURE_STUDY_PLANNER\|FEATURE_ADAPTIVE_SESSION\|FEATURE_CONTINUOUS_STUDY\|LearningCatalog" -- src tests scripts package.json playwright.config.ts`
Expected: no matches.

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A src tests package.json
git commit -m "chore(flags): retire planner, adaptive-session and continuous-study flags (ADR 0072)"
```

---

### Task 8: E2E — Revisão and Erros practice blocks

**Files:**
- Modify: `tests/e2e/review-mistake-loop.spec.ts` (full rewrite below)

**Interfaces:**
- Consumes: `reviewMistakeFixture()` from `tests/fixtures/review-mistake-loop.ts` (lesson `REVIEW-MISTAKE-PILOT`, two numeric Questions on one Concept: "Quanto é 2 + 3 nesta fixture?" = 5, "Quanto é 3 + 4 nesta fixture?" = 7).
- Produces: e2e coverage of "Praticar este conceito" (block of 2, resume after reload, summary), "Praticar este assunto" (block of 1, other Question only), no time selectors, mistake resolution.

One spec file keeps the whole loop because the memory store and the owner are shared across spec files in one Playwright process; a second spec importing the same fixture would see this one's Attempts.

- [ ] **Step 1: Rewrite the spec**

Replace `tests/e2e/review-mistake-loop.spec.ts` with:

```ts
import { expect,test,type Page } from "@playwright/test";
import { reviewMistakeFixture } from "../fixtures/review-mistake-loop";
const answers:Record<string,string>={"Quanto é 2 + 3 nesta fixture?":"5","Quanto é 3 + 4 nesta fixture?":"7"};
/** Answers the Question on screen; `wrong` sends a value that is never correct. Returns its stem. */
async function answerVisible(page:Page,wrong=false){
  const question=page.locator("section.learning-interaction:visible");
  const stem=(await question.getByRole("heading").first().textContent())?.trim()??"";
  await question.getByRole("textbox").fill(wrong?"999":answers[stem]);await question.getByRole("button",{name:"Enviar resposta",exact:true}).click();
  await expect(question.getByRole("status",{name:"Resultado da resposta"})).toContainText(wrong?"Ainda não":"Resposta correta");
  return stem;
}
test("keeps practice blocks disabled before rollout",async({request})=>{
  test.skip(process.env.FEATURE_SMART_MISTAKES==="true","Checks flag off.");
  expect((await request.post("/api/study-sessions",{data:{action:"practice_block",target:{kind:"review"}}})).status()).toBe(404);
});
test("observes a mistake, records a reflection, practises review and the mistake in blocks and preserves history",async({page,request},testInfo)=>{
  test.skip(process.env.FEATURE_SMART_MISTAKES!=="true","Enable smart mistakes for the loop.");test.setTimeout(120000);
  const pack=reviewMistakeFixture();const conceptId=pack.track.modules.flatMap(m=>m.lessons).find(l=>l.id==="REVIEW-MISTAKE-PILOT")!.concepts[0].id;
  const imported=await request.post("/api/import/track",{data:pack});expect(imported.ok(),await imported.text()).toBe(true);
  await page.goto("/lessons/REVIEW-MISTAKE-PILOT");await page.getByRole("button",{name:"Ver tudo",exact:true}).click();
  const first=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Quanto é 2 + 3 nesta fixture?",exact:true})});
  await first.getByRole("textbox").fill("999");
  const firstSubmit=first.getByRole("button",{name:"Enviar resposta",exact:true});
  if(testInfo.project.use.isMobile)await firstSubmit.tap();else await firstSubmit.press("Enter");
  await expect(first.getByRole("status",{name:"Resultado da resposta"})).toContainText("Ainda não");
  await page.goto("/mistakes");await expect(page.getByText("Errou uma vez",{exact:true})).toBeVisible();await expect(page.getByText(/Você errou 1 vez neste assunto/)).toBeVisible();
  await page.getByText("Registrar minha percepção",{exact:true}).click();
  await page.getByRole("combobox",{name:"O que você percebeu?"}).selectOption("calculation_error");
  await page.getByRole("textbox",{name:"Anotação opcional"}).fill("Somei sem conferir.");
  const saveReflection=page.getByRole("button",{name:"Registrar percepção",exact:true});
  if(testInfo.project.use.isMobile)await saveReflection.tap();else await saveReflection.click();
  await expect(page.getByText(/Percepção registrada como relato seu/)).toBeVisible();
  await expect(page.getByRole("combobox",{name:/Tempo/})).toHaveCount(0);

  // Revisão: both Questions of the Concept in one block; leaving mid-block resumes at the next Question.
  await page.goto("/review");await expect(page.getByRole("combobox",{name:/Tempo/})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Revisar agora",exact:true})).toBeVisible();
  await page.getByText("Ver a fila em lista",{exact:true}).click();
  await page.getByRole("list",{name:"Revisões vencidas"}).getByRole("listitem").filter({has:page.locator(`a[href="/concepts/${conceptId}"]`)}).getByRole("button",{name:/^Praticar /}).click();
  await page.waitForURL(/\/study\//);await expect(page.getByText("1 de 2",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:/Concluir sessão|Começar sessão/})).toHaveCount(0);
  await answerVisible(page,true);
  await page.getByRole("button",{name:"Próxima",exact:true}).click();await expect(page.getByText("2 de 2",{exact:true})).toBeVisible();
  const url=page.url();await page.reload();expect(page.url()).toBe(url);await expect(page.getByText("2 de 2",{exact:true})).toBeVisible();
  for(const width of [390,320]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.screenshot({path:testInfo.outputPath(`practice-block-${width}.png`),fullPage:true});}
  await answerVisible(page,true);
  await page.getByRole("button",{name:"Ver resumo",exact:true}).click();
  await expect(page.getByRole("heading",{name:"0 de 2 sem ajuda"})).toBeVisible();
  await expect(page.getByRole("list",{name:"Questões do bloco"}).getByRole("listitem")).toHaveCount(2);
  for(const width of [390,320]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.screenshot({path:testInfo.outputPath(`practice-summary-${width}.png`),fullPage:true});}
  await page.getByRole("link",{name:"Voltar",exact:true}).click();await expect(page).toHaveURL(/\/review$/);

  // Erros: the other Question only (the missed one stays out); a right answer without help corrects the mistakes.
  await page.goto("/mistakes");await page.getByRole("button",{name:"Praticar este assunto",exact:true}).click();
  await page.waitForURL(/\/study\//);await expect(page.getByText("1 de 1",{exact:true})).toBeVisible();
  await answerVisible(page);
  await page.getByRole("button",{name:"Ver resumo",exact:true}).click();await expect(page.getByRole("heading",{name:"1 de 1 sem ajuda"})).toBeVisible();
  await page.getByRole("link",{name:"Voltar",exact:true}).click();await expect(page).toHaveURL(/\/mistakes$/);
  await expect(page.getByText(/Já está corrigido\./)).toBeVisible();await page.getByText("Ver cada erro",{exact:true}).click();await expect(page.getByText(/· corrigido/).first()).toBeVisible();await expect(page.getByText(/· para corrigir/)).toHaveCount(0);
  for(const width of [320,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:testInfo.outputPath(`mistake-loop-${width}.png`),fullPage:true});}
});
```

- [ ] **Step 2: Run without the flag (off case)**

Run: `pnpm test:e2e tests/e2e/review-mistake-loop.spec.ts`
Expected: the off-case test PASSES on both projects; the loop test is skipped.

- [ ] **Step 3: Run with the flags (loop case)**

Run (Git Bash): `FEATURE_SMART_MISTAKES=true FEATURE_NEW_TODAY=true FEATURE_INTERACTIVE_LESSONS=true pnpm test:e2e tests/e2e/review-mistake-loop.spec.ts`
Expected: the loop test PASSES on chromium and mobile-chrome.

If it fails, debug with the screenshots in `test-results/<project>/…` before changing assertions. Known traps from this repo: Playwright strict mode when two elements share a label (scope with `getByRole("list", { name })`), NBSP in names (use regex), and `:visible` needing the hidden steps to carry the `hidden` attribute. If the review list button cannot be found because the list item's link is URL-encoded, match on `a[href*="${conceptId}"]`. If "Já está corrigido." does not appear, read `groupMistakeObservations` (`src/features/mistakes/mistake-patterns.ts`) to confirm which mistakes an independent answer resolves and adjust only the assertion, not the domain rule.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/review-mistake-loop.spec.ts
git commit -m "test(e2e): Revisão and Erros practice blocks with resume and summary"
```

---

### Task 9: ADR 0072, docs and full acceptance

**Files:**
- Create: `docs/ADR/0072-practice-blocks.md`
- Modify: `CHANGELOG.md` (new top entry), `PLANS.md` (practice-blocks section NEXT ACTION), `PROJECT_STATUS.md` (current state), `docs/superpowers/specs/2026-10-18-practice-blocks-design.md` (Status line)
- Modify: `design-system/COMPONENT_REGISTRY.md`, `design-system/SCREEN_SPECS.md`, `design-system/DESIGN_SYSTEM_INDEX.md`, `DESIGN.md` — only the lines that name `SessionControls`, `TargetedPracticeControls`, `RoutinePlanner`, `/plan`, time-budget sessions or the three retired flags.

- [ ] **Step 1: Write ADR 0072**

Create `docs/ADR/0072-practice-blocks.md`:

```md
# ADR 0072 — Practice blocks replace time-budget sessions

Status: Accepted
Date: 2026-10-18
Supersedes ADR 0021 (deterministic planner) and ADR 0041 (weekly routine), point 7 of ADR 0060, and the time-budget part of ADR 0042 (its frozen activity snapshots stay).

## Context

ADR 0060 made continuous lessons the main study path, but Revisão and Erros still opened `/study/<id>` time-budget sessions ("Sessão de 10 min", lesson blocks, "Começar/Concluir sessão"), students still chose 10 or 15 minutes, and the weekly planner and `/plan` stayed behind flags. The owner found the flow confusing.

## Decision

1. **Study paths.** Hoje and Estudar open whole lessons (ADR 0060). Revisão and Erros practise in **blocks of up to 5 Questions**, one at a time, with a summary ("3 de 5 sem ajuda", ✓/↺, "Mais 5", "Voltar"). No time choice anywhere.
2. **Engine.** A block is a targeted `study_sessions` row created ACTIVE. Selection is unchanged (`TargetedSelection`, exposure policy, reserved Questions excluded, remediation excludes the missed Question); composition reuses the adaptive choices with an internal 60-minute budget and keeps the first 5 Questions. Items are `delivery: "questions"` with frozen snapshots.
3. **Target and resume.** `policyVersion` is `practice-block.v1|{target}` (`{kind:"review"}`, `{kind:"review",conceptId}`, `{kind:"remediation",mistakeId}`). The same target resumes the ACTIVE block at its first unanswered Question; a different target abandons it (Attempts keep counting). No migration.
4. **Completion and summary.** The screen completes the block when every Question has an Attempt. "Sem ajuda" counts a Question whose first Attempt in the block passed with no hint, no solution and no guess (ADR 0071). "Mais 5" appears when the same target still composes a block.
5. **API.** `POST /api/study-sessions` accepts `practice_block` and `complete`/`abandon`; `plan`, `quick_review`, `practice_mistake` and `start` are rejected. `FEATURE_SMART_MISTAKES` still gates the entry points; full access is still required.
6. **Retired.** `/plan` (redirects to Hoje), `/api/study-plan`, the routine planner UI, `SessionControls`, `TargetedPracticeControls` and the practice time pickers, the session chooser on Hoje, the enhanced catalog, and the flags `FEATURE_STUDY_PLANNER`, `FEATURE_ADAPTIVE_SESSION`, `FEATURE_CONTINUOUS_STUDY` (continuous study is unconditional).
7. **Legacy sessions.** Never created again. An open one stays dormant, is not shown on Hoje or Revisão, and its link shows a read-only summary with "Ir para Hoje".

## Consequences

- Mastery, ConceptEvidence, spacing, mistakes, achievements and Attempts are unchanged; blocks only change how Questions are offered.
- The engine's untargeted `plan()` (planner.v1/v2), routine constraints and `StudyPlanRepository` remain as dormant code exercised by tests; a later cleanup can remove them with their tests. Planner, routine and session tables stay as history and in exports.
- Production can drop the three retired env vars at any time; the flag schema ignores them.
```

- [ ] **Step 2: Update CHANGELOG, PLANS, PROJECT_STATUS, spec status and design-system docs**

`CHANGELOG.md` — insert after `# Changelog`:

```md
## 2026-10-18 — Practice blocks replace time-budget sessions (ADR 0072)

- Revisão: "Revisar agora" and "Praticar este conceito" start a block of up to 5 Questions, one at a time ("2 de 5"), with "Próxima", then a summary ("3 de 5 sem ajuda", ✓/↺, "Mais 5", "Voltar"). Leaving and coming back resumes the block.
- Erros: "Praticar este assunto" starts a block with other Questions of the Concept; the missed Question stays out.
- No practice time choice anymore. "Sessão de N min", "Começar/Concluir sessão", the session chooser on Hoje, /plan (now redirects to Hoje), the weekly routine and the enhanced catalog are gone; old session links show a read-only summary.
- Flags retired: FEATURE_STUDY_PLANNER, FEATURE_ADAPTIVE_SESSION, FEATURE_CONTINUOUS_STUDY (continuous study is always on). No migration.
```

`PLANS.md` — in the section "Practice blocks replace time-budget sessions (2026-10-18, owner-approved design)", replace the `NEXT ACTION:` line with:

```md
Plan: docs/superpowers/plans/2026-10-18-practice-blocks.md (tasks 1–9 done locally; ADR 0072).
NEXT ACTION: owner reviews the 390/320 screenshots of the practice screen, its summary, Revisão and Erros; push only after approval, then confirm the Railway deployment.
```

`PROJECT_STATUS.md` — add a short current-state entry with the same facts as the CHANGELOG entry, the exact acceptance commands and results from Step 3, and the push-pending note.

Spec — change its `Status:` line to `Status: approved by the owner (2026-10-18); implemented by docs/superpowers/plans/2026-10-18-practice-blocks.md`.

Design-system docs — `git grep -n "SessionControls\|TargetedPracticeControls\|RoutinePlanner\|FEATURE_STUDY_PLANNER\|FEATURE_ADAPTIVE_SESSION\|FEATURE_CONTINUOUS_STUDY\|/plan\b" -- design-system DESIGN.md`; mark each named component as "retired by ADR 0072", and add `PracticeBlockButton` and `PracticeBlockStepper` to `design-system/COMPONENT_REGISTRY.md` next to the retired entries (one line each: purpose, file, touch/keyboard behaviour).

- [ ] **Step 3: Full acceptance**

Run each and record the exact result:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
FEATURE_NEW_TODAY=true FEATURE_INTERACTIVE_LESSONS=true FEATURE_SMART_MISTAKES=true FEATURE_KNOWLEDGE_MAP=true pnpm test:e2e
```

Expected: all pass. Any pre-existing failure unrelated to this work is recorded in PLANS.md and PROJECT_STATUS.md with its output, not hidden.

- [ ] **Step 4: Screenshots for the owner (390 and 320)**

Start the local preview from the repo's documented command (memory store, all production flags on, port 3311), seed demo content (`node scripts/seed-local-demo.mjs http://localhost:3311`, MAT-07 build `pnpm exec tsx .local/build-mat07.mts`), answer a few Questions wrong so Revisão and Erros have entries (`node .local/answer-many.mjs`), then capture with the `.local` screenshot scripts at widths 390 and 320 (`reducedMotion: "reduce"`, `MSYS_NO_PATHCONV=1` for route arguments): `/review`, `/mistakes`, a practice block mid-way, and a block summary. Save under the scratchpad and show them to the owner with a short list of what changed.

- [ ] **Step 5: Commit docs**

```bash
git add docs/ADR/0072-practice-blocks.md CHANGELOG.md PLANS.md PROJECT_STATUS.md docs/superpowers design-system DESIGN.md
git commit -m "docs: ADR 0072 practice blocks, changelog, plans and status"
```

- [ ] **Step 6: Ask for push approval**

Do not push. Tell the owner the commits are ready (including the two spec commits already on `main`), share the screenshots, and wait for approval. After approval: `git push origin main`, then confirm the Railway deployment with `gh api "repos/theusinshow/estudisc/deployments?sha=$(git rev-parse HEAD)"` and the deployment status endpoint until `success`.

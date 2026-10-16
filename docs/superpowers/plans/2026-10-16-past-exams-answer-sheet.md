# Past Exams Answer Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Provas anteriores" page. Students answer the 11 IFSC Integrated editions from 2022.1 to 2026.2 on a digital A–E answer sheet next to the official PDF. Correction runs on the server. The existing Assessment Engine is reused.

**Architecture:** A new assessment kind, `PAST_EXAM_SHEET`, has its own template/snapshot contracts (`sheet-contracts.ts`) and a pure scorer (`sheet-scoring.ts`). Both repositories (SQL and memory) branch on that kind in `importTemplate`/`start`/`finalize`. They also gain `sheetView`/`saveSheet`/`listSheetInstances`. Answers live in a sibling table, `assessment_sheet_responses`. The UI adds `/past-exams` and renders `AnswerSheetPanel` inside the existing `/assessments/[id]` runner. The committed catalog is converted to templates by a pure converter plus a build script.

**Tech Stack:** Next.js (repo version; read `node_modules/next/dist/docs/` before touching routing APIs), TypeScript strict, Zod 4, Drizzle 0.45 + PGlite tests, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-16-past-exams-answer-sheet-design.md`

## Global Constraints

- One Assessment Engine. Do not add a parallel past-exam engine or repository class.
- A sheet finalization creates **no** Attempt, ConceptEvidence, review schedule or mistake.
- The answer key (`key`) never leaves the server before the owner's instance is FINALIZED. The `answerKeyUrl` link is shown only after one finalized attempt.
- Reserved templates (`availableAt` in the future) cannot start. Their student DTO omits `examUrl` and `answerKeyUrl`.
- Release dates are configuration: `packs/past-exams/releases.json`, with 2026-1 → `2026-11-09T03:00:00.000Z` and 2026-2 → `2026-11-22T03:00:00.000Z`.
- PDFs are links only, and every host must be `www.ifsc.edu.br`. No re-hosting or embedding.
- English code identifiers, Portuguese UI copy. Mobile-first, no horizontal scroll at 320px, touch targets ≥ 44px.
- Published template versions are immutable. The same id/version with different content → "Assessment template version conflict".
- Match the surrounding dense code style (compact one-line methods in the repositories).
- Do not push, open PRs, deploy or publish to production without explicit user confirmation.

---

### Task 1: Sheet contracts, scorer and ADR 0066

**Files:**
- Create: `src/features/assessments/sheet-contracts.ts`
- Create: `src/features/assessments/sheet-scoring.ts`
- Create: `tests/unit/past-exam-fixture.ts`
- Create: `tests/unit/past-exam-sheet.test.ts`
- Create: `docs/ADR/0066-answer-sheet-past-exams.md`
- Modify: `src/features/assessments/labels.ts` (add the `PAST_EXAM_SHEET` label)

**Interfaces:**
- Produces: `PAST_EXAM_SHEET`, `SHEET_POLICY`, `sheetLetters`, `pastExamSheetTemplateSchema`, `PastExamSheetTemplate`, `sheetSnapshotSchema`, `SheetSnapshot`, `sheetAnswerSchema`, `SheetAnswer`, `sheetResultSchema`, `SheetResult`, `isSheetDefinition(value:unknown):boolean`, `isSheetSnapshot(value:unknown):boolean`, `subjectOf(subjects,position)`, `buildSheetSnapshot(template):SheetSnapshot`, `scoreSheet(template, responses:ReadonlyMap<number,SheetAnswer>, finishedAfterDeadline?):SheetResult`, and the fixture `sheetTemplateInput(overrides?)`.

- [ ] **Step 1: Write the fixture** `tests/unit/past-exam-fixture.ts`

```ts
const letters=["A","B","C","D","E"] as const;
/** 28-item 2025.1-shaped sheet; key at position p is letters[(p-1)%5]; position 15 is annulled. */
export function sheetTemplateInput(overrides:Record<string,unknown>={}){
  return {id:"past-exam-test-2025-1",version:1,title:"Prova 2025.1",kind:"PAST_EXAM_SHEET",trackId:"ifsc-2027",durationMinutes:240,status:"published",
    exam:{examId:"ifsc-integrado-2025-1",edition:"2025.1",year:2025,variant:"Aplicação geral",appliedOn:"2024-11-24",examType:"Exame de Classificação - Cursos Técnicos Integrados ao Ensino Médio",publisher:"IFSC - Instituto Federal de Santa Catarina"},
    subjects:[{name:"Português",start:1,end:7},{name:"Matemática",start:8,end:14},{name:"Geografia e História",start:15,end:21},{name:"Ciências",start:22,end:28}],
    items:Array.from({length:28},(_,index)=>({position:index+1,key:index===14?"ANNULLED":letters[index%5]})),
    links:{examUrl:"https://www.ifsc.edu.br/documents/d/ingresso/prova-teste",answerKeyUrl:"https://www.ifsc.edu.br/documents/d/ingresso/gabarito-teste",sourcePage:"https://www.ifsc.edu.br/provas-e-gabaritos"},
    provenance:{catalogDataset:"IFSC-provas-anteriores-integrado",catalogVerifiedAt:"2026-10-16",catalogSha256:"a".repeat(64),transcriptionNote:"Gabarito transcrito do gabarito definitivo.",publication:{mode:"ADMIN_DIRECT",reason:"Fixture de teste do cartão-resposta."}},
    ...overrides};
}
```

- [ ] **Step 2: Write the failing tests** `tests/unit/past-exam-sheet.test.ts`

```ts
import { describe,expect,it } from "vitest";
import { buildSheetSnapshot,pastExamSheetTemplateSchema,sheetResultSchema } from "@/features/assessments/sheet-contracts";
import { scoreSheet } from "@/features/assessments/sheet-scoring";
import { sheetTemplateInput } from "./past-exam-fixture";
const letters=["A","B","C","D","E"] as const;
describe("past exam sheet template",()=>{
  it("accepts a 28-item sheet and an omitted subject layout",()=>{
    expect(pastExamSheetTemplateSchema.parse(sheetTemplateInput()).items).toHaveLength(28);
    expect(pastExamSheetTemplateSchema.safeParse(sheetTemplateInput({subjects:undefined})).success).toBe(true);
  });
  it("rejects malformed sheets",()=>{
    const base=sheetTemplateInput();
    const issues=(input:unknown)=>{const parsed=pastExamSheetTemplateSchema.safeParse(input);return parsed.success?"":parsed.error.issues.map(issue=>issue.message).join("|");};
    expect(issues({...base,items:base.items.slice(0,25)})).toMatch("20, 24 or 28");
    expect(issues({...base,items:base.items.map(item=>item.position===3?{...item,key:"F"}:item)})).not.toBe("");
    expect(issues({...base,items:base.items.map(item=>item.position===3?{...item,position:30}:item)})).not.toBe("");
    expect(issues({...base,subjects:[{name:"A",start:1,end:10},{name:"B",start:9,end:28}]})).toMatch("Subject range");
    expect(issues({...base,links:{...base.links,examUrl:"https://example.com/prova.pdf"}})).toMatch("Official IFSC host");
  });
  it("freezes a snapshot without answer keys",()=>{
    const snapshot=buildSheetSnapshot(pastExamSheetTemplateSchema.parse(sheetTemplateInput()));
    expect(JSON.stringify(snapshot)).not.toContain("\"key\"");
    expect(snapshot.items[7]).toEqual({position:8,subject:"Matemática"});
  });
});
describe("scoreSheet",()=>{
  it("excludes annulled items, counts blanks as incorrect and is deterministic",()=>{
    const template=pastExamSheetTemplateSchema.parse(sheetTemplateInput());
    const responses=new Map(template.items.map(item=>[item.position,letters[(item.position-1)%5]] as const));
    responses.set(1,"B");responses.delete(2);responses.set(15,"A");
    const result=scoreSheet(template,responses);
    expect(sheetResultSchema.parse(result)).toEqual(result);
    expect(result).toMatchObject({correct:25,scored:27,total:28,annulled:1,blank:1,finishedAfterDeadline:false});
    expect(result.bySubject[0]).toEqual({name:"Português",correct:5,scored:7,total:7,annulled:0});
    expect(result.bySubject[2]).toEqual({name:"Geografia e História",correct:6,scored:6,total:7,annulled:1});
    expect(result.byPosition[14]).toMatchObject({position:15,answer:"A",key:"ANNULLED",outcome:"annulled"});
    expect(result.byPosition[1]).toMatchObject({answer:null,outcome:"blank"});
    expect(scoreSheet(template,responses)).toEqual(result);
  });
  it("returns no subject breakdown without ranges",()=>{
    expect(scoreSheet(pastExamSheetTemplateSchema.parse(sheetTemplateInput({subjects:undefined})),new Map()).bySubject).toEqual([]);
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `pnpm vitest run tests/unit/past-exam-sheet.test.ts`
Expected: FAIL, because `sheet-contracts` cannot be resolved.

- [ ] **Step 4: Implement** `src/features/assessments/sheet-contracts.ts`

```ts
import { z } from "zod";
// ADR 0066: answer-sheet assessments for past exams. The key stays server-side; no Question, Attempt or evidence.
export const PAST_EXAM_SHEET="PAST_EXAM_SHEET" as const;
export const SHEET_POLICY="assessment.sheet.v1";
export const sheetLetters=["A","B","C","D","E"] as const;
export const sheetItemCounts=[20,24,28] as const;
export const sheetOutcomes=["correct","incorrect","blank","annulled"] as const;
const sheetKeySchema=z.enum([...sheetLetters,"ANNULLED"]);
const ifscUrl=z.url().refine(value=>new URL(value).host==="www.ifsc.edu.br","Official IFSC host required");
const positionSchema=z.number().int().min(1).max(28);
const count=z.number().int().min(0).max(28);
export const sheetSubjectSchema=z.object({name:z.string().min(1).max(80),start:positionSchema,end:positionSchema}).strict();
export const sheetExamSchema=z.object({examId:z.string().regex(/^ifsc-integrado-\d{4}-[12](-[a-z]+)?$/),edition:z.string().regex(/^\d{4}\.[12]$/),year:z.number().int().min(2000).max(2100),variant:z.string().min(1).max(120),appliedOn:z.iso.date(),examType:z.string().min(1).max(200),publisher:z.string().min(1).max(200)}).strict();
export const pastExamSheetTemplateSchema=z.object({id:z.string().min(1).max(160),version:z.number().int().positive(),title:z.string().min(1).max(160),kind:z.literal(PAST_EXAM_SHEET),trackId:z.string().min(1),durationMinutes:z.number().int().min(5).max(240),availableAt:z.iso.datetime().optional(),status:z.enum(["draft","published","retired"]).default("draft"),exam:sheetExamSchema,subjects:z.array(sheetSubjectSchema).min(1).max(6).optional(),items:z.array(z.object({position:positionSchema,key:sheetKeySchema}).strict()).min(20).max(28),links:z.object({examUrl:ifscUrl,answerKeyUrl:ifscUrl,sourcePage:ifscUrl}).strict(),provenance:z.object({catalogDataset:z.string().min(1),catalogVerifiedAt:z.iso.date(),catalogSha256:z.string().regex(/^[a-f0-9]{64}$/),transcriptionNote:z.string().min(1).max(400),publication:z.object({mode:z.literal("ADMIN_DIRECT"),reason:z.string().min(10).max(500)}).strict()}).strict()}).strict().superRefine((template,context)=>{
  if(!(sheetItemCounts as readonly number[]).includes(template.items.length))context.addIssue({code:"custom",message:"Answer sheets have 20, 24 or 28 items"});
  if(template.items.some((item,index)=>item.position!==index+1))context.addIssue({code:"custom",message:"Positions must run 1..N in order"});
  let next=1;for(const subject of template.subjects??[]){if(subject.start<next||subject.end<subject.start||subject.end>template.items.length)context.addIssue({code:"custom",message:`Subject range ${subject.name} must be ordered, non-overlapping and inside 1..${template.items.length}`});next=subject.end+1;}
});
export type PastExamSheetTemplate=z.infer<typeof pastExamSheetTemplateSchema>;
export const sheetSnapshotSchema=z.object({kind:z.literal(PAST_EXAM_SHEET),mode:z.literal("EXAM"),templateStableId:z.string().min(1),templateVersion:z.number().int().positive(),exam:sheetExamSchema,items:z.array(z.object({position:positionSchema,subject:z.string().optional()}).strict()).min(20).max(28),subjects:z.array(sheetSubjectSchema).optional(),durationMinutes:z.number().int().min(5).max(240),policyVersion:z.literal(SHEET_POLICY)}).strict();
export type SheetSnapshot=z.infer<typeof sheetSnapshotSchema>;
export const sheetAnswerSchema=z.enum(sheetLetters).nullable();
export type SheetAnswer=z.infer<typeof sheetAnswerSchema>;
const tallySchema={correct:count,scored:count,total:count,annulled:count};
export const sheetResultSchema=z.object({kind:z.literal(PAST_EXAM_SHEET),policyVersion:z.literal(SHEET_POLICY),...tallySchema,blank:count,finishedAfterDeadline:z.boolean(),bySubject:z.array(z.object({name:z.string(),...tallySchema}).strict()),byPosition:z.array(z.object({position:positionSchema,subject:z.string().optional(),answer:sheetAnswerSchema,key:sheetKeySchema,outcome:z.enum(sheetOutcomes)}).strict())}).strict();
export type SheetResult=z.infer<typeof sheetResultSchema>;
const hasSheetKind=(value:unknown)=>typeof value==="object"&&value!==null&&(value as {kind?:unknown}).kind===PAST_EXAM_SHEET;
export const isSheetDefinition=hasSheetKind,isSheetSnapshot=hasSheetKind;
export function subjectOf(subjects:PastExamSheetTemplate["subjects"],position:number){return subjects?.find(subject=>position>=subject.start&&position<=subject.end)?.name;}
export function buildSheetSnapshot(template:PastExamSheetTemplate):SheetSnapshot{
  return sheetSnapshotSchema.parse({kind:PAST_EXAM_SHEET,mode:"EXAM",templateStableId:template.id,templateVersion:template.version,exam:template.exam,items:template.items.map(item=>{const subject=subjectOf(template.subjects,item.position);return subject?{position:item.position,subject}:{position:item.position};}),...(template.subjects?{subjects:template.subjects}:{}),durationMinutes:template.durationMinutes,policyVersion:SHEET_POLICY});
}
```

- [ ] **Step 5: Implement** `src/features/assessments/sheet-scoring.ts`

```ts
import { PAST_EXAM_SHEET,SHEET_POLICY,subjectOf,type PastExamSheetTemplate,type SheetAnswer,type SheetResult } from "./sheet-contracts";
type Row=SheetResult["byPosition"][number];
const tally=(rows:readonly Row[])=>{const annulled=rows.filter(row=>row.outcome==="annulled").length;return {correct:rows.filter(row=>row.outcome==="correct").length,scored:rows.length-annulled,total:rows.length,annulled};};
/** Training score: annulled items leave the denominator and a blank counts as incorrect. This is not the official classification rule. */
export function scoreSheet(template:PastExamSheetTemplate,responses:ReadonlyMap<number,SheetAnswer>,finishedAfterDeadline=false):SheetResult{
  const byPosition:Row[]=template.items.map(item=>{const answer=responses.get(item.position)??null;const subject=subjectOf(template.subjects,item.position);const outcome=item.key==="ANNULLED"?"annulled":answer===null?"blank":answer===item.key?"correct":"incorrect";return {position:item.position,...(subject?{subject}:{}),answer,key:item.key,outcome};});
  return {kind:PAST_EXAM_SHEET,policyVersion:SHEET_POLICY,...tally(byPosition),blank:byPosition.filter(row=>row.outcome==="blank").length,finishedAfterDeadline,bySubject:(template.subjects??[]).map(subject=>({name:subject.name,...tally(byPosition.filter(row=>row.subject===subject.name))})),byPosition};
}
```

- [ ] **Step 6: Add the label.** In `src/features/assessments/labels.ts`, after `OFFICIAL_EXAM: "Prova anterior"`, add `,\n  PAST_EXAM_SHEET: "Prova anterior · cartão-resposta"`.

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `pnpm vitest run tests/unit/past-exam-sheet.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 8: Write ADR 0066** `docs/ADR/0066-answer-sheet-past-exams.md`, following the 0023 format (Status: Accepted, Date 2026-10-16, Context, Decision, Consequences, Rejected alternatives, Implementation constraints). Cover: the kind; the 20/24/28 relaxation for this kind only; the sibling responses table and why (the composite PK of `assessment_responses`); no Attempt/evidence/mastery; EXAM-mode guards while ACTIVE; link-only rights; the reservation via `availableAt` with dates in `packs/past-exams/releases.json`; the future position→Question bridge. Rejected alternatives: a separate past-exam engine (AGENTS.md rule), and a full Question import now (rights and transcription for 7 of 11 editions).

- [ ] **Step 9: Commit**

```bash
git add src/features/assessments/sheet-contracts.ts src/features/assessments/sheet-scoring.ts src/features/assessments/labels.ts tests/unit/past-exam-fixture.ts tests/unit/past-exam-sheet.test.ts docs/ADR/0066-answer-sheet-past-exams.md
git commit -m "feat(assessments): answer-sheet contracts and scorer for past exams (ADR 0066)"
```

---

### Task 2: Sheet responses table and SQL repository branch

**Files:**
- Modify: `src/db/schema/assessments.ts` (new table `assessmentSheetResponses`)
- Create: `src/db/migrations/0022_*.sql` (generated)
- Create: `src/features/assessments/sheet-view.ts`
- Modify: `src/db/repositories/assessment-repository.ts`
- Modify: `src/db/repositories/question-asset-repository.ts:24`
- Test: `tests/integration/past-exam-sheet.test.ts`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces: `AssessmentRepository.sheetView(ownerId,id):Promise<SheetView|null>`, `.saveSheet(ownerId,id,position:number,answer:SheetAnswer,flagged:boolean,now?)` → `{saved:true}`, `.listSheetInstances(ownerId)` → `{id,templateId,status,startedAt:Date,deadlineAt:Date,finalizedAt:Date|null,result:unknown}[]`; `.list()` rows gain `templateId` and `kind:string`. `.view()` returns `null` for sheet instances. `.finalize()` returns `SheetResult` for sheets. Also `toSheetView(input, serverNow?)` and `type SheetView` from `sheet-view.ts`.

- [ ] **Step 1: Write the failing integration test** `tests/integration/past-exam-sheet.test.ts`

```ts
import { expect,it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { AssessmentRepository } from "@/db/repositories/assessment-repository";
import { attempts,conceptEvidence,studyEvents } from "@/db/schema";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
import { sheetTemplateInput } from "../unit/past-exam-fixture";
async function setup(){const database=await createMigratedPgliteTestDatabase();expect((await importTrackPack(JSON.parse(JSON.stringify(source)),new DrizzleTrackImportRepository(database.db))).status).toBe("imported");return database;}
it("runs a past-exam answer sheet without leaking keys or emitting learning evidence",async()=>{
  const database=await setup();try{
    const repo=new AssessmentRepository(database.db);const template=await repo.importTemplate(sheetTemplateInput());
    expect(await repo.importTemplate(sheetTemplateInput())).toMatchObject({id:template.id});
    await expect(repo.importTemplate(sheetTemplateInput({title:"Outro título"}))).rejects.toThrow("conflict");
    const now=new Date("2026-10-16T12:00:00Z");const started=await repo.start("student-a",template.id,crypto.randomUUID(),now);
    expect(await repo.view("student-a",started.id)).toBeNull();expect(await repo.sheetView("student-b",started.id)).toBeNull();
    const view=(await repo.sheetView("student-a",started.id))!;expect(view.items).toHaveLength(28);expect(JSON.stringify(view)).not.toMatch(/"key"|answerKeyUrl/);
    await repo.saveSheet("student-a",started.id,1,"B",false,now);await repo.saveSheet("student-a",started.id,1,"A",true,now);await repo.saveSheet("student-a",started.id,8,"C",false,now);await repo.saveSheet("student-a",started.id,15,"A",false,now);
    await expect(repo.saveSheet("student-a",started.id,29,"A",false,now)).rejects.toThrow("unavailable");
    await expect(repo.saveSheet("student-b",started.id,2,"A",false,now)).rejects.toThrow("unavailable");
    expect((await repo.sheetView("student-a",started.id))!.responses).toContainEqual({position:1,answer:"A",flagged:true});
    const result=await repo.finalize("student-a",started.id,now);
    expect(result).toMatchObject({kind:"PAST_EXAM_SHEET",correct:2,scored:27,annulled:1,blank:25});expect(await repo.finalize("student-a",started.id,now)).toEqual(result);
    expect(await database.db.select().from(attempts)).toHaveLength(0);expect(await database.db.select().from(conceptEvidence)).toHaveLength(0);
    expect((await database.db.select().from(studyEvents)).filter(event=>event.type==="assessment_finalized")).toHaveLength(1);
    const done=(await repo.sheetView("student-a",started.id))!;expect(done.links.answerKeyUrl).toContain("www.ifsc.edu.br");expect(done.result?.byPosition[14].outcome).toBe("annulled");
    await expect(repo.saveSheet("student-a",started.id,2,"A",false,now)).rejects.toThrow("unavailable");
    expect(await repo.listSheetInstances("student-a")).toHaveLength(1);expect((await repo.list("student-a"))[0]).toMatchObject({kind:"PAST_EXAM_SHEET",templateId:template.id});
  }finally{await database.close();}
});
it("refuses a reserved answer sheet before its release date",async()=>{
  const database=await setup();try{
    const repo=new AssessmentRepository(database.db);const base=sheetTemplateInput();
    const template=await repo.importTemplate({...base,id:"past-exam-test-2026-1",title:"Prova 2026.1",availableAt:"2026-11-09T03:00:00.000Z",exam:{...base.exam,examId:"ifsc-integrado-2026-1",edition:"2026.1",year:2026}});
    await expect(repo.start("student-a",template.id,crypto.randomUUID(),new Date("2026-10-16T12:00:00Z"))).rejects.toThrow("unavailable");
    expect(await repo.start("student-a",template.id,crypto.randomUUID(),new Date("2026-11-10T12:00:00Z"))).toHaveProperty("id");
  }finally{await database.close();}
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm vitest run tests/integration/past-exam-sheet.test.ts`
Expected: FAIL (`importTemplate` rejects the sheet input: Zod kind enum / `sheetView` is not a function).

- [ ] **Step 3: Add the table** in `src/db/schema/assessments.ts`. Add `check` to the `drizzle-orm/pg-core` import and append:

```ts
// ADR 0066: past-exam answer sheets answer positions, not Question versions.
export const assessmentSheetResponses=pgTable("assessment_sheet_responses",{instanceId:uuid("instance_id").notNull().references(()=>assessmentInstances.id),position:integer("position").notNull(),answer:text("answer"),flagged:integer("flagged").notNull().default(0),firstAnsweredAt:timestamp("first_answered_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()},table=>[primaryKey({columns:[table.instanceId,table.position]}),check("assessment_sheet_answer_check",sql`${table.answer} is null or ${table.answer} in ('A','B','C','D','E')`),check("assessment_sheet_position_check",sql`${table.position} between 1 and 28`)]);
```

- [ ] **Step 4: Generate the migration**

Run: `pnpm db:generate`
Expected: a new `src/db/migrations/0022_<name>.sql` that contains only `CREATE TABLE "assessment_sheet_responses"`, its two CHECK constraints, the PK and the FK. Inspect it, and if it touches any other table, stop and fix the schema.

- [ ] **Step 5: Create** `src/features/assessments/sheet-view.ts`

```ts
import { PAST_EXAM_SHEET,sheetResultSchema,type PastExamSheetTemplate,type SheetAnswer,type SheetSnapshot } from "./sheet-contracts";
type ViewInput={instance:{id:string;status:string;startedAt:Date;deadlineAt:Date;result:unknown};snapshot:SheetSnapshot;template:PastExamSheetTemplate;responses:readonly {position:number;answer:SheetAnswer;flagged:boolean}[]};
/** Student DTO for an answer sheet. It carries no `key`; the answer-key link and per-position keys appear only once FINALIZED. */
export function toSheetView({instance,snapshot,template,responses}:ViewInput,serverNow=Date.now()){
  const finalized=instance.status==="FINALIZED";
  return {serverNow,id:instance.id,status:instance.status,kind:PAST_EXAM_SHEET,mode:"EXAM" as const,startedAt:instance.startedAt.toISOString(),deadlineAt:instance.deadlineAt.toISOString(),title:template.title,exam:snapshot.exam,items:snapshot.items,subjects:snapshot.subjects??[],links:finalized?{examUrl:template.links.examUrl,answerKeyUrl:template.links.answerKeyUrl}:{examUrl:template.links.examUrl},provenance:{catalogVerifiedAt:template.provenance.catalogVerifiedAt,transcriptionNote:template.provenance.transcriptionNote},responses:responses.map(row=>({position:row.position,answer:row.answer,flagged:row.flagged})),result:finalized?sheetResultSchema.parse(instance.result):null};
}
export type SheetView=ReturnType<typeof toSheetView>;
```

- [ ] **Step 6: Change the SQL repository** `src/db/repositories/assessment-repository.ts`

Imports: add `assessmentSheetResponses` to the `@/db/schema` import. Add:

```ts
import { buildSheetSnapshot,isSheetDefinition,isSheetSnapshot,pastExamSheetTemplateSchema,PAST_EXAM_SHEET,sheetAnswerSchema,sheetSnapshotSchema,SHEET_POLICY,type PastExamSheetTemplate,type SheetAnswer } from "@/features/assessments/sheet-contracts";
import { scoreSheet } from "@/features/assessments/sheet-scoring";
import { toSheetView } from "@/features/assessments/sheet-view";
import type { AssessmentTemplate } from "@/features/assessments/contracts";
```

Replace the body of `importTemplate` with a dispatch, and move the shared insert into `storeTemplate`:

```ts
  async importTemplate(input:unknown){
    if(isSheetDefinition(input)){const sheet=pastExamSheetTemplateSchema.parse(input);await this.assertTrackScope(sheet.trackId,[]);return this.storeTemplate(sheet);}
    const template=assessmentTemplateSchema.parse(input);const questions=[];
    for(const ref of template.items){const item=await new DrizzleQuestionRepository(this.db).getVersion(ref.id,ref.version);if(!item)throw new AssessmentStateError();questions.push(item.question);}
    validateAssessmentComposition(template,questions);
    await this.assertTrackScope(template.trackId,questions.flatMap(question=>question.conceptIds),template.scopeTrackIds);
    return this.storeTemplate(template);
  }
  private async storeTemplate(template:AssessmentTemplate|PastExamSheetTemplate){
    const contentHash=hashCanonicalJson(template);
    const [created]=await this.db.insert(assessmentTemplates).values({stableId:template.id,version:template.version,kind:template.kind,status:template.status,contentHash,definition:template}).onConflictDoNothing().returning();
    if(created)return created;
    const [existing]=await this.db.select().from(assessmentTemplates).where(and(eq(assessmentTemplates.stableId,template.id),eq(assessmentTemplates.version,template.version)));
    if(existing?.contentHash!==contentHash)throw new Error("Assessment template version conflict");return existing;
  }
```

In `list`, add `templateId:assessmentInstances.templateId,kind:sql<string>\`${assessmentInstances.snapshot}->>'kind'\`` to the select object.

In `start`, directly after `if(!row||row.status!=="published")throw new AssessmentStateError();`, insert:

```ts
      if(row.kind===PAST_EXAM_SHEET){const sheet=pastExamSheetTemplateSchema.parse(row.definition);if(sheet.availableAt&&now.getTime()<Date.parse(sheet.availableAt))throw new AssessmentStateError();const sheetId=randomUUID();await tx.insert(assessmentInstances).values({id:sheetId,ownerId,templateId,startKey,mode:"EXAM",snapshot:buildSheetSnapshot(sheet),startedAt:now,deadlineAt:new Date(now.getTime()+sheet.durationMinutes*60000)});return {id:sheetId};}
```

In `view`, change `if(!instance)return null;` to `if(!instance||isSheetSnapshot(instance.snapshot))return null;`.

In `save`, after the ACTIVE/deadline check, add `if(isSheetSnapshot(instance.snapshot))throw new AssessmentStateError();`.

In `finalize`, after `if(instance.status!=="ACTIVE")throw new AssessmentStateError();`, add:

```ts
      if(isSheetSnapshot(instance.snapshot))return new AssessmentRepository(tx).finalizeSheetLocked(ownerId,instance,now);
```

Add these methods to the class:

```ts
  async listSheetInstances(ownerId:string){return this.db.select({id:assessmentInstances.id,templateId:assessmentInstances.templateId,status:assessmentInstances.status,startedAt:assessmentInstances.startedAt,deadlineAt:assessmentInstances.deadlineAt,finalizedAt:assessmentInstances.finalizedAt,result:assessmentInstances.result}).from(assessmentInstances).where(and(eq(assessmentInstances.ownerId,ownerId),sql`${assessmentInstances.snapshot}->>'kind'=${PAST_EXAM_SHEET}`)).orderBy(desc(assessmentInstances.startedAt));}
  private async sheetTemplate(templateId:string){const [row]=await this.db.select({definition:assessmentTemplates.definition}).from(assessmentTemplates).where(eq(assessmentTemplates.id,templateId));if(!row)throw new AssessmentStateError();return pastExamSheetTemplateSchema.parse(row.definition);}
  async sheetView(ownerId:string,id:string){
    const [instance]=await this.db.select().from(assessmentInstances).where(and(eq(assessmentInstances.id,id),eq(assessmentInstances.ownerId,ownerId)));if(!instance||!isSheetSnapshot(instance.snapshot))return null;
    const responses=await this.db.select().from(assessmentSheetResponses).where(eq(assessmentSheetResponses.instanceId,id));
    return toSheetView({instance,snapshot:sheetSnapshotSchema.parse(instance.snapshot),template:await this.sheetTemplate(instance.templateId),responses:responses.map(row=>({position:row.position,answer:row.answer as SheetAnswer,flagged:row.flagged===1}))});
  }
  async saveSheet(ownerId:string,id:string,position:number,answer:SheetAnswer,flagged:boolean,now=new Date()){
    return this.db.transaction(async tx=>{
      const [instance]=await tx.select().from(assessmentInstances).where(and(eq(assessmentInstances.id,id),eq(assessmentInstances.ownerId,ownerId))).for("update");
      if(!instance||instance.status!=="ACTIVE"||now.getTime()>instance.deadlineAt.getTime()||!isSheetSnapshot(instance.snapshot)||!sheetSnapshotSchema.parse(instance.snapshot).items.some(item=>item.position===position))throw new AssessmentStateError();
      const value=sheetAnswerSchema.parse(answer);
      await tx.insert(assessmentSheetResponses).values({instanceId:id,position,answer:value,flagged:flagged?1:0,firstAnsweredAt:now,updatedAt:now}).onConflictDoUpdate({target:[assessmentSheetResponses.instanceId,assessmentSheetResponses.position],set:{answer:value,flagged:flagged?1:0,updatedAt:now}});return {saved:true as const};
    });
  }
  // ADR 0066: called inside finalize's transaction (this.db is the tx); emits no Attempt, evidence, review or mistake.
  async finalizeSheetLocked(ownerId:string,instance:typeof assessmentInstances.$inferSelect,now:Date){
    const template=await this.sheetTemplate(instance.templateId);if(sheetSnapshotSchema.parse(instance.snapshot).templateVersion!==template.version)throw new AssessmentStateError();
    const responses=await this.db.select().from(assessmentSheetResponses).where(eq(assessmentSheetResponses.instanceId,instance.id));
    const result=scoreSheet(template,new Map(responses.map(row=>[row.position,row.answer as SheetAnswer])),now.getTime()>instance.deadlineAt.getTime());
    await this.db.update(assessmentInstances).set({status:"FINALIZED",result,finalizedAt:now}).where(eq(assessmentInstances.id,instance.id));
    await this.db.insert(studyEvents).values({ownerId,type:"assessment_finalized",entityType:"assessment",entityId:instance.id,payload:{correct:result.correct,scored:result.scored,policyVersion:SHEET_POLICY}});return result;
  }
```

- [ ] **Step 7: Make asset access skip sheet snapshots.** In `src/db/repositories/question-asset-repository.ts:24`, change `instances.some(instance=>assessmentSnapshotSchema.parse(` to `instances.some(instance=>!isSheetSnapshot(instance.snapshot)&&assessmentSnapshotSchema.parse(`. Add `import { isSheetSnapshot } from "@/features/assessments/sheet-contracts";`.

- [ ] **Step 8: Run the tests and confirm they pass**

Run: `pnpm vitest run tests/integration/past-exam-sheet.test.ts tests/integration/assessment-engine.test.ts tests/integration/standalone-simulado.test.ts`
Expected: PASS, with the existing simulado tests unchanged.

- [ ] **Step 9: Commit**

```bash
git add src/db/schema/assessments.ts src/db/migrations src/features/assessments/sheet-view.ts src/db/repositories/assessment-repository.ts src/db/repositories/question-asset-repository.ts tests/integration/past-exam-sheet.test.ts
git commit -m "feat(assessments): answer-sheet lifecycle in the SQL assessment repository"
```

---

### Task 3: Memory repository parity

**Files:**
- Modify: `src/db/repositories/memory/store.ts:176-178,215`
- Modify: `src/db/repositories/memory-assessment-repository.ts`
- Modify: `src/app/api/question-assets/[assetId]/route.ts:11`
- Test: `tests/unit/past-exam-memory-repository.test.ts`

**Interfaces:**
- Consumes: Task 1, plus `toSheetView` from Task 2.
- Produces: `MemoryAssessmentRepository` methods with the same signatures as the SQL ones (`sheetView`, `saveSheet`, `listSheetInstances`, `list` with `templateId`/`kind`, `finalize` returning `SheetResult` for sheets).

- [ ] **Step 1: Write the failing test** `tests/unit/past-exam-memory-repository.test.ts`

```ts
import { expect,it } from "vitest";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { MemoryAssessmentRepository } from "@/db/repositories/memory-assessment-repository";
import { sheetTemplateInput } from "./past-exam-fixture";
it("mirrors the answer-sheet lifecycle in memory",async()=>{
  const store=structuredClone(getMemoryStore());const repo=new MemoryAssessmentRepository(store);const attemptsBefore=store.attempts.length,evidenceBefore=store.conceptEvidence.length;
  const template=await repo.importTemplate(sheetTemplateInput());const now=new Date("2026-10-16T12:00:00Z");
  const started=await repo.start("student-a",template.id,crypto.randomUUID(),now);
  expect(await repo.view("student-a",started.id)).toBeNull();expect(await repo.sheetView("student-b",started.id)).toBeNull();
  expect(JSON.stringify(await repo.sheetView("student-a",started.id))).not.toMatch(/"key"|answerKeyUrl/);
  await repo.saveSheet("student-a",started.id,1,"A",false,now);await repo.saveSheet("student-a",started.id,8,"C",true,now);
  await expect(repo.saveSheet("student-a",started.id,29,"A",false,now)).rejects.toThrow("unavailable");
  const result=await repo.finalize("student-a",started.id,now);expect(result).toMatchObject({kind:"PAST_EXAM_SHEET",correct:2,scored:27,blank:25});
  expect(store.attempts).toHaveLength(attemptsBefore);expect(store.conceptEvidence).toHaveLength(evidenceBefore);
  expect((await repo.list("student-a"))[0]).toMatchObject({kind:"PAST_EXAM_SHEET",templateId:template.id});expect(await repo.listSheetInstances("student-a")).toHaveLength(1);
  expect((await repo.sheetView("student-a",started.id))!.links.answerKeyUrl).toContain("www.ifsc.edu.br");
});
it("refuses a reserved sheet in memory before availableAt",async()=>{
  const repo=new MemoryAssessmentRepository(structuredClone(getMemoryStore()));const template=await repo.importTemplate(sheetTemplateInput({id:"past-exam-reserved",availableAt:"2026-11-09T03:00:00.000Z"}));
  await expect(repo.start("student-a",template.id,crypto.randomUUID(),new Date("2026-10-16T12:00:00Z"))).rejects.toThrow("unavailable");
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm vitest run tests/unit/past-exam-memory-repository.test.ts`
Expected: FAIL (`importTemplate` rejects the sheet input).

- [ ] **Step 3: Widen the store types** in `src/db/repositories/memory/store.ts`. Import `PastExamSheetTemplate`, `SheetSnapshot` and `SheetAnswer` from `@/features/assessments/sheet-contracts`. Change `definition:AssessmentTemplate` → `definition:AssessmentTemplate|PastExamSheetTemplate` and `snapshot:AssessmentSnapshot` → `snapshot:AssessmentSnapshot|SheetSnapshot`. Add the field `assessmentSheetResponses:Array<{instanceId:string;position:number;answer:SheetAnswer;flagged:boolean}>;`, and add `assessmentSheetResponses:[],` to the initializer next to `assessmentResponses:[]`.

- [ ] **Step 4: Change the memory repository** `src/db/repositories/memory-assessment-repository.ts`. Add imports for `buildSheetSnapshot,isSheetDefinition,pastExamSheetTemplateSchema,PAST_EXAM_SHEET,sheetAnswerSchema,type PastExamSheetTemplate,type SheetAnswer`, `scoreSheet`, `toSheetView`, and `type AssessmentTemplate`. Then:

```ts
  async importTemplate(input:unknown){if(isSheetDefinition(input))return this.storeTemplate(pastExamSheetTemplateSchema.parse(input));const definition=assessmentTemplateSchema.parse(input);validateAssessmentComposition(definition,definition.items.map(ref=>this.question(ref.id,ref.version)));return this.storeTemplate(definition);}
  private storeTemplate(definition:AssessmentTemplate|PastExamSheetTemplate){const contentHash=hashCanonicalJson(definition);const existing=this.store.assessmentTemplates.find(row=>row.definition.id===definition.id&&row.definition.version===definition.version);if(existing){if(existing.contentHash!==contentHash)throw new Error("Assessment template version conflict");return existing;}const row={id:crypto.randomUUID(),definition,contentHash};this.store.assessmentTemplates.push(row);return row;}
  private sheetTemplate(templateId:string){const definition=this.store.assessmentTemplates.find(row=>row.id===templateId)?.definition;if(definition?.kind!==PAST_EXAM_SHEET)throw new AssessmentStateError();return definition;}
```

- `list`: add `templateId:row.templateId,kind:row.snapshot.kind,` to the mapped object.
- `start`: after the line that throws on an unpublished or not-yet-available template, insert `if(row.definition.kind===PAST_EXAM_SHEET){const sheet=row.definition,sheetId=crypto.randomUUID();this.store.assessmentInstances.push({id:sheetId,ownerId,templateId,startKey,status:"ACTIVE",snapshot:buildSheetSnapshot(sheet),startedAt:now,deadlineAt:new Date(now.getTime()+sheet.durationMinutes*60000),finalizedAt:null,result:null});return {id:sheetId};}`
- `view`: change `if(!row)return null;` to `if(!row||row.snapshot.kind===PAST_EXAM_SHEET)return null;`.
- `save`: in the guard, insert `row.snapshot.kind===PAST_EXAM_SHEET||` before `!row.snapshot.questions.some(`.
- `finalize`: after `if(row.status!=="ACTIVE")throw new AssessmentStateError();`, insert `if(row.snapshot.kind===PAST_EXAM_SHEET){const result=scoreSheet(this.sheetTemplate(row.templateId),new Map(this.store.assessmentSheetResponses.filter(response=>response.instanceId===id).map(response=>[response.position,response.answer])),now.getTime()>row.deadlineAt.getTime());row.result=result;row.status="FINALIZED";row.finalizedAt=now;return result;}`

New methods:

```ts
  async listSheetInstances(ownerId:string){return this.store.assessmentInstances.filter(row=>row.ownerId===ownerId&&row.snapshot.kind===PAST_EXAM_SHEET).reverse().map(row=>({id:row.id,templateId:row.templateId,status:row.status,startedAt:row.startedAt,deadlineAt:row.deadlineAt,finalizedAt:row.finalizedAt,result:row.result}));}
  async sheetView(ownerId:string,id:string){const row=this.store.assessmentInstances.find(item=>item.id===id&&item.ownerId===ownerId);if(!row||row.snapshot.kind!==PAST_EXAM_SHEET)return null;return toSheetView({instance:row,snapshot:row.snapshot,template:this.sheetTemplate(row.templateId),responses:this.store.assessmentSheetResponses.filter(response=>response.instanceId===id)});}
  async saveSheet(ownerId:string,id:string,position:number,answer:SheetAnswer,flagged:boolean,now=new Date()){const row=this.store.assessmentInstances.find(item=>item.id===id&&item.ownerId===ownerId);if(!row||row.status!=="ACTIVE"||now.getTime()>row.deadlineAt.getTime()||row.snapshot.kind!==PAST_EXAM_SHEET||!row.snapshot.items.some(item=>item.position===position))throw new AssessmentStateError();const value=sheetAnswerSchema.parse(answer);const existing=this.store.assessmentSheetResponses.find(item=>item.instanceId===id&&item.position===position);if(existing){existing.answer=value;existing.flagged=flagged;}else this.store.assessmentSheetResponses.push({instanceId:id,position,answer:value,flagged});return {saved:true as const};}
```

- [ ] **Step 5: Fix the memory asset route.** In `src/app/api/question-assets/[assetId]/route.ts:11`, change `instance.snapshot.questions.some(` to `instance.snapshot.kind!==PAST_EXAM_SHEET&&instance.snapshot.questions.some(`, and import `PAST_EXAM_SHEET`.

- [ ] **Step 6: Run the tests and typecheck**

Run: `pnpm vitest run tests/unit/past-exam-memory-repository.test.ts tests/integration/adaptive-sessions.test.ts && pnpm typecheck`
Expected: PASS, and typecheck reports 0 errors. Any union-narrowing error elsewhere means another `snapshot.questions`/`definition.items` reader needs the same `kind` guard.

- [ ] **Step 7: Commit**

```bash
git add src/db/repositories/memory src/db/repositories/memory-assessment-repository.ts "src/app/api/question-assets/[assetId]/route.ts" tests/unit/past-exam-memory-repository.test.ts
git commit -m "feat(assessments): answer-sheet parity in the memory repository"
```

---

### Task 4: API routes, past-exam card DTO and /assessments separation

**Files:**
- Modify: `src/app/api/admin/assessment-templates/route.ts`
- Modify: `src/app/api/assessments/[assessmentId]/route.ts`
- Modify: `src/app/assessments/page.tsx`
- Create: `src/features/assessments/past-exam-cards.ts`
- Test: `tests/unit/past-exam-cards.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: `buildPastExamCards(templates:TemplateRow[], instances:SheetInstanceRow[], now:Date):PastExamCard[]`, `buildPastExamProgress(templates, instances)` → `{instanceId,title,correct,scored,startedAt:string}[]`, and the type `PastExamCard`. The PATCH body for sheets is `{position:number, answer:"A".."E"|null, flagged:boolean}`.

- [ ] **Step 1: Write the failing test** `tests/unit/past-exam-cards.test.ts`

```ts
import { expect,it } from "vitest";
import { pastExamSheetTemplateSchema } from "@/features/assessments/sheet-contracts";
import { scoreSheet } from "@/features/assessments/sheet-scoring";
import { buildPastExamCards,buildPastExamProgress } from "@/features/assessments/past-exam-cards";
import { sheetTemplateInput } from "./past-exam-fixture";
const free=pastExamSheetTemplateSchema.parse(sheetTemplateInput());
const reserved=pastExamSheetTemplateSchema.parse(sheetTemplateInput({id:"past-exam-test-2026-1",title:"Prova 2026.1",availableAt:"2026-11-09T03:00:00.000Z",exam:{...free.exam,examId:"ifsc-integrado-2026-1",edition:"2026.1",year:2026}}));
const row=(definition:typeof free,id:string)=>({id,stableId:definition.id,version:definition.version,kind:"PAST_EXAM_SHEET",definition});
const now=new Date("2026-10-16T12:00:00Z");
it("hides links of reserved editions and the answer key until a finalized attempt",()=>{
  const cards=buildPastExamCards([row(free,"t1"),row(reserved,"t2"),{id:"q1",stableId:"mini",version:1,kind:"MINI_SIMULATION",definition:{}}],[],now);
  expect(cards.map(card=>card.edition)).toEqual(["2026.1","2025.1"]);
  expect(cards[0]).toMatchObject({state:"RESERVED",availableAt:"2026-11-09T03:00:00.000Z"});expect(cards[0]).not.toHaveProperty("examUrl");expect(cards[0]).not.toHaveProperty("answerKeyUrl");
  expect(cards[1]).toMatchObject({state:"FREE",examUrl:free.links.examUrl,annulledCount:1,itemCount:28,catalogVerifiedAt:"2026-10-16"});expect(cards[1]).not.toHaveProperty("answerKeyUrl");
  expect(JSON.stringify(cards)).not.toContain("\"key\"");
});
it("follows attempts across template versions and reports progress",()=>{
  const v2=pastExamSheetTemplateSchema.parse({...sheetTemplateInput(),version:2});const result=scoreSheet(free,new Map([[1,"A"]]));
  const instances=[{id:"i1",templateId:"t1",status:"FINALIZED",startedAt:now,deadlineAt:now,result},{id:"i2",templateId:"t1v2",status:"ACTIVE",startedAt:now,deadlineAt:now,result:null}];
  const cards=buildPastExamCards([row(free,"t1"),row(v2,"t1v2")],instances,now);
  expect(cards).toHaveLength(1);expect(cards[0]).toMatchObject({templateId:"t1v2",state:"ACTIVE",activeInstanceId:"i2",attempts:1,best:{correct:1,scored:27},answerKeyUrl:free.links.answerKeyUrl});
  expect(buildPastExamProgress([row(free,"t1"),row(v2,"t1v2")],instances)).toEqual([{instanceId:"i1",title:"Prova 2025.1",correct:1,scored:27,startedAt:now.toISOString()}]);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm vitest run tests/unit/past-exam-cards.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `src/features/assessments/past-exam-cards.ts`

```ts
import { pastExamSheetTemplateSchema,PAST_EXAM_SHEET,sheetResultSchema,type PastExamSheetTemplate } from "./sheet-contracts";
type TemplateRow={id:string;stableId:string;version:number;kind:string;definition:unknown};
type SheetInstanceRow={id:string;templateId:string;status:string;startedAt:Date;deadlineAt:Date;result:unknown};
export type PastExamCard={templateId:string;title:string;edition:string;year:number;variant:string;appliedOn:string;itemCount:number;annulledCount:number;subjects:string[];durationMinutes:number;catalogVerifiedAt:string;state:"FREE"|"ACTIVE"|"DONE"|"RESERVED";attempts:number;availableAt?:string;examUrl?:string;answerKeyUrl?:string;activeInstanceId?:string;deadlineAt?:string;best?:{correct:number;scored:number}};
function sheets(templates:readonly TemplateRow[]){return templates.filter(row=>row.kind===PAST_EXAM_SHEET).map(row=>({row,template:pastExamSheetTemplateSchema.parse(row.definition)}));}
const results=(rows:readonly SheetInstanceRow[])=>rows.filter(row=>row.status==="FINALIZED").flatMap(row=>{const parsed=sheetResultSchema.safeParse(row.result);return parsed.success?[{row,result:parsed.data}]:[];});
/** Student DTO for /past-exams. It never contains answer keys; reserved editions carry no official links. */
export function buildPastExamCards(templates:readonly TemplateRow[],instances:readonly SheetInstanceRow[],now:Date):PastExamCard[]{
  const all=sheets(templates);const stableOf=new Map(all.map(({row})=>[row.id,row.stableId]));const latest=new Map<string,{row:TemplateRow;template:PastExamSheetTemplate}>();
  for(const entry of all){const current=latest.get(entry.row.stableId);if(!current||current.row.version<entry.row.version)latest.set(entry.row.stableId,entry);}
  return [...latest.values()].map(({row,template})=>{
    const own=instances.filter(instance=>stableOf.get(instance.templateId)===row.stableId);const active=own.find(instance=>instance.status==="ACTIVE");const done=results(own).map(entry=>entry.result);
    const reserved=!!template.availableAt&&now.getTime()<Date.parse(template.availableAt);
    const best=done.reduce<{correct:number;scored:number}|undefined>((top,result)=>!top||result.correct/Math.max(result.scored,1)>top.correct/Math.max(top.scored,1)?{correct:result.correct,scored:result.scored}:top,undefined);
    return {templateId:row.id,title:template.title,edition:template.exam.edition,year:template.exam.year,variant:template.exam.variant,appliedOn:template.exam.appliedOn,itemCount:template.items.length,annulledCount:template.items.filter(item=>item.key==="ANNULLED").length,subjects:(template.subjects??[]).map(subject=>subject.name),durationMinutes:template.durationMinutes,catalogVerifiedAt:template.provenance.catalogVerifiedAt,
      state:reserved?"RESERVED" as const:active?"ACTIVE" as const:done.length?"DONE" as const:"FREE" as const,attempts:done.length,
      ...(template.availableAt?{availableAt:template.availableAt}:{}),...(reserved?{}:{examUrl:template.links.examUrl}),...(!reserved&&done.length?{answerKeyUrl:template.links.answerKeyUrl}:{}),
      ...(active?{activeInstanceId:active.id,deadlineAt:active.deadlineAt.toISOString()}:{}),...(best?{best}:{})};
  }).sort((a,b)=>b.edition.localeCompare(a.edition)||a.variant.localeCompare(b.variant));
}
export function buildPastExamProgress(templates:readonly TemplateRow[],instances:readonly SheetInstanceRow[]){
  const titles=new Map(sheets(templates).map(({row,template})=>[row.id,template.title]));
  return results(instances).flatMap(({row,result})=>{const title=titles.get(row.templateId);return title?[{instanceId:row.id,title,correct:result.correct,scored:result.scored,startedAt:row.startedAt.toISOString()}]:[];}).sort((a,b)=>a.startedAt.localeCompare(b.startedAt));
}
```

- [ ] **Step 4: Admin template route accepts both kinds.** In `src/app/api/admin/assessment-templates/route.ts`, replace the `input` line with:

```ts
  const body=await request.json().catch(()=>null);const input=(isSheetDefinition(body)?pastExamSheetTemplateSchema:assessmentTemplateSchema).safeParse(body);if(!input.success)return NextResponse.json({code:"invalid_template"},{status:400});
```

Add `import { isSheetDefinition,pastExamSheetTemplateSchema } from "@/features/assessments/sheet-contracts";`.

- [ ] **Step 5: The save route accepts sheet bodies.** In `src/app/api/assessments/[assessmentId]/route.ts`:

```ts
const questionSaveSchema=z.object({questionVersionId:z.uuid(),response:z.json(),flagged:z.boolean().default(false)}).strict();
const sheetSaveSchema=z.object({position:z.number().int().min(1).max(28),answer:sheetAnswerSchema,flagged:z.boolean().default(false)}).strict();
const requestSchema=z.union([questionSaveSchema,sheetSaveSchema]);
```

Inside `try`:

```ts
const repo=assessmentRepository(),ownerId=await getOwnerId(),data=input.data;return NextResponse.json("position" in data?await repo.saveSheet(ownerId,assessmentId,data.position,data.answer,data.flagged):await repo.save(ownerId,assessmentId,data.questionVersionId,data.response,data.flagged));
```

Import `sheetAnswerSchema` from `@/features/assessments/sheet-contracts`.

- [ ] **Step 6: Keep /assessments question-only.** In `src/app/assessments/page.tsx`:
  - after the `Promise.all` line, add `const questionTemplates=templates.filter(row=>row.kind!==PAST_EXAM_SHEET);`;
  - change `finalized` to `instances.filter(instance=>instance.status==="FINALIZED"&&instance.kind!==PAST_EXAM_SHEET)`;
  - replace `templates.length===0` and `templates.map(` with `questionTemplates.length===0` and `questionTemplates.map(`;
  - import `PAST_EXAM_SHEET`.

  The active-resume block stays for every kind.

- [ ] **Step 7: Run the tests and typecheck**

Run: `pnpm vitest run tests/unit/past-exam-cards.test.ts && pnpm typecheck`
Expected: PASS; 0 type errors.

- [ ] **Step 8: Commit**

```bash
git add src/features/assessments/past-exam-cards.ts tests/unit/past-exam-cards.test.ts src/app/api/admin/assessment-templates/route.ts "src/app/api/assessments/[assessmentId]/route.ts" src/app/assessments/page.tsx
git commit -m "feat(assessments): past-exam card DTO and answer-sheet API bodies"
```

---

### Task 5: Committed catalog, converter and build script

**Files:**
- Create: `packs/past-exams/ifsc-integrado-2022-2026.catalog.json` (copied verbatim from the package's `catalogo/ifsc-provas-anteriores.json`)
- Create: `packs/past-exams/releases.json`
- Create: `packs/past-exams/README.md`
- Create: `src/features/assessments/past-exam-catalog.ts`
- Create: `scripts/build-past-exam-templates.ts`
- Test: `tests/unit/past-exam-catalog.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces: `catalogToSheetTemplates(input:unknown, catalogSha256:string, options:{trackId;status;reason;availableAt:Record<string,string>}):PastExamSheetTemplate[]`, `crossCheckPrivateBank(templates, bank:unknown):string[]`, `PastExamCatalogError`, `TRANSCRIPTION_NOTE`.

- [ ] **Step 1: Copy the catalog** from the extracted package (`<scratchpad>/ESTUDISC-PROVAS-ANTERIORES-IFSC-2022-2026/catalogo/ifsc-provas-anteriores.json`) to `packs/past-exams/ifsc-integrado-2022-2026.catalog.json`. Write `packs/past-exams/releases.json`:

```json
{ "2026-1": "2026-11-09T03:00:00.000Z", "2026-2": "2026-11-22T03:00:00.000Z" }
```

Write `packs/past-exams/README.md` covering three points: the source is the IFSC portal (verified 2026-10-16); the file holds metadata, definitive answer keys and links only, with no PDFs; and release dates come from `docs/ifsc/16-IMPLEMENTATION-PLAN.md:148-154`, which also explains how to change them (edit `releases.json`, then publish a new template version).

- [ ] **Step 2: Write the failing test** `tests/unit/past-exam-catalog.test.ts`

```ts
import { existsSync,readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import catalog from "../../packs/past-exams/ifsc-integrado-2022-2026.catalog.json";
import releases from "../../packs/past-exams/releases.json";
import { catalogToSheetTemplates,crossCheckPrivateBank } from "@/features/assessments/past-exam-catalog";
const options={trackId:"ifsc-2027",status:"published" as const,reason:"Publicação autorizada das provas anteriores (teste).",availableAt:releases};
const clone=()=>JSON.parse(JSON.stringify(catalog));
const templates=catalogToSheetTemplates(catalog,"b".repeat(64),options);
describe("past exam catalog",()=>{
  it("converts the 11 Integrated editions",()=>{
    expect(templates).toHaveLength(11);expect(templates.map(template=>template.items.length).sort()).toEqual([20,20,20,20,24,24,28,28,28,28,28]);
    expect(templates.find(template=>template.exam.edition==="2025.1")!.items[14].key).toBe("ANNULLED");
    expect(templates.filter(template=>template.items.some(item=>item.key==="ANNULLED")).map(template=>template.exam.edition).sort()).toEqual(["2022.2","2023.2","2025.1"]);
    expect(templates.filter(template=>template.availableAt).map(template=>template.exam.edition).sort()).toEqual(["2026.1","2026.2"]);
    expect(new Set(templates.map(template=>template.exam.examId)).size).toBe(11);
  });
  it("rejects broken catalogs with the edition in the message",()=>{
    const badKey=clone();badKey.exams[0].answerKey["3"]="F";expect(()=>catalogToSheetTemplates(badKey,"b".repeat(64),options)).toThrow(/2022-1-florianopolis: invalid key F at 3/);
    const badAnnulled=clone();badAnnulled.exams[1].annulledQuestions=[11];expect(()=>catalogToSheetTemplates(badAnnulled,"b".repeat(64),options)).toThrow(/2022-2: annulledQuestions/);
    const badHost=clone();badHost.exams[0].examUrl="https://example.com/prova.pdf";expect(()=>catalogToSheetTemplates(badHost,"b".repeat(64),options)).toThrow(/Official IFSC host/);
    const duplicate=clone();duplicate.exams.push(duplicate.exams[0]);expect(()=>catalogToSheetTemplates(duplicate,"b".repeat(64),options)).toThrow(/duplicate edition/);
  });
  it("detects disagreement with an official bank",()=>{
    const q1=templates.find(template=>template.exam.edition==="2025.1")!.items[0].key;const wrong=q1==="A"?"B":"A";
    expect(crossCheckPrivateBank(templates,{questions:[{status:"draft",provenance:{examId:"IFSC-INT-2025.1",officialNumber:1},choices:[{id:q1,correct:true}]},{status:"annulled",provenance:{examId:"IFSC-INT-2025.1",officialNumber:15}}]})).toEqual([]);
    expect(crossCheckPrivateBank(templates,{questions:[{status:"draft",provenance:{examId:"IFSC-INT-2025.1",officialNumber:1},choices:[{id:wrong,correct:true}]}]})).toHaveLength(1);
  });
  const bankPath=".local/ifsc-official/bank.draft.json";
  it.skipIf(!existsSync(bankPath))("matches the private official bank when present",()=>{expect(crossCheckPrivateBank(templates,JSON.parse(readFileSync(bankPath,"utf8")))).toEqual([]);});
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `pnpm vitest run tests/unit/past-exam-catalog.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement** `src/features/assessments/past-exam-catalog.ts`

```ts
import { z } from "zod";
import { pastExamSheetTemplateSchema,PAST_EXAM_SHEET,type PastExamSheetTemplate } from "./sheet-contracts";
export class PastExamCatalogError extends Error {}
export const TRANSCRIPTION_NOTE="Gabarito transcrito do gabarito definitivo publicado pelo IFSC. Em caso de conflito, vale o documento oficial.";
const catalogExamSchema=z.object({id:z.string().regex(/^\d{4}-[12](-[a-z]+)?$/),edition:z.string(),year:z.number().int(),variant:z.string().min(1),date:z.iso.date(),questions:z.number().int(),durationMinutes:z.number().int(),subjects:z.array(z.object({name:z.string(),start:z.number().int(),end:z.number().int()})).optional(),examUrl:z.string(),answerKeyUrl:z.string(),answerKey:z.record(z.string(),z.string()),annulledQuestions:z.array(z.number().int()),questionCountScorable:z.number().int(),examType:z.string().min(1),publisher:z.string().min(1),originalSourcePage:z.string()});
export const pastExamCatalogSchema=z.object({dataset:z.string().min(1),lastVerifiedAt:z.iso.date(),exams:z.array(catalogExamSchema).min(1)});
export type CatalogConversionOptions={trackId:string;status:"draft"|"published";reason:string;availableAt:Readonly<Record<string,string>>};
function fail(id:string,message:string):never{throw new PastExamCatalogError(`${id}: ${message}`);}
/** Converts the committed IFSC catalog into answer-sheet templates (ADR 0066). Any inconsistency stops the whole conversion. */
export function catalogToSheetTemplates(input:unknown,catalogSha256:string,options:CatalogConversionOptions):PastExamSheetTemplate[]{
  const catalog=pastExamCatalogSchema.parse(input);const seen=new Set<string>();
  return catalog.exams.map(exam=>{
    if(seen.has(exam.id))fail(exam.id,"duplicate edition");seen.add(exam.id);
    const positions=Object.keys(exam.answerKey).map(Number).sort((a,b)=>a-b);
    if(positions.length!==exam.questions||positions.some((position,index)=>position!==index+1))fail(exam.id,`answer key must cover 1..${exam.questions}`);
    const items=positions.map(position=>{const value=exam.answerKey[String(position)];if(value==="ANULADA")return {position,key:"ANNULLED" as const};if(!/^[A-E]$/.test(value))fail(exam.id,`invalid key ${value} at ${position}`);return {position,key:value as "A"|"B"|"C"|"D"|"E"};});
    const annulled=items.filter(item=>item.key==="ANNULLED").map(item=>item.position);
    if(annulled.join()!==[...exam.annulledQuestions].sort((a,b)=>a-b).join())fail(exam.id,"annulledQuestions disagree with the answer key");
    if(exam.questionCountScorable!==exam.questions-annulled.length)fail(exam.id,"questionCountScorable disagrees with annulled items");
    const availableAt=options.availableAt[exam.id];
    const parsed=pastExamSheetTemplateSchema.safeParse({id:`past-exam-${exam.id}`,version:1,title:exam.variant==="Aplicação geral"?`Prova ${exam.edition}`:`Prova ${exam.edition} · ${exam.variant}`,kind:PAST_EXAM_SHEET,trackId:options.trackId,durationMinutes:exam.durationMinutes,...(availableAt?{availableAt}:{}),status:options.status,
      exam:{examId:`ifsc-integrado-${exam.id}`,edition:exam.edition,year:exam.year,variant:exam.variant,appliedOn:exam.date,examType:exam.examType,publisher:exam.publisher},...(exam.subjects?.length?{subjects:exam.subjects}:{}),items,
      links:{examUrl:exam.examUrl,answerKeyUrl:exam.answerKeyUrl,sourcePage:exam.originalSourcePage},
      provenance:{catalogDataset:catalog.dataset,catalogVerifiedAt:catalog.lastVerifiedAt,catalogSha256,transcriptionNote:TRANSCRIPTION_NOTE,publication:{mode:"ADMIN_DIRECT",reason:options.reason}}});
    if(!parsed.success)fail(exam.id,parsed.error.issues.map(issue=>issue.message).join("; "));
    return parsed.data;
  });
}
const bankSchema=z.object({questions:z.array(z.object({status:z.string(),provenance:z.object({examId:z.string(),officialNumber:z.number().int()}),choices:z.array(z.object({id:z.string(),correct:z.boolean()})).optional()}))});
/** Compares catalog keys with the private official bank (general application only). Returns human-readable mismatches. */
export function crossCheckPrivateBank(templates:readonly PastExamSheetTemplate[],bank:unknown){
  const mismatches:string[]=[];
  for(const question of bankSchema.parse(bank).questions){
    const edition=question.provenance.examId.replace(/^IFSC-INT-/,"");const template=templates.find(item=>item.exam.edition===edition&&item.exam.variant==="Aplicação geral");if(!template)continue;
    const expected=question.status==="annulled"?"ANNULLED":question.choices?.find(choice=>choice.correct)?.id;const actual=template.items.find(item=>item.position===question.provenance.officialNumber)?.key;
    if(expected!==actual)mismatches.push(`${edition} Q${question.provenance.officialNumber}: banco ${expected??"?"} × catálogo ${actual??"?"}`);
  }
  return mismatches;
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `pnpm vitest run tests/unit/past-exam-catalog.test.ts`
Expected: PASS. The private-bank case is SKIPPED when `.local/ifsc-official/bank.draft.json` is absent. If a real catalog edition fails, stop and report: do not edit official keys to make the test pass.

- [ ] **Step 6: Write the build script** `scripts/build-past-exam-templates.ts`

```ts
import { existsSync,mkdirSync,readFileSync,writeFileSync } from "node:fs";
import { catalogToSheetTemplates,crossCheckPrivateBank } from "@/features/assessments/past-exam-catalog";
import { hashCanonicalJson } from "@/lib/canonical-json";
// Usage: pnpm tsx scripts/build-past-exam-templates.ts "<actual publication authorization/reason>"
const reason=process.argv[2];if(!reason||reason.length<10)throw new Error("Pass the actual publication authorization/reason (>= 10 chars).");
const catalog=JSON.parse(readFileSync("packs/past-exams/ifsc-integrado-2022-2026.catalog.json","utf8"));
const releases=JSON.parse(readFileSync("packs/past-exams/releases.json","utf8"));
const templates=catalogToSheetTemplates(catalog,hashCanonicalJson(catalog),{trackId:"ifsc-2027",status:"published",reason,availableAt:releases});
const bankPath=".local/ifsc-official/bank.draft.json";
if(existsSync(bankPath)){const mismatches=crossCheckPrivateBank(templates,JSON.parse(readFileSync(bankPath,"utf8")));if(mismatches.length){console.error(mismatches.slice(0,20).join("\n"));process.exit(1);}console.log("Private bank cross-check: PASS");}
else console.log("Private bank cross-check: SKIPPED (bank absent)");
mkdirSync(".local/past-exams",{recursive:true});writeFileSync(".local/past-exams/templates.json",JSON.stringify(templates,null,2)+"\n");
console.log(`Wrote ${templates.length} templates to .local/past-exams/templates.json (reserved: ${templates.filter(t=>t.availableAt).map(t=>t.exam.edition).join(", ")})`);
```

Run: `pnpm tsx scripts/build-past-exam-templates.ts "Validação local do conversor"`
Expected: `Wrote 11 templates ... (reserved: 2026.1, 2026.2)`. Do not commit `.local/` (it is gitignored).

- [ ] **Step 7: Commit**

```bash
git add packs/past-exams src/features/assessments/past-exam-catalog.ts scripts/build-past-exam-templates.ts tests/unit/past-exam-catalog.test.ts
git commit -m "feat(content): IFSC past-exam catalog and answer-sheet template converter"
```

---

### Task 6: Student UI (/past-exams, answer sheet, result)

**Files:**
- Create: `src/app/past-exams/page.tsx`
- Create: `src/features/assessments/answer-sheet-panel.tsx`
- Create: `src/features/assessments/past-exam-result.tsx`
- Create: `src/styles/application/past-exams.css`
- Modify: `src/app/globals.css` (import the CSS after `assessments.css`)
- Modify: `src/app/assessments/[assessmentId]/page.tsx` (sheet branch)
- Modify: `src/features/assessments/start-button.tsx` (optional `label`)
- Modify: `src/components/layout/primary-nav.tsx` (nav item)
- Test: `tests/e2e/past-exams.spec.ts`

**Interfaces:**
- Consumes: `SheetView` (Task 2); `buildPastExamCards`/`buildPastExamProgress`/`PastExamCard` (Task 4); `sheetLetters`, `sheetResultSchema`, `SheetAnswer` (Task 1); `assessmentSavedResponseSchema` and `readValidatedResponse` from `@/lib/api-response`.

- [ ] **Step 1: Read the Next docs.** Check `node_modules/next/dist/docs/` for `searchParams` in page props (Promise-based in this version) before writing `src/app/past-exams/page.tsx`.

- [ ] **Step 2: Write the failing E2E spec** `tests/e2e/past-exams.spec.ts`

```ts
import { expect,test } from "@playwright/test";
import { sheetTemplateInput } from "../unit/past-exam-fixture";
test("lists, answers, resumes and corrects a past-exam answer sheet",async({page,request},testInfo)=>{
  test.setTimeout(90000);const tag=testInfo.project.name;const base=sheetTemplateInput();
  const free=sheetTemplateInput({id:`e2e-past-${tag}-2025-1`,title:`Prova 2025.1 ${tag}`});
  const reserved=sheetTemplateInput({id:`e2e-past-${tag}-2026-1`,title:`Prova 2026.1 ${tag}`,availableAt:"2099-01-01T03:00:00.000Z",exam:{...base.exam,examId:"ifsc-integrado-2026-1",edition:"2026.1",year:2026}});
  for(const template of [free,reserved])expect((await request.post("/api/admin/assessment-templates",{data:template})).ok()).toBe(true);
  await page.goto("/past-exams");
  const reservedCard=page.locator(".past-exam-card",{hasText:`Prova 2026.1 ${tag}`});await expect(reservedCard.getByText(/Simulado reservado/)).toBeVisible();await expect(reservedCard.getByRole("link")).toHaveCount(0);
  const card=page.locator(".past-exam-card",{hasText:`Prova 2025.1 ${tag}`});await expect(card.getByRole("link",{name:"Abrir caderno oficial"})).toHaveAttribute("href",/www\.ifsc\.edu\.br/);await expect(card.getByRole("link",{name:"Gabarito oficial"})).toHaveCount(0);
  await card.getByRole("button",{name:"Responder"}).click();await page.waitForURL(/\/assessments\//);
  await page.getByRole("radio",{name:"Questão 1, alternativa A"}).check();
  await page.getByRole("radio",{name:"Questão 8, alternativa A"}).focus();await page.keyboard.press("ArrowRight");await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio",{name:"Questão 8, alternativa C"})).toBeChecked();
  await page.getByRole("checkbox",{name:"Revisar questão 2 depois"}).check();
  await expect(page.getByText("2/28 respondidas")).toBeVisible();await expect(page.getByText("Salvando…")).toHaveCount(0);
  await page.reload();await expect(page.getByRole("radio",{name:"Questão 1, alternativa A"})).toBeChecked();await expect(page.getByRole("radio",{name:"Questão 8, alternativa C"})).toBeChecked();await expect(page.getByRole("checkbox",{name:"Revisar questão 2 depois"})).toBeChecked();
  for(const width of [320,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.screenshot({path:testInfo.outputPath(`answer-sheet-${width}.png`)});}
  await page.getByRole("button",{name:"Conferir e finalizar"}).click();await expect(page.getByText(/Em branco: 2, 3, 4/)).toBeVisible();await expect(page.getByText("Marcadas para revisar: 2.")).toBeVisible();
  await page.getByRole("button",{name:"Finalizar prova"}).click();
  await expect(page.getByRole("heading",{name:"Seu resultado"})).toBeVisible();await expect(page.getByLabel("Pontuação")).toContainText("2/27");
  await expect(page.getByRole("row",{name:/^15 /})).toContainText("Anulada");
  for(const width of [320,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
  await page.goto("/past-exams");await expect(card.getByRole("link",{name:"Gabarito oficial"})).toBeVisible();await expect(card.getByRole("button",{name:"Refazer"})).toBeVisible();
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `pnpm test:e2e tests/e2e/past-exams.spec.ts`
Expected: FAIL (`/past-exams` returns 404).

- [ ] **Step 4: Start button label.** In `src/features/assessments/start-button.tsx`, change the props to `{templateId,label="Começar simulado"}:{templateId:string;label?:string}` and render `{busy?"Preparando…":label}`.

- [ ] **Step 5: Implement** `src/features/assessments/answer-sheet-panel.tsx`

```tsx
"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { assessmentSavedResponseSchema,readValidatedResponse } from "@/lib/api-response";
import { sheetLetters,sheetResultSchema,type SheetAnswer } from "./sheet-contracts";
import type { SheetView } from "./sheet-view";
type Row={answer:SheetAnswer;flagged:boolean;saving:boolean;failed:boolean};
const milestones=[30,10,5,1];
export function AnswerSheetPanel({view}:{view:SheetView}){
  const router=useRouter(),[now,setNow]=useState(view.serverNow),[confirming,setConfirming]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [rows,setRows]=useState<Record<number,Row>>(()=>Object.fromEntries(view.items.map(item=>{const saved=view.responses.find(row=>row.position===item.position);return [item.position,{answer:saved?.answer??null,flagged:saved?.flagged??false,saving:false,failed:false}];})));
  useEffect(()=>{const start=performance.now();const timer=setInterval(()=>setNow(view.serverNow+performance.now()-start),1000);return()=>clearInterval(timer);},[view.serverNow]);
  const remaining=Math.max(0,Math.ceil((Date.parse(view.deadlineAt)-now)/1000)),open=remaining>0,milestone=milestones.filter(value=>remaining<=value*60).at(-1);
  const hh=String(Math.floor(remaining/3600)),mm=String(Math.floor(remaining%3600/60)).padStart(2,"0"),ss=String(remaining%60).padStart(2,"0");
  const list=Object.entries(rows),answered=list.filter(([,row])=>row.answer!==null).length,pending=list.some(([,row])=>row.saving);
  const blank=list.filter(([,row])=>row.answer===null).map(([position])=>position),flagged=list.filter(([,row])=>row.flagged).map(([position])=>position);
  const sections=view.subjects.length?view.subjects.map(subject=>({name:subject.name,items:view.items.filter(item=>item.position>=subject.start&&item.position<=subject.end)})):[{name:"",items:view.items}];
  async function save(position:number,next:{answer:SheetAnswer;flagged:boolean}){
    setRows(current=>({...current,[position]:{...next,saving:true,failed:false}}));
    try{const response=await fetch(`/api/assessments/${view.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({position,...next})});if(!response.ok)throw new Error("save");await readValidatedResponse(response,assessmentSavedResponseSchema);setRows(current=>({...current,[position]:{...current[position],saving:false}}));}
    catch{setRows(current=>({...current,[position]:{...current[position],saving:false,failed:true}}));}
  }
  async function finish(){setBusy(true);setError("");try{const response=await fetch(`/api/assessments/${view.id}/finalize`,{method:"POST"});if(!response.ok)throw new Error("Não foi possível finalizar. As respostas salvas foram preservadas; tente novamente.");await readValidatedResponse(response,sheetResultSchema);router.refresh();}catch(error){setError(error instanceof Error?error.message:"Falha ao finalizar.");}finally{setBusy(false);}}
  return <div className="answer-sheet">
    <header className="answer-sheet-bar">
      <p className="answer-sheet-timer"><span className="visually-hidden">Tempo restante: </span><strong>{hh}:{mm}:{ss}</strong></p>
      <p>{answered}/{view.items.length} respondidas</p>
      <a className="past-exam-link" href={view.links.examUrl} target="_blank" rel="noopener noreferrer">Abrir caderno oficial</a>
      <p className="visually-hidden" aria-live="polite">{milestone?`Restam ${milestone} minutos de prova.`:""}</p>
    </header>
    {!open&&<p role="status" className="answer-sheet-closed">Tempo esgotado. Finalize para ver o resultado; as respostas salvas foram preservadas.</p>}
    {sections.map(section=><section key={section.name||"all"} className="answer-sheet-section" aria-label={section.name||"Cartão-resposta"}>
      {section.name&&<h2>{section.name}</h2>}
      <ol className="answer-sheet-rows">{section.items.map(item=>{const row=rows[item.position];return <li key={item.position} data-flagged={row.flagged||undefined}>
        <fieldset disabled={!open}><legend>Questão {item.position}</legend>
          <div className="answer-sheet-letters">{sheetLetters.map(letter=><label key={letter}><input type="radio" name={`q-${item.position}`} value={letter} checked={row.answer===letter} onChange={()=>save(item.position,{answer:letter,flagged:row.flagged})} aria-label={`Questão ${item.position}, alternativa ${letter}`}/><span aria-hidden="true">{letter}</span></label>)}</div>
          <div className="answer-sheet-tools">
            <button type="button" className="text-button" disabled={row.answer===null} onClick={()=>save(item.position,{answer:null,flagged:row.flagged})} aria-label={`Limpar questão ${item.position}`}>Limpar</button>
            <label className="answer-sheet-flag"><input type="checkbox" checked={row.flagged} onChange={event=>save(item.position,{answer:row.answer,flagged:event.target.checked})} aria-label={`Revisar questão ${item.position} depois`}/><span aria-hidden="true">Revisar depois</span></label>
            {row.saving?<small>Salvando…</small>:row.failed?<small role="alert">Não salvou. Marque de novo.</small>:null}
          </div>
        </fieldset></li>;})}</ol>
    </section>)}
    <footer className="answer-sheet-finish">
      {!confirming?<button className="primary-button" type="button" disabled={pending||busy} onClick={()=>setConfirming(true)}>Conferir e finalizar</button>:<section aria-labelledby="finish-title">
        <h2 id="finish-title">Finalizar a prova?</h2>
        <p>{blank.length?`Em branco: ${blank.join(", ")}.`:"Todas as questões têm resposta."}</p>
        {flagged.length>0&&<p>Marcadas para revisar: {flagged.join(", ")}.</p>}
        <p>Depois de finalizar, as respostas não podem mais ser alteradas.</p>
        <div className="answer-sheet-confirm"><button className="primary-button" type="button" disabled={pending||busy} onClick={finish}>{busy?"Corrigindo…":"Finalizar prova"}</button><button className="text-button" type="button" onClick={()=>setConfirming(false)}>Voltar ao cartão</button></div>
      </section>}
      {error&&<p role="alert">{error}</p>}
    </footer>
  </div>;
}
```

- [ ] **Step 6: Implement** `src/features/assessments/past-exam-result.tsx`

```tsx
import Link from "next/link";
import type { SheetView } from "./sheet-view";
const outcomeLabel={correct:"Acertou",incorrect:"Errou",blank:"Em branco",annulled:"Anulada"} as const;
const dateOnly=(value:string)=>value.split("-").reverse().join("/");
export function PastExamResult({view}:{view:SheetView}){
  const result=view.result;if(!result)return <p>Resultado indisponível.</p>;
  return <>
    <section className="score-card" aria-label="Pontuação"><strong>{result.correct}<span>/{result.scored}</span></strong><p>{result.annulled?`${result.annulled} anulada(s) fora da conta. `:""}Critério de treino do Estudisc; não reproduz a regra oficial de classificação.</p></section>
    {result.bySubject.length>0&&<section className="module-section" aria-labelledby="sheet-by-subject"><h2 id="sheet-by-subject">Por área</h2><ul className="subject-bars">{result.bySubject.map(subject=><li key={subject.name}><span>{subject.name}</span><progress className="bar" value={subject.correct} max={Math.max(subject.scored,1)} aria-hidden="true"/><strong>{subject.correct}/{subject.scored}</strong>{subject.annulled?<small>{subject.annulled} anulada(s)</small>:null}</li>)}</ul></section>}
    <section className="module-section" aria-labelledby="sheet-positions"><h2 id="sheet-positions">Questão por questão</h2>
      <table className="sheet-result-table"><thead><tr><th scope="col">Questão</th><th scope="col">Sua resposta</th><th scope="col">Gabarito</th><th scope="col">Resultado</th></tr></thead>
        <tbody>{result.byPosition.map(row=><tr key={row.position} data-outcome={row.outcome}><th scope="row">{row.position}</th><td>{row.answer??"—"}</td><td>{row.key==="ANNULLED"?"Anulada":row.key}</td><td>{outcomeLabel[row.outcome]}</td></tr>)}</tbody></table>
    </section>
    <p className="past-exam-actions"><a className="past-exam-link" href={view.links.examUrl} target="_blank" rel="noopener noreferrer">Caderno oficial</a>{"answerKeyUrl" in view.links&&<a className="past-exam-link" href={view.links.answerKeyUrl} target="_blank" rel="noopener noreferrer">Gabarito oficial</a>}</p>
    <p className="past-exam-notice">{view.provenance.transcriptionNote} Catálogo conferido em {dateOnly(view.provenance.catalogVerifiedAt)}.</p>
    <Link className="primary-action" href="/past-exams">Voltar às provas anteriores</Link>
  </>;
}
```

- [ ] **Step 7: Add the runner branch.** In `src/app/assessments/[assessmentId]/page.tsx`, replace `const view=await assessmentRepository().view(await getOwnerId(),assessmentId);if(!view)notFound();` with:

```tsx
  const repo=assessmentRepository(),ownerId=await getOwnerId();
  const sheet=await repo.sheetView(ownerId,assessmentId);
  if(sheet)return <AppShell mode={sheet.status==="ACTIVE"?"focus":"page"} exit={{href:"/past-exams",label:"Voltar às provas anteriores"}}><article className="foundation-panel content-panel assessment-page">
    <p className="eyebrow">{assessmentKindLabel.PAST_EXAM_SHEET} · modo prova</p><h1>{sheet.status==="FINALIZED"?"Seu resultado":sheet.title}</h1>
    {sheet.status==="ACTIVE"?<AnswerSheetPanel view={sheet}/>:<PastExamResult view={sheet}/>}
  </article></AppShell>;
  const view=await repo.view(ownerId,assessmentId);if(!view)notFound();
```

Import `AnswerSheetPanel` and `PastExamResult`.

- [ ] **Step 8: Implement** `src/app/past-exams/page.tsx`

```tsx
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { assessmentRepository } from "@/features/assessments/api";
import { formatDuration } from "@/features/assessments/labels";
import { buildPastExamCards,buildPastExamProgress,type PastExamCard } from "@/features/assessments/past-exam-cards";
import { AssessmentStartButton } from "@/features/assessments/start-button";
import { getOwnerId } from "@/features/auth/owner";
export const dynamic="force-dynamic";
const dateOnly=(value:string)=>value.split("-").reverse().join("/");
const localDate=(value:string)=>new Date(value).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"});
const stateLabel={FREE:"Livre",ACTIVE:"Em andamento",DONE:"Feita",RESERVED:"Reservada"} as const;
export default async function PastExamsPage({searchParams}:{searchParams:Promise<{year?:string}>}){
  const repo=assessmentRepository();const [templates,instances]=await Promise.all([repo.listTemplates(),repo.listSheetInstances(await getOwnerId())]);
  const cards=buildPastExamCards(templates,instances,new Date()),progress=buildPastExamProgress(templates,instances);
  const years=[...new Set(cards.map(card=>card.year))],{year}=await searchParams,selected=years.find(value=>String(value)===year);
  const verifiedAt=cards.map(card=>card.catalogVerifiedAt).sort().at(-1);
  return <AppShell><section className="foundation-panel past-exams" aria-labelledby="past-exams-title">
    <p className="eyebrow">IFSC · Cursos técnicos integrados</p><h1 id="past-exams-title">Provas anteriores</h1>
    <p>Abra o caderno oficial, marque suas respostas no cartão e veja a correção quando finalizar.</p>
    {cards.length===0?<div className="empty-state"><strong>Nenhuma prova liberada ainda</strong><p>As provas anteriores aparecem aqui quando forem publicadas.</p></div>:<>
      <nav className="year-chips" aria-label="Filtrar por ano"><Link href="/past-exams" aria-current={selected?undefined:"page"}>Todas</Link>{years.map(value=><Link key={value} href={`/past-exams?year=${value}`} aria-current={selected===value?"page":undefined}>{value}</Link>)}</nav>
      {years.filter(value=>!selected||value===selected).map(value=><section key={value} className="module-section" aria-labelledby={`year-${value}`}><h2 id={`year-${value}`}>{value}</h2><ul className="assessment-grid">{cards.filter(card=>card.year===value).map(card=><PastExamCardView key={card.templateId} card={card}/>)}</ul></section>)}
    </>}
    {progress.length>0&&<section className="module-section" aria-labelledby="past-exam-progress"><h2 id="past-exam-progress">Sua evolução</h2><ol className="past-exam-progress">{progress.map(entry=><li key={entry.instanceId}><span>{entry.title}</span><progress className="bar" value={entry.correct} max={Math.max(entry.scored,1)} aria-hidden="true"/><strong>{entry.correct}/{entry.scored}</strong><small>{localDate(entry.startedAt)}</small></li>)}</ol></section>}
    <p className="past-exam-notice">Projeto independente, sem vínculo com o IFSC. Cadernos e gabaritos pertencem aos seus titulares; os links levam ao site oficial.{verifiedAt?` Catálogo conferido em ${dateOnly(verifiedAt)}.`:""}</p>
  </section></AppShell>;
}
function PastExamCardView({card}:{card:PastExamCard}){
  return <li className="assessment-card past-exam-card" data-state={card.state}>
    <span className="kind-chip">{stateLabel[card.state]}</span><h3>{card.title}</h3>
    <p className="assessment-meta"><span>Aplicada em {dateOnly(card.appliedOn)}</span><span>{card.itemCount} questões</span><span>{formatDuration(card.durationMinutes)}</span>{card.annulledCount>0&&<span>{card.annulledCount} anulada(s)</span>}</p>
    {card.subjects.length>0&&<p className="past-exam-subjects">{card.subjects.join(" · ")}</p>}
    {card.state==="RESERVED"?<p className="assessment-date">Simulado reservado: libera em {card.availableAt?localDate(card.availableAt):"data a definir"}</p>:<>
      {card.best&&<p>Melhor resultado: {card.best.correct}/{card.best.scored} · {card.attempts} tentativa(s)</p>}
      <div className="past-exam-actions">
        {card.examUrl&&<a className="past-exam-link" href={card.examUrl} target="_blank" rel="noopener noreferrer">Abrir caderno oficial</a>}
        {card.answerKeyUrl&&<a className="past-exam-link" href={card.answerKeyUrl} target="_blank" rel="noopener noreferrer">Gabarito oficial</a>}
      </div>
      {card.state==="ACTIVE"?<Link className="primary-action" href={`/assessments/${card.activeInstanceId}`}>Continuar</Link>:<AssessmentStartButton templateId={card.templateId} label={card.state==="DONE"?"Refazer":"Responder"}/>}
    </>}
  </li>;
}
```

- [ ] **Step 9: Write the CSS** `src/styles/application/past-exams.css`. Use only existing `--estudisc-*` tokens (read `design-system/DESIGN_SYSTEM_INDEX.md` and copy the patterns from `assessments.css`):

```css
/* Past exams (ADR 0066): list, answer sheet and result. Mobile-first. */
.year-chips { display: flex; flex-wrap: wrap; gap: var(--estudisc-spacing-4); margin: var(--estudisc-spacing-8) 0; }
.year-chips a { min-height: 44px; display: inline-flex; align-items: center; padding: 0 var(--estudisc-spacing-8); border: var(--estudisc-border-hair) solid var(--estudisc-color-ink); color: inherit; text-decoration: none; font-weight: 700; }
.year-chips a[aria-current="page"] { background: var(--estudisc-color-ink); color: var(--estudisc-color-paper); }
.past-exam-card h3 { margin: 0; font-size: 1.375rem; font-weight: 900; line-height: 1.15; }
.past-exam-subjects { margin: 0; font-weight: 600; }
.past-exam-actions { display: flex; flex-wrap: wrap; gap: var(--estudisc-spacing-8); margin: 0; }
.past-exam-link { min-height: 44px; display: inline-flex; align-items: center; font-weight: 700; color: inherit; text-underline-offset: 3px; }
.past-exam-notice { margin-top: var(--estudisc-spacing-12); font-size: 0.875rem; max-width: 65ch; }
.past-exam-progress { display: grid; gap: var(--estudisc-spacing-6); margin: 0; padding: 0; list-style: none; }
.past-exam-progress li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--estudisc-spacing-2) var(--estudisc-spacing-8); align-items: center; }
.past-exam-progress progress { grid-column: 1 / -1; width: 100%; }
.answer-sheet-bar { position: sticky; top: 0; z-index: 1; display: flex; flex-wrap: wrap; gap: var(--estudisc-spacing-4) var(--estudisc-spacing-12); align-items: center; padding: var(--estudisc-spacing-6) 0; background: var(--estudisc-color-paper); border-bottom: var(--estudisc-border-rule) solid var(--estudisc-color-ink); }
.answer-sheet-bar p { margin: 0; font-weight: 700; }
.answer-sheet-timer strong { font-variant-numeric: tabular-nums; font-size: 1.25rem; }
.answer-sheet-section h2 { margin: var(--estudisc-spacing-12) 0 var(--estudisc-spacing-4); }
.answer-sheet-rows { display: grid; gap: var(--estudisc-spacing-4); margin: 0; padding: 0; list-style: none; }
@media (min-width: 900px) { .answer-sheet-rows { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--estudisc-spacing-4) var(--estudisc-spacing-12); } }
.answer-sheet-rows fieldset { display: grid; gap: var(--estudisc-spacing-2); margin: 0; padding: var(--estudisc-spacing-4) 0; border: 0; border-bottom: var(--estudisc-border-hair) solid var(--estudisc-color-ink); min-width: 0; }
.answer-sheet-rows legend { font-weight: 900; padding: 0; }
.answer-sheet-rows li[data-flagged] legend::after { content: " · revisar"; font-weight: 600; }
.answer-sheet-letters { display: grid; grid-template-columns: repeat(5, minmax(44px, 1fr)); gap: var(--estudisc-spacing-2); }
.answer-sheet-letters label { position: relative; display: grid; place-items: center; min-height: 44px; border: var(--estudisc-border-hair) solid var(--estudisc-color-ink); font-weight: 900; cursor: pointer; }
.answer-sheet-letters input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.answer-sheet-letters label:has(input:checked) { background: var(--estudisc-color-ink); color: var(--estudisc-color-paper); }
.answer-sheet-letters label:has(input:focus-visible) { outline: 3px solid var(--estudisc-color-ink); outline-offset: 2px; }
.answer-sheet-tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--estudisc-spacing-8); }
.answer-sheet-tools .text-button, .answer-sheet-flag { min-height: 44px; display: inline-flex; align-items: center; gap: var(--estudisc-spacing-2); }
.answer-sheet-finish { display: grid; gap: var(--estudisc-spacing-6); margin-top: var(--estudisc-spacing-12); }
.answer-sheet-confirm { display: flex; flex-wrap: wrap; gap: var(--estudisc-spacing-8); }
.answer-sheet-closed { font-weight: 700; }
.sheet-result-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.sheet-result-table th, .sheet-result-table td { padding: var(--estudisc-spacing-2) var(--estudisc-spacing-4); border-bottom: var(--estudisc-border-hair) solid var(--estudisc-color-ink); text-align: left; }
.sheet-result-table tr[data-outcome="incorrect"] td:last-child, .sheet-result-table tr[data-outcome="blank"] td:last-child { font-weight: 900; }
```

Then add `@import "../styles/application/past-exams.css";` after the `assessments.css` import in `src/app/globals.css`. If any token name does not exist, use the nearest existing token from `assessments.css`. Do not invent new tokens.

- [ ] **Step 10: Add the nav item.** In `src/components/layout/primary-nav.tsx`, add `FileText` to the lucide import and insert `{ label: "Provas anteriores", href: "/past-exams", icon: FileText, match: ["/past-exams"] },` after the Simulados entry.

- [ ] **Step 11: Run the E2E and related suites**

Run: `pnpm test:e2e tests/e2e/past-exams.spec.ts tests/e2e/shell.spec.ts tests/e2e/exam-navigation.spec.ts tests/e2e/accessibility.spec.ts`
Expected: PASS in both projects (chromium, mobile-chrome). If shell/accessibility assert nav items or page lists, update those expectations only for the new nav entry. Open the 320px and 1280px screenshots and check the layout visually.

- [ ] **Step 12: Commit**

```bash
git add src/app/past-exams src/features/assessments/answer-sheet-panel.tsx src/features/assessments/past-exam-result.tsx src/features/assessments/start-button.tsx src/styles/application/past-exams.css src/app/globals.css "src/app/assessments/[assessmentId]/page.tsx" src/components/layout/primary-nav.tsx tests/e2e/past-exams.spec.ts
git commit -m "feat(ui): Provas anteriores page, answer sheet and result"
```

---

### Task 7: Docs, full gates and handoff

**Files:**
- Modify: `docs/ifsc/09-ASSESSMENT-SYSTEM.md` (add `PAST_EXAM_SHEET` under the unified engine and a short "Answer-sheet past exams" section pointing to ADR 0066)
- Modify: `docs/ifsc/10-OFFICIAL-EXAMS.md` (an "Answer-sheet catalog 2022.1–2026.2" section: 11 editions, link-only, reservation unchanged with dates in `packs/past-exams/releases.json`)
- Modify: `CHANGELOG.md`, `PLANS.md`, `PROJECT_STATUS.md`

- [ ] **Step 1: Update the docs above.** Write `PROJECT_STATUS.md` with the exact commands run and a `NEXT ACTION`: user confirmation for push/PR, then the production template import.

- [ ] **Step 2: Run the full gates**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`
Expected: all PASS. Record the counts. Fix failures before continuing, and report anything environmental exactly.

- [ ] **Step 3: Commit**

```bash
git add docs CHANGELOG.md PLANS.md PROJECT_STATUS.md
git commit -m "docs: past exams answer sheet (ADR 0066) status and contracts"
```

- [ ] **Step 4: Stop for confirmation.** Push, PR, deploy and the production import all need explicit user approval. Once approved, the import is: `pnpm tsx scripts/build-past-exam-templates.ts "<actual authorization>"`, then POST each object in `.local/past-exams/templates.json` to `/api/admin/assessment-templates` from an authenticated ADMIN session. Expect 201, or the existing row on a re-run.

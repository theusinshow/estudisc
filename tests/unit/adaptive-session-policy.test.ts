import { expect, it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { questionSchema } from "@/features/questions/contracts";
import { adaptiveChoice, type AdaptiveLesson } from "@/features/study-sessions/adaptive-candidates";
import { planCandidates } from "@/features/study-sessions/planner-policy";
import { sessionItemsSchema } from "@/features/study-sessions/contracts";

const question = questionSchema.parse(source.questions[0]);
function lesson(patch: Partial<AdaptiveLesson> = {}): AdaptiveLesson {
  return { id: "lesson", trackId: "track", version: 1, title: "Aula", subjectCode: "MAT", estimatedMinutes: 30, conceptIds: question.conceptIds,
    levels: [0], importance: 1, dueDays: 0, due: false, mistake: false, prerequisitesReady: true, phase: "FOUNDATION", objectives: ["Objetivo"], sourceIds: ["source"], checkpointIds: ["q2"], independentQa: true, officialMappingVerified: false,
    activities: [0, 1, 2].map(index => ({ stableId: `a${index}`, prompt: "Pratique", orderIndex: index, config: { questionId: `q${index}`, questionVersion: 1, hints: [] }, question: { ...question, id: `q${index}`, difficulty: "foundation" }, independentSuccess: false, failedBefore: false })), ...patch };
}
it("uses question delivery within ten minutes and never clamps a whole lesson estimate", () => {
  const short = adaptiveChoice(lesson(), 10)!;
  expect(short.item.delivery).toBe("questions"); expect(short.item.minutes).toBe(8);
  expect(short.item.questions).toHaveLength(2); expect(short.item.caveats).toContain("O mapeamento curricular oficial não foi certificado.");
  const full = adaptiveChoice(lesson(), 30)!;
  expect(full.item.delivery).toBe("lesson"); expect(full.item.minutes).toBe(30);
  expect(adaptiveChoice(lesson({ independentQa: false }), 30)!.item.delivery).toBe("questions");
  expect(adaptiveChoice(lesson({ checkpointIds: ["unavailable"] }), 30)!.item.delivery).toBe("questions");
});
it("uses the existing composer for targeted retrieval and excludes original identities across versions",()=>{
  const input=lesson({due:false,mistake:false,activities:lesson().activities.map(activity=>({...activity,independentSuccess:true}))});
  const target={kind:"remediation" as const,conceptIds:question.conceptIds,excludedQuestionIds:["q0"],reason:"Outra questão do conceito"};
  const result=adaptiveChoice(input,10,10,target)!;
  expect(result.item.intent).toBe("remediation");expect(result.item.delivery).toBe("questions");expect(result.item.questions.map(q=>q.id)).toEqual(["q1","q2"]);
  expect(result.item.reason).toBe(target.reason);expect(result.item.minutes).toBeLessThanOrEqual(10);
  expect(adaptiveChoice(input,10,10,{...target,excludedQuestionIds:["q0","q1","q2"]})).toBeNull();
  expect(adaptiveChoice(input,10,10,{...target,conceptIds:["unrelated"]})).toBeNull();
});
it("keeps published-without-QA separate from new-learning readiness and respects prerequisites", () => {
  const practice = adaptiveChoice(lesson({ independentQa: false, objectives: [], levels: [2] }), 20)!;
  expect(practice.item.intent).toBe("practice"); expect(practice.item.caveats?.length).toBeGreaterThan(0);
  const blocked = adaptiveChoice(lesson({ prerequisitesReady: false }), 30)!;
  expect(planCandidates([blocked.candidate], 30, "FOUNDATION", {}, undefined, true).items).toEqual([]);
});
it("prioritizes due retrieval, mistakes and weaknesses with stable permutation/budget constraints", () => {
  const review = adaptiveChoice(lesson({ id: "review", due: true, importance: 1, levels: [5] }), 10)!;
  const remediate = adaptiveChoice(lesson({ id: "remediate", mistake: true, importance: 4, levels: [0], activities: lesson().activities.map(a => ({ ...a, question: { ...a.question, id: `r-${a.question.id}` } })) }), 10)!;
  const a = planCandidates([remediate.candidate, review.candidate], 10, "FOUNDATION", {}, undefined, true);
  expect(a.items[0].kind).toBe("review"); expect(a.usedMinutes).toBeLessThanOrEqual(10);
  expect(planCandidates([review.candidate, remediate.candidate], 10, "FOUNDATION", {}, undefined, true)).toEqual(a);
});
it("excludes independent successes except due review and prefers novel remediation questions", () => {
  const input = lesson(); input.activities[0].independentSuccess = true; input.activities[1].failedBefore = true;
  expect(adaptiveChoice(input, 5)!.item.activityIds).toEqual(["a2"]);
  expect(adaptiveChoice({ ...input, activities: input.activities.map(a => ({ ...a, independentSuccess: true })) }, 10)).toBeNull();
  expect(adaptiveChoice({ ...input, due: true }, 10)).not.toBeNull();
});
it("deduplicates shared Questions across tracks and applies per-track exam caps", () => {
  const a = adaptiveChoice(lesson({ id: "a", trackId: "track-a", levels: [2] }), 10)!;
  const b = adaptiveChoice(lesson({ id: "b", trackId: "track-b", levels: [2] }), 10)!;
  expect(planCandidates([a.candidate, b.candidate], 20, "FOUNDATION", {}, undefined, true).items).toHaveLength(1);
  const exam = adaptiveChoice(lesson({ phase: "EXAM_PREP" }), 45)!;
  expect(exam.item.intent).toBe("practice");
});
it("preserves old snapshot parsing and binds new activity snapshots without answer payloads", () => {
  const item = adaptiveChoice(lesson(), 10)!.item;
  expect(sessionItemsSchema.parse([item])[0]).toEqual(item);
  expect(JSON.stringify(item.activitySnapshots)).not.toContain('"answer"');
  const old = { lessonId: item.lessonId, version: item.version, title: item.title, subjectCode: item.subjectCode, minutes: item.minutes, activityIds: item.activityIds, questions: item.questions };
  expect(sessionItemsSchema.parse([old])).toEqual([old]);
  expect(() => sessionItemsSchema.parse([{ ...item, activityIds: ["other"] }])).toThrow();
});

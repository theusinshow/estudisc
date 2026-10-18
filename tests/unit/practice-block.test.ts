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

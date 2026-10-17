import { describe, expect, it } from "vitest";

import { examPace, examPaceLabel } from "@/features/assessments/exam-pace";

const start = "2026-11-29T08:00:00.000Z", end = "2026-11-29T12:00:00.000Z"; // 240 min, 28 questions → ~8.6 min each
const at = (minutes: number) => Date.parse(start) + minutes * 60000;

describe("examPace", () => {
  it("is on pace within ±3 minutes", () => {
    const pace = examPace({ totalQuestions: 28, answered: 7, startedAt: start, deadlineAt: end, now: at(60) })!;
    expect(pace.status).toBe("on");
    expect(examPaceLabel(pace)).toBe("No ritmo");
    expect(pace.perQuestionMinutes).toBeCloseTo(8.57, 1);
  });

  it("reports minutes ahead and behind", () => {
    expect(examPaceLabel(examPace({ totalQuestions: 28, answered: 10, startedAt: start, deadlineAt: end, now: at(60) })!)).toBe("26 min adiantado");
    expect(examPaceLabel(examPace({ totalQuestions: 28, answered: 4, startedAt: start, deadlineAt: end, now: at(60) })!)).toBe("26 min atrasado");
  });

  it("stops the clock at the deadline and rejects invalid windows", () => {
    expect(examPace({ totalQuestions: 28, answered: 28, startedAt: start, deadlineAt: end, now: at(500) })!.minutes).toBe(0);
    expect(examPace({ totalQuestions: 0, answered: 0, startedAt: start, deadlineAt: end, now: at(1) })).toBeNull();
    expect(examPace({ totalQuestions: 5, answered: 0, startedAt: end, deadlineAt: start, now: at(1) })).toBeNull();
  });
});

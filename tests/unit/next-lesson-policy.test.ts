import { expect, it } from "vitest";
import { chooseNextLessons, isLessonDone, type FlowLesson } from "@/features/study-flow/next-lesson";

function lesson(id: string, subjectCode: string, order: number, questionIds = [`${id}-q1`, `${id}-q2`, `${id}-q3`, `${id}-q4`, `${id}-q5`]): FlowLesson {
  return { id, title: `Aula ${id}`, subjectCode, order, estimatedMinutes: 30, questionIds };
}
const catalog = [
  lesson("MAT-01", "MAT", 1), lesson("MAT-02", "MAT", 2),
  lesson("CIE-01", "CIE", 1), lesson("CIE-02", "CIE", 2),
  lesson("GH-01", "GH", 1), lesson("GH-02", "GH", 2),
  lesson("POR-01", "POR", 1), lesson("POR-02", "POR", 2)
];
const empty = { completedLessonIds: [], inProgress: [], answeredQuestionIds: [] };

it("starts a new student on the first lesson of the first subject", () => {
  const result = chooseNextLessons(catalog, empty);
  expect(result.next).toMatchObject({ lesson: { id: "MAT-01" }, resume: false });
  expect(result.bySubject.map(entry => entry.lesson.id)).toEqual(["MAT-01", "CIE-01", "GH-01", "POR-01"]);
});

it("counts a lesson as done when completed or when 80% of its questions were answered in any version", () => {
  const mat = catalog[0];
  expect(isLessonDone(mat, { ...empty, completedLessonIds: ["MAT-01"] })).toBe(true);
  expect(isLessonDone(mat, { ...empty, answeredQuestionIds: ["MAT-01-q1", "MAT-01-q2", "MAT-01-q3", "MAT-01-q4"] })).toBe(true);
  expect(isLessonDone(mat, { ...empty, answeredQuestionIds: ["MAT-01-q1", "MAT-01-q2", "MAT-01-q3"] })).toBe(false);
  expect(isLessonDone({ ...mat, questionIds: [] }, empty)).toBe(false);
});

it("resumes the most recently touched unfinished lesson before anything else", () => {
  const result = chooseNextLessons(catalog, { ...empty, inProgress: [
    { lessonId: "GH-02", updatedAt: new Date("2026-10-14T10:00:00Z") },
    { lessonId: "CIE-01", updatedAt: new Date("2026-10-15T10:00:00Z") }
  ] });
  expect(result.next).toMatchObject({ lesson: { id: "CIE-01" }, resume: true });
});

it("ignores an in-progress record once the lesson is done", () => {
  const result = chooseNextLessons(catalog, { ...empty, completedLessonIds: ["CIE-01"], inProgress: [{ lessonId: "CIE-01", updatedAt: new Date() }] });
  expect(result.next?.lesson.id).toBe("MAT-01");
  expect(result.next?.resume).toBe(false);
});

it("rotates to the subject with the fewest finished lessons and advances within it", () => {
  const result = chooseNextLessons(catalog, { ...empty, completedLessonIds: ["MAT-01", "CIE-01", "GH-01"] });
  expect(result.next?.lesson.id).toBe("POR-01");
  const after = chooseNextLessons(catalog, { ...empty, completedLessonIds: ["MAT-01", "CIE-01", "GH-01", "POR-01"] });
  expect(after.next?.lesson.id).toBe("MAT-02");
  expect(after.bySubject.map(entry => entry.lesson.id)).toEqual(["MAT-02", "CIE-02", "GH-02", "POR-02"]);
});

it("skips finished subjects and reports when every lesson is done", () => {
  const done = catalog.map(entry => entry.id);
  expect(chooseNextLessons(catalog, { ...empty, completedLessonIds: done }).next).toBeNull();
  const onlyGh = chooseNextLessons(catalog, { ...empty, completedLessonIds: done.filter(id => id !== "GH-02") });
  expect(onlyGh.next?.lesson.id).toBe("GH-02");
  expect(onlyGh.bySubject.map(entry => entry.lesson.id)).toEqual(["GH-02"]);
});

it("orders lessons inside a subject by track order, not by id", () => {
  const shuffled = [lesson("MAT-PREREQ", "MAT", 0), lesson("MAT-10", "MAT", 10), lesson("MAT-02", "MAT", 2)];
  expect(chooseNextLessons(shuffled, empty).next?.lesson.id).toBe("MAT-PREREQ");
  expect(chooseNextLessons(shuffled, { ...empty, completedLessonIds: ["MAT-PREREQ"] }).next?.lesson.id).toBe("MAT-02");
});

it("ignores a lesson resume from an older pack that reused the same lesson id", async () => {
  const { progressFromResumes } = await import("@/db/repositories/study-flow-repository");
  const done = { stepId: null, completed: true, showAll: false, elapsedSeconds: 0, drafts: [] };
  const progress = progressFromResumes([
    { lessonId: "CIE-06", trackId: "week-1", data: done, updatedAt: new Date() },
    { lessonId: "CIE-01", trackId: "science", data: done, updatedAt: new Date() }
  ], [], new Map([["CIE-06", "science"], ["CIE-01", "science"]]));
  expect(progress.completedLessonIds).toEqual(["CIE-01"]);
});

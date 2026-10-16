// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { resolveLessonVersionContext } from "@/features/import/application/lesson-version-policy";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";

type Fixture = ReturnType<typeof lessonVersionFixture>;
type Question = Fixture["context"]["questions"][number];

/** Build a next lesson version that binds new Question versions (ADR 0063). */
function binding(edit: (input: { lesson: Fixture["base"]; context: Fixture["context"]; questions: Question[] }) => void) {
  const { context, base, packet } = lessonVersionFixture();
  const lesson = structuredClone({ ...base, version: base.version + 1, status: "draft" as const });
  const questions: Question[] = [];
  edit({ lesson, context, questions });
  const all = [...context.questions.filter(q => !questions.some(n => n.id === q.id)), ...questions];
  const ids = [...new Set([...lesson.exitTicketQuestionIds, ...lesson.activities.flatMap(a => a.questionId ? [a.questionId] : [])])];
  const questionReferences = ids.map(id => { const q = all.find(entry => entry.id === id)!; return { id, version: q.version, hash: hashCanonicalJson(q) }; });
  const pack = lessonVersionPackSchema.parse({ ...packet, packId: "estudisc.binding.fixture", lesson, questionReferences, questionVersions: questions });
  return { context, base, pack };
}
/** Reorder choices of the first Question activity and bind the next version. */
function bumpFirst(input: { lesson: Fixture["base"]; context: Fixture["context"]; questions: Question[] }, patch: Partial<Question> = {}) {
  const activity = input.lesson.activities.find(a => a.type === "question")!;
  const old = input.context.questions.find(q => q.id === activity.questionId)!;
  const next = { ...structuredClone(old), version: old.version + 1, status: "draft" as const, choices: [...(old.choices ?? [])].reverse(), ...patch } as Question;
  input.questions.push(next);
  activity.config = { ...activity.config, questionVersion: next.version };
  return { activity, old, next };
}

describe("lesson-bound Question versions", () => {
  it("binds the next version of a lesson-owned Question and projects it", () => {
    let id = "";
    const { context, pack } = binding(input => { id = bumpFirst(input).next.id; });
    const { projection } = resolveLessonVersionContext([context], pack);
    const projected = projection.questions.filter(q => q.id === id);
    expect(projected).toHaveLength(1);
    expect(projected[0].version).toBe(context.questions.find(q => q.id === id)!.version + 1);
  });

  it("appends a new Question with a new question Activity", () => {
    const { context, pack } = binding(input => {
      const template = input.lesson.activities.find(a => a.type === "question")!;
      const source = input.context.questions.find(q => q.id === template.questionId)!;
      const question = { ...structuredClone(source), id: "Q-NEW-BINDING-1", version: 1, status: "draft" as const } as Question;
      input.questions.push(question);
      input.lesson.activities.push({ ...structuredClone(template), id: "ACT-NEW-BINDING-1", questionId: question.id, config: { ...template.config, questionVersion: 1 } });
    });
    expect(resolveLessonVersionContext([context], pack).projection.questions.some(q => q.id === "Q-NEW-BINDING-1")).toBe(true);
  });

  it("refuses version jumps, published, official or reserved Questions and foreign Concepts", () => {
    const cases: [Partial<Question> | ((q: Question) => Partial<Question>), RegExp][] = [
      [q => ({ version: q.version + 2 }), /next version/],
      [{ status: "published" }, /draft/],
      [{ provenance: { type: "official_exam", examId: "IFSC-2025-1", officialNumber: 3 } } as Partial<Question>, /official|provenance/i],
      [q => ({ exposurePolicy: { ...q.exposurePolicy, reservedForAssessment: true } }), /reserved/],
      [{ conceptIds: ["UNKNOWN.CONCEPT"], primaryConceptId: "UNKNOWN.CONCEPT" }, /Concept/]
    ];
    for (const [patch, error] of cases) {
      const { context, pack } = binding(input => {
        const activity = input.lesson.activities.find(a => a.type === "question")!;
        const old = input.context.questions.find(q => q.id === activity.questionId)!;
        const resolved = typeof patch === "function" ? patch(old) : patch;
        const { next } = bumpFirst(input, resolved);
        activity.config = { ...activity.config, questionVersion: next.version };
      });
      expect(() => resolveLessonVersionContext([context], pack), String(JSON.stringify(patch) ?? patch).slice(0, 60)).toThrow(error);
    }
  });

  it("refuses a new version of a Question another lesson references", () => {
    const { context, pack } = binding(input => {
      const { old } = bumpFirst(input);
      const other = input.context.track.modules[0].lessons.find(l => l.id !== input.lesson.id)!;
      other.activities.push({ ...structuredClone(input.lesson.activities.find(a => a.type === "question")!), id: "ACT-SHARED", questionId: old.id, config: { questionVersion: old.version, hints: [] } });
    });
    expect(() => resolveLessonVersionContext([context], pack)).toThrow(/another lesson/);
  });

  it("refuses Activity changes beyond rebinding and unused Question versions", () => {
    const prompt = binding(input => { const { activity } = bumpFirst(input); activity.prompt = "Outro enunciado da atividade"; });
    expect(() => resolveLessonVersionContext([prompt.context], prompt.pack)).toThrow(/Activities/);
    const unbound = binding(input => { const { activity, old } = bumpFirst(input); activity.config = { ...activity.config, questionVersion: old.version }; });
    expect(() => resolveLessonVersionContext([unbound.context], unbound.pack)).toThrow(/not bound|unused/);
  });

  it("still refuses an unchanged lesson without corrections, additions or Question versions", () => {
    const { context, pack } = binding(() => undefined);
    expect(() => resolveLessonVersionContext([context], pack)).toThrow(/at least one/);
  });
});

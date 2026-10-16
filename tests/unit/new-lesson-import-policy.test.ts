// @vitest-environment node
import { describe, expect, it } from "vitest";
import { newLessonPackSchema, type NewLessonPack } from "@/features/import/application/new-lesson-contracts";
import { resolveNewLessonContext } from "@/features/import/application/new-lesson-policy";
import { validateTrackPack } from "@/features/import/api";
import { newLessonFixture } from "../fixtures/new-lesson-import";

/** Mutate a valid converted pack and resolve it against the fixture context. */
function resolve(edit: (pack: NewLessonPack, context: ReturnType<typeof newLessonFixture>["context"]) => void) {
  const { context, pack } = newLessonFixture();
  const next = structuredClone(pack);
  edit(next, context);
  return () => resolveNewLessonContext([context], newLessonPackSchema.parse(next));
}

describe("new lesson in an imported Track version (ADR 0064)", () => {
  it("accepts a valid new lesson and appends it, its Questions and sources to the projection", () => {
    const { context, pack } = newLessonFixture();
    const { projection } = resolveNewLessonContext([context], pack);
    const lessons = projection.track.modules.find(m => m.id === "mat")!.lessons;
    expect(lessons.at(-1)?.id).toBe("MAT-NEW-FIX");
    expect(lessons.slice(0, -1)).toEqual(context.track.modules.find(m => m.id === "mat")!.lessons);
    expect(projection.questions.filter(q => q.id.startsWith("MAT-NEW-FIX-"))).toHaveLength(3);
    expect(projection.sources.length).toBe(context.sources.length + pack.sources.length);
    expect(projection.questions.slice(0, context.questions.length)).toEqual(context.questions);
    // A projection is a read snapshot; it can never be replayed as a full Track import.
    expect(validateTrackPack(projection)).toMatchObject({ ok: false, issues: [{ code: "projection_only" }] });
  });

  it("refuses an existing lesson id, a colliding Concept id and a reused Question id", () => {
    expect(resolve((pack, context) => { pack.lesson.id = context.track.modules[0].lessons[0].id; })).toThrow(/already exists/);
    expect(resolve((pack, context) => {
      const existing = context.track.modules[0].lessons[0].concepts[0].id, own = pack.lesson.concepts[0].id;
      pack.lesson.concepts[0].id = existing;
      const swap = (ids: string[]) => ids.map(id => id === own ? existing : id);
      pack.lesson.blocks.forEach(b => { b.conceptIds = swap(b.conceptIds); if (b.payload.conceptId === own) b.payload.conceptId = existing; });
      pack.lesson.activities.forEach(a => { a.conceptIds = swap(a.conceptIds); });
      pack.questions.forEach(q => { q.conceptIds = swap(q.conceptIds); if (q.primaryConceptId === own) q.primaryConceptId = existing; });
    })).toThrow(/Concept .* already exists/);
    expect(resolve((pack, context) => {
      const existing = context.questions[0].id, own = pack.questions[0].id;
      pack.questions[0].id = existing;
      pack.lesson.activities.forEach(a => { if (a.questionId === own) a.questionId = existing; });
    })).toThrow(/Question .* already exists/);
  });

  it("refuses official, reserved, published or non-initial Questions", () => {
    expect(resolve(pack => { pack.questions[0].provenance = { type: "official_exam", examId: "IFSC-2025-1", officialNumber: 3 }; })).toThrow(/Official/);
    expect(resolve(pack => { pack.questions[0].exposurePolicy.reservedForAssessment = true; })).toThrow(/reserved/);
    expect(resolve(pack => { pack.questions[0].status = "published"; })).toThrow(/version 1 as draft/);
    expect(resolve(pack => { pack.questions[0].version = 2; })).toThrow(/version 1 as draft/);
    expect(resolve(pack => { pack.questions[0].conceptIds = ["MAT.UNKNOWN"]; pack.questions[0].primaryConceptId = "MAT.UNKNOWN"; })).toThrow(/Concept outside/);
  });

  it("refuses an unknown or non-text renderer and a wrong module", () => {
    expect(resolve(pack => { pack.lesson.blocks[0].type = "figure"; })).toThrow(/only existing text renderers/);
    expect(resolve(pack => { pack.lesson.blocks[0].type = "exit-ticket"; })).toThrow(/only existing text renderers/);
    expect(resolve(pack => { pack.target.moduleId = "por"; })).toThrow(/module/);
  });

  it("refuses a published or later lesson version, unused Questions and foreign activity bindings", () => {
    expect(resolve(pack => { pack.lesson.status = "published"; })).toThrow(/version 1 as draft/);
    expect(resolve(pack => { pack.lesson.version = 2; })).toThrow(/version 1 as draft/);
    expect(resolve(pack => { pack.lesson.activities = pack.lesson.activities.filter(a => a.questionId !== "MAT-NEW-FIX-Q02"); })).toThrow(/unused/);
    expect(resolve((pack, context) => { pack.lesson.activities[0].questionId = context.questions[0].id; })).toThrow(/new Questions/);
  });
});

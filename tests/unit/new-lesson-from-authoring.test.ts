// @vitest-environment node
import { describe, expect, it } from "vitest";
import { newLessonPackFromAuthoring } from "../../tools/estudisc-content-studio/new-lesson-from-authoring";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
import { newLessonAuthoringFixture, newLessonFixture } from "../fixtures/new-lesson-import";

describe("new-lesson authoring converter", () => {
  it("maps the authoring file into a draft caderno.lesson-new.v1 pack", () => {
    const { context, pack } = newLessonFixture();
    expect(pack).toMatchObject({ schema: "caderno.lesson-new.v1", packId: "estudisc.new-lesson.mat-new-fix", version: 1, target: { trackId: context.track.id, trackVersion: context.version, moduleId: "mat" } });
    expect(pack.lesson).toMatchObject({ id: "MAT-NEW-FIX", version: 1, status: "draft", kind: "core", exitTicketQuestionIds: ["MAT-NEW-FIX-Q03"] });
    const [q1, q2, q3] = pack.questions;
    expect(q1.stem).toBe("Tempos: 8, 12, 10 e 14 minutos.\n\nQual é a média?");
    expect(q1.stimulus).toBeUndefined();
    expect(q2.stem).toBe("Qual é a mediana de 3, 9 e 5?");
    expect(q1).toMatchObject({ version: 1, status: "draft", difficulty: "foundation", subjectCode: "MAT", answer: { kind: "multiple_choice", choiceId: "B" }, provenance: { type: "generated", generationRunId: "fixture-new-lesson-run" }, exposurePolicy: { reservedForAssessment: false } });
    expect(q3).toMatchObject({ difficulty: "ifsc", primaryConceptId: "MAT-NEW-FIX-C02" });
    // Enum labels survive; free-text labels become "unknown"; the correct choice carries none.
    expect(q1.choices!.map(c => c.targetsError)).toEqual(["calculation", undefined, "unknown", "unknown"]);
    expect(pack.lesson.activities.map(a => [a.questionId, a.config.phase, a.config.questionVersion])).toEqual([
      ["MAT-NEW-FIX-Q01", "guided_practice", 1], ["MAT-NEW-FIX-Q02", "independent_practice", 1], ["MAT-NEW-FIX-Q03", "exit_ticket", 1]]);
    expect(pack.lesson.activities[0].config.checkpointFor).toBe("MAT-NEW-FIX-B02");
    expect(pack.lesson.blocks[1].payload).toEqual({ conceptId: "MAT-NEW-FIX-C01", title: "Média simples", content: "Some os valores e divida pela quantidade." });
    expect(pack.sources.map(s => s.type)).toEqual(["ai_generated", "reference"]);
    expect(pack.sources[0].metadata).toMatchObject({ editalItem: "MATEMÁTICA — item fictício de teste", editalMappingStatus: "author_claim_unverified", reviewStatus: "pending_human_publication_review" });
    expect(pack.lesson.sourceIds).toEqual(pack.sources.map(s => s.id));
  });

  it("refuses a subject that differs from the module, an unknown module and invalid authoring", () => {
    const { context } = lessonVersionFixture();
    const base = { context, moduleId: "mat", authorId: "fixture-author", generationRunId: "run" };
    expect(() => newLessonPackFromAuthoring({ ...base, authoring: { ...newLessonAuthoringFixture(), subject: "POR" } })).toThrow(/subject/);
    expect(() => newLessonPackFromAuthoring({ ...base, moduleId: "missing", authoring: newLessonAuthoringFixture() })).toThrow(/Module/);
    const twoCorrect = newLessonAuthoringFixture(); twoCorrect.questions[0].choices[0].correct = true;
    expect(() => newLessonPackFromAuthoring({ ...base, authoring: twoCorrect })).toThrow(/exactly one correct/);
    expect(() => newLessonPackFromAuthoring({ ...base, authoring: { ...newLessonAuthoringFixture(), blocks: [] } })).toThrow();
  });
});

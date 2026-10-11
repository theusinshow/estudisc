import { describe, expect, it } from "vitest";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { buildMat16CircleRetrievalPacket } from "../../tools/estudisc-content-studio/recipes/mat16-circle-retrieval.v1";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";

describe("MAT-16 circle retrieval authoring recipe", () => {
  it("builds three original generated training Questions only from a fresh MAT-16 v4 context", () => {
    const fixture = lessonVersionFixture(true);
    const lesson = structuredClone(fixture.base);
    lesson.id = "MAT-16"; lesson.version = 4; lesson.status = "published";
    lesson.concepts = [
      { id: "MAT.MEASURE.LENGTH", title: "Comprimento", importance: "medium" },
      { id: "MAT.GEO.AREA.OTHER_PLANAR", title: "Área do círculo", importance: "medium" }
    ];
    const context = { authorId: "fixture-author", target: { ...fixture.packet.target, lessonId: lesson.id, baseVersion: lesson.version, baseHash: hashCanonicalJson(lesson) }, lesson, questionReferences: fixture.packet.questionReferences, published: true, findings: [] };
    const packet = buildMat16CircleRetrievalPacket(context, "fixture.mat16-circle-v5");
    expect(packet.schema).toBe("caderno.lesson.v3");
    expect(packet.lesson.activities.slice(-3).every(activity => activity.type === "question")).toBe(true);
    expect(packet.newQuestions.map(question => question.answer.kind === "numeric" ? question.answer.value : null)).toEqual([31.4, 10, 28.26]);
    expect(packet.newQuestions.every(question => question.provenance.type === "generated" && !question.exposurePolicy.reservedForAssessment && question.sourceIds.length === 0)).toBe(true);
  });
});

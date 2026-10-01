import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateTrackPack } from "@/features/import/api";
// @ts-expect-error plain ESM authoring script without type declarations
import { DRAFT_SOURCE, expandLessonDraft, loadLessonDrafts } from "../../scripts/expand-ifsc-lesson-drafts.mjs";

type Expanded = { lesson: { id: string; status: string; exitTicketQuestionIds: string[]; concepts: { id: string }[] }; questions: { id: string; status: string; provenance: { type: string }; primaryConceptId: string }[] };

describe("IFSC lesson drafts", () => {
  const expanded: Expanded[] = loadLessonDrafts().map(expandLessonDraft);

  it("expands into a valid Pack v2 alongside the Golden seed, still as unreviewed drafts", () => {
    const pack = JSON.parse(readFileSync("packs/seeds/ifsc-2027.golden.track.v2.json", "utf8"));
    pack.sources.push(DRAFT_SOURCE);
    pack.questions.push(...expanded.flatMap(e => e.questions));
    for (const { lesson } of expanded) pack.track.modules.find((m: { subjectCode: string }) => m.subjectCode === lesson.id.split("-")[0]).lessons.push(lesson);
    const result = validateTrackPack(pack);
    expect(result.ok, JSON.stringify(!result.ok && result.issues).slice(0, 2000)).toBe(true);
    for (const { lesson, questions } of expanded) {
      expect(lesson.status).toBe("draft");
      expect(lesson.exitTicketQuestionIds).toHaveLength(3);
      for (const question of questions) expect([question.status, question.provenance.type]).toEqual(["draft", "generated"]);
      for (const concept of lesson.concepts) expect(questions.filter(q => q.primaryConceptId === concept.id).length).toBeGreaterThanOrEqual(2);
    }
  });
});

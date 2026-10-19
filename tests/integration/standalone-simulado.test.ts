// @vitest-environment node
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { AssessmentRepository } from "@/db/repositories/assessment-repository";
import { StandaloneQuestionRepository } from "@/db/repositories/content-qa/standalone-question-repository";
import { ContentPublicationService } from "@/db/repositories/content-qa/publication-service";
import { DrizzleQuestionRepository } from "@/db/repositories/question-repository";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { QuestionStudyRepository } from "@/db/repositories/question-study-repository";
import { attempts, concepts, contentPublicationEvents, contentReleases, lessons, owners, questionVersions, reviewSchedules } from "@/db/schema";
import { sessionItemsSchema } from "@/features/study-sessions/contracts";
import type { Question } from "@/features/questions/contracts";
import { buildSimuladoTemplate } from "../../tools/estudisc-content-studio/simulado-builder";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

const admin = { ownerId: "owner", role: "ADMIN" as const };
const student = { ownerId: "student", role: "STUDENT" as const };
const reason = "Publicação direta das questões inéditas dos simulados IFSC.";
const now = new Date("2026-10-16T12:00:00Z");
const subjectConcepts = { MAT: "MAT.PCT.CALCULATE", POR: "POR.READ.INFER", CIE: "CIE.ATOM.STRUCTURE", GH: "GH.BR.ABOLITION.PROCESS" } as const;
type Subject = keyof typeof subjectConcepts;

function standalone(subject: Subject, n: number, patch: Partial<Question> = {}): Question {
  return {
    id: `SIM-${subject}-${n}`, version: 1, subjectCode: subject, primaryConceptId: subjectConcepts[subject], conceptIds: [subjectConcepts[subject]],
    type: "multiple_choice", difficulty: "ifsc", cognitiveOperations: ["interpret", "apply"], stem: `Questão inédita ${subject} ${n}?`,
    choices: ["A", "B", "C", "D", "E"].map(id => ({ id, content: `Alternativa ${id} de ${subject} ${n}`, correct: id === "C" })),
    answer: { kind: "multiple_choice", choiceId: "C" }, explanation: "A alternativa C decorre do enunciado.", sourceIds: [], assets: [], items: [], destinations: [],
    provenance: { type: "generated", generationRunId: "simulado-test" }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "draft",
    ...patch
  };
}
const bank = (["MAT", "POR", "CIE", "GH"] as const).flatMap(subject => Array.from({ length: 7 }, (_, index) => standalone(subject, index + 1)));
const refs = (subject: Subject) => bank.filter(question => question.subjectCode === subject).map(question => ({ id: question.id, version: question.version }));
const items = { MAT: refs("MAT"), POR: refs("POR"), CIE: refs("CIE"), GH: refs("GH") };

async function setup() {
  const database = await createMigratedPgliteTestDatabase();
  const fixture = structuredClone(source);
  for (const question of fixture.questions) { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; }
  for (const trackModule of fixture.track.modules) for (const lesson of trackModule.lessons) lesson.status = "published";
  const importer = new DrizzleTrackImportRepository(database.db);
  expect((await importTrackPack(fixture, importer)).status).toBe("imported");
  // Disposable stand-in for the editorial release of the lesson Pack.
  await database.db.update(questionVersions).set({ status: "published" });
  for (const lesson of await database.db.select().from(lessons)) await database.db.update(lessons).set({ metadata: { ...lesson.metadata as object, status: "published", qaReleaseId: crypto.randomUUID() } }).where(eq(lessons.id, lesson.id));
  // A second Track that only owns the Portuguese Concepts exercises the scope union.
  const portuguese = structuredClone(fixture) as typeof fixture;
  portuguese.packId = `${fixture.packId}.por-only`; portuguese.track.id = "ifsc-2027-por-only";
  portuguese.track.modules = portuguese.track.modules.filter(trackModule => trackModule.subjectCode === "POR");
  const porConcepts = new Set(portuguese.track.modules.flatMap(trackModule => trackModule.lessons.flatMap(lesson => lesson.concepts.map(concept => concept.id))));
  portuguese.questions = portuguese.questions.filter(question => question.conceptIds.every(id => porConcepts.has(id)));
  portuguese.curriculumRequirements = portuguese.curriculumRequirements.filter(requirement => requirement.mappedConceptIds.every(id => porConcepts.has(id)));
  portuguese.conceptPrerequisites = portuguese.conceptPrerequisites.filter(edge => porConcepts.has(edge.conceptId) && porConcepts.has(edge.prerequisiteConceptId));
  const second = await importTrackPack(portuguese, importer);
  expect(second.status, JSON.stringify(second)).toBe("imported");
  return database;
}

describe("standalone simulado Questions (ADR 0065)", () => {
  it("imports, publishes Admin Direct, builds a full simulado and scores it per area", async () => {
    const database = await setup();
    try {
      const imports = new StandaloneQuestionRepository(database.db);
      const publication = new ContentPublicationService(database.db);
      await expect(imports.importSet(student, { trackId: "ifsc-2027", questions: bank })).rejects.toThrow("Access denied");
      await expect(imports.importSet(admin, { trackId: "ifsc-2027", questions: [standalone("MAT", 99, { exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: true } })] })).rejects.toThrow("reserved_for_assessment");
      await expect(imports.importSet(admin, { trackId: "ifsc-2027", questions: [standalone("MAT", 98, { provenance: { type: "official_exam", examId: "ifsc-2025", officialNumber: 1 } })] })).rejects.toThrow("official_provenance");
      await expect(imports.importSet(admin, { trackId: "ifsc-2027-por-only", questions: [standalone("MAT", 97)] })).rejects.toThrow("Concept outside Track");
      await expect(imports.importSet(admin, { trackId: "ifsc-2027", questions: [standalone("MAT", 1, { id: source.questions[0].id })] })).rejects.toThrow(/lesson activity|imported Pack/);

      const first = await imports.importSet(admin, { trackId: "ifsc-2027", questions: bank });
      expect(first).toMatchObject({ imported: 28, unchanged: 0 });
      expect(first.releases.every(release => release.status === "draft")).toBe(true);
      expect(await imports.importSet(admin, { trackId: "ifsc-2027", questions: bank })).toMatchObject({ imported: 0, unchanged: 28 });
      await expect(imports.importSet(admin, { trackId: "ifsc-2027", questions: [{ ...bank[0], stem: "Conteúdo alterado?" }] })).rejects.toThrow(/conflict|different content/);

      const template = buildSimuladoTemplate({ number: 1, trackId: "ifsc-2027", items });
      const assessments = new AssessmentRepository(database.db);
      await expect(assessments.importTemplate(template)).rejects.toThrow("Only published");

      await expect(publication.publishStandaloneQuestionsDirect(student, { questions: items.MAT, reason })).rejects.toThrow("Access denied");
      await expect(publication.publishStandaloneQuestionsDirect(admin, { questions: [{ id: source.questions[0].id, version: 1 }], reason })).rejects.toThrow(/lesson activity|imported Pack/);
      const all = bank.map(question => ({ id: question.id, version: question.version }));
      expect(await publication.publishStandaloneQuestionsDirect(admin, { questions: all, reason })).toEqual({ published: true, releases: 28, newlyPublished: 28 });
      expect(await publication.publishStandaloneQuestionsDirect(admin, { questions: all, reason })).toEqual({ published: true, releases: 28, newlyPublished: 0 });
      const events = await database.db.select().from(contentPublicationEvents);
      expect(events).toHaveLength(28);
      expect(events.every(event => event.mode === "admin_direct" && event.actorId === "owner" && event.reason === reason)).toBe(true);
      expect((await database.db.select().from(contentReleases)).filter(release => release.stableId.startsWith("SIM-")).every(release => release.status === "published")).toBe(true);

      const row = await assessments.importTemplate(template);
      expect(await assessments.importTemplate(template)).toEqual(row);
      expect((await assessments.listTemplates()).map(entry => entry.stableId)).toContain("ifsc-simulado-1");

      const started = await assessments.start("student", row.id, crypto.randomUUID(), now);
      const view = (await assessments.view("student", started.id))!;
      expect(view.mode).toBe("EXAM");
      expect(view.questions).toHaveLength(28);
      expect(view.questions.every(entry => !("answer" in entry.question) && entry.question.choices?.length === 5)).toBe(true);
      expect(new Date(view.deadlineAt).getTime() - new Date(view.startedAt).getTime()).toBe(240 * 60000);
      // MAT and POR answered correctly, CIE wrong, GH left blank.
      for (const entry of view.questions) {
        const subject = entry.question.id.split("-")[1];
        if (subject === "GH") continue;
        await assessments.save("student", started.id, entry.versionId, subject === "CIE" ? "A" : "C", false, now);
      }
      const result = await assessments.finalize("student", started.id, new Date(now.getTime() + 60000)) as { correct: number; total: number; bySubject: Record<string, { correct: number; total: number }> };
      expect(result.correct).toBe(14);
      expect(result.total).toBe(28);
      expect(Object.fromEntries(Object.entries(result.bySubject).map(([subject, value]) => [subject, [value.correct, value.total]]))).toEqual({ MAT: [7, 7], POR: [7, 7], CIE: [0, 7], GH: [0, 7] });
      expect(await database.db.select().from(attempts)).toHaveLength(28);
    } finally { await database.close(); }
  });

  it("refuses invalid compositions and scopes concepts across Tracks only when listed", async () => {
    const database = await setup();
    try {
      const imports = new StandaloneQuestionRepository(database.db);
      const publication = new ContentPublicationService(database.db);
      const draftOnly = standalone("MAT", 8);
      await imports.importSet(admin, { trackId: "ifsc-2027", questions: [...bank, draftOnly] });
      await publication.publishStandaloneQuestionsDirect(admin, { questions: bank.map(question => ({ id: question.id, version: 1 })), reason });
      // A reserved benchmark Question published through the shared bank, outside this path.
      const reserved = standalone("MAT", 9, { id: "RESERVED-MAT-9", exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: true } });
      await new DrizzleQuestionRepository(database.db).importVersions("ifsc-2027", [reserved]);
      const reservedRow = (await database.db.select().from(questionVersions)).find(row => (row.content as { id: string }).id === reserved.id)!;
      await database.db.update(questionVersions).set({ status: "published" }).where(eq(questionVersions.id, reservedRow.id));
      const assessments = new AssessmentRepository(database.db);
      const base = buildSimuladoTemplate({ number: 2, trackId: "ifsc-2027", items });
      const swap = (id: string) => ({ ...base, items: [{ id, version: 1 }, ...base.items.slice(1)] });
      expect(() => buildSimuladoTemplate({ number: 2, trackId: "ifsc-2027", items: { ...items, MAT: items.MAT.slice(0, 6) } })).toThrow("needs 7 MAT");
      // Six MAT and eight POR: the per-area rule refuses before any other check.
      await expect(assessments.importTemplate(swap("Q-POR-GOLDEN-1"))).rejects.toThrow("seven questions per subject");
      await expect(assessments.importTemplate(swap("RESERVED-MAT-9"))).rejects.toThrow("Reserved question");
      await expect(assessments.importTemplate(swap(draftOnly.id))).rejects.toThrow("Only published");
      // POR-only home Track: MAT/CIE/GH Concepts are out of scope until the owning Track is listed.
      await expect(assessments.importTemplate({ ...base, trackId: "ifsc-2027-por-only" })).rejects.toThrow("unavailable");
      await expect(assessments.importTemplate({ ...base, trackId: "ifsc-2027-por-only", scopeTrackIds: ["ifsc-2027", "ifsc-ghost"] })).rejects.toThrow("unavailable");
      expect(await assessments.importTemplate({ ...base, trackId: "ifsc-2027-por-only", scopeTrackIds: ["ifsc-2027"] })).toMatchObject({ stableId: "ifsc-simulado-2" });
    } finally { await database.close(); }
  });

  it("never offers a standalone Question in lesson practice, review or practice blocks", async () => {
    const database = await setup();
    try {
      await new StandaloneQuestionRepository(database.db).importSet(admin, { trackId: "ifsc-2027", questions: bank });
      await new ContentPublicationService(database.db).publishStandaloneQuestionsDirect(admin, { questions: bank.map(question => ({ id: question.id, version: 1 })), reason });
      await database.db.insert(owners).values({ id: "learner", displayName: "Test learner" }).onConflictDoNothing();
      const [concept] = await database.db.select().from(concepts).where(eq(concepts.stableId, subjectConcepts.MAT));
      await database.db.insert(reviewSchedules).values({ ownerId: "learner", conceptId: concept.id, currentMasteryState: "learning", nextReviewAt: now, policyVersion: "review.v2", reviewCount: 0, recentQuality: 0 });
      const targeted = await new StudySessionRepository(database.db).startBlock("learner", { kind: "review", conceptId: subjectConcepts.MAT }, now);
      expect(targeted).not.toBeNull();
      const offered = sessionItemsSchema.parse(targeted!.items).flatMap(item => item.questions.map(ref => ref.id));
      expect(offered.length).toBeGreaterThan(0);
      expect(offered.some(id => id.startsWith("SIM-"))).toBe(false);
      const activity = (source.track.modules[0].lessons[0].activities as { id: string }[])[0].id;
      await expect(new QuestionStudyRepository(database.db).isAvailable("learner", activity, "SIM-MAT-1", 1)).rejects.toThrow("unavailable");
    } finally { await database.close(); }
  });
});

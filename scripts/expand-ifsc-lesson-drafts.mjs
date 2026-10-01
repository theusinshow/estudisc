// Expands compact AI-authored IFSC lesson drafts into Pack v2 lessons/Questions.
// Output is editorial draft only: status "draft", generated provenance, pending human review.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const DRAFT_SOURCE = { id: "src-ifsc-draft-author", type: "ai_generated", title: "KNOW/OS IFSC — aulas em rascunho com autoria assistida por IA", metadata: { authorRunId: "ifsc-draft-author-v1", reviewStatus: "pending" } };
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRAFT_DIR = join(ROOT, "packs/seeds/ifsc-2027.lesson-drafts");
const LETTERS = ["A", "B", "C", "D", "E"];

export function loadLessonDrafts(dir = DRAFT_DIR) {
  return readdirSync(dir).filter(file => file.endsWith(".json") && (!process.env.IFSC_DRAFT_FILE || file === process.env.IFSC_DRAFT_FILE)).sort().flatMap(file => JSON.parse(readFileSync(join(dir, file), "utf8")).lessons);
}

function assert(condition, message) { if (!condition) throw new Error(message); }

export function expandLessonDraft(draft) {
  const id = draft.id, prefix = id.toLowerCase().replace(/[^a-z0-9]/g, ""), subjectCode = id.split("-")[0];
  const conceptIds = Object.keys(draft.conceptTitles);
  assert(draft.concepts.length === conceptIds.length && draft.concepts.every(c => conceptIds.includes(c.conceptId)), `${id}: one concept block per lesson Concept`);
  const exits = draft.questions.filter(q => q.exit);
  assert(exits.length === 3, `${id}: exactly three exit-ticket questions`);
  for (const conceptId of conceptIds) assert(draft.questions.filter(q => q.conceptIds[0] === conceptId).length >= 2, `${id}: Concept ${conceptId} needs two primary questions`);
  const questions = draft.questions.map((q, index) => {
    assert(q.conceptIds.every(c => conceptIds.includes(c)), `${id} q${index + 1}: Concept outside lesson`);
    const base = { id: `Q-${id}-D${index + 1}`, version: 1, subjectCode, primaryConceptId: q.conceptIds[0], conceptIds: q.conceptIds, difficulty: q.difficulty ?? "direct", cognitiveOperations: q.ops ?? ["apply"], ...(q.stimulus ? { stimulus: q.stimulus } : {}), stem: q.stem, explanation: q.explanation, sourceIds: [DRAFT_SOURCE.id], provenance: { type: "generated", generationRunId: DRAFT_SOURCE.metadata.authorRunId }, exposurePolicy: { minimumDaysBetween: 1, reservedForAssessment: false }, status: "draft" };
    if (q.type === "num") return { ...base, type: "numeric", answer: { kind: "numeric", value: q.value, tolerance: q.tolerance ?? 0, ...(q.unit ? { unit: q.unit } : {}) } };
    assert(q.type === "mc" && q.choices.length >= 4 && q.choices.length <= 5 && Number.isInteger(q.correct) && q.choices[q.correct], `${id} q${index + 1}: invalid multiple choice`);
    assert(new Set(q.choices).size === q.choices.length, `${id} q${index + 1}: duplicate choices`);
    return { ...base, type: "multiple_choice", choices: q.choices.map((content, i) => ({ id: LETTERS[i], content, correct: i === q.correct, ...(i === q.correct ? {} : { targetsError: "conceptual" }) })), answer: { kind: "multiple_choice", choiceId: LETTERS[q.correct] } };
  });
  const block = (suffix, type, payload, ids = []) => ({ id: `${prefix}-${suffix}`, type, schemaVersion: 1, conceptIds: ids, payload });
  const blocks = [
    block("hook", "text", { content: draft.hook }),
    ...draft.concepts.map((c, i) => block(`concept-${i + 1}`, "concept", { conceptId: c.conceptId, title: c.title, content: c.content }, [c.conceptId])),
    ...(draft.examples ?? []).map((e, i) => block(`example-${i + 1}`, "worked-example", { title: e.title, content: e.content }, e.conceptIds ?? [])),
    ...(draft.warning ? [block("warning", "warning", draft.warning)] : []),
    block("transfer", "text", { content: "Agora pratique sem consultar os exemplos. Leia o enunciado inteiro e identifique o que é pedido antes de responder." }),
    block("summary", "summary", { title: "Para lembrar depois", content: draft.summary })
  ];
  const activities = draft.questions.map((q, index) => ({ id: `${prefix}-q${index + 1}`, type: "question", prompt: q.stem, conceptIds: q.conceptIds, questionId: questions[index].id, config: { hints: (q.hints ?? []).slice(0, 3), phase: q.exit ? "exit_ticket" : "independent" } }));
  return {
    lesson: { id, version: 1, title: draft.title, kind: "core", estimatedMinutes: draft.estimatedMinutes ?? 35, status: "draft", concepts: conceptIds.map(c => ({ id: c, title: draft.conceptTitles[c], importance: "high" })), prerequisiteConceptIds: draft.prerequisiteConceptIds ?? [], objectives: conceptIds.map(c => draft.conceptTitles[c]), sourceIds: [DRAFT_SOURCE.id], exitTicketQuestionIds: questions.filter((_, i) => draft.questions[i].exit).map(q => q.id), blocks, activities },
    questions
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const expanded = loadLessonDrafts().map(expandLessonDraft);
  process.stdout.write(JSON.stringify({ source: DRAFT_SOURCE, lessons: expanded.map(e => e.lesson), questions: expanded.flatMap(e => e.questions) }));
}

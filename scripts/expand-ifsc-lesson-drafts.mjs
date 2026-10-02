// Expands compact AI-authored IFSC lesson drafts into Pack v2 lessons/Questions.
// Output is editorial draft only: status "draft", generated provenance, pending human review.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const DRAFT_SOURCE = { id: "src-ifsc-draft-author", type: "ai_generated", title: "KNOW/OS IFSC — aulas em rascunho com autoria assistida por IA", metadata: { authorRunId: "ifsc-draft-author-v1", reviewStatus: "pending" } };
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRAFT_DIR = join(ROOT, "packs/seeds/ifsc-2027.lesson-drafts");
const FIGURE_DIR = join(DRAFT_DIR, "figures");
const EDUCATIONAL_TYPES = new Set(["classification", "ordering", "matching", "text-highlight", "guided-steps"]);
const LETTERS = ["A", "B", "C", "D", "E"];

export function loadLessonDrafts(dir = DRAFT_DIR) {
  return readdirSync(dir).filter(file => file.endsWith(".json") && (!process.env.IFSC_DRAFT_FILE || file === process.env.IFSC_DRAFT_FILE)).sort().flatMap(file => JSON.parse(readFileSync(join(dir, file), "utf8")).lessons);
}

function assert(condition, message) { if (!condition) throw new Error(message); }

/** ADR 0032: a figure is authored as an SVG file and embedded in the lesson version as a data URI. */
function figurePayload(id, extra) {
  assert(typeof extra.file === "string" && extra.file.endsWith(".svg"), `${id}: figure needs an .svg file`);
  const svg = readFileSync(join(FIGURE_DIR, extra.file), "utf8");
  const viewBox = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/.exec(svg);
  assert(viewBox || (extra.width && extra.height), `${id}: figure needs a viewBox or explicit size`);
  return {
    src: `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`,
    alt: extra.alt, caption: extra.caption, credit: extra.credit ?? "Ilustração própria (rascunho)",
    ...(extra.longDescription ? { longDescription: extra.longDescription } : {}),
    width: extra.width ?? Math.round(Number(viewBox[1])), height: extra.height ?? Math.round(Number(viewBox[2]))
  };
}

/**
 * Figures illustrate the rule right after it and interactions practise it after the worked examples,
 * unless an extra names the example it follows (`afterExample`, 1-based).
 */
function conceptBody(prefix, index, concept) {
  const extras = (concept.extras ?? []).map((extra, j) => ({ extra, id: `${prefix}-c${index + 1}-x${j + 1}`, slot: extra.afterExample ?? (extra.type === "figure" ? 0 : Infinity) }));
  const placed = slot => extras.filter(item => item.slot === slot).map(({ extra: { afterExample: _skip, ...extra }, id }) => { void _skip; return extraBlock(id, extra, [concept.conceptId]); });
  const examples = concept.examples ?? [];
  for (const item of extras) assert(item.slot === Infinity || (Number.isInteger(item.slot) && item.slot >= 0 && item.slot <= examples.length), `${item.id}: afterExample out of range`);
  return [
    ...placed(0),
    ...examples.flatMap((e, j) => [{ id: `${prefix}-c${index + 1}-example-${j + 1}`, type: "worked-example", schemaVersion: 1, conceptIds: [concept.conceptId], payload: { title: e.title, content: e.content } }, ...placed(j + 1)]),
    ...placed(Infinity)
  ];
}

/** Optional teaching blocks beyond text: figures, predictions and self-check interactions (no attempt recorded). */
function extraBlock(id, extra, conceptIds) {
  const { type, conceptIds: _ignored, ...rest } = extra;
  void _ignored;
  if (type === "figure") return { id, type, schemaVersion: 1, conceptIds, payload: figurePayload(id, rest) };
  if (type === "prediction") return { id, type, schemaVersion: 1, conceptIds, payload: { title: rest.title ?? "Antes de continuar", content: rest.content } };
  assert(EDUCATIONAL_TYPES.has(type), `${id}: unsupported extra block ${type}`);
  return { id, type, schemaVersion: 1, conceptIds, payload: { type, ...rest } };
}

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
    ...(draft.opening ? [extraBlock(`${prefix}-opening`, { type: "prediction", ...draft.opening }, [])] : []),
    // Each Concept is its own teaching unit: intuition, rule, worked examples, then its common error.
    ...draft.concepts.flatMap((c, i) => [
      ...(c.intuition ? [block(`c${i + 1}-intuition`, "text", { content: c.intuition }, [c.conceptId])] : []),
      block(`concept-${i + 1}`, "concept", { conceptId: c.conceptId, title: c.title, content: c.content }, [c.conceptId]),
      ...conceptBody(prefix, i, c),
      ...(c.pitfall ? [block(`c${i + 1}-pitfall`, "warning", c.pitfall, [c.conceptId])] : [])
    ]),
    ...(draft.examples ?? []).map((e, i) => block(`example-${i + 1}`, "worked-example", { title: e.title, content: e.content }, e.conceptIds ?? [])),
    ...(draft.integration ?? []).map((extra, i) => extraBlock(`${prefix}-integration-${i + 1}`, extra, extra.conceptIds ?? [])),
    ...(draft.warning ? [block("warning", "warning", draft.warning)] : []),
    block("transfer", "text", { content: "Agora pratique sem consultar os exemplos. Leia o enunciado inteiro e identifique o que é pedido antes de responder." }),
    block("summary", "summary", { title: "Para lembrar depois", content: draft.summary })
  ];
  // The first practice item of each Concept becomes a quick check shown right after that Concept is taught.
  const checkpoints = new Map(draft.concepts.map((c, i) => [draft.questions.findIndex(q => !q.exit && q.conceptIds[0] === c.conceptId), `${prefix}-concept-${i + 1}`]));
  const activities = draft.questions.map((q, index) => ({ id: `${prefix}-q${index + 1}`, type: "question", prompt: q.stem, conceptIds: q.conceptIds, questionId: questions[index].id, config: { hints: (q.hints ?? []).slice(0, 3), phase: q.exit ? "exit_ticket" : "independent", ...(checkpoints.has(index) ? { checkpointFor: checkpoints.get(index) } : {}) } }));
  return {
    lesson: { id, version: 1, title: draft.title, kind: "core", estimatedMinutes: draft.estimatedMinutes ?? 35, status: "draft", concepts: conceptIds.map(c => ({ id: c, title: draft.conceptTitles[c], importance: "high" })), prerequisiteConceptIds: draft.prerequisiteConceptIds ?? [], objectives: conceptIds.map(c => draft.conceptTitles[c]), sourceIds: [DRAFT_SOURCE.id], exitTicketQuestionIds: questions.filter((_, i) => draft.questions[i].exit).map(q => q.id), blocks, activities },
    questions
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const expanded = loadLessonDrafts().map(expandLessonDraft);
  process.stdout.write(JSON.stringify({ source: DRAFT_SOURCE, lessons: expanded.map(e => e.lesson), questions: expanded.flatMap(e => e.questions) }));
}

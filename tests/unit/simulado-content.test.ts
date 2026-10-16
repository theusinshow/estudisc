// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { standaloneQuestionPublicationSchema, standaloneQuestionSetSchema } from "@/features/questions/standalone-set";
import { assessmentTemplateSchema } from "@/features/assessments/contracts";
import type { Question } from "@/features/questions/contracts";
import { MAT_TOPIC_CONCEPTS, cognitiveOperations, convertChatGptQuestion, convertMathSimulado, errorCategory, lessonConceptIndex, mathTopicConcepts, standaloneSets } from "../../tools/estudisc-content-studio/simulado-questions";
import { buildSimuladoTemplate, partitionSimulados, validateSimulado } from "../../tools/estudisc-content-studio/simulado-builder";

const pack = (path: string) => JSON.parse(readFileSync(path, "utf8")) as unknown;
const portuguese = pack("packs/drafts/ifsc-2027-portuguese/portuguese.pack.json");
const mathematics = pack("packs/drafts/ifsc-2027-mathematics/mathematics.pack.json");
const index = lessonConceptIndex([portuguese, mathematics]);
const matConcepts = new Set([...index.values()].filter(lesson => lesson.trackId === "ifsc-2027-mathematics").flatMap(lesson => lesson.conceptIds));

const chatGpt = {
  id: "POR-01-NQ01", lessonId: "POR-01", subject: "POR",
  stem: "O boletim descreve a reabertura de uma biblioteca.\n\nQual característica orienta a classificação do gênero?",
  options: ["A", "B", "C", "D", "E"].map(letter => ({ letter, text: `Opção ${letter}` })),
  correctOption: "B", correctAnswer: "Opção B", explanation: "A finalidade informativa define o gênero.",
  difficulty: "IFSC_APPLICATION", cognitiveOperation: "interpret_and_apply", sourceProvenance: { status: "ORIGINAL" }, visualAssetRequired: false
};
const mathItem = (n: number, topic: string, simulado = 1) => ({
  id: `SIM-MAT-${String(n).padStart(2, "0")}`, simulado, topic, difficulty: "applied", stimulus: "Contexto.", stem: "Quanto vale?",
  choices: ["A", "B", "C", "D", "E"].map(id => ({ id, content: `${id} kg`, correct: id === "C", targetsError: id === "C" ? null : "esquece de ajustar a quantidade", rationale: id === "A" ? "Mantém o grupo original." : "" })),
  explanation: "Conferência dupla."
});

function question(subject: string, n: number, patch: Partial<Question> = {}): Question {
  return {
    id: `SIM-${subject}-${n}`, version: 1, subjectCode: subject, primaryConceptId: `${subject}.C`, conceptIds: [`${subject}.C`], type: "multiple_choice", difficulty: "ifsc",
    cognitiveOperations: ["apply"], stem: "Pergunta?", choices: ["A", "B", "C", "D", "E"].map(id => ({ id, content: id, correct: id === "A" })), answer: { kind: "multiple_choice", choiceId: "A" },
    sourceIds: [], assets: [], items: [], destinations: [], provenance: { type: "generated", generationRunId: "run" }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "published", ...patch
  };
}
const bank = ["MAT", "POR", "CIE", "GH"].flatMap(subject => Array.from({ length: 7 }, (_, i) => question(subject, i + 1)));
const items = Object.fromEntries(["MAT", "POR", "CIE", "GH"].map(subject => [subject, bank.filter(q => q.subjectCode === subject).map(q => ({ id: q.id, version: 1 }))])) as Record<"MAT" | "POR" | "CIE" | "GH", { id: string; version: number }[]>;

describe("authoring → standalone Question conversion", () => {
  it("maps the ChatGPT format onto the lesson's primary Concept with SIM- ids and generated provenance", () => {
    const { trackId, question } = convertChatGptQuestion(chatGpt, index, "chatgpt-run");
    expect(trackId).toBe("ifsc-2027-portuguese");
    expect(question).toMatchObject({ id: "SIM-POR-01-NQ01", version: 1, subjectCode: "POR", type: "multiple_choice", difficulty: "ifsc", status: "draft",
      answer: { kind: "multiple_choice", choiceId: "B" }, provenance: { type: "generated", generationRunId: "chatgpt-run" }, exposurePolicy: { reservedForAssessment: false },
      stimulus: "O boletim descreve a reabertura de uma biblioteca.", stem: "Qual característica orienta a classificação do gênero?", cognitiveOperations: ["interpret", "apply"] });
    expect(question.primaryConceptId).toBe(index.get("POR-01")!.conceptIds[0]);
    expect(question.choices?.filter(choice => choice.correct).map(choice => choice.id)).toEqual(["B"]);
    expect(convertChatGptQuestion({ ...chatGpt, difficulty: "IFSC_REASONING" }, index, "r").question.difficulty).toBe("challenge");
  });
  it("refuses mismatched answers, unknown lessons, wrong subjects and visual items", () => {
    expect(() => convertChatGptQuestion({ ...chatGpt, correctAnswer: "Opção C" }, index, "r")).toThrow("correctOption");
    expect(() => convertChatGptQuestion({ ...chatGpt, lessonId: "POR-99" }, index, "r")).toThrow("unknown lesson");
    expect(() => convertChatGptQuestion({ ...chatGpt, subject: "GH" }, index, "r")).toThrow("subject");
    expect(() => convertChatGptQuestion({ ...chatGpt, visualAssetRequired: true }, index, "r")).toThrow("visual");
    expect(cognitiveOperations("analyze_or_evaluate")).toEqual(["analyze", "evaluate"]);
    expect(cognitiveOperations("unknown")).toEqual(["apply"]);
  });
  it("maps every documented mathematics topic to Concepts that exist in the mathematics Pack", () => {
    for (const row of MAT_TOPIC_CONCEPTS) for (const id of row.conceptIds) expect(matConcepts.has(id), id).toBe(true);
    expect(mathTopicConcepts("Números e operações — porcentagem sucessiva")).toEqual(["MAT.PCT.SUCCESSIVE"]);
    expect(mathTopicConcepts("Números e operações — porcentagem")).toEqual(["MAT.PCT.CALCULATE"]);
    expect(mathTopicConcepts("Números e operações — razão e velocidade média")).toEqual(["MAT.RATIO.INTERPRET"]);
    expect(mathTopicConcepts("Geometria e medidas — teorema de Pitágoras")).toEqual(["MAT.RIGHTTRI.PYTHAGORAS"]);
    expect(() => mathTopicConcepts("Trigonometria — lei dos senos")).toThrow("Unmapped");
  });
  it("converts the Codex mathematics format with canonical error categories", () => {
    const [entry] = convertMathSimulado({ questions: [mathItem(1, "Números e operações — razão e proporção", 2)] }, "ifsc-2027-mathematics", matConcepts, "codex-run");
    expect(entry).toMatchObject({ trackId: "ifsc-2027-mathematics", simulado: 2, question: { id: "SIM-MAT-01", primaryConceptId: "MAT.PROPORTION.CONTEXT", difficulty: "applied", stimulus: "Contexto.", answer: { choiceId: "C" } } });
    const choices = entry.question.choices!;
    expect(choices.find(choice => choice.id === "C")).toEqual({ id: "C", content: "C kg", correct: true });
    expect(choices.find(choice => choice.id === "A")).toMatchObject({ targetsError: "procedural", rationale: "Mantém o grupo original." });
    expect(choices.find(choice => choice.id === "B")).toMatchObject({ rationale: "esquece de ajustar a quantidade" });
    expect(errorCategory("erro de cálculo ao dividir")).toBe("calculation");
    expect(errorCategory(null)).toBeUndefined();
    expect(() => convertMathSimulado({ questions: [mathItem(1, "Álgebra — equação de primeiro grau")] }, "t", new Set(), "r")).toThrow("not in the mathematics Pack");
  });
  it("groups converted Questions per Track and refuses duplicates", () => {
    const a = convertChatGptQuestion(chatGpt, index, "r");
    const b = convertMathSimulado({ questions: [mathItem(1, "Álgebra — sistema de equações")] }, "ifsc-2027-mathematics", matConcepts, "r")[0];
    const sets = standaloneSets([a, b]);
    expect(sets.map(set => [set.trackId, set.questions.length])).toEqual([["ifsc-2027-portuguese", 1], ["ifsc-2027-mathematics", 1]]);
    expect(standaloneQuestionSetSchema.safeParse(sets[0]).success).toBe(true);
    expect(() => standaloneSets([a, a])).toThrow("Duplicate");
  });
});

describe("standalone Question set contract", () => {
  const draft = (patch: Partial<Question> = {}) => question("MAT", 1, { status: "draft", ...patch });
  it("accepts drafts and refuses official, reserved, non-draft or duplicate entries", () => {
    expect(standaloneQuestionSetSchema.safeParse({ trackId: "t", questions: [draft()] }).success).toBe(true);
    expect(standaloneQuestionSetSchema.safeParse({ trackId: "t", questions: [draft({ provenance: { type: "official_exam", examId: "e", officialNumber: 1 } })] }).success).toBe(false);
    expect(standaloneQuestionSetSchema.safeParse({ trackId: "t", questions: [draft({ exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: true } })] }).success).toBe(false);
    expect(standaloneQuestionSetSchema.safeParse({ trackId: "t", questions: [draft({ status: "published" })] }).success).toBe(false);
    expect(standaloneQuestionSetSchema.safeParse({ trackId: "t", questions: [draft(), draft()] }).success).toBe(false);
    expect(standaloneQuestionPublicationSchema.safeParse({ questions: [{ id: "SIM-1", version: 1 }], reason: "curto" }).success).toBe(false);
  });
});

describe("simulado template builder", () => {
  it("builds a valid published FULL_SIMULATION template validated by the engine rules", () => {
    const template = buildSimuladoTemplate({ number: 2, trackId: "ifsc-2027", scopeTrackIds: ["ifsc-2027-mathematics"], items });
    expect(template).toMatchObject({ id: "ifsc-simulado-2", version: 1, title: "Simulado IFSC 2", kind: "FULL_SIMULATION", durationMinutes: 240, shuffleChoices: true, status: "published", scopeTrackIds: ["ifsc-2027-mathematics"] });
    expect(template.items).toHaveLength(28);
    expect(assessmentTemplateSchema.parse(template)).toEqual(template);
    expect(validateSimulado(template, bank)).toBe(template);
  });
  it("refuses a wrong area count, reserved or unpublished Questions", () => {
    expect(() => buildSimuladoTemplate({ number: 1, trackId: "t", items: { ...items, MAT: items.MAT.slice(0, 6) } })).toThrow("7 MAT");
    const template = buildSimuladoTemplate({ number: 1, trackId: "t", items });
    const swap = (patch: Partial<Question>) => bank.map((entry, i) => i === 0 ? { ...entry, ...patch } : entry);
    expect(() => validateSimulado(template, swap({ subjectCode: "POR" }))).toThrow("seven questions per subject");
    expect(() => validateSimulado(template, swap({ exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: true } }))).toThrow("Reserved question");
    expect(() => validateSimulado(template, swap({ status: "draft" }))).toThrow("Only published");
    expect(validateSimulado(template, swap({ status: "draft" }), { assumePublished: true })).toBe(template);
    expect(() => buildSimuladoTemplate({ number: 0, trackId: "t", items })).toThrow("positive");
  });
  it("partitions a bank into disjoint simulados, honouring explicit assignments", () => {
    const large = ["POR", "CIE", "GH"].flatMap(subject => Array.from({ length: 30 }, (_, i) => ({ question: question(subject, i + 1) })));
    const math = Array.from({ length: 21 }, (_, i) => ({ question: question("MAT", i + 1), simulado: 3 - Math.floor(i / 7) }));
    const parts = partitionSimulados([...large, ...math], 3);
    const all = parts.flatMap(part => Object.values(part).flat().map(ref => ref.id));
    expect(new Set(all).size).toBe(84);
    for (const part of parts) for (const subject of ["MAT", "POR", "CIE", "GH"] as const) expect(part[subject]).toHaveLength(7);
    expect(parts[2].MAT.map(ref => ref.id)).toEqual(Array.from({ length: 7 }, (_, i) => `SIM-MAT-${i + 1}`));
    expect(() => partitionSimulados([{ question: question("MAT", 1), simulado: 4 }], 3)).toThrow("outside");
  });
});

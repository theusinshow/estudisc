import { z } from "zod";
import { questionSchema, type Question } from "@/features/questions/contracts";
import { standaloneQuestionIssues } from "@/features/questions/standalone-set";

/**
 * Converts authoring JSON into standalone assessment Questions (ADR 0065). Output Questions are
 * version 1 drafts with generated provenance, never reserved and never bound to a lesson. Ids
 * gain the `SIM-` prefix so they cannot collide with lesson Questions.
 */
type Choice = NonNullable<Question["choices"]>[number];
type TargetsError = NonNullable<Choice["targetsError"]>;
type Operation = Question["cognitiveOperations"][number];

export type LessonConcepts = Readonly<{ trackId: string; lessonId: string; version: number; subjectCode: string; conceptIds: readonly string[] }>;
export type ConvertedQuestion = Readonly<{ trackId: string; simulado?: number; question: Question }>;

const packSchema = z.object({
  track: z.object({ id: z.string(), modules: z.array(z.object({ subjectCode: z.string().optional(), lessons: z.array(z.object({ id: z.string(), version: z.number().int(), concepts: z.array(z.object({ id: z.string() }).passthrough()) }).passthrough()) }).passthrough()) }).passthrough()
}).passthrough();

/** Lesson → Concepts index from subject Packs; the highest lesson version wins inside one Track. */
export function lessonConceptIndex(packs: readonly unknown[]) {
  const index = new Map<string, LessonConcepts>();
  for (const raw of packs) {
    const pack = packSchema.parse(raw);
    for (const trackModule of pack.track.modules) for (const lesson of trackModule.lessons) {
      const previous = index.get(lesson.id);
      if (previous && previous.trackId !== pack.track.id) throw new Error(`Lesson ${lesson.id} appears in Tracks ${previous.trackId} and ${pack.track.id}; pass only the live Packs`);
      if (previous && previous.version >= lesson.version) continue;
      index.set(lesson.id, { trackId: pack.track.id, lessonId: lesson.id, version: lesson.version, subjectCode: trackModule.subjectCode ?? "", conceptIds: lesson.concepts.map(concept => concept.id) });
    }
  }
  return index;
}

export const simuladoId = (id: string) => id.startsWith("SIM-") ? id : `SIM-${id}`;

const operations: readonly Operation[] = ["recall", "identify", "interpret", "calculate", "compare", "infer", "apply", "analyze", "evaluate"];
export function cognitiveOperations(value: string | undefined): Operation[] {
  const parts = (value ?? "").toLowerCase().split(/_and_|_or_|[^a-z]+/).filter((part): part is Operation => (operations as readonly string[]).includes(part));
  return parts.length ? [...new Set(parts)] : ["apply"];
}

/** IFSC_APPLICATION is exam-level application; IFSC_REASONING is the harder multi-step tier. */
const chatGptDifficulty = { IFSC_APPLICATION: "ifsc", IFSC_REASONING: "challenge" } as const;

const chatGptQuestionSchema = z.object({
  id: z.string().min(1), lessonId: z.string().min(1), subject: z.enum(["MAT", "POR", "CIE", "GH"]), stem: z.string().min(1),
  options: z.array(z.object({ letter: z.string().min(1), text: z.string().min(1) }).strict()).length(5),
  correctOption: z.string().min(1), correctAnswer: z.string().min(1), explanation: z.string().min(1),
  difficulty: z.enum(["IFSC_APPLICATION", "IFSC_REASONING"]), cognitiveOperation: z.string().optional(),
  visualAssetRequired: z.boolean().optional()
}).passthrough();

/** Splits a leading support text from the final interrogative paragraph, when one exists. */
function splitStimulus(text: string) {
  const paragraphs = text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
  const last = paragraphs.at(-1) ?? "";
  if (paragraphs.length < 2 || !/[?:]$/.test(last)) return { stem: text.trim() };
  return { stimulus: paragraphs.slice(0, -1).join("\n\n"), stem: last };
}

export function convertChatGptQuestion(raw: unknown, lessons: ReadonlyMap<string, LessonConcepts>, generationRunId: string): ConvertedQuestion {
  const item = chatGptQuestionSchema.parse(raw);
  if (item.visualAssetRequired) throw new Error(`${item.id}: visual assets are not supported for standalone Questions`);
  const lesson = lessons.get(item.lessonId);
  if (!lesson) throw new Error(`${item.id}: unknown lesson ${item.lessonId}`);
  if (lesson.subjectCode && lesson.subjectCode !== item.subject) throw new Error(`${item.id}: subject ${item.subject} differs from lesson ${lesson.subjectCode}`);
  const primary = lesson.conceptIds[0];
  if (!primary) throw new Error(`${item.id}: lesson ${item.lessonId} has no Concept`);
  const correct = item.options.find(option => option.letter === item.correctOption);
  if (!correct || correct.text.trim() !== item.correctAnswer.trim()) throw new Error(`${item.id}: correctOption does not match correctAnswer`);
  return { trackId: lesson.trackId, question: questionSchema.parse({
    id: simuladoId(item.id), version: 1, subjectCode: item.subject, primaryConceptId: primary, conceptIds: [primary],
    type: "multiple_choice", difficulty: chatGptDifficulty[item.difficulty], cognitiveOperations: cognitiveOperations(item.cognitiveOperation),
    ...splitStimulus(item.stem),
    choices: item.options.map(option => ({ id: option.letter, content: option.text, correct: option.letter === item.correctOption })),
    answer: { kind: "multiple_choice", choiceId: item.correctOption }, explanation: item.explanation,
    provenance: { type: "generated", generationRunId }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "draft"
  }) };
}

/**
 * Mathematics simulado `topic` → existing MAT Concept (mathematics Pack). Checked in order, so
 * the more specific phrases come first. Unknown topics are refused, never guessed.
 */
export const MAT_TOPIC_CONCEPTS: ReadonlyArray<Readonly<{ match: string; conceptIds: readonly string[] }>> = [
  { match: "porcentagem sucessiva", conceptIds: ["MAT.PCT.SUCCESSIVE"] },
  { match: "porcentagem", conceptIds: ["MAT.PCT.CALCULATE"] },
  { match: "velocidade média", conceptIds: ["MAT.RATIO.INTERPRET"] },
  { match: "regra de três", conceptIds: ["MAT.RULE3.DIRECT"] },
  { match: "razão e proporção", conceptIds: ["MAT.PROPORTION.CONTEXT"] },
  { match: "fração de quantidade", conceptIds: ["MAT.FRACTION.CONTEXT"] },
  { match: "frações e decimais", conceptIds: ["MAT.FRACTION.DECIMAL.CONVERT"] },
  { match: "divisão decimal", conceptIds: ["MAT.DECIMAL.OPERATIONS"] },
  { match: "potência e ordem das operações", conceptIds: ["MAT.EXPR.ORDER", "MAT.POWER.CONCEPT"] },
  { match: "sistema de equações", conceptIds: ["MAT.SYSTEM.CONTEXT"] },
  { match: "segundo grau", conceptIds: ["MAT.EQ2.CONTEXT"] },
  { match: "primeiro grau", conceptIds: ["MAT.EQ1.CONTEXT"] },
  { match: "expressão e equação", conceptIds: ["MAT.ALG.EXPRESSION", "MAT.EQ1.MODEL"] },
  { match: "leitura de tabela", conceptIds: ["MAT.DATA.TABLE.READ", "MAT.PROB.FREQUENCY"] },
  { match: "média aritmética", conceptIds: ["MAT.DATA.INFER"] },
  { match: "probabilidade", conceptIds: ["MAT.PROB.FREQUENCY"] },
  { match: "pitágoras", conceptIds: ["MAT.RIGHTTRI.PYTHAGORAS"] },
  { match: "área de retângulo", conceptIds: ["MAT.GEO.AREA.RECTANGLE"] },
  { match: "perímetro e ângulos", conceptIds: ["MAT.GEO.PERIMETER", "MAT.GEO.ANGLES"] }
];

export function mathTopicConcepts(topic: string) {
  const normalized = topic.toLocaleLowerCase("pt-BR");
  const row = MAT_TOPIC_CONCEPTS.find(entry => normalized.includes(entry.match));
  if (!row) throw new Error(`Unmapped mathematics topic: ${topic}`);
  return row.conceptIds;
}

/** Free-text distractor diagnoses become the closest canonical error category. */
export function errorCategory(text: string | null | undefined): TargetsError | undefined {
  if (!text?.trim()) return undefined;
  const value = text.toLocaleLowerCase("pt-BR");
  if (/arredond|erro de conta|soma errad|multiplica errad|calcula errad|cálculo/.test(value)) return "calculation";
  if (/interpreta|lê |leitura|confunde o enunciado|entende/.test(value)) return "interpretation";
  if (/esquece|inverte|troca|omite|ignora|aplica|usa |soma |multiplica|divide|subtrai|calcula/.test(value)) return "procedural";
  if (/confunde|conceito|significado/.test(value)) return "conceptual";
  return "distractor";
}

const mathFileSchema = z.object({ questions: z.array(z.object({
  id: z.string().min(1), simulado: z.number().int().positive(), topic: z.string().min(1),
  difficulty: z.enum(["foundation", "direct", "applied", "ifsc", "challenge"]), stimulus: z.string().min(1).optional(), stem: z.string().min(1),
  choices: z.array(z.object({ id: z.string().min(1), content: z.string().min(1), correct: z.boolean(), targetsError: z.string().nullable().optional(), rationale: z.string().optional() }).strict()).length(5),
  explanation: z.string().min(1)
}).passthrough()).min(1) }).passthrough();

export function convertMathSimulado(raw: unknown, trackId: string, knownConceptIds: ReadonlySet<string>, generationRunId: string): ConvertedQuestion[] {
  const file = mathFileSchema.parse(raw);
  return file.questions.map(item => {
    const conceptIds = mathTopicConcepts(item.topic);
    const missing = conceptIds.find(id => !knownConceptIds.has(id));
    if (missing) throw new Error(`${item.id}: Concept ${missing} is not in the mathematics Pack`);
    const correct = item.choices.filter(choice => choice.correct);
    if (correct.length !== 1) throw new Error(`${item.id}: exactly one correct choice required`);
    return { trackId, simulado: item.simulado, question: questionSchema.parse({
      id: simuladoId(item.id), version: 1, subjectCode: "MAT", primaryConceptId: conceptIds[0], conceptIds,
      type: "multiple_choice", difficulty: item.difficulty, cognitiveOperations: ["interpret", "calculate", "apply"],
      ...(item.stimulus ? { stimulus: item.stimulus } : {}), stem: item.stem,
      choices: item.choices.map(choice => {
        const targetsError = choice.correct ? undefined : errorCategory(choice.targetsError);
        const rationale = choice.rationale?.trim() || (choice.correct ? undefined : choice.targetsError?.trim() || undefined);
        return { id: choice.id, content: choice.content, correct: choice.correct, ...(targetsError ? { targetsError } : {}), ...(rationale ? { rationale } : {}) };
      }),
      answer: { kind: "multiple_choice", choiceId: correct[0].id }, explanation: item.explanation,
      provenance: { type: "generated", generationRunId }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "draft"
    }) };
  });
}

/** Groups converted Questions into per-Track standalone import sets (`StandaloneQuestionSet`). */
export function standaloneSets(converted: readonly ConvertedQuestion[]) {
  const ids = new Set<string>();
  const sets = new Map<string, Question[]>();
  for (const entry of converted) {
    if (ids.has(entry.question.id)) throw new Error(`Duplicate standalone Question ${entry.question.id}`);
    ids.add(entry.question.id);
    const issues = standaloneQuestionIssues(entry.question);
    if (issues.length) throw new Error(`${entry.question.id}: ${issues.join(",")}`);
    sets.set(entry.trackId, [...(sets.get(entry.trackId) ?? []), entry.question]);
  }
  return [...sets].map(([trackId, questions]) => ({ trackId, questions }));
}

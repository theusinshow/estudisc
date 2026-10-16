import { createHash } from "node:crypto";

const CHOICE_IDS = ["A", "B", "C", "D", "E"] as const;
type ChoiceId = (typeof CHOICE_IDS)[number];

type ChoiceLike = {
  id: string;
  correct?: boolean;
  rationale?: unknown;
};

type ChoiceQuestionLike = {
  id: string;
  choices: readonly ChoiceLike[];
  answer?: { choiceId?: string; [key: string]: unknown };
  explanation?: unknown;
  rationale?: unknown;
};

export type ShuffleChoicesResult<T extends ChoiceQuestionLike> = {
  question: T;
  changed: boolean;
};

function seededRandom(questionId: string): () => number {
  const digest = createHash("sha256").update(questionId, "utf8").digest();
  let state = digest.readUInt32LE(0) || 0x6d2b79f5;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

function rewriteReferences(value: unknown, idMap: ReadonlyMap<string, ChoiceId>): unknown {
  if (typeof value === "string") {
    return value.replace(/\b(alternativa|letra)\s+([A-E])\b/giu, (match, label: string, oldId: string) => {
      const newId = idMap.get(oldId.toUpperCase());
      if (!newId) return match;
      return `${label} ${oldId === oldId.toLowerCase() ? newId.toLowerCase() : newId}`;
    });
  }

  if (Array.isArray(value)) return value.map((entry) => rewriteReferences(entry, idMap));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, rewriteReferences(entry, idMap)]));
  }
  return value;
}

/** Deterministically permute one multiple-choice question using its ID as the seed. */
export function shuffleQuestionChoices<T extends ChoiceQuestionLike>(question: T): ShuffleChoicesResult<T> {
  const { choices } = question;
  if (choices.length < 2 || choices.length > CHOICE_IDS.length) {
    throw new Error(`Question ${question.id} must have between 2 and 5 choices`);
  }

  const ids = choices.map((choice) => choice.id);
  if (new Set(ids).size !== ids.length || ids.some((id) => !CHOICE_IDS.includes(id as ChoiceId))) {
    throw new Error(`Question ${question.id} must use unique A-E choice IDs`);
  }

  const correctIds = choices.filter((choice) => choice.correct === true).map((choice) => choice.id);
  if (correctIds.length !== 1 || question.answer?.choiceId !== correctIds[0]) {
    throw new Error(`Question ${question.id} must have one correct choice matching answer.choiceId`);
  }

  const shuffled = [...choices];
  const random = seededRandom(question.id);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }

  const changed = shuffled.some((choice, index) => choice.id !== choices[index]?.id);
  const idMap = new Map<string, ChoiceId>(shuffled.map((choice, index) => [choice.id, CHOICE_IDS[index]]));
  const nextChoices = shuffled.map((choice, index) => ({
    ...choice,
    id: CHOICE_IDS[index],
    ...(typeof choice.rationale === "undefined" ? {} : { rationale: rewriteReferences(choice.rationale, idMap) }),
  }));
  const answer = {
    ...question.answer,
    choiceId: idMap.get(question.answer!.choiceId!)!,
  };

  return {
    question: {
      ...question,
      choices: nextChoices,
      answer,
      ...(typeof question.explanation === "undefined" ? {} : { explanation: rewriteReferences(question.explanation, idMap) }),
      ...(typeof question.rationale === "undefined" ? {} : { rationale: rewriteReferences(question.rationale, idMap) }),
    } as T,
    changed,
  };
}
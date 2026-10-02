import type { Question } from "./contracts";
export type StudentQuestion = ReturnType<typeof studentQuestion>;
export function studentQuestion(question: Question) {
  return { id:question.id, version:question.version, type:question.type, stem:question.stem, stimulus:question.stimulus,
    choices:question.choices?.map(choice=>({id:choice.id,content:choice.content})), items:question.items, destinations:question.destinations,assets:question.assets,
    // The unit labels the input; it reveals nothing about the expected value.
    unit:question.answer.kind==="numeric"?question.answer.unit:undefined };
}

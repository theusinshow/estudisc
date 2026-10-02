// Psychometric audit of lesson drafts (see docs/ifsc/LESSON-AUTHORING-GUIDE.md):
// key position spread, keys noticeably longer than every distractor, numeric choices out of order,
// and the expander's structural rules. Exits 1 when a lesson needs attention.
import { expandLessonDraft, loadLessonDrafts } from "./expand-ifsc-lesson-drafts.mjs";

const LETTERS = "ABCDE";
const NUMERIC = /^\s*[−-]?\d+(?:[.,]\d+)?(?:h\d{2})?\s*(?:[a-zA-Zµ°/%²³]+(?:\/[a-z]+)?)?\s*$/;
const value = text => {
  const clean = text.replace("−", "-").trim();
  const time = /^(-?\d+)h(\d{2})/.exec(clean);
  return time ? Number(time[1]) * 60 + Number(time[2]) : Number(/^-?\d+(?:[.,]\d+)?/.exec(clean)[0].replace(",", "."));
};

let failing = 0;
for (const draft of loadLessonDrafts()) {
  const problems = [];
  try { expandLessonDraft(draft); } catch (error) { problems.push(error.message); }
  const choiceQuestions = draft.questions.map((question, index) => ({ question, index })).filter(({ question }) => question.type === "mc");
  const keys = choiceQuestions.map(({ question }) => LETTERS[question.correct]).join("");
  const longKeys = choiceQuestions.filter(({ question }) => {
    const lengths = question.choices.map(choice => choice.length);
    return lengths[question.correct] > Math.max(...lengths.filter((_, i) => i !== question.correct)) * 1.15;
  }).map(({ index }) => `Q${index + 1}`);
  const unsorted = choiceQuestions.filter(({ question }) => question.choices.every(choice => NUMERIC.test(choice)) && question.choices.some((choice, i) => i > 0 && value(choice) < value(question.choices[i - 1]))).map(({ index }) => `Q${index + 1}`);
  const missingLetters = choiceQuestions.length >= 8 ? [...LETTERS].filter(letter => !keys.includes(letter)) : [];
  if (longKeys.length > 2) problems.push(`key noticeably longest in ${longKeys.join(", ")}`);
  if (unsorted.length) problems.push(`numeric choices not ascending in ${unsorted.join(", ")}`);
  if (missingLetters.length) problems.push(`key never in ${missingLetters.join(", ")}`);
  if (draft.questions.some(question => !question.hints?.length)) problems.push("questions without hints");
  console.log(`${draft.id.padEnd(7)} keys ${keys.padEnd(18)} ${problems.length ? `✗ ${problems.join("; ")}` : "✓"}`);
  if (problems.length) failing += 1;
}
process.exitCode = failing ? 1 : 0;

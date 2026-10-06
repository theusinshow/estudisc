import {readApplicationCss} from "./application-css";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonBlockRenderer } from "../../../src/features/lessons/blocks";
import { QuestionPanel } from "../../../src/features/activities/components/question-panel";
import { studentQuestion } from "../../../src/features/questions/student-view";
import { trackPackV2Schema } from "../../../src/features/import/application/track-pack-v2-schema";
import { jsonFile } from "./adapted-pack-audit";
import { SCIENCE_DRAFT_PACK } from "../paths";

const pack = trackPackV2Schema.parse(jsonFile(process.env.EDITORIAL_QA_PACK ?? process.env.SCIENCE_QA_PACK ?? SCIENCE_DRAFT_PACK));
const pilot = new Set((process.env.EDITORIAL_QA_PILOTS ?? process.env.EDITORIAL_QA_PILOT)?.split(",") ?? ["CIE-04", "CIE-10", "CIE-18", "CIE-22", "CIE-30", "CIE-33", "CIE-38", "CIE-40"]);
const output = process.env.EDITORIAL_QA_OUTPUT ?? ".local/science-integration/qa-mobile";
const css = readFileSync("src/styles/generated/design-tokens.css", "utf8") + readApplicationCss();
mkdirSync(output, { recursive: true });
for (const lesson of pack.track.modules.flatMap(module => module.lessons).filter(lesson => pilot.has(lesson.id))) {
  const questions = pack.questions.filter(question => lesson.activities.some(activity => activity.questionId === question.id));
  const html = renderToStaticMarkup(<div className="app-shell"><main id="main-content" className="main-surface"><article className="foundation-panel content-panel accent-panel accent-learn"><h1>{lesson.title}</h1><div className="lesson-stepper" data-mode="all">{lesson.blocks.map(block => <section className="lesson-step" key={block.id}><LessonBlockRenderer block={{ stableId: block.id, type: block.type, payload: block.payload }}/></section>)}{questions.map(question => <section className="lesson-step" key={question.id}><QuestionPanel question={studentQuestion(question)} activityStableId={`${question.id}-ACT`}/></section>)}</div></article></main></div>);
  writeFileSync(`${output}/${lesson.id}.html`, `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html}</body></html>`);
}
console.log("Generated 8 pilot SSR previews with existing app CSS. Static semantics/layout scope only; no route or hydration simulation.");

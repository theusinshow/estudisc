import { getDatabaseUrl } from "@/db/connection";
import { getMemoryStore } from "@/db/repositories/memory-store";
import { DrizzleQuestionRepository } from "@/db/repositories/question-repository";
import { canExposeQuestion, questionSchema } from "@/features/questions/api";
import type { QuestionReferenceConfig } from "../application/question-reference";
import { EducationalActivityPanel } from "./educational-activity-panel";
import { questionInteraction } from "@/features/questions/interaction";

export async function QuestionActivity({ config }: { config: QuestionReferenceConfig }) {
  let question;
  if (getDatabaseUrl() === "memory://local") {
    const candidates = getMemoryStore().packImports.flatMap(entry => entry.manifest?.schema === "caderno.track.v2" ? entry.manifest.questions : []);
    const match = candidates.find(candidate => candidate.id === config.questionId && candidate.version === config.questionVersion);
    question = match ? questionSchema.parse(match) : null;
  } else question = (await new DrizzleQuestionRepository().getVersion(config.questionId, config.questionVersion))?.question;
  if (!question || !canExposeQuestion(question, { now: new Date(), context: "training" })) return <p>Questão indisponível para estudo. Escolha outro exercício publicado.</p>;
  return <>{question.stimulus && <p>{question.stimulus}</p>}<EducationalActivityPanel prompt={question.stem} config={questionInteraction(question, config.hints)} /></>;
}

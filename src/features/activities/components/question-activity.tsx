import Link from "next/link";

import { Paragraphs } from "@/components/ui/paragraphs";
import { getDatabaseUrl } from "@/db/connection";
import { QuestionStudyRepository, QuestionUnavailableError } from "@/db/repositories/question-study-repository";
import { MemoryQuestionStudyRepository } from "@/db/repositories/memory-question-study-repository";
import { DrizzleQuestionRepository } from "@/db/repositories/question-repository";
import { getOwnerId, getOwnerProfile } from "@/features/auth/owner";
import type { Question } from "@/features/questions/contracts";
import type { QuestionReferenceConfig } from "../application/question-reference";
import { QuestionPanel } from "./question-panel";

export async function QuestionActivity({ config,activityStableId,sessionId }: { config: QuestionReferenceConfig;activityStableId:string;sessionId?:string }) {
  let view;
  try {
    const repository=getDatabaseUrl()==="memory://local"?new MemoryQuestionStudyRepository():new QuestionStudyRepository();
    view=await repository.view(await getOwnerId(),activityStableId,config.questionId,config.questionVersion,sessionId);
  } catch(error) {if(!(error instanceof QuestionUnavailableError))throw error;}
  if(view)return <QuestionPanel question={view.question} hintCount={view.hintCount} activityStableId={activityStableId} sessionId={sessionId} lastAnswer={view.lastAnswer} lastAttempt={view.lastAttempt} assistance={view.assistance} />;
  return <UnavailableQuestion questionId={config.questionId} version={config.questionVersion} />;
}

/**
 * Why a question cannot be studied right now. The admin previewing a draft lesson sees a read-only
 * preview (no submission, so no attempt or evidence on unpublished content); a student who saw the item
 * recently learns it returns after the spacing window.
 */
async function UnavailableQuestion({ questionId, version }: Readonly<{ questionId: string; version: number }>) {
  const persistent = getDatabaseUrl() && getDatabaseUrl() !== "memory://local";
  const [question, isAdmin] = await Promise.all([
    persistent ? new DrizzleQuestionRepository().getVersion(questionId, version).then(found => found?.question ?? null).catch(() => null) : Promise.resolve(null),
    getOwnerProfile().then(profile => profile.role === "ADMIN").catch(() => false)
  ]);

  if (question && question.status !== "published" && isAdmin) return <DraftPreview question={question} />;
  if (question?.status === "published") {
    return <p className="lesson-callout question-unavailable" role="status">Você viu esta questão há pouco. Ela volta a valer como prática depois do intervalo de revisão; siga para a próxima.</p>;
  }
  return <p className="lesson-callout question-unavailable" role="status">Esta questão ainda não foi liberada. Siga para a próxima atividade.</p>;
}

function DraftPreview({ question }: Readonly<{ question: Question }>) {
  return (
    <section className="learning-interaction question-draft-preview" aria-label="Prévia de questão em rascunho">
      <span className="question-draft-badge">Rascunho · prévia do revisor</span>
      <div className="question-draft-note">O aluno só verá esta questão quando a aula for publicada em <Link href="/admin/review">Revisar aulas</Link>. Aqui não é possível responder.</div>
      {question.stimulus ? <div className="question-stimulus"><Paragraphs text={question.stimulus} /></div> : null}
      <h3>{question.stem}</h3>
      {question.choices?.length ? (
        <ol className="question-draft-choices">
          {question.choices.map(choice => <li key={choice.id} data-correct={choice.correct || undefined}>{choice.content}{choice.correct ? <strong> (gabarito)</strong> : null}</li>)}
        </ol>
      ) : question.answer.kind === "numeric" ? (
        <p>Resposta esperada: <strong>{String(question.answer.value).replace(".", ",")}{question.answer.unit ? ` ${question.answer.unit}` : ""}</strong></p>
      ) : null}
    </section>
  );
}

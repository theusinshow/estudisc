import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import "@/styles/practice-block.css";
import { AppShell } from "@/components/layout/app-shell";
import { MathText } from "@/components/ui/paragraphs";
import { ActivityList } from "@/features/activities/registry";
import { getOwnerId } from "@/features/auth/owner";
import { getConcept } from "@/features/concepts/api";
import { studentConceptLabel } from "@/features/concepts/student-label";
import { getFeatureFlags } from "@/lib/feature-flags";
import type { SessionItem } from "./contracts";
import { studySessionRepository } from "./api";
import { blockConceptId, blockQuestions, summarizeBlock, type BlockAnswer, type BlockMark, type PracticeBlockTarget } from "./practice-block";
import { PracticeBlockButton } from "./practice-block-button";
import { PracticeBlockStepper } from "./practice-block-stepper";

export type BlockResult = Readonly<{ session: Readonly<{ id: string; status: string }>; items: SessionItem[]; answers: readonly BlockAnswer[] }>;
const markLabel: Record<BlockMark, string> = { independent: "Acertou sem ajuda", retry: "Volta na revisão", open: "Não respondida" };

/** ADR 0072: a practice block, one Question at a time while ACTIVE, then its summary. */
export async function PracticeBlockPage({ result, target }: Readonly<{ result: BlockResult; target: PracticeBlockTarget }>) {
  const { session, items } = result;
  const questions = blockQuestions(items), summary = summarizeBlock(questions, result.answers);
  const back = target.kind === "remediation" ? { href: "/mistakes", label: "Voltar para Erros" } : { href: "/review", label: "Voltar para Revisão" };
  const conceptId = target.kind === "review" ? target.conceptId ?? null : blockConceptId(items);
  const concept = conceptId ? await getConcept(conceptId) : null;
  const title = concept ? studentConceptLabel(concept.title) : target.kind === "review" ? "Revisão" : "Prática";
  const header = <header className="study-header"><p className="eyebrow">{target.kind === "remediation" ? "Erros" : "Revisão"}</p><h1>{title}</h1></header>;
  if (session.status === "ACTIVE") {
    const steps = questions.map(question => {
      const snapshot = items[question.itemIndex].activitySnapshots!.find(activity => activity.stableId === question.stableId)!;
      return { stableId: question.stableId, questionId: question.questionId, node: <ActivityList activities={[{ ...snapshot, studySessionId: session.id }]} /> };
    });
    return <AppShell mode={getFeatureFlags().FEATURE_INTERACTIVE_LESSONS ? "focus" : "page"} exit={back}>
      <article className="foundation-panel content-panel practice-block-page" data-status="ACTIVE">
        {header}
        <PracticeBlockStepper sessionId={session.id} steps={steps} answeredQuestionIds={summary.rows.filter(row => row.mark !== "open").map(row => row.questionId)} />
      </article>
    </AppShell>;
  }
  const hasMore = session.status === "COMPLETED" && await studySessionRepository().blockHasMore(await getOwnerId(), target);
  return <AppShell>
    <article className="foundation-panel content-panel practice-block-page" data-status={session.status}>
      {header}
      <section className="practice-block-summary" aria-labelledby="block-summary-title">
        <h2 id="block-summary-title"><strong>{summary.independent} de {summary.total}</strong> sem ajuda</h2>
        <p>{session.status === "ABANDONED" ? "Você trocou este bloco por outra prática. As respostas dadas continuam valendo." : "As questões marcadas com ↺ voltam na sua revisão."}</p>
        <ol className="practice-block-results" aria-label="Questões do bloco">
          {summary.rows.map(row => <li key={row.stableId} data-mark={row.mark}>
            <span className="practice-block-mark" aria-hidden="true">{row.mark === "independent" ? <Check /> : <RotateCcw />}</span>
            <span className="practice-block-result-text"><span className="practice-block-stem"><MathText text={row.prompt} /></span><small>{markLabel[row.mark]}</small></span>
          </li>)}
        </ol>
        <div className="practice-block-actions">
          {hasMore && <PracticeBlockButton target={target} label="Mais 5" />}
          <Link className={hasMore ? "secondary-action" : "primary-action"} href={back.href}>Voltar</Link>
        </div>
      </section>
    </article>
  </AppShell>;
}

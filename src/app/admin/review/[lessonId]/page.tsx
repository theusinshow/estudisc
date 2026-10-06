import { PublicationSummary } from "@/features/content-qa/publication-summary";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import "@/styles/admin-review.css";
import { AppShell } from "@/components/layout/app-shell";
import { Paragraphs } from "@/components/ui/paragraphs";
import { getDatabase, getDatabaseUrl } from "@/db/connection";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { AccessDeniedError, requireAdmin } from "@/features/auth/owner";
import { LessonReviewForm } from "@/features/content-qa/lesson-review-form";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = { draft: "Rascunho", published: "Publicada", retired: "Retirada" };
const LETTERS = "ABCDE";

type Props = Readonly<{ params: Promise<{ lessonId: string }>; searchParams: Promise<{ version?: string }> }>;

export default async function LessonReviewPage({ params, searchParams }: Props) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AccessDeniedError) notFound();
    throw error;
  }
  if (!getDatabaseUrl() || getDatabaseUrl() === "memory://local") notFound();

  const lessonId = decodeURIComponent((await params).lessonId);
  const version = Number((await searchParams).version ?? 1);
  const detail = await new ContentQaRepository(getDatabase()).lessonDetail(lessonId, version).catch(() => null);
  if (!detail) notFound();

  const { lesson, questions, lessonRelease, questionReleases } = detail;
  const hints = new Map(lesson.activities.flatMap((activity) => activity.questionId ? [[activity.questionId, (activity.config as { hints?: string[] }).hints ?? []] as const] : []));
  const exitIds = new Set(lesson.exitTicketQuestionIds);
  const status = lessonRelease?.status ?? "unregistered";
  const pendingQuestions = questionReleases.filter((item) => item.release?.status !== "published").length;

  return (
    <AppShell>
      <div className="editorial-page">
        <Link href="/admin/review" className="editorial-back"><ArrowLeft aria-hidden="true" /> Todas as aulas</Link>
        <header>
          <h1>{lesson.title}</h1>
          <p className="editorial-meta">{lesson.id} · versão {lesson.version} · <span className="editorial-status" data-status={status}>{statusLabel[status] ?? "Sem registro"}</span></p>
          <Link href={`/lessons/${encodeURIComponent(lesson.id)}`} target="_blank" className="secondary-action editorial-preview">
            Abrir a aula como o aluno vê <ExternalLink aria-hidden="true" />
          </Link>
          <PublicationSummary details={detail.publication} />
        </header>

        <section className="editorial-section" aria-labelledby="concepts-title">
          <h2 id="concepts-title">Conceitos ({lesson.concepts.length})</h2>
          <ul className="editorial-concepts">{lesson.concepts.map((concept) => <li key={concept.id}><strong>{concept.title}</strong><small>{concept.id}</small></li>)}</ul>
        </section>

        <section className="editorial-section" aria-labelledby="questions-title">
          <h2 id="questions-title">Questões ({questions.length})</h2>
          <p className="editorial-lede">Confira se cada gabarito está certo e se só uma alternativa é defensável. Gabarito errado é falha crítica.</p>
          <ol className="editorial-questions">
            {questions.map((question) => (
              <li key={question.id}>
                <details>
                  <summary>
                    <span>{question.stem}</span>
                    <small>{question.id}{exitIds.has(question.id) ? " · desafio final" : ""} · {question.difficulty}</small>
                  </summary>
                  {question.stimulus ? <div className="question-stimulus"><Paragraphs text={question.stimulus} /></div> : null}
                  {question.choices?.length ? (
                    <ol className="editorial-choices">
                      {question.choices.map((choice, index) => (
                        <li key={choice.id} data-correct={choice.correct || undefined}>
                          <span className="editorial-letter">{LETTERS[index]}</span>
                          <span>{choice.content}</span>
                          {choice.correct ? <strong className="editorial-key">Gabarito</strong> : null}
                        </li>
                      ))}
                    </ol>
                  ) : question.answer.kind === "numeric" ? (
                    <p className="editorial-answer">Resposta: <strong>{String(question.answer.value).replace(".", ",")}{question.answer.unit ? ` ${question.answer.unit}` : ""}</strong>{question.answer.tolerance ? ` (tolerância ${question.answer.tolerance})` : ""}</p>
                  ) : (
                    <pre className="editorial-answer">{JSON.stringify(question.answer, null, 2)}</pre>
                  )}
                  <p className="editorial-explanation"><strong>Explicação:</strong> {question.explanation}</p>
                  {hints.get(question.id)?.length ? <p className="editorial-hints"><strong>Dicas:</strong> {hints.get(question.id)!.join(" → ")}</p> : null}
                </details>
              </li>
            ))}
          </ol>
        </section>

        <section className="editorial-section" aria-labelledby="decision-title">
          <h2 id="decision-title">Sua revisão</h2>
          {status === "published" && pendingQuestions === 0 ? (
            <p className="editorial-message" data-kind="ok" role="status">Publicada: o aluno já vê esta aula e as {questions.length} questões dela. Para mudar o conteúdo, importe uma nova versão.</p>
          ) : status === "retired" ? (
            <p className="editorial-empty">Esta versão foi retirada. Uma nova versão precisa ser importada.</p>
          ) : !lessonRelease ? (
            <p className="editorial-empty">Esta versão ainda não tem registro editorial. Reimporte a trilha para registrá-la.</p>
          ) : (
            <LessonReviewForm lessonId={lesson.id} version={lesson.version} questionCount={questions.length} />
          )}
        </section>
      </div>
    </AppShell>
  );
}

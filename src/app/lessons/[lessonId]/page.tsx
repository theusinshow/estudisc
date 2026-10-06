import { notFound } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { getFeatureFlags } from "@/lib/feature-flags";
import { ActivityList } from "@/features/activities/registry";
import { getLesson } from "@/features/lessons/api";
import { LessonBlockList } from "@/features/lessons/blocks";
import { getLessonProgress } from "@/features/progress/api";
import { LiveLessonProgress } from "@/features/progress/live-progress-summary";
import { LessonSteps } from "@/features/lessons/lesson-steps";
import { getTrack } from "@/features/tracks/api";

type LessonPageProps = Readonly<{
  params: Promise<{ lessonId: string }>;
}>;

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);

  if (!lesson) {
    notFound();
  }
  const [progress, track] = await Promise.all([
    getLessonProgress(lesson.stableId, lesson.concepts.map((concept) => concept.stableId)),
    getTrack(lesson.trackStableId)
  ]);
  const trackLessons = track?.modules.flatMap((module) => module.lessons) ?? [];
  const next = trackLessons[trackLessons.findIndex((entry) => entry.stableId === lesson.stableId) + 1];
  const completion = {
    trackHref: `/tracks/${lesson.trackStableId}`,
    nextLesson: next && trackLessons.some((entry) => entry.stableId === lesson.stableId) ? { href: `/lessons/${next.stableId}`, title: next.title } : undefined
  };
  // Study lessons get the one-idea-per-screen flow; programming lessons keep the Lab layout.
  const stepped = !lesson.activities.some(activity => activity.type === "code" || activity.type === "debug");

  return (
    <AppShell mode={getFeatureFlags().FEATURE_INTERACTIVE_LESSONS ? "focus" : "page"} exit={{ href: `/tracks/${lesson.trackStableId}`, label: "Voltar à trilha" }}>
      <article className="foundation-panel content-panel accent-panel accent-learn" aria-labelledby="lesson-title">
        <p className="eyebrow">{lesson.trackTitle}</p>
        <h1 id="lesson-title">{lesson.title}</h1>
        {Boolean(lesson.metadata?.kind)&&(!lesson.metadata?.qaReleaseId||lesson.metadata?.status!=="published")&&<p className="learning-hint">Prévia administrativa · conteúdo aguardando QA independente.</p>}
        <LiveLessonProgress lessonStableId={lesson.stableId} initial={progress} />
        {!stepped && <LessonSessionCallout progress={progress} />}

        {stepped ? (
          <LessonSteps blocks={lesson.blocks} activities={lesson.activities} completion={completion} />
        ) : (
          <>
        <nav className="lesson-flow-nav" aria-label="Fluxo da aula">
          <a href="#lesson-body-title">
            <span>01</span>
            <strong>Aula</strong>
          </a>
          <a href="#concepts-title">
            <span>02</span>
            <strong>Conceitos</strong>
          </a>
          <a href="#activities-title">
            <span>03</span>
            <strong>Prática</strong>
          </a>
        </nav>

        <section className="module-section lesson-study-section" aria-labelledby="lesson-body-title">
          <p className="technical-label">Ler primeiro</p>
          <h2 id="lesson-body-title">Aula</h2>
          <LessonBlockList blocks={lesson.blocks} />
        </section>

        <section className="module-section" aria-labelledby="concepts-title">
          <p className="technical-label">Entender</p>
          <h2 id="concepts-title">Conceitos desta aula</h2>
          <ul className="concept-list">
            {lesson.concepts.map((concept) => (
              <li key={concept.stableId}>
                <Link href={`/concepts/${concept.stableId}`}>
                  <strong>{concept.title}</strong>
                  <span>{concept.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="module-section" aria-labelledby="activities-title">
          <p className="technical-label">Praticar depois</p>
          <h2 id="activities-title">Prática</h2>
          <ActivityList activities={lesson.activities} />
        </section>
          </>
        )}
      </article>
    </AppShell>
  );
}

function LessonSessionCallout({ progress }: Readonly<{ progress: Awaited<ReturnType<typeof getLessonProgress>> }>) {
  if (!progress) {
    return null;
  }

  const hasPractice = progress.totalActivities > 0;
  const isComplete = hasPractice && progress.passedActivities === progress.totalActivities;
  const hasStarted = progress.attemptedActivities > 0;

  return (
    <aside
      className={`study-session-callout ${isComplete ? "is-complete" : "is-active"}`}
      aria-label="Estado da sessão de estudo"
    >
      <div>
        <p className="technical-label">{isComplete ? "Sessão concluída" : hasStarted ? "Sessão em andamento" : "Próximo passo"}</p>
        <strong>{getSessionTitle({ isComplete, hasStarted })}</strong>
        <span>{getSessionCopy({ isComplete, hasStarted, passedActivities: progress.passedActivities, totalActivities: progress.totalActivities })}</span>
      </div>
      <nav aria-label="Ações da sessão">
        {isComplete ? (
          <>
            <Link href="/progress">Ver progresso</Link>
            <Link href="/history">Abrir histórico</Link>
            <Link href="/review">Revisar depois</Link>
          </>
        ) : (
          <>
            <a href="#lesson-body-title">Ler aula</a>
            <a href="#concepts-title">Rever conceitos</a>
            <a href="#activities-title">Praticar</a>
          </>
        )}
      </nav>
    </aside>
  );
}

function getSessionTitle({ isComplete, hasStarted }: Readonly<{ isComplete: boolean; hasStarted: boolean }>) {
  if (isComplete) {
    return "Todas as atividades desta aula foram aprovadas.";
  }

  if (hasStarted) {
    return "Continue pela prática que ainda falta evidência.";
  }

  return "Leia a teoria, conecte os conceitos e pratique depois.";
}

function getSessionCopy({
  isComplete,
  hasStarted,
  passedActivities,
  totalActivities
}: Readonly<{ isComplete: boolean; hasStarted: boolean; passedActivities: number; totalActivities: number }>) {
  if (isComplete) {
    return "Agora vale conferir o progresso, revisar o histórico e decidir se abre a fila de revisão.";
  }

  if (hasStarted) {
    return `${passedActivities}/${totalActivities} atividades aprovadas. RUN continua livre; SUBMIT registra a próxima evidência oficial.`;
  }

  return "O laboratório está no final da aula para que o código confirme o que foi lido, não substitua a leitura.";
}

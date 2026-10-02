import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getTrackProgress } from "@/features/progress/api";
import { ProgressSummary } from "@/features/progress/progress-summary";
import { getTrack } from "@/features/tracks/api";

type TrackPageProps = Readonly<{
  params: Promise<{ trackId: string }>;
}>;

export default async function TrackPage({ params }: TrackPageProps) {
  const { trackId } = await params;
  const [track, progress] = await Promise.all([getTrack(trackId), getTrackProgress(trackId)]);

  if (!track) {
    notFound();
  }

  const lessons = track.modules.flatMap((module) => module.lessons);
  const completed = new Set(progress?.completedLessonStableIds ?? []);
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.stableId));
  const started = completed.size > 0;

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-learn" aria-labelledby="track-title">
        <p className="eyebrow">Trilha</p>
        <h1 id="track-title">{track.title}</h1>
        <p>{track.description}</p>
        <ProgressSummary progress={progress} />

        {nextLesson ? (
          <Link className="today-action study-next-action" href={`/lessons/${nextLesson.stableId}`}>
            <strong>{started ? "Continuar pela próxima aula" : "Começar pela primeira aula"}</strong>
            <span>{nextLesson.title}</span>
          </Link>
        ) : lessons.length ? (
          <p className="today-action study-next-action">
            <strong>Todas as aulas desta trilha foram concluídas</strong>
            <span>Continue pelas revisões na tela Hoje.</span>
          </p>
        ) : null}

        <div className="module-stack" aria-label="Módulos da trilha">
          {track.modules.map((module, moduleIndex) => (
            <details key={module.stableId} className="module-section module-disclosure" open={moduleIndex === 0}>
              <summary aria-labelledby={`module-${module.stableId}`}>
                <span className="technical-label">Módulo {moduleIndex + 1}</span>
                <h2 id={`module-${module.stableId}`}>{module.title}</h2>
                <span>{plural(module.lessons.length, "aula", "aulas")}</span>
              </summary>
              <ol className="record-list">
                {module.lessons.map((lesson) => (
                  <li key={lesson.stableId}>
                    <Link href={`/lessons/${lesson.stableId}`} data-complete={completed.has(lesson.stableId) || undefined}>
                      <strong>{lesson.title}</strong>
                      <span>
                        {completed.has(lesson.stableId) ? "Concluída · " : ""}
                        {plural(lesson.activityCount, "atividade", "atividades")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

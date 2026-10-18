import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronDown, Play } from "lucide-react";

import "@/styles/today.css";
import "@/styles/track.css";
import { AppShell } from "@/components/layout/app-shell";
import { getTrackProgress } from "@/features/progress/api";
import { getTrack } from "@/features/tracks/api";
import { StudyActionCard } from "@/features/today/study-action-card";

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
  const nextModule = track.modules.find((module) => module.lessons.some((lesson) => lesson.stableId === nextLesson?.stableId));
  // The subject of the next lesson opens by itself; with everything done, the first one.
  const openModuleId = (nextModule ?? track.modules[0])?.stableId;

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-learn track-page" aria-labelledby="track-title">
        <p className="eyebrow">Trilha</p>
        <h1 id="track-title">{track.title}</h1>
        <p>{track.description}</p>
        <div className="track-progress" aria-label="Progresso">
          <p><strong>{completed.size}</strong> de {lessons.length} {lessons.length === 1 ? "aula concluída" : "aulas concluídas"}</p>
          <progress value={completed.size} max={Math.max(lessons.length, 1)} aria-hidden="true" />
        </div>

        {nextLesson ? (
          // ".today" gives the card the same treatment as on Hoje (subject tab, yellow action bar).
          <div className="today">
            <StudyActionCard variant={started ? "continue" : "lesson"} title={nextLesson.title}
              reason={`${started ? "Próxima aula" : "Primeira aula"} de ${nextModule?.title ?? track.title}.`}
              href={`/lessons/${nextLesson.stableId}`} subjectCode={nextModule?.subjectCode ?? undefined} />
          </div>
        ) : lessons.length ? (
          <p className="track-done"><strong>Todas as aulas desta trilha foram concluídas.</strong> Continue pelas revisões na tela Hoje.</p>
        ) : null}

        <div className="track-modules" aria-label="Matérias da trilha">
          {track.modules.map((module) => {
            const done = module.lessons.filter((lesson) => completed.has(lesson.stableId)).length;
            return (
              <details key={module.stableId} className="track-module" data-subject={module.subjectCode ?? undefined} open={module.stableId === openModuleId}>
                <summary>
                  <span className="track-module-head">
                    <h2 id={`module-${module.stableId}`}>{module.title}</h2>
                    <small>{done} de {plural(module.lessons.length, "aula", "aulas")}</small>
                  </span>
                  <ChevronDown aria-hidden="true" />
                  <progress value={done} max={Math.max(module.lessons.length, 1)} aria-hidden="true" />
                </summary>
                <ol className="track-lessons" aria-label={`Aulas de ${module.title}`}>
                  {module.lessons.map((lesson) => {
                    const state = completed.has(lesson.stableId) ? "done" : lesson.stableId === nextLesson?.stableId ? "next" : "todo";
                    return (
                      <li key={lesson.stableId}>
                        <Link href={`/lessons/${lesson.stableId}`} data-state={state}>
                          <span className="track-lesson-mark" aria-hidden="true">{state === "done" ? <Check /> : state === "next" ? <Play /> : null}</span>
                          <span>
                            <strong>{lesson.title}</strong>
                            <small>{state === "done" ? "Concluída" : state === "next" ? "Próxima aula" : plural(lesson.activityCount, "atividade", "atividades")}</small>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </details>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

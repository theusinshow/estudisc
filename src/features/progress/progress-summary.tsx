import type { LessonProgressSummary, TrackProgressSummary } from "@/db/repositories/progress-repository";

type ProgressSummaryProps = Readonly<{
  progress: LessonProgressSummary | TrackProgressSummary | null;
}>;

export function ProgressSummary({ progress }: ProgressSummaryProps) {
  if (!progress) {
    return null;
  }

  const hasLessonStats = "totalLessons" in progress;

  return (
    <aside className="progress-summary" aria-label="Progresso">
      <p className="eyebrow">Seu progresso nesta aula</p>
      <dl>
        {hasLessonStats ? (
          <>
            <div>
              <dt>Lições concluídas</dt>
              <dd>
                {progress.completedLessons}/{progress.totalLessons}
              </dd>
            </div>
            <div>
              <dt>Atividades tentadas</dt>
              <dd>
                {progress.attemptedActivities}/{progress.totalActivities}
              </dd>
            </div>
          </>
        ) : (
          <div>
            <dt>Atividades tentadas</dt>
            <dd>
              {progress.attemptedActivities}/{progress.totalActivities}
            </dd>
          </div>
        )}
        <div>
          <dt>Atividades aprovadas</dt>
          <dd>
            {progress.passedActivities}/{progress.totalActivities}
          </dd>
        </div>
        <div>
          <dt>Domínio dos conceitos</dt>
          <dd>{progress.masteryStatus === "not_calculated" ? "Ainda não calculado" : progress.masteryStatus}</dd>
        </div>
      </dl>
    </aside>
  );
}

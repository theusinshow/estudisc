import type { LessonProgressSummary, TrackProgressSummary } from "@/db/repositories/progress-repository";
import type { ConceptMasterySummary } from "./mastery-summary";

export type ProgressSummaryData = (LessonProgressSummary & { mastery?: ConceptMasterySummary }) | TrackProgressSummary;

type ProgressSummaryProps = Readonly<{
  progress: ProgressSummaryData | null;
}>;

export function ProgressSummary({ progress }: ProgressSummaryProps) {
  if (!progress) {
    return null;
  }

  const isTrack = "totalLessons" in progress;
  const mastery = isTrack ? undefined : progress.mastery;

  return (
    <aside className="progress-summary" aria-label="Progresso">
      <p className="eyebrow">{isTrack ? "Seu progresso nesta trilha" : "Seu progresso nesta aula"}</p>
      <dl>
        {isTrack && (
          <div>
            <dt>Aulas concluídas</dt>
            <dd>
              {progress.completedLessons}/{progress.totalLessons}
            </dd>
          </div>
        )}
        <div>
          <dt>Atividades tentadas</dt>
          <dd>
            {progress.attemptedActivities}/{progress.totalActivities}
          </dd>
        </div>
        <div>
          <dt>Atividades aprovadas</dt>
          <dd>
            {progress.passedActivities}/{progress.totalActivities}
          </dd>
        </div>
        {mastery && (
          <div>
            <dt>Domínio dos conceitos</dt>
            <dd>{mastery.conceptsWithEvidence === 0 ? "Sem evidência ainda" : mastery.weakestLabel}</dd>
            <small>
              {mastery.conceptsWithEvidence}/{mastery.totalConcepts} conceitos praticados · sobe com acertos sem dica em dias diferentes
            </small>
          </div>
        )}
      </dl>
    </aside>
  );
}

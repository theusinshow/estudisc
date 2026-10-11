import { MathText } from "@/components/ui/paragraphs";
import type { StaticActivityConfig } from "@/features/activities/application/static-activity-config";

type StaticActivityPanelProps = Readonly<{
  activityStableId: string;
  activityLabel: string;
  prompt: string;
  config: StaticActivityConfig;
}>;

export function StaticActivityPanel({ activityStableId, activityLabel, prompt, config }: StaticActivityPanelProps) {
  const correctChoices = config.choices.filter((choice) => choice.isCorrect).map((choice) => choice.label);
  const hasAnswer = Boolean(config.answer || config.explanation || correctChoices.length > 0);

  return (
    <section className="activity-panel static-activity-panel" id={`activity-${activityStableId}`} aria-labelledby={`${activityStableId}-title`}>
      <header>
        <p className="eyebrow">{activityLabel}</p>
        <h3 id={`${activityStableId}-title`}><MathText text={prompt} /></h3>
      </header>

      {config.instructions ? <p><MathText text={config.instructions} /></p> : null}

      {config.choices.length > 0 ? (
        <ol className="activity-choice-list" aria-label="Alternativas">
          {config.choices.map((choice, index) => (
            <li key={`${choice.label}-${index}`}>
              <span className="technical-label">Opção {index + 1}</span>
              <strong><MathText text={choice.label} /></strong>
            </li>
          ))}
        </ol>
      ) : null}

      {config.hint ? (
        <div className="attempt-feedback">
          <strong>Pista</strong>
          <span><MathText text={config.hint} /></span>
        </div>
      ) : null}

      {hasAnswer ? (
        <details className="activity-answer-disclosure">
          <summary>Ver resposta esperada</summary>
          {correctChoices.length > 0 ? (
            <p>
              <strong>Alternativa esperada:</strong> {correctChoices.join(", ")}
            </p>
          ) : null}
          {config.answer ? (
            <p>
              <strong>Resposta:</strong> <MathText text={config.answer} />
            </p>
          ) : null}
          {config.explanation ? (
            <p>
              <strong>Explicação:</strong> <MathText text={config.explanation} />
            </p>
          ) : null}
        </details>
      ) : null}

      <p className="activity-status" role="status">
        Checagem de leitura. Nenhuma tentativa oficial é registrada nesta atividade.
      </p>
    </section>
  );
}

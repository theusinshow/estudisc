import { getLatestActivityAttemptFeedback } from "@/features/activities/api";

import { getActivityDefinition, isExecutableActivityType } from "./activity-definitions";
import type { ActivityAttemptFeedback, ActivityRecord, KnownActivityType } from "./types";

export async function ActivityList({ activities }: Readonly<{ activities: ReadonlyArray<ActivityRecord> }>) {
  return (
    <div className="activity-stack">
      {activities.map((activity) => (
        <ActivityRenderer activity={activity} key={activity.stableId} />
      ))}
    </div>
  );
}

async function ActivityRenderer({ activity }: Readonly<{ activity: ActivityRecord }>) {
  switch (activity.type) {
    case "code":
    case "debug":
    case "prediction":
    case "multiple-choice":
    case "numeric":
    case "ordering":
    case "classification":
    case "matching":
    case "text-highlight":
    case "guided-steps":
    case "question":
      return renderKnownActivity(activity, activity.type);
    default:
      return (
        <div className="activity-panel">
          <p className="eyebrow">Atividade indisponível</p>
          <h3>{activity.prompt}</h3>
          <p>Este tipo de atividade ainda não tem renderer seguro nesta versão.</p>
        </div>
      );
  }
}

async function renderKnownActivity<Type extends KnownActivityType>(activity: ActivityRecord, type: Type) {
  const definition = getActivityDefinition(type);
  let config;
  try { config = definition.parseConfig(activity.config); }
  catch { return <div className="activity-panel"><h3>{activity.prompt}</h3><p>Este exercício precisa de revisão de conteúdo antes de ser usado.</p></div>; }
  const feedback: ActivityAttemptFeedback | null = isExecutableActivityType(type)
    ? await getLatestActivityAttemptFeedback(activity.stableId)
    : null;

  return definition.render({ activity, config, feedback });
}

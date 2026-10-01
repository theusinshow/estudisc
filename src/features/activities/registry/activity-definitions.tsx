import { parseCodeActivityConfig } from "@/features/activities/application/code-activity-config";
import { parseStaticActivityConfig } from "@/features/activities/application/static-activity-config";
import { CodeActivityPanel } from "@/features/activities/components/code-activity-panel";
import { StaticActivityPanel } from "@/features/activities/components/static-activity-panel";
import { parseEducationalActivityConfig } from "../application/educational-activity";
import { questionReferenceSchema } from "../application/question-reference";
import { EducationalActivityPanel } from "../components/educational-activity-panel";
import { QuestionActivity } from "../components/question-activity";

import type { ActivityConfigByType, ActivityDefinition, ExecutableActivityType, KnownActivityType } from "./types";

type ActivityDefinitionMap = {
  [Type in KnownActivityType]: ActivityDefinition<Type>;
};

const codeActivityDefinition: ActivityDefinition<"code"> = {
  type: "code",
  label: "Atividade de codigo",
  parseConfig: parseCodeActivityConfig,
  render: ({ activity, config, feedback }) => (
    <CodeActivityPanel
      activityStableId={activity.stableId}
      activityLabel="Atividade de código"
      prompt={activity.prompt}
      starterCode={config.starterCode}
      initialFeedback={feedback}
    />
  )
};

const debugActivityDefinition: ActivityDefinition<"debug"> = {
  type: "debug",
  label: "Atividade de debug",
  parseConfig: parseCodeActivityConfig,
  render: ({ activity, config, feedback }) => (
    <CodeActivityPanel
      activityStableId={activity.stableId}
      activityLabel="Atividade de debug"
      prompt={activity.prompt}
      starterCode={config.starterCode}
      initialFeedback={feedback}
    />
  )
};

const predictionActivityDefinition: ActivityDefinition<"prediction"> = {
  type: "prediction",
  label: "Atividade de predição",
  parseConfig: parseStaticActivityConfig,
  render: ({ activity, config }) => (
    <StaticActivityPanel
      activityStableId={activity.stableId}
      activityLabel="Atividade de predição"
      prompt={activity.prompt}
      config={config}
    />
  )
};

const multipleChoiceActivityDefinition: ActivityDefinition<"multiple-choice"> = {
  type: "multiple-choice",
  label: "Atividade de múltipla escolha",
  parseConfig: parseStaticActivityConfig,
  render: ({ activity, config }) => (
    <StaticActivityPanel
      activityStableId={activity.stableId}
      activityLabel="Atividade de múltipla escolha"
      prompt={activity.prompt}
      config={config}
    />
  )
};

type EducationalType = "numeric" | "ordering" | "classification" | "matching" | "text-highlight" | "guided-steps";
function educationalDefinition<Type extends EducationalType>(type: Type): ActivityDefinition<Type> {
  return { type, label: "Prática guiada", parseConfig: input => parseEducationalActivityConfig({ ...(typeof input === "object" && input !== null ? input : {}), type }), render: ({ activity, config }) => <EducationalActivityPanel prompt={activity.prompt} config={config} /> };
}
const activityDefinitions = {
  code: codeActivityDefinition,
  debug: debugActivityDefinition,
  prediction: predictionActivityDefinition,
  "multiple-choice": multipleChoiceActivityDefinition,
  numeric: educationalDefinition("numeric"),
  ordering: educationalDefinition("ordering"),
  classification: educationalDefinition("classification"),
  matching: educationalDefinition("matching"),
  "text-highlight": educationalDefinition("text-highlight"),
  "guided-steps": educationalDefinition("guided-steps"),
  question: { type: "question", label: "Questão", parseConfig: input => questionReferenceSchema.parse(input), render: ({ config,activity }) => <QuestionActivity config={config} activityStableId={activity.stableId} sessionId={activity.studySessionId} /> }
} satisfies ActivityDefinitionMap;

const executableActivityTypes = new Set<string>(["code", "debug"]);

export function getActivityDefinition<Type extends KnownActivityType>(type: Type): ActivityDefinitionMap[Type];
export function getActivityDefinition(type: string): ActivityDefinitionMap[KnownActivityType] | null;
export function getActivityDefinition(type: string) {
  return isKnownActivityType(type) ? activityDefinitions[type] : null;
}

export function parseActivityConfig<Type extends KnownActivityType>(
  type: Type,
  config: unknown
): ActivityConfigByType[Type];
export function parseActivityConfig(type: string, config: unknown): ActivityConfigByType[KnownActivityType];
export function parseActivityConfig(type: string, config: unknown) {
  const definition = getActivityDefinition(type);

  if (!definition) {
    throw new Error(`Unsupported activity type: ${type}`);
  }

  return definition.parseConfig(config) as ActivityConfigByType[KnownActivityType];
}

function isKnownActivityType(type: string): type is KnownActivityType {
  return type in activityDefinitions;
}

export function isExecutableActivityType(type: string): type is ExecutableActivityType {
  return executableActivityTypes.has(type);
}

export { activityDefinitions };

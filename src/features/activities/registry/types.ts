import type { ReactNode } from "react";

import type { SourceDiffLine } from "@/features/attempts/source-diff";
import type { CodeActivityConfig } from "@/features/activities/application/code-activity-config";
import type { StaticActivityConfig } from "@/features/activities/application/static-activity-config";
import type { JavaScriptExecutionResult, JavaScriptTestResult } from "@/runtime/javascript/api";
import type { EducationalActivityConfig } from "../application/educational-activity";
import type { QuestionReferenceConfig } from "../application/question-reference";

export type ActivityRecord = Readonly<{
  stableId: string;
  type: string;
  prompt: string;
  config: unknown;
}>;

export type ActivityConfigByType = {
  code: CodeActivityConfig;
  debug: CodeActivityConfig;
  prediction: StaticActivityConfig;
  "multiple-choice": StaticActivityConfig;
  numeric: EducationalActivityConfig;
  ordering: EducationalActivityConfig;
  classification: EducationalActivityConfig;
  matching: EducationalActivityConfig;
  "text-highlight": EducationalActivityConfig;
  "guided-steps": EducationalActivityConfig;
  question: QuestionReferenceConfig;
};

export type KnownActivityType = keyof ActivityConfigByType;
export type ExecutableActivityType = "code" | "debug";

export type ActivityAttemptFeedback = Readonly<{
  attemptNumber: number;
  outcome: "passed" | "failed";
  execution: JavaScriptExecutionResult;
  tests: JavaScriptTestResult[];
  sourceDiff: SourceDiffLine[];
  submittedAt: string;
}>;

export type ActivityDefinition<Type extends KnownActivityType = KnownActivityType> = Readonly<{
  type: Type;
  label: string;
  parseConfig: (config: unknown) => ActivityConfigByType[Type];
  render: (props: {
    activity: ActivityRecord;
    config: ActivityConfigByType[Type];
    feedback: ActivityAttemptFeedback | null;
  }) => ReactNode;
}>;

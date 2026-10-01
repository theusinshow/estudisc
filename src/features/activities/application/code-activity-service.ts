import { getOwnerId } from "@/features/auth/owner";
import { ActivityAttemptRepository } from "@/db/repositories/activity-attempt-repository";
import { getDatabaseUrl } from "@/db/connection";
import { MemoryActivityAttemptRepository } from "@/db/repositories/memory-store";
import { isExecutableActivityType, parseActivityConfig } from "@/features/activities/registry";
import { evaluateJavaScriptActivity, runJavaScript } from "@/runtime/javascript/api";
import type { ActivityAttemptFeedback } from "@/features/activities/registry";
import { diffSourceLines } from "@/features/attempts/source-diff";

export type RunCodeActivityResult =
  | Readonly<{ status: "not_found" }>
  | Readonly<{ status: "executed"; execution: Awaited<ReturnType<typeof runJavaScript>>; attemptsBefore: number }>;

export type SubmitCodeActivityResult =
  | Readonly<{ status: "not_found" }>
  | Readonly<{
      status: "submitted";
      evaluation: Awaited<ReturnType<typeof evaluateJavaScriptActivity>>;
      submission: Awaited<ReturnType<ActivityAttemptRepository["recordSubmission"]>>;
    }>;

type ActivityAttemptStore = Pick<
  ActivityAttemptRepository,
  "countAttemptsForActivity" | "getCodeActivity" | "getLatestAttemptFeedback" | "recordSubmission"
>;

export async function runCodeActivity(
  activityStableId: string,
  source: string,
  repository: ActivityAttemptStore = createActivityAttemptRepository()
): Promise<RunCodeActivityResult> {
  const ownerId = await getOwnerId();
  const activity = await repository.getCodeActivity(activityStableId);

  if (!activity || !isExecutableActivityType(activity.type)) {
    return { status: "not_found" };
  }

  const attemptsBefore = await repository.countAttemptsForActivity(ownerId, activity.id);
  const execution = await runJavaScript({ source });

  return { status: "executed", execution, attemptsBefore };
}

export async function submitCodeActivity(
  activityStableId: string,
  source: string,
  repository: ActivityAttemptStore = createActivityAttemptRepository()
): Promise<SubmitCodeActivityResult> {
  const ownerId = await getOwnerId();
  const activity = await repository.getCodeActivity(activityStableId);

  if (!activity || !isExecutableActivityType(activity.type)) {
    return { status: "not_found" };
  }

  const config = parseActivityConfig(activity.type, activity.config);
  const evaluation = await evaluateJavaScriptActivity(source, config.tests);
  const submission = await repository.recordSubmission({
    ownerId,
    activity,
    source,
    evaluation
  });

  return { status: "submitted", evaluation, submission };
}

export async function getLatestActivityAttemptFeedback(
  activityStableId: string,
  repository: ActivityAttemptStore = createActivityAttemptRepository()
): Promise<ActivityAttemptFeedback | null> {
  const ownerId = await getOwnerId();
  const activity = await repository.getCodeActivity(activityStableId);

  if (!activity) {
    return null;
  }

  if (!isExecutableActivityType(activity.type)) {
    return null;
  }

  const feedback = await repository.getLatestAttemptFeedback(ownerId, activity.id);

  if (!feedback) {
    return null;
  }

  const config = parseActivityConfig(activity.type, activity.config);

  return {
    attemptNumber: feedback.attemptNumber,
    outcome: feedback.outcome,
    execution: feedback.execution,
    tests: feedback.tests,
    sourceDiff: diffSourceLines(config.starterCode, feedback.source),
    submittedAt: feedback.createdAt.toISOString()
  };
}

function createActivityAttemptRepository(): ActivityAttemptStore {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryActivityAttemptRepository();
  }

  return new ActivityAttemptRepository();
}


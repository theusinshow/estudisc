import { z } from "zod";

const flag = z.preprocess(
  value => value === "" ? undefined : value,
  z.enum(["true", "false"]).default("false").transform(value => value === "true")
);

export const featureFlagsSchema = z.object({
  FEATURE_NEW_TODAY: flag,
  FEATURE_STUDY_PLANNER: flag,
  FEATURE_ADAPTIVE_SESSION: flag,
  FEATURE_INTERACTIVE_LESSONS: flag,
  FEATURE_AI_LEARNING: flag,
  FEATURE_KNOWLEDGE_MAP: flag,
  FEATURE_SMART_MISTAKES: flag,
  FEATURE_REAL_EXAM: flag,
  FEATURE_CONTENT_HEALTH: flag
});

export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

/** Read only explicit rollout settings; never serialize the server environment to a client. */
export function getFeatureFlags(source: Record<string, string | undefined> = process.env): FeatureFlags {
  return featureFlagsSchema.parse(Object.fromEntries(
    Object.keys(featureFlagsSchema.shape).map(name => [name, source[name]])
  ));
}

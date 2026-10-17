import { getServerEnv } from "@/lib/env";
import { getFeatureFlags } from "@/lib/feature-flags";

/** AI help is offered to students only when the feature is on and a provider key is actually configured. */
export function isLearningAiAvailable() {
  if (!getFeatureFlags().FEATURE_AI_LEARNING) return false;
  try { return Boolean(getServerEnv().DEEPSEEK_API_KEY); } catch { return false; }
}

import { logEvent } from "@/lib/logger";

/**
 * Conversion funnel steps, written as structured server logs (no third-party tracker, no personal data).
 * Counts that already live in the database — new owners, Diagnostic and lesson completion, entitlements —
 * are measured there instead; see docs/29-CONVERSION-FUNNEL.md.
 */
export type FunnelStep =
  | "signin_completed"
  | "free_home_viewed"
  | "paywall_viewed"
  | "paid_feature_blocked"
  | "checkout_started"
  | "checkout_failed"
  | "checkout_returned"
  | "entitlement_granted";

export function logFunnelEvent(funnelStep: FunnelStep, metadata: Readonly<{ reasonCode?: string; status?: string; source?: string; operation?: string }> = {}) {
  logEvent("info", "funnel_event", { funnelStep, ...metadata });
}

import { logEvent } from "@/lib/logger";

/**
 * Conversion funnel steps, written as structured server logs (no third-party tracker, no personal data).
 * Counts that already live in the database — new owners, Diagnostic and lesson completion, entitlements —
 * are measured there instead; see docs/29-CONVERSION-FUNNEL.md.
 */
export type FunnelStep =
  | "cta_clicked"
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

/** Buttons that open sign-in to subscribe; the link carries `origem=<source>` (SEO pass, 2026-10-18). */
export const CTA_SOURCES = ["landing_hero", "landing_free", "landing_price", "parents_price", "past_exams"] as const;
export type CtaSource = (typeof CTA_SOURCES)[number];

/** Logs the click that led here; unknown values are ignored so the log never echoes arbitrary input. */
export function logCtaClick(origem: string | undefined) {
  const source = CTA_SOURCES.find(value => value === origem);
  if (source) logFunnelEvent("cta_clicked", { source });
  return source ?? null;
}

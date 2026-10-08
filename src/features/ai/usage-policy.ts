import { AiLearningError, type AiOutcome } from "./contracts";

export const AI_TIMEOUT_MS = 20_000;
export const AI_CACHE_MS = 60 * 60_000;
export type AiReservation = Readonly<{ id: string; requestId: string; key: string; createdAt: Date; providerCall: boolean; outcome?: AiOutcome; completedAt?: Date }>;
export type AiClaim = Readonly<{ id: string; cached?: Extract<AiOutcome, { ok: true }>; replay?: AiOutcome }>;
export type AiClaimInput = Readonly<{ requestId: string; key: string }>;
export type AiDecision = Readonly<{ kind: "existing"; claim: AiClaim }> | Readonly<{ kind: "new"; providerCall: boolean; cached?: Extract<AiOutcome, { ok: true }> }>;

/** Called with one owner's ledger while holding the existing owner lock. */
export function decideAiClaim(rows: readonly AiReservation[], input: AiClaimInput, now: Date): AiDecision {
  const previous = rows.find(row => row.requestId === input.requestId);
  if (previous) {
    if (previous.key !== input.key) throw new AiLearningError("request_conflict");
    if (previous.outcome) return { kind: "existing", claim: { id: previous.id, replay: previous.outcome } };
    if (now.getTime() - previous.createdAt.getTime() < AI_TIMEOUT_MS) throw new AiLearningError("request_pending");
    return { kind: "existing", claim: { id: previous.id, replay: { ok: false, code: "timeout" } } };
  }
  const minute = now.getTime() - 60_000;
  const recent = rows.filter(row => row.createdAt.getTime() > minute && row.createdAt <= now);
  if (recent.length >= 30) throw new AiLearningError("rate_limited");
  const cached = rows.filter(row => row.providerCall && row.key === input.key && row.outcome?.ok && row.completedAt && row.completedAt.getTime() > now.getTime() - AI_CACHE_MS && row.completedAt <= now)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0]?.outcome;
  if (cached?.ok) return { kind: "new", providerCall: false, cached };
  if (rows.some(row => row.providerCall && row.key === input.key && !row.outcome && row.createdAt <= now && row.createdAt.getTime() > now.getTime() - AI_TIMEOUT_MS)) throw new AiLearningError("request_pending");
  if (recent.filter(row => row.providerCall).length >= 6) throw new AiLearningError("rate_limited");
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (rows.filter(row => row.providerCall && row.createdAt.getTime() >= dayStart && row.createdAt <= now).length >= 20) throw new AiLearningError("daily_limit");
  if (rows.filter(row => row.providerCall && !row.outcome && row.createdAt <= now && row.createdAt.getTime() > now.getTime() - AI_TIMEOUT_MS).length >= 2) throw new AiLearningError("request_pending");
  return { kind: "new", providerCall: true };
}

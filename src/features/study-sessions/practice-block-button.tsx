"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { openStudySession } from "./session-navigation";
import { apiErrorSchema, readValidatedResponse, sessionResponseSchema } from "@/lib/api-response";
import type { PracticeBlockTarget } from "./practice-block";

type Props = Readonly<{ target: PracticeBlockTarget; label: string; ariaLabel?: string; variant?: "primary" | "secondary"; lessonHref?: string }>;
const subscribe = () => () => {};

/** ADR 0072: one tap starts (or resumes) a block of up to five Questions for this target; there is no time choice. */
export function PracticeBlockButton({ target, label, ariaLabel, variant = "primary", lessonHref }: Props) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [locked, setLocked] = useState(false), [empty, setEmpty] = useState(false);
  async function start() {
    if (busy) return;
    setBusy(true); setError(""); setLocked(false); setEmpty(false);
    try {
      const response = await fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "practice_block", target }) });
      if (!response.ok) {
        const failure = apiErrorSchema.safeParse(await response.json().catch(() => null));
        setLocked(failure.success && failure.data.code === "paid_access_required");
        setEmpty(failure.success && failure.data.code === "content_gap");
        throw new Error(failure.success ? failure.data.message ?? "Esta prática não está disponível agora." : "Não foi possível preparar a prática. Tente novamente.");
      }
      openStudySession((await readValidatedResponse(response, sessionResponseSchema)).sessionId);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Falha de conexão. Você pode tentar novamente.");
      setBusy(false);
    }
  }
  return <div className="practice-block-start" aria-busy={busy}>
    <button className={variant === "primary" ? "primary-button" : "secondary-button"} type="button" aria-label={busy ? undefined : ariaLabel} disabled={!ready || busy} onClick={() => void start()}>{busy ? "Preparando…" : label}</button>
    {error && <p role="alert">{error}{locked && <> <Link href="/upgrade">Ver acesso completo</Link></>}{empty && lessonHref && <> <Link href={lessonHref}>Revisar a aula</Link></>}</p>}
  </div>;
}

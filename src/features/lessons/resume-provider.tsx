"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { emptyResume, resumeSnapshotSchema, type ResumeData, type ResumeDraft, type ResumeScope, type ResumeSnapshot, type SaveResume } from "./resume-contracts";
import { readValidatedResponse } from "@/lib/api-response";
import { interactionKey, type InteractionState } from "./interaction-state";

type ResumeContext = { data: ResumeData; update: (change: Partial<ResumeData>) => void; setDraft: (draft: ResumeDraft | undefined, activityId: string) => void; setInteraction: (value: InteractionState) => void };
const Context = createContext<ResumeContext | null>(null);
export const useLessonResume = () => useContext(Context);

export function LessonResumeProvider({ scope, initial, children }: Readonly<{ scope: ResumeScope; initial: ResumeSnapshot | null; children: ReactNode }>) {
  const [data, setData] = useState<ResumeData>(() => initial?.data ?? emptyResume());
  const current = useRef(data), revision = useRef(initial?.revision ?? 0), acknowledged = useRef(JSON.stringify({ ...data, elapsedSeconds: 0 }));
  const pending = useRef<SaveResume | null>(null), saving = useRef(false), conflict = useRef(false);
  const mounted = useRef(false), flush = useRef<((keepalive?: boolean) => Promise<void>) | null>(null);
  const clock = useRef<{ seconds: number; since: number | null }>({ seconds: data.elapsedSeconds, since: null });
  const [status, setStatus] = useState<"new" | "saved" | "changed" | "saving" | "error" | "conflict">(initial ? "saved" : "new");
  const pinnedScope = useMemo(() => ({ trackId: scope.trackId, lessonId: scope.lessonId, version: scope.version, ...(scope.sessionId ? { sessionId: scope.sessionId } : {}) }), [scope.trackId, scope.lessonId, scope.version, scope.sessionId]);
  const elapsed = useCallback(() => Math.min(604800, Math.floor(clock.current.seconds + (clock.current.since === null ? 0 : (performance.now() - clock.current.since) / 1000))), []);
  const update = useCallback((change: Partial<ResumeData>) => {
    current.current = { ...current.current, ...change, elapsedSeconds: elapsed() };
    setData(current.current); setStatus(conflict.current ? "conflict" : "changed");
  }, [elapsed]);
  const setDraft = useCallback((draft: ResumeDraft | undefined, activityId: string) => update({ drafts: [...current.current.drafts.filter(entry => entry.activityId !== activityId), ...(draft ? [draft] : [])] }), [update]);
  const setInteraction = useCallback((value: InteractionState) => update({ interactions: [...(current.current.interactions ?? []).filter(entry => interactionKey(entry) !== interactionKey(value)), value] }), [update]);

  const save = useCallback(async (keepalive = true, force = false) => {
    if (saving.current || conflict.current) return;
    const snapshot = { ...current.current, elapsedSeconds: elapsed() };
    if (!force && !pending.current && JSON.stringify({ ...snapshot, elapsedSeconds: 0 }) === acknowledged.current) return;
    pending.current ??= { scope: pinnedScope, revision: revision.current, mutationId: crypto.randomUUID(), data: snapshot };
    saving.current = true; setStatus("saving");
    try {
      const response = await fetch("/api/lesson-resume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pending.current), keepalive });
      if (response.status === 409) { conflict.current = true; setStatus("conflict"); return; }
      if (!response.ok) throw new Error("Resume save failed");
      const result = await readValidatedResponse(response, resumeSnapshotSchema);
      revision.current = result.revision; acknowledged.current = JSON.stringify({ ...pending.current.data, elapsedSeconds: 0 }); pending.current = null;
      setStatus(JSON.stringify({ ...current.current, elapsedSeconds: 0 }) === acknowledged.current ? "saved" : "changed");
    } catch { setStatus("error"); }
    finally {
      saving.current = false;
      if (!mounted.current && !pending.current && !conflict.current && JSON.stringify({ ...current.current, elapsedSeconds: 0 }) !== acknowledged.current) queueMicrotask(() => { void flush.current?.(true); });
    }
  }, [pinnedScope, elapsed]);

  useEffect(() => {
    mounted.current = true; flush.current = save;
    const activeClock = clock.current;
    activeClock.since = document.visibilityState === "visible" ? performance.now() : null;
    const visibility = () => { clock.current.seconds = elapsed(); clock.current.since = document.visibilityState === "visible" ? performance.now() : null; if (document.visibilityState === "hidden") void save(true); };
    const leave = () => { void save(true); };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", leave);
    return () => {
      activeClock.seconds = elapsed(); activeClock.since = null; mounted.current = false;
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", leave);
      // Strict Mode remounts synchronously; real client navigation needs its final bounded save.
      queueMicrotask(() => { if (!mounted.current) void flush.current?.(true); });
    };
  }, [elapsed, save]);
  useEffect(() => {
    if (status !== "changed") return;
    const timer = setTimeout(() => { void save(); }, 500);
    return () => clearTimeout(timer);
  }, [data, status, save]);
  const context = useMemo(() => ({ data, update, setDraft, setInteraction }), [data, update, setDraft, setInteraction]);
  return <Context.Provider value={context}><div className="lesson-resume-controls">
    <p role="status" aria-live="polite">{status === "new" ? "Seu ponto será salvo durante o estudo" : status === "saved" ? "Ponto da aula salvo" : status === "saving" ? "Salvando ponto da aula…" : status === "changed" ? "Há mudanças para salvar" : status === "conflict" ? "Outra aba salvou um ponto mais recente. Recarregue a aula para continuar a partir dele." : "Não foi possível salvar. Mantenha esta página aberta e tente novamente."}</p>
    {status === "conflict" ? <button className="secondary-button" type="button" onClick={() => window.location.reload()}>Recarregar aula</button> : <button className="secondary-button" type="button" disabled={status === "saving"} onClick={() => void save(true, true)}>Salvar ponto da aula</button>}
  </div>{children}</Context.Provider>;
}

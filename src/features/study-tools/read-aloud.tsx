"use client";

import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
const supportedSnapshot = () => typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * Read a text aloud with the device's own voice (Web Speech API, ADR 0069). Nothing is sent to a server.
 * Shown only when the browser can speak; rendered after hydration to avoid a server/client mismatch.
 */
export function ReadAloudButton({ text = "", getText, label = "Ouvir" }: Readonly<{ text?: string; getText?: () => string; label?: string }>) {
  const supported = useSyncExternalStore(noopSubscribe, supportedSnapshot, () => false);
  const [state, setState] = useState<"idle" | "speaking" | "paused">("idle");
  useEffect(() => () => { if (supportedSnapshot()) window.speechSynthesis.cancel(); }, []);
  if (!supported || (!getText && !text.trim())) return null;

  function play() {
    if (state === "paused") { window.speechSynthesis.resume(); setState("speaking"); return; }
    window.speechSynthesis.cancel();
    const spoken = (getText ? getText() : text).replace(/\s+/g, " ").trim();
    if (!spoken) return;
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = "pt-BR";
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("pt"));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    window.speechSynthesis.speak(utterance);
    setState("speaking");
  }
  return (
    <span className="read-aloud" role="group" aria-label="Leitura em voz alta">
      {state === "speaking"
        ? <button type="button" className="read-aloud-button" onClick={() => { window.speechSynthesis.pause(); setState("paused"); }}><Pause aria-hidden="true" />Pausar</button>
        : <button type="button" className="read-aloud-button" onClick={play}>{state === "paused" ? <Play aria-hidden="true" /> : <Volume2 aria-hidden="true" />}{state === "paused" ? "Continuar" : label}</button>}
      {state !== "idle" ? <button type="button" className="read-aloud-button" aria-label="Parar leitura" onClick={() => { window.speechSynthesis.cancel(); setState("idle"); }}><Square aria-hidden="true" /></button> : null}
    </span>
  );
}

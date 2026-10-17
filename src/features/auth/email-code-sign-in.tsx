"use client";

import { useState, useSyncExternalStore } from "react";
import CodeSlots, { type CodeSlotsStatus } from "@/components/code-slots/code-slots";

const CODE_LENGTH = 6;
const noSubscription = () => () => {};

type Intent = "signin" | "signup" | "link";
export type SignupDetails = Readonly<{ name: string; minor: boolean; guardianAuthorized: boolean; acceptTerms: true }>;

/**
 * Passwordless e-mail step (ADR 0068): send a 6-digit code, then type it. Used for sign-in, sign-up
 * (with the sign-up details) and linking an e-mail to the signed-in profile.
 */
export function EmailCodeStep({ intent, callbackUrl, signup, submitLabel, onDone, onNoAccount, initialEmail = "" }: Readonly<{
  intent: Intent; callbackUrl: string; signup?: () => SignupDetails | null; submitLabel: string; initialEmail?: string;
  onDone?: (name: string) => void; onNoAccount?: (email: string) => void;
}>) {
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false);
  const [email, setEmail] = useState(initialEmail);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [status, setStatus] = useState<CodeSlotsStatus>("idle");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" | "info" } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (busy) return;
    const details = signup?.();
    if (signup && !details) return;
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/auth/email/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, intent, ...(details ? { signup: details } : {}) }) });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) { setMessage({ text: body.message ?? "Não foi possível enviar o código. Tente de novo.", tone: "error" }); return; }
      setSentTo(email.trim().toLowerCase()); setStatus("idle");
      setMessage({ text: "Enviamos um código de 6 dígitos. Confira a caixa de entrada e o spam.", tone: "info" });
    } catch {
      setMessage({ text: "Sem conexão com o servidor. Tente de novo.", tone: "error" });
    } finally { setBusy(false); }
  }

  async function verify(code: string) {
    if (!sentTo || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/auth/email/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: sentTo, code }) });
      const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string; name?: string };
      if (response.ok) {
        setStatus("success");
        setMessage({ text: intent === "link" ? "E-mail ligado ao seu perfil." : `Bem-vindo${body.name ? `, ${body.name}` : ""}!`, tone: "success" });
        if (onDone) onDone(body.name ?? ""); else setTimeout(() => window.location.assign(callbackUrl), 600);
        return;
      }
      if (body.code === "no_account" && onNoAccount) { onNoAccount(sentTo); return; }
      setStatus("error");
      setMessage({ text: body.message ?? "Código incorreto. Tente de novo.", tone: "error" });
      setTimeout(() => setStatus("idle"), 900);
    } catch {
      setMessage({ text: "Sem conexão com o servidor. Tente de novo.", tone: "error" });
    } finally { setBusy(false); }
  }

  return (
    <div className="email-code-step">
      {!sentTo ? (
        <form className="auth-form" onSubmit={event => { event.preventDefault(); void send(); }}>
          <label className="learning-field">
            E-mail
            <input type="email" required autoComplete="email" inputMode="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          <button className="primary-button" type="submit" disabled={busy}>{busy ? "Enviando…" : submitLabel}</button>
        </form>
      ) : (
        <div className="account-code">
          <p id="email-code-label">Código enviado para <strong>{sentTo}</strong></p>
          {mounted ? (
            <CodeSlots length={CODE_LENGTH} slotSize={44} gap={8} mask={false} autoFocus status={status} ariaLabel={`Código de ${CODE_LENGTH} dígitos enviado por e-mail`}
              onChange={() => { if (status === "error") setStatus("idle"); }} onComplete={code => void verify(code)} />
          ) : null}
          <p className="account-help"><button type="button" className="text-link" onClick={() => { setSentTo(null); setMessage(null); }}>Trocar e-mail</button> · <button type="button" className="text-link" disabled={busy} onClick={() => void send()}>Reenviar código</button></p>
        </div>
      )}
      <p className="account-code-message" role="status" data-tone={message?.tone}>{message?.text}</p>
    </div>
  );
}

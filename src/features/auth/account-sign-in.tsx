"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { UserRound } from "lucide-react";

import CodeSlots, { type CodeSlotsStatus } from "@/components/code-slots/code-slots";
import type { PublicAccount } from "./code-accounts";

const CODE_LENGTH = 6;
const noSubscription = () => () => {};
// Narrow phones get smaller slots; sizes must match .code-slots--compact in globals.css (caret math).
const COMPACT_QUERY = "(max-width: 420px)";
const subscribeCompact = (onChange: () => void) => {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** Profile picker + Code Slots. The slots render only on the client: their motion styles are applied
 *  through CSSOM, which our CSP allows, while server-rendered style attributes would be blocked.
 *  The input is never disabled while submitting: that would drop focus and swallow the next digits;
 *  submit() ignores overlapping requests instead. */
export function AccountSignIn({ accounts, callbackUrl }: Readonly<{ accounts: PublicAccount[]; callbackUrl: string }>) {
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false);
  const compact = useSyncExternalStore(subscribeCompact, () => window.matchMedia(COMPACT_QUERY).matches, () => false);
  const [selectedId, setSelectedId] = useState(accounts.length === 1 ? accounts[0]!.id : "");
  const [status, setStatus] = useState<CodeSlotsStatus>("idle");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selected = accounts.find((account) => account.id === selectedId);

  function fail(text: string) {
    setStatus("error");
    setMessage({ text, tone: "error" });
    clearTimeout(resetTimer.current);
    // The slots drain on "error"; return to idle so the next digits are accepted.
    resetTimer.current = setTimeout(() => setStatus("idle"), 900);
  }

  async function submit(code: string) {
    if (!selected || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selected.id, code })
      });
      if (response.ok) {
        setStatus("success");
        setMessage({ text: `Bem-vindo, ${selected.name}!`, tone: "success" });
        setTimeout(() => window.location.assign(callbackUrl), 700);
        return;
      }
      if (response.status === 429) {
        const body = (await response.json().catch(() => ({}))) as { retryAfter?: number };
        fail(`Muitas tentativas. Espere ${Math.max(1, Math.ceil((body.retryAfter ?? 60) / 60))} min e tente de novo.`);
      } else {
        fail("Código incorreto. Tente de novo.");
      }
    } catch {
      fail("Sem conexão com o servidor. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-sign-in">
      <fieldset className="account-picker">
        <legend>Quem vai estudar?</legend>
        {accounts.map((account) => (
          <button
            type="button"
            key={account.id}
            className="account-option"
            aria-pressed={account.id === selectedId}
            disabled={status === "success"}
            onClick={() => { setSelectedId(account.id); setStatus("idle"); setMessage(null); }}
          >
            <UserRound aria-hidden="true" />
            <span>{account.name}</span>
          </button>
        ))}
      </fieldset>

      {selected ? (
        <div className="account-code">
          <p id="account-code-label">Código de {selected.name}</p>
          {mounted ? (
            <CodeSlots
              key={selected.id}
              length={CODE_LENGTH}
              slotSize={compact ? 40 : 48}
              gap={compact ? 6 : 8}
              className={compact ? "code-slots--compact" : ""}
              mask
              autoFocus
              status={status}
              ariaLabel={`Código de acesso de ${selected.name}, ${CODE_LENGTH} dígitos`}
              onChange={() => { if (status === "error") setStatus("idle"); }}
              onComplete={(code) => void submit(code)}
            />
          ) : (
            <div className="code-slots-placeholder" aria-hidden="true">
              {Array.from({ length: CODE_LENGTH }, (_, index) => <span key={index} />)}
            </div>
          )}
          <p className="account-code-message" role="status" data-tone={message?.tone}>{message?.text}</p>
        </div>
      ) : null}
    </div>
  );
}

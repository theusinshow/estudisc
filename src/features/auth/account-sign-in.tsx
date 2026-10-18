"use client";

import { useRef, useState, useSyncExternalStore } from "react";

import CodeSlots, { type CodeSlotsStatus } from "@/components/code-slots/code-slots";
import { useCodeSlotSize } from "@/components/code-slots/use-code-slot-size";

/** Same slug rule as scripts/create-account.mjs: "Kauã" -> "account-kaua". Unknown profiles fail like a wrong code. */
export function profileAccountId(profile: string) {
  const value = profile.trim().toLowerCase();
  if (value.startsWith("account-")) return value;
  const slug = value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? `account-${slug}` : "";
}

const CODE_LENGTH = 6;
const noSubscription = () => () => {};

/** Profile name + Code Slots. Profile names are never listed to signed-out visitors: the student types their own.
 *  The slots render only on the client: their motion styles are applied
 *  through CSSOM, which our CSP allows, while server-rendered style attributes would be blocked.
 *  The input is never disabled while submitting: that would drop focus and swallow the next digits;
 *  submit() ignores overlapping requests instead. */
export function AccountSignIn({ callbackUrl }: Readonly<{ callbackUrl: string }>) {
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false);
  const slot = useCodeSlotSize();
  const [profile, setProfile] = useState("");
  const [status, setStatus] = useState<CodeSlotsStatus>("idle");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const accountId = profileAccountId(profile);

  function fail(text: string) {
    setStatus("error");
    setMessage({ text, tone: "error" });
    clearTimeout(resetTimer.current);
    // The slots drain on "error"; return to idle so the next digits are accepted.
    resetTimer.current = setTimeout(() => setStatus("idle"), 900);
  }

  async function submit(code: string) {
    if (!accountId || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, code })
      });
      if (response.ok) {
        setStatus("success");
        const body = (await response.json().catch(() => ({}))) as { name?: string };
        setMessage({ text: body.name ? `Bem-vindo, ${body.name}!` : "Bem-vindo!", tone: "success" });
        setTimeout(() => window.location.assign(callbackUrl), 700);
        return;
      }
      if (response.status === 429) {
        const body = (await response.json().catch(() => ({}))) as { retryAfter?: number };
        fail(`Muitas tentativas. Espere ${Math.max(1, Math.ceil((body.retryAfter ?? 60) / 60))} min e tente de novo.`);
      } else {
        fail("Nome do perfil ou código não confere. Tente de novo.");
      }
    } catch {
      fail("Sem conexão com o servidor. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-sign-in">
      <label className="learning-field account-profile">
        Nome do perfil
        <input
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={64}
          value={profile}
          disabled={status === "success"}
          aria-describedby="account-help"
          onChange={(event) => { setProfile(event.target.value); setStatus("idle"); setMessage(null); }}
        />
      </label>
      <p id="account-help" className="account-help">
        É o nome que está no seu perfil, como foi combinado com quem criou o acesso. O código de 6 dígitos também vem dessa pessoa.
        Não tem um código? <a href="/suporte?acesso=1">Peça acesso</a>.
      </p>

      {accountId ? (
        <div className="account-code">
          <p id="account-code-label">Código de 6 dígitos</p>
          {mounted ? (
            <CodeSlots
              length={CODE_LENGTH}
              slotSize={slot.slotSize}
              gap={slot.gap}
              className={slot.className}
              mask
              status={status}
              ariaLabel={`Código de acesso, ${CODE_LENGTH} dígitos`}
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

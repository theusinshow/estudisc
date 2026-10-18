"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "@/styles/access-offer.css";
import { useEffect, useState } from "react";
import { FREE_SAMPLE_LESSONS, LIFETIME_PRICE_BRL } from "./contracts";
import { AccessFacts } from "@/features/public-site/access-facts";

export type PaywallPanelProps = Readonly<{
  lockedLessonTitle?: string;
  initialStatus?: "idle" | "confirming" | "failure" | "sandbox";
  sandboxRef?: string;
}>;

function navigateTo(destination: string) {
  window.location.assign(destination);
}

const PAYMENT_POLL_LIMIT_MS = 10 * 60_000;

export function PaywallPanel({
  lockedLessonTitle,
  initialStatus = "idle",
  sandboxRef
}: PaywallPanelProps) {
  const [busy, setBusy] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(
    initialStatus === "confirming"
      ? {
          tone: "info",
          text: "Confirmando seu pagamento no Mercado Pago. Você pode fechar esta página: o acesso é liberado assim que o Pix ou o cartão for aprovado. Se já gerou um Pix, pague esse mesmo código; não gere outro."
        }
      : initialStatus === "failure"
        ? {
            tone: "error",
            text: "O pagamento não foi concluído no Mercado Pago. Você pode tentar novamente com Pix ou cartão."
          }
        : null
  );

  useEffect(() => {
    if (initialStatus !== "confirming") return;
    // Card approvals arrive in seconds, Pix can take minutes: check often at first, then slow down and stop.
    const startedAt = Date.now();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function check() {
      try {
        const res = await fetch("/api/payments/status", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { hasFullAccess?: boolean };
          if (data.hasFullAccess) {
            setFeedback({ tone: "success", text: "Pagamento confirmado! Redirecionando para o seu plano de estudos..." });
            navigateTo("/plan");
            return;
          }
        }
      } catch {
        // Ignore transient network errors while polling
      }
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      if (elapsed >= PAYMENT_POLL_LIMIT_MS) {
        setFeedback({
          tone: "info",
          text: "Ainda não recebemos a confirmação. Se você pagou com Pix, ela pode levar alguns minutos: volte mais tarde ou recarregue esta página. Não é preciso pagar de novo."
        });
        return;
      }
      timer = setTimeout(check, elapsed < 60_000 ? 3_000 : 10_000);
    }
    timer = setTimeout(check, 3_000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [initialStatus]);

  async function startCheckout() {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/payments/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = (await response.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        message?: string;
      };
      if (!response.ok || !data.checkoutUrl) {
        setFeedback({
          tone: "error",
          text: data.message ?? "Não foi possível abrir o checkout agora. Tente novamente."
        });
        return;
      }
      navigateTo(data.checkoutUrl);
    } catch {
      setFeedback({ tone: "error", text: "Sem conexão com o servidor. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  async function confirmSandbox() {
    if (busy || !sandboxRef) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/payments/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxConfirm: true, externalReference: sandboxRef })
      });
      if (response.ok) {
        setFeedback({
          tone: "success",
          text: "Acesso liberado em modo de teste! Redirecionando..."
        });
        navigateTo("/plan");
        return;
      }
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setFeedback({ tone: "error", text: data.message ?? "Falha ao confirmar pagamento de teste." });
    } catch {
      setFeedback({ tone: "error", text: "Erro de conexão ao confirmar sandbox." });
    } finally {
      setBusy(false);
    }
  }

  async function handleRedeemInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !inviteCode.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/payments/invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode.trim() })
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setFeedback({
          tone: "error",
          text: data.message ?? "Código de bolsa ou convite inválido."
        });
        return;
      }
      setFeedback({
        tone: "success",
        text: "Bolsa / convite ativado com sucesso! Todas as aulas e questões foram liberadas até a prova."
      });
      navigateTo("/plan");
    } catch {
      setFeedback({ tone: "error", text: "Sem conexão com o servidor. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="offer" aria-labelledby="paywall-title">
      <header className="offer-head">
        <h1 id="paywall-title">{lockedLessonTitle ? "Esta aula faz parte do acesso completo" : `Tudo do Estudisc por R$ ${LIFETIME_PRICE_BRL}, até a prova`}</h1>
        {lockedLessonTitle ? <p>“{lockedLessonTitle}” e todas as outras aulas ficam liberadas com o acesso completo.</p> : null}
      </header>
      {feedback ? <p role="status" className="offer-feedback" data-tone={feedback.tone}>{feedback.text}</p> : null}
      <div className="offer-price">
        <p className="offer-price-value"><strong>R$ {LIFETIME_PRICE_BRL}</strong><span>pagamento único</span></p>
        <AccessFacts />
        <button type="button" className="primary-action" disabled={busy} onClick={startCheckout}>
          {busy ? "Abrindo Mercado Pago…" : `Pagar R$ ${LIFETIME_PRICE_BRL} com Pix ou cartão`}
        </button>
        {initialStatus === "sandbox" && sandboxRef ? (
          <button type="button" className="secondary-action" disabled={busy} onClick={confirmSandbox}>
            Simular aprovação Pix (Sandbox Local)
          </button>
        ) : null}
      </div>
      <ul className="offer-fine">
        <li>O Estudisc não garante aprovação. Ele organiza o estudo; o resultado depende da dedicação de cada estudante.</li>
        <li>Menores de 18 anos usam o Estudisc com autorização do responsável, que faz a compra.</li>
      </ul>
      <section className="offer-block" aria-labelledby="free-samples-title">
        <h2 id="free-samples-title">Enquanto isso, grátis</h2>
        <p>Sua conta já abre uma aula completa de cada matéria:</p>
        <ul className="offer-free">
          {FREE_SAMPLE_LESSONS.map(sample => (
            <li key={sample.id}>
              <Link href={`/lessons/${sample.id}`} data-subject={sample.id.split("-")[0]}>
                <span>{sample.subject}</span><strong>{sample.title}</strong>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/assessments" className="offer-link">Fazer o simulado diagnóstico <span className="offer-link-end">grátis<ArrowRight aria-hidden="true" /></span></Link>
      </section>
      <details className="offer-invite">
        <summary>Tenho um código de bolsa ou convite</summary>
        <form onSubmit={handleRedeemInvite}>
          <label htmlFor="invite-code-input">Código de convite</label>
          <input
            id="invite-code-input"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Ex.: IFSC-BOLSA-2027"
            autoComplete="off"
          />
          <button type="submit" className="secondary-action" disabled={busy || !inviteCode.trim()}>
            Ativar código de bolsa
          </button>
        </form>
      </details>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FREE_SAMPLE_LESSONS, LIFETIME_PRICE_BRL } from "./contracts";
import { CONTENT_SUMMARY, formatCount } from "@/features/public-site/content-summary";

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
    <section className="foundation-panel content-panel accent-panel accent-learn" aria-labelledby="paywall-title">
      <p className="eyebrow">Acesso completo até a prova · Projeto social Estudisc</p>
      <h1 id="paywall-title">
        {lockedLessonTitle
          ? `Desbloqueie "${lockedLessonTitle}" e todo o curso IFSC`
          : `Desbloqueie todas as ${formatCount(CONTENT_SUMMARY.lessons)} aulas e ${formatCount(CONTENT_SUMMARY.lessonQuestions)} questões por R$ ${LIFETIME_PRICE_BRL}`}
      </h1>
      <p>
        Pagamento único de <strong>R$ {LIFETIME_PRICE_BRL},00</strong> via <strong>Pix ou cartão no Mercado Pago</strong>.
        Sem mensalidade e sem cobranças recorrentes: você paga uma única vez e tem acesso completo até o dia da prova (29/11/2026).
      </p>

      {feedback ? (
        <p role="status" className="learning-hint">
          {feedback.text}
        </p>
      ) : null}

      <div className="learning-controls">
        <button
          type="button"
          className="primary-action"
          disabled={busy}
          onClick={startCheckout}
        >
          {busy ? "Abrindo Mercado Pago..." : `Liberar acesso até a prova por R$ ${LIFETIME_PRICE_BRL} (Pix ou cartão)`}
        </button>
        {initialStatus === "sandbox" && sandboxRef ? (
          <button
            type="button"
            className="secondary-action"
            disabled={busy}
            onClick={confirmSandbox}
          >
            Simular aprovação Pix (Sandbox Local)
          </button>
        ) : null}
        <Link href="/assessments" className="secondary-action">
          Fazer Simulado Diagnóstico grátis
        </Link>
      </div>

      <section className="module-section" aria-labelledby="free-samples-title">
        <p className="technical-label">Degustação gratuita liberada</p>
        <h2 id="free-samples-title">Experimente grátis 1 aula interativa de cada matéria</h2>
        <p>
          Antes de decidir, você pode estudar gratuitamente nossas 4 aulas mais interativas do edital IFSC:
        </p>
        <ul className="concept-list">
          {FREE_SAMPLE_LESSONS.map((sample) => (
            <li key={sample.id}>
              <Link href={`/lessons/${sample.id}`}>
                <strong>
                  {sample.subject} · {sample.title}
                </strong>
                <span>{sample.interactiveFeature}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="module-section" aria-labelledby="invite-code-title">
        <p className="technical-label">Bolsa Social ou Turma Parceira</p>
        <h2 id="invite-code-title">Tem um código de bolsa ou convite?</h2>
        <form onSubmit={handleRedeemInvite} className="learning-controls">
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
      </section>
    </section>
  );
}

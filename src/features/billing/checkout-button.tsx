"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const messages: Record<string, string> = {
  auth_required: "Entre com sua conta Google para assinar.",
  already_active: "Seu acesso já está ativo.",
  provider_unavailable: "O Mercado Pago não respondeu agora. Tente de novo em alguns minutos.",
  billing_not_configured: "O pagamento ainda não está disponível."
};

/** Sends the customer to Mercado Pago's hosted checkout (card or Pix); access is released only by the webhook. */
export function CheckoutButton({ label }: Readonly<{ label: string }>) {
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; error?: string }>({ busy: false });
  async function start() {
    setState({ busy: true });
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      const body = await response.json().catch(() => ({})) as { checkoutUrl?: string; code?: string };
      if (response.status === 201 && body.checkoutUrl) { window.location.assign(body.checkoutUrl); return; }
      if (body.code === "already_active") { router.push("/"); return; }
      setState({ busy: false, error: messages[body.code ?? ""] ?? "Não foi possível iniciar o pagamento. Tente novamente." });
    } catch {
      setState({ busy: false, error: "Sem conexão. Verifique a internet e tente novamente." });
    }
  }
  return <div className="auth-actions">
    <button type="button" className="primary-action auth-primary-action" onClick={start} disabled={state.busy} aria-busy={state.busy}>
      {state.busy ? "Abrindo o Mercado Pago…" : label}
    </button>
    {state.error ? <p className="auth-error" role="alert"><span>{state.error}</span></p> : null}
  </div>;
}

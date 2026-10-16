"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Polls the server until the webhook has granted access; the provider redirect alone never unlocks the app. */
export function PaymentWaiter() {
  const router = useRouter();
  const [state, setState] = useState<"waiting" | "active" | "slow">("waiting");
  useEffect(() => {
    let attempts = 0, stopped = false;
    const check = async () => {
      if (stopped) return;
      attempts++;
      const active = await fetch("/api/billing/status", { cache: "no-store" }).then(r => r.json()).then((body: { active?: boolean }) => Boolean(body.active)).catch(() => false);
      if (active) { setState("active"); setTimeout(() => router.push("/"), 1500); return; }
      if (attempts >= 40) { setState("slow"); return; }
      setTimeout(check, 3000);
    };
    void check();
    return () => { stopped = true; };
  }, [router]);
  if (state === "active") return <p role="status"><strong>Acesso liberado!</strong> Levando você para o Estudisc…</p>;
  if (state === "slow") return <p role="status">O pagamento ainda está sendo confirmado. Pix costuma levar segundos; boleto e algumas análises de cartão podem levar mais. Você pode fechar esta página: o acesso é liberado automaticamente assim que o Mercado Pago confirmar. <a href="/assinar/obrigado">Verificar de novo</a></p>;
  return <p role="status" aria-live="polite">Confirmando seu pagamento com o Mercado Pago…</p>;
}

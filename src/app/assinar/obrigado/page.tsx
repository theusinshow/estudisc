import { notFound } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PaymentWaiter } from "@/features/billing/payment-waiter";
import { isPaidAccessEnabled } from "@/features/billing/paid-access";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagamento · Estudisc" };

export default function ThankYouPage() {
  if (!isPaidAccessEnabled(getServerEnv())) notFound();
  return <main className="auth-surface" aria-labelledby="thanks-title">
    <section className="auth-panel">
      <div className="auth-panel-header"><BrandLockup priority /><p className="eyebrow">Pagamento</p></div>
      <div className="auth-copy"><h1 id="thanks-title">Obrigado!</h1><PaymentWaiter /></div>
    </section>
  </main>;
}

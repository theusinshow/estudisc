import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { AccessDeniedError, getOwnerProfile } from "@/features/auth/owner";
import { BillingRepository } from "@/db/repositories/billing-repository";
import { CheckoutButton } from "@/features/billing/checkout-button";
import { isPaidAccessEnabled } from "@/features/billing/paid-access";
import { DEFAULT_PRODUCT_ID, findProduct, formatPrice } from "@/features/billing/products";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assinar · Estudisc" };

const included = [
  "132 aulas completas de Matemática, Língua Portuguesa, Ciências e Geografia e História, organizadas pelo edital do IFSC",
  "Mais de 1.100 questões com explicação e dicas",
  "Continue de onde parou: a próxima aula sempre pronta, sem montar plano",
  "Revisão espaçada e caderno de erros automáticos",
  "Funciona no celular"
];

export default async function SubscribePage({ searchParams }: Readonly<{ searchParams?: Promise<{ pagamento?: string }> }>) {
  if (!isPaidAccessEnabled(getServerEnv())) notFound();
  const product = findProduct(DEFAULT_PRODUCT_ID)!;
  const params = await searchParams;
  let ownerId: string | null = null;
  try { ownerId = (await getOwnerProfile()).ownerId; } catch (error) { if (!(error instanceof AccessDeniedError)) throw error; }
  const active = ownerId ? await new BillingRepository().hasAccess(ownerId, product.id) : false;
  const endsAt = new Date(product.accessEndsAt);
  endsAt.setTime(endsAt.getTime() - 1);

  return <main className="auth-surface" aria-labelledby="subscribe-title">
    <section className="auth-panel">
      <div className="auth-panel-header"><BrandLockup priority /><p className="eyebrow">Preparação IFSC 2027/1</p></div>
      <div className="auth-copy">
        <h1 id="subscribe-title">{formatPrice(product)} para estudar até o dia da prova</h1>
        <p>Pagamento único, sem mensalidade. Acesso completo até {endsAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>
      </div>
      {params?.pagamento === "falhou" ? <p className="auth-error" role="alert"><strong>Pagamento não concluído.</strong><span>Nenhum valor foi cobrado. Você pode tentar de novo.</span></p> : null}
      <ul className="subscribe-list">{included.map(item => <li key={item}>{item}</li>)}</ul>
      {active ? <p className="auth-copy"><strong>Seu acesso está ativo.</strong> <Link href="/">Ir para o Estudisc</Link></p>
        : ownerId ? <CheckoutButton label={`Pagar ${formatPrice(product)} com Pix ou cartão`} />
        : <div className="auth-actions"><Link className="primary-action auth-primary-action" href="/auth/signin?callbackUrl=/assinar">Entrar com Google para assinar</Link></div>}
      <p className="subscribe-legal">O pagamento é processado pelo Mercado Pago. A compra deve ser feita por maior de 18 anos ou com autorização do responsável pelo estudante. Você pode desistir em até 7 dias e receber o valor de volta. Leia os <Link href="/termos">termos de uso</Link> e a <Link href="/privacidade">política de privacidade</Link>.</p>
    </section>
  </main>;
}

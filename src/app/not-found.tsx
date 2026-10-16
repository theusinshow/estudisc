import Link from "next/link";
import { PublicLayout } from "@/features/public-site/public-layout";

export default function NotFound() {
  return (
    <PublicLayout labelledBy="not-found-title">
      <section className="public-hero">
        <p className="eyebrow">Erro 404</p>
        <h1 id="not-found-title">Esta página não existe</h1>
        <p>O endereço pode ter mudado ou estar digitado errado.</p>
        <div className="auth-actions">
          <Link href="/" className="primary-action">Ir para o início</Link>
          <Link href="/suporte" className="secondary-action">Falar com o suporte</Link>
        </div>
      </section>
    </PublicLayout>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLockup } from "@/components/brand/brand-lockup";

/** Shell for pages that visitors open without signing in (sales and legal pages). */
export function PublicLayout({ children, labelledBy }: Readonly<{ children: ReactNode; labelledBy: string }>) {
  return (
    <div className="public-site">
      <a className="skip-link" href="#public-main">Pular para o conteúdo</a>
      <header className="public-header">
        <Link href="/conheca" className="brand-link" aria-label="Estudisc — página inicial"><BrandLockup priority /></Link>
        <nav aria-label="Site">
          <Link href="/auth/signin" className="secondary-action">Entrar</Link>
        </nav>
      </header>
      <main id="public-main" className="public-main auth-surface" aria-labelledby={labelledBy}>{children}</main>
      <footer className="public-footer">
        <nav aria-label="Informações legais">
          <Link href="/conheca">Conheça</Link>
          <Link href="/termos">Termos de uso</Link>
          <Link href="/privacidade">Privacidade</Link>
        </nav>
        <p>O Estudisc é um material de estudo independente. Não tem vínculo com o Instituto Federal de Santa Catarina (IFSC) nem substitui o edital oficial.</p>
      </footer>
    </div>
  );
}

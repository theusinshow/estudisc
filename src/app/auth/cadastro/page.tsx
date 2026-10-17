import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { getDatabaseUrl } from "@/db/connection";
import { SignupForm } from "@/features/auth/email-account-forms";
import { getServerEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Criar conta — Estudisc" };
export const dynamic = "force-dynamic";

/** Self-service sign-up (ADR 0068), shown only with FEATURE_OPEN_SIGNUP. */
export default async function SignupPage({ searchParams }: Readonly<{ searchParams?: Promise<{ email?: string }> }>) {
  const env = getServerEnv();
  const open = Boolean(env.FEATURE_OPEN_SIGNUP && env.AUTH_SECRET && getDatabaseUrl());
  const email = (await searchParams)?.email?.slice(0, 254) ?? "";
  return (
    <main className="auth-surface" aria-labelledby="signup-title">
      <section className="auth-panel">
        <div className="auth-panel-header">
          <BrandLockup priority />
          <p className="auth-kicker">Criar conta</p>
        </div>
        <div className="auth-copy">
          <h1 id="signup-title">Crie sua conta</h1>
          <p>{open ? "Grátis para começar: você estuda as aulas de amostra e depois decide se quer o acesso completo. Não precisa de senha; mandamos um código para o seu e-mail." : "O cadastro aberto ainda não começou. Por enquanto, o acesso é por convite."}</p>
        </div>
        {open ? <SignupForm initialEmail={email} /> : <p><Link className="primary-action" href="/suporte?acesso=1">Peça acesso</Link></p>}
        <p className="auth-alternate">Já tem conta? <Link href="/auth/signin">Entrar</Link></p>
      </section>
      <nav className="auth-legal" aria-label="Informações legais">
        <Link href="/conheca">Conheça o Estudisc</Link>
        <Link href="/termos">Termos de uso</Link>
        <Link href="/privacidade">Privacidade</Link>
      </nav>
    </main>
  );
}

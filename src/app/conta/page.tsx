import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { getAccountStore } from "@/features/auth/accounts";
import { LinkEmailForm } from "@/features/auth/email-account-forms";
import { getOwnerProfile } from "@/features/auth/owner";
import { getServerEnv } from "@/lib/env";
import { getDatabaseUrl } from "@/db/connection";
import { isEmailDeliveryAvailable } from "@/features/auth/email-delivery";

export const metadata: Metadata = { title: "Minha conta — Estudisc" };
export const dynamic = "force-dynamic";

/** ADR 0068: who is signed in and, for code profiles, linking an e-mail to keep the same progress. */
export default async function AccountPage() {
  const profile = await getOwnerProfile();
  const emailReady = Boolean(getServerEnv().AUTH_SECRET && getDatabaseUrl() && isEmailDeliveryAvailable(getServerEnv()));
  const account = emailReady ? await getAccountStore().findById(profile.ownerId) : null;
  const email = account?.email ?? profile.email ?? null;
  return (
    <AppShell>
      <section className="foundation-panel content-panel" aria-labelledby="account-title">
        <p className="eyebrow">Conta</p>
        <h1 id="account-title">Minha conta</h1>
        <dl className="account-facts">
          <div><dt>Nome</dt><dd>{profile.name ?? account?.name ?? "Estudante"}</dd></div>
          <div><dt>E-mail</dt><dd>{email ?? "Nenhum e-mail ligado"}</dd></div>
        </dl>
        {!email && emailReady ? <>
          <h2>Ligar um e-mail</h2>
          <p>Com um e-mail ligado, você entra com um código enviado para ele, ou com o Google se for um Gmail, e continua com o mesmo progresso de sempre.</p>
          <LinkEmailForm />
        </> : null}
      </section>
    </AppShell>
  );
}

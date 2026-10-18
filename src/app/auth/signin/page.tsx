
import { BrandLockup } from "@/components/brand/brand-lockup";
import { getDatabaseUrl } from "@/db/connection";
import { EmailSignIn } from "@/features/auth/email-account-forms";
import { signIn } from "@/auth";
import { googleAuthorizationParams } from "@/features/auth/google-oauth";
import { getServerEnv } from "@/lib/env";
import Link from "next/link";
import "@/styles/auth-entry.css";
import { getAccountConfig, isHybridSignIn } from "@/features/auth/account-mode";
import { AccountSignIn } from "@/features/auth/account-sign-in";
import { GoogleSubmitButton } from "@/features/auth/google-submit-button";
import { isEmailDeliveryAvailable } from "@/features/auth/email-delivery";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
    perfil?: string;
  }>;
};

function normalizeCallbackUrl(value: string | undefined) {
  if (!value) {
    return "/";
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  const appUrl = getServerEnv().APP_URL;

  if (!appUrl) {
    return "/";
  }

  try {
    const parsedValue = new URL(value);
    const parsedAppUrl = new URL(appUrl);

    if (parsedValue.origin !== parsedAppUrl.origin) {
      return "/";
    }

    return `${parsedValue.pathname}${parsedValue.search}${parsedValue.hash}`;
  } catch {
    return "/";
  }
}

function getErrorMessage(error: string | undefined) {
  if (!error) {
    return null;
  }

  if (error === "AccessDenied") {
    return "Esta conta Google não está autorizada para este Estudisc.";
  }

  if (error === "OAuthSignin" || error === "OAuthCallback") {
    return "Não foi possível concluir o retorno do Google. Tente escolher a conta novamente.";
  }

  return "A autenticação não foi concluída. Tente novamente.";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = normalizeCallbackUrl(params?.callbackUrl);
  const errorMessage = getErrorMessage(params?.error);
  const env = getServerEnv();
  const accountConfig = getAccountConfig(env);
  const hybrid = isHybridSignIn(env);
  const withCallback = (extra: Record<string, string>) => `/auth/signin?${new URLSearchParams({ callbackUrl, ...extra })}`;
  // ADR 0068: e-mail sign-in needs the session secret, a database and a working e-mail sender.
  const emailSignIn = Boolean(env.AUTH_SECRET && getDatabaseUrl() && isEmailDeliveryAvailable(env));
  const signupOpen = emailSignIn && env.FEATURE_OPEN_SIGNUP;

  if (accountConfig && (!hybrid || params?.perfil === "1")) {
    // In hybrid mode this page is reached through "Tenho um perfil com código": the profile form only.
    const showEmail = emailSignIn && !hybrid;
    return (
      <main className="auth-surface auth-entry" aria-labelledby="signin-title">
        <section className="auth-panel">
          <div className="auth-panel-header">
            <BrandLockup />
          </div>
          <div className="auth-copy">
            <h1 id="signin-title">{showEmail ? "Entrar no Estudisc" : "Entre no seu perfil"}</h1>
            <p>{showEmail ? "Entre com o e-mail da sua conta. Mandamos um código de 6 dígitos; você não precisa de senha." : "Digite o nome do seu perfil e o código de 6 dígitos. Cada perfil guarda o próprio progresso."}</p>
          </div>
          {showEmail ? <EmailSignIn callbackUrl={callbackUrl} signupOpen={signupOpen} /> : null}
          {showEmail && signupOpen ? <p className="auth-alternate">Ainda não tem conta? <Link href="/auth/cadastro">Criar conta</Link></p> : null}
          {showEmail ? <h2 className="auth-divider">ou com perfil e código</h2> : null}
          <AccountSignIn callbackUrl={callbackUrl} />
          {hybrid ? <p className="auth-alternate"><Link href={withCallback({})}>Entrar com Google ou e-mail</Link></p> : null}
        </section>
        <LegalLinks />
      </main>
    );
  }

  async function signInWithGoogle() {
    "use server";

    await signIn(
      "google",
      { redirectTo: callbackUrl },
      googleAuthorizationParams
    );
  }

  return (
    <main className="auth-surface auth-entry" aria-labelledby="signin-title">
      <section className="auth-panel">
        <div className="auth-panel-header">
<BrandLockup />
          {env.FEATURE_PAID_ACCESS ? null : <p className="auth-kicker">Acesso do proprietário</p>}
        </div>

        <div className="auth-copy">
          <h1 id="signin-title">{env.FEATURE_PAID_ACCESS ? "Entrar ou criar conta" : "Escolha a conta Google"}</h1>
          <p>{env.FEATURE_PAID_ACCESS
            ? "É grátis e já libera uma aula de cada matéria."
            : "Use somente o e-mail autorizado para abrir seu ambiente pessoal de aprendizado."}</p>
        </div>

        {errorMessage ? (
          <p className="auth-error" role="alert">
            <strong>Acesso não concluído.</strong>
            <span>{errorMessage}</span>
            <span>Seu progresso continua salvo. Tente de novo pelo botão abaixo.</span>
          </p>
        ) : null}

        <form action={signInWithGoogle} className="auth-actions">
          <GoogleSubmitButton />
        </form>
        {emailSignIn ? <>
          <h2 className="auth-divider">ou com seu e-mail</h2>
          <EmailSignIn callbackUrl={callbackUrl} signupOpen={signupOpen} />
          <p className="auth-note">Mandamos um código de 6 dígitos. Sem senha.{signupOpen ? <> Primeira vez com e-mail? <Link href="/auth/cadastro">Criar conta</Link></> : null}</p>
        </> : null}

        <p className="auth-note">{env.FEATURE_PAID_ACCESS
          ? <>Ao continuar, você aceita os <Link href="/termos">Termos de uso</Link> e a <Link href="/privacidade">Política de privacidade</Link>.</>
          : "Somente e-mails autorizados entram."}</p>
        {hybrid ? <p className="auth-alternate"><Link className="text-button" href={withCallback({ perfil: "1" })}>Tenho um perfil com código</Link></p> : null}
      </section>
      <LegalLinks />
    </main>
  );
}

function LegalLinks() {
  return (
    <nav className="auth-legal" aria-label="Informações legais">
      <Link href="/conheca">Conheça</Link>
      <Link href="/termos">Termos de uso</Link>
      <Link href="/privacidade">Privacidade</Link>
    </nav>
  );
}


import { BrandLockup } from "@/components/brand/brand-lockup";
import { getDatabaseUrl } from "@/db/connection";
import { EmailSignIn } from "@/features/auth/email-account-forms";
import { signIn } from "@/auth";
import { googleAuthorizationParams } from "@/features/auth/google-oauth";
import { getServerEnv } from "@/lib/env";
import Link from "next/link";
import { getAccountConfig, isHybridSignIn } from "@/features/auth/account-mode";
import { AccountSignIn } from "@/features/auth/account-sign-in";
import { GoogleSubmitButton } from "@/features/auth/google-submit-button";
import { daysUntilExam, examCountdownLabel } from "@/features/public-site/countdown";
import { accessLastDay } from "@/features/public-site/content-summary";

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
  // ADR 0068: e-mail sign-in needs the session secret and a database.
  const emailSignIn = Boolean(env.AUTH_SECRET && getDatabaseUrl());
  const signupOpen = emailSignIn && env.FEATURE_OPEN_SIGNUP;

  if (accountConfig && (!hybrid || params?.perfil === "1")) {
    return (
      <main className="auth-surface" aria-labelledby="signin-title">
        <section className="auth-panel">
          <div className="auth-panel-header">
            <BrandLockup />
            <p className="auth-kicker">Entrar</p>
          </div>
          <div className="auth-copy">
            <h1 id="signin-title">{emailSignIn ? "Entrar no Estudisc" : "Entre no seu perfil"}</h1>
            <p>{emailSignIn ? "Entre com o e-mail da sua conta. Mandamos um código de 6 dígitos; você não precisa de senha." : "Digite o nome do seu perfil e o código de 6 dígitos. Cada perfil guarda o próprio progresso."}</p>
          </div>
          {emailSignIn ? <EmailSignIn callbackUrl={callbackUrl} signupOpen={signupOpen} /> : null}
          {signupOpen ? <p className="auth-alternate">Ainda não tem conta? <Link href="/auth/cadastro">Criar conta</Link></p> : null}
          {emailSignIn ? <h2 className="auth-subtitle">Ou entre com seu perfil e código</h2> : null}
          <AccountSignIn callbackUrl={callbackUrl} />
          {hybrid ? <p className="auth-alternate"><Link href={withCallback({})}>Entrar com conta Google</Link></p> : null}
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
    <main className="auth-surface auth-split" aria-labelledby="signin-title">
      <section className="auth-panel">
        <div className="auth-panel-header">
<BrandLockup />
          <p className="auth-kicker">{env.FEATURE_PAID_ACCESS ? "Entrar" : "Acesso do proprietário"}</p>
        </div>

        <div className="auth-copy">
          <h1 id="signin-title">{env.FEATURE_PAID_ACCESS ? "Entre com sua conta Google" : "Escolha a conta Google"}</h1>
          <p>{env.FEATURE_PAID_ACCESS
            ? "Crie sua conta gratuita ou entre para continuar estudando. Ao continuar, você aceita os termos de uso e a política de privacidade."
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
        {emailSignIn ? <><h2 className="auth-subtitle">Ou entre com seu e-mail</h2><EmailSignIn callbackUrl={callbackUrl} signupOpen={signupOpen} /></> : null}
        {signupOpen ? <p className="auth-alternate">Ainda não tem conta? <Link href="/auth/cadastro">Criar conta</Link></p> : null}

        <dl className="auth-status" aria-label="Regras de acesso">
          <div>
            <dt>Conta</dt>
            <dd>Google OAuth com seleção manual.</dd>
          </div>
          <div>
            <dt>Escopo</dt>
            <dd>{env.FEATURE_PAID_ACCESS ? "Qualquer conta Google; o acesso completo depende do pagamento." : "Somente e-mails permitidos."}</dd>
          </div>
          <div>
            <dt>Sessão</dt>
            <dd>Rotas privadas ficam bloqueadas sem login.</dd>
          </div>
        </dl>
        {hybrid ? <p className="auth-alternate"><Link href={withCallback({ perfil: "1" })}>Tenho um perfil com código</Link></p> : null}
      </section>
      <ExamCountdown />
      <LegalLinks />
    </main>
  );
}

/** Real countdown to the exam day (the last day of paid access); hidden once the date has passed. */
function ExamCountdown() {
  const days = daysUntilExam();
  if (days === null) return null;
  return (
    <aside className="auth-countdown" aria-label="Contagem para a prova">
      <p className="auth-countdown-days"><strong>{days}</strong> <span>{days === 1 ? "dia" : "dias"}</span></p>
      <p className="type-meta">{examCountdownLabel(days)} · {accessLastDay()}</p>
      <p>Ao entrar, o Hoje mostra a próxima aula e o que voltou para revisão.</p>
    </aside>
  );
}

function LegalLinks() {
  return (
    <nav className="auth-legal" aria-label="Informações legais">
      <Link href="/conheca">Conheça o Estudisc</Link>
      <Link href="/termos">Termos de uso</Link>
      <Link href="/privacidade">Privacidade</Link>
    </nav>
  );
}


import { BrandLockup } from "@/components/brand/brand-lockup";
import { signIn } from "@/auth";
import { googleAuthorizationParams } from "@/features/auth/google-oauth";
import { getServerEnv } from "@/lib/env";
import { getAccountConfig } from "@/features/auth/account-mode";
import { publicAccounts } from "@/features/auth/code-accounts";
import { AccountSignIn } from "@/features/auth/account-sign-in";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
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
    return "Esta conta Google não está autorizada para este Vecta.";
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
  const accountConfig = getAccountConfig(getServerEnv());

  if (accountConfig) {
    return (
      <main className="auth-surface" aria-labelledby="signin-title">
        <section className="auth-panel">
          <div className="auth-panel-header">
            <BrandLockup priority />
            <p className="eyebrow">Entrar</p>
          </div>
          <div className="auth-copy">
            <h1 id="signin-title">Escolha seu perfil</h1>
            <p>Cada perfil guarda o próprio progresso.</p>
          </div>
          <AccountSignIn accounts={publicAccounts(accountConfig.accounts)} callbackUrl={callbackUrl} />
        </section>
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
    <main className="auth-surface" aria-labelledby="signin-title">
      <section className="auth-panel">
        <div className="auth-panel-header">
<BrandLockup priority />
          <p className="eyebrow">Acesso do proprietário</p>
        </div>

        <div className="auth-copy">
          <h1 id="signin-title">Escolha a conta Google</h1>
          <p>Use somente o e-mail autorizado para abrir seu ambiente pessoal de aprendizado.</p>
        </div>

        {errorMessage ? (
          <p className="auth-error" role="alert">
            <strong>Acesso não concluído.</strong>
            <span>{errorMessage}</span>
          </p>
        ) : null}

        <form action={signInWithGoogle} className="auth-actions">
          <button type="submit" className="primary-action auth-primary-action">
            Continuar com Google
          </button>
        </form>

        <dl className="auth-status" aria-label="Regras de acesso">
          <div>
            <dt>Conta</dt>
            <dd>Google OAuth com seleção manual.</dd>
          </div>
          <div>
            <dt>Escopo</dt>
            <dd>Somente e-mails permitidos.</dd>
          </div>
          <div>
            <dt>Sessão</dt>
            <dd>Rotas privadas ficam bloqueadas sem login.</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

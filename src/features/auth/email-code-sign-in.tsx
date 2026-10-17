"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { requestEmailCodeAction, verifyEmailCodeAction, type EmailCodeFormState } from "./email-code-actions";

function SubmitButton({ idle, pending }: Readonly<{ idle: string; pending: string }>) {
  const status = useFormStatus();
  return <button type="submit" className="secondary-action email-code-submit" disabled={status.pending}>{status.pending ? pending : idle}</button>;
}

/** Email one-time code sign-in (ADR 0068): email → 6-digit code. Same account as Google for the same email. */
export function EmailCodeSignIn({ callbackUrl }: Readonly<{ callbackUrl: string }>) {
  const initial: EmailCodeFormState = { step: "email", email: "" };
  const [requested, requestAction] = useActionState(requestEmailCodeAction, initial);
  const [verified, verifyAction] = useActionState(verifyEmailCodeAction, initial);
  // A new code request clears the previous verification message.
  const codeError = verified.requestId && verified.requestId === requested.requestId ? verified.error : undefined;

  if (requested.step === "email") {
    return (
      <form action={requestAction} className="email-code-sign-in" noValidate>
        <label className="learning-field">
          Seu e-mail
          <input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} defaultValue={requested.email} aria-describedby="email-code-message" />
        </label>
        <SubmitButton idle="Receber código por e-mail" pending="Enviando código…" />
        <p id="email-code-message" className="account-code-message" role="status" data-tone={requested.error ? "error" : undefined}>{requested.error}</p>
      </form>
    );
  }

  return (
    <div className="email-code-sign-in">
      <form action={verifyAction} className="email-code-sign-in" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <input type="hidden" name="email" value={requested.email} />
        <input type="hidden" name="requestId" value={requested.requestId ?? ""} />
        <p className="account-help">{requested.notice}</p>
        <label className="learning-field">
          Código de 6 dígitos
          <input name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus aria-describedby="email-code-message" />
        </label>
        <SubmitButton idle="Entrar" pending="Conferindo…" />
        <p id="email-code-message" className="account-code-message" role="status" data-tone={codeError ? "error" : undefined}>{codeError}</p>
      </form>
      <form action={requestAction}>
        <input type="hidden" name="email" value={requested.email} />
        <p className="account-help">Não chegou? Veja a caixa de spam ou <button type="submit" className="text-action">envie um novo código</button>.</p>
      </form>
    </div>
  );
}

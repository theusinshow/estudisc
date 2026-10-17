"use client";

import { useFormStatus } from "react-dom";

/** Sign-in submit with a visible, announced pending state while the Google redirect starts. */
export function GoogleSubmitButton() {
  const { pending } = useFormStatus();
  return <>
    <button type="submit" className="primary-action auth-primary-action" disabled={pending} aria-describedby={pending ? "signin-pending" : undefined}>
      {pending ? "Abrindo o Google…" : "Continuar com Google"}
    </button>
    <span id="signin-pending" className="auth-pending" role="status">{pending ? "Redirecionando para a escolha da conta Google." : ""}</span>
  </>;
}

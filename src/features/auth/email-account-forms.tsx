"use client";

import { useState } from "react";
import Link from "next/link";
import { EmailCodeStep, type SignupDetails } from "./email-code-sign-in";

/** Sign-in with an e-mail that already has (or is linked to) an account. */
export function EmailSignIn({ callbackUrl, signupOpen }: Readonly<{ callbackUrl: string; signupOpen: boolean }>) {
  const [missing, setMissing] = useState<string | null>(null);
  if (missing) return (
    <div className="email-code-step" role="status">
      <p>Não encontramos uma conta com <strong>{missing}</strong>.</p>
      {signupOpen
        ? <Link className="primary-action" href={`/auth/cadastro?email=${encodeURIComponent(missing)}`}>Criar conta com esse e-mail</Link>
        : <p>Se você já estuda com um perfil e código, entre por ele e ligue o e-mail no seu perfil. Não tem acesso? <Link href="/suporte?acesso=1">Peça acesso</Link>.</p>}
      <button type="button" className="text-link" onClick={() => setMissing(null)}>Tentar outro e-mail</button>
    </div>
  );
  return <EmailCodeStep intent="signin" callbackUrl={callbackUrl} submitLabel="Receber código" onNoAccount={setMissing} />;
}

/** Self-service sign-up (ADR 0068): name, age band with the guardian declaration, terms, then the e-mail code. */
export function SignupForm({ initialEmail = "" }: Readonly<{ initialEmail?: string }>) {
  const [name, setName] = useState("");
  const [age, setAge] = useState<"adult" | "minor" | "">("");
  const [guardian, setGuardian] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");

  function details(): SignupDetails | null {
    if (name.trim().length < 2) { setError("Digite seu nome."); return null; }
    if (!age) { setError("Diga se você tem 18 anos ou mais."); return null; }
    if (age === "minor" && !guardian) { setError("Para menores de 18, confirme que seu responsável autorizou."); return null; }
    if (!terms) { setError("Para criar a conta, aceite os termos de uso e a política de privacidade."); return null; }
    setError("");
    return { name: name.trim(), minor: age === "minor", guardianAuthorized: age === "minor" && guardian, acceptTerms: true };
  }

  return (
    <div className="signup-form">
      <label className="learning-field">Seu nome<input autoComplete="name" maxLength={60} value={name} onChange={event => setName(event.target.value)} /></label>
      <fieldset className="signup-age">
        <legend>Idade</legend>
        <label><input type="radio" name="age" checked={age === "adult"} onChange={() => setAge("adult")} /> Tenho 18 anos ou mais</label>
        <label><input type="radio" name="age" checked={age === "minor"} onChange={() => setAge("minor")} /> Tenho menos de 18 anos</label>
      </fieldset>
      {age === "minor" && <label className="signup-check"><input type="checkbox" checked={guardian} onChange={event => setGuardian(event.target.checked)} /><span>Meu pai, mãe ou responsável sabe que vou usar o Estudisc e autorizou.</span></label>}
      <label className="signup-check"><input type="checkbox" checked={terms} onChange={event => setTerms(event.target.checked)} /><span>Li e aceito os <Link href="/termos" target="_blank">termos de uso</Link> e a <Link href="/privacidade" target="_blank">política de privacidade</Link>.</span></label>
      {error && <p className="account-code-message" data-tone="error" role="alert">{error}</p>}
      <EmailCodeStep intent="signup" callbackUrl="/" signup={details} initialEmail={initialEmail} submitLabel="Criar conta e receber código" />
    </div>
  );
}

/** On the profile: link an e-mail to the current profile so it can sign in by e-mail or Google later. */
export function LinkEmailForm() {
  const [done, setDone] = useState(false);
  if (done) return <p className="account-code-message" data-tone="success" role="status">Pronto! Agora você também pode entrar com esse e-mail.</p>;
  return <EmailCodeStep intent="link" callbackUrl="/" submitLabel="Enviar código para ligar o e-mail" onDone={() => setDone(true)} />;
}

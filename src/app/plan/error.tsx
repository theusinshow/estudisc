"use client";

import Link from "next/link";

export default function PlanError({ reset }: Readonly<{ reset: () => void }>) {
  return <main id="main-content" className="main-surface"><section className="foundation-panel content-panel">
    <h1>Não foi possível carregar seu plano</h1>
    <p role="alert">Suas sessões salvas foram preservadas. Tente carregar a página novamente.</p>
    <button type="button" onClick={reset}>Tentar novamente</button><Link href="/">Voltar para Hoje</Link>
  </section></main>;
}

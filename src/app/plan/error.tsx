"use client";

import Link from "next/link";

export default function PlanError({ retry }: Readonly<{ retry: () => void }>) {
  return <main id="main-content" className="main-surface"><section className="foundation-panel content-panel">
    <h1>Não foi possível carregar seu plano</h1>
    <p role="alert">Suas sessões salvas foram preservadas. Tente carregar a página novamente.</p>
    <div className="learning-controls"><button type="button" className="primary-button" onClick={retry}>Tentar novamente</button><Link className="secondary-button" href="/">Voltar para Hoje</Link></div>
  </section></main>;
}

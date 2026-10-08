"use client";
import Link from "next/link";
export default function ApplicationError({retry}:{error:Error&{digest?:string};retry:()=>void}){
 return <main id="main-content" className="main-surface"><section className="foundation-panel content-panel">
  <h1>Não foi possível carregar esta página</h1>
  <p role="alert">Os dados estão indisponíveis no momento. Você pode tentar carregar novamente.</p>
  <div className="learning-controls"><button type="button" className="primary-button" onClick={retry}>Tentar novamente</button><Link className="secondary-button" href="/">Voltar para Hoje</Link></div>
 </section></main>;
}

"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Replays a CSS animation by remounting its subject. */
function Replay({ code, title, note, children }: Readonly<{ code: string; title: string; note?: string; children: (run: number) => ReactNode }>) {
  const [run, setRun] = useState(1);
  return (
    <article className="dc-item" id={`item-${code}`} aria-labelledby={`item-${code}-title`}>
      <header className="dc-item-head"><span className="dc-code">{code}</span><h3 id={`item-${code}-title`}>{title}</h3></header>
      {note ? <p className="dc-note">{note}</p> : null}
      <div className="dc-item-body dc-motion-stage" key={run}>{children(run)}</div>
      <button type="button" className="text-button" onClick={() => setRun((value) => value + 1)}><RotateCcw aria-hidden="true" /> Repetir</button>
    </article>
  );
}

function Confetti() {
  return <span className="dc-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} data-i={index} />)}</span>;
}

function CountUp({ to }: Readonly<{ to: number }>) {
  return <span className="dc-countup" data-to={to} aria-label={String(to)}>{to}</span>;
}

function PageTransitionDemo() {
  const [page, setPage] = useState(0);
  const pages = ["Hoje", "Aula: Porcentagem", "Resultado"];
  function go() {
    const next = () => setPage((value) => (value + 1) % pages.length);
    const doc = document as Document & { startViewTransition?: (callback: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) doc.startViewTransition(next);
    else next();
  }
  return (
    <div className="dc-vt">
      <div className="dc-vt-page" data-page={page}><p className="type-meta">Tela {page + 1} de 3</p><h4>{pages[page]}</h4></div>
      <button type="button" className="secondary-button" onClick={go}>Ir para a próxima tela</button>
    </div>
  );
}

export function MotionBlock() {
  return (
    <section className="dc-block" id="movimento" aria-labelledby="movimento-title">
      <h2 id="movimento-title" className="type-title"><span className="dc-block-number">6</span>Movimento</h2>
      <p className="dc-note">Com “reduzir movimento” ligado no sistema, nada aqui anima.</p>
      <div className="dc-grid">
        <Replay code="6.1" title="Botão esmaga ao pressionar" note="Pressione e segure o botão.">
          {() => <button type="button" className="primary-button dc-squish">Pressione</button>}
        </Replay>
        <Replay code="6.2" title="Alternativa dá um “pop”" note="Ao marcar uma alternativa.">
          {() => <span className="dc-answer dc-anim-pop" data-state="selected"><span className="dc-letter">B</span><span className="dc-answer-text">29 em cada 100</span></span>}
        </Replay>
        <Replay code="6.3" title="Acerto: pulo + confete">
          {() => <span className="dc-celebrate"><span className="dc-stamp dc-anim-bounce" data-result="correct"><Check aria-hidden="true" />Acertou!</span><Confetti /></span>}
        </Replay>
        <Replay code="6.4" title="Erro: tremida curta" note="Curta e sem som; não pune.">
          {() => <span className="dc-stamp dc-anim-shake" data-result="wrong"><X aria-hidden="true" />Ainda não</span>}
        </Replay>
        <Replay code="6.5" title="Card levanta" note="Passe o mouse ou toque no card.">
          {() => <article className="dc-card dc-lift" data-variant="a" data-subject="science" tabIndex={0}><p className="type-meta">Ciências</p><h4>Movimento</h4></article>}
        </Replay>
        <Replay code="6.6" title="Progresso enche com mola + número sobe">
          {() => <div className="dc-stack"><span className="dc-progress dc-progress-lg"><span className="dc-progress-fill dc-anim-fill" data-value={70} /></span><p className="dc-big-number"><CountUp to={70} />%</p></div>}
        </Replay>
        <Replay code="6.7" title="Entrada de tela" note="Conteúdo sobe e aparece ao abrir uma página.">
          {() => <div className="dc-stack dc-anim-enter"><h4>Título da tela</h4><p>O conteúdo entra em sequência.</p><span className="secondary-button">Ação</span></div>}
        </Replay>
        <article className="dc-item" id="item-6.8" aria-labelledby="item-6.8-title">
          <header className="dc-item-head"><span className="dc-code">6.8</span><h3 id="item-6.8-title">Troca de tela (View Transitions)</h3></header>
          <p className="dc-note">Desvanece/desliza entre páginas; em navegadores sem suporte, troca direto.</p>
          <div className="dc-item-body"><PageTransitionDemo /></div>
        </article>
      </div>
    </section>
  );
}

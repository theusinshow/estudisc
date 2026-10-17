"use client";

import { MotionConfig } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

import { CardToLesson, ConceptMap, ExamCountdown, FocusTimer, GoalTower } from "./journey";
import { NumberLine, PercentExplorer } from "./math";
import { ClassifyPieces, ConfidenceCheck, OrderSteps, ReviewDeck } from "./practice";
import { DraggableTimeline, EvidenceHighlighter } from "./reading";

const noopSubscribe = () => () => {};

function Idea({ code, title, note, wide, children }: Readonly<{ code: string; title: string; note: string; wide?: boolean; children: ReactNode }>) {
  return (
    <article className={wide ? "dc-item dc-item-wide" : "dc-item"} id={`item-${code}`} aria-labelledby={`item-${code}-title`}>
      <header className="dc-item-head"><span className="dc-code">{code}</span><h3 id={`item-${code}-title`}>{title}</h3></header>
      <p className="dc-note">{note}</p>
      {children}
    </article>
  );
}

function Group({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return <><h3 className="ix-group">{title}</h3><div className="dc-grid">{children}</div></>;
}

/** Block 8: interactive learning patterns. Rendered after hydration only (Motion inline styles vs strict CSP). */
export function IdeasBlock() {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <section className="dc-block" id="estudar-mexendo" aria-labelledby="estudar-mexendo-title">
      <h2 id="estudar-mexendo-title" className="type-title"><span className="dc-block-number">8</span>Estudar mexendo</h2>
      <p className="dc-note">Cada movimento ensina algo. Tudo que se arrasta também funciona com toque simples e teclado.</p>
      {!hydrated ? <p className="dc-note" aria-busy="true">Carregando…</p> : (
        <MotionConfig reducedMotion="user">
          <Group title="Explorar">
            <Idea code="8.1" title="Explorador de porcentagem" note="Arraste e veja a grade, a fração e o decimal mudarem juntos."><PercentExplorer /></Idea>
            <Idea code="8.2" title="Reta numérica" note="Arraste (ou use as setas) até 3/4; o marcador encaixa."><NumberLine /></Idea>
          </Group>
          <Group title="Praticar de outros jeitos">
            <Idea code="8.3" title="Ordenar os passos" note="Arraste pela alça ou use as setas."><OrderSteps /></Idea>
            <Idea code="8.4" title="Classificar" note="Toque na peça e depois na caixa; ela voa até lá."><ClassifyPieces /></Idea>
            <Idea code="8.5" title="Revisão em cartões" note="Toque para virar; deslize para a direita (Sei) ou esquerda (Rever)."><ReviewDeck /></Idea>
            <Idea code="8.6" title="Confiança antes de conferir" note="Errar com certeza revela um ponto cego, que vai para a revisão prioritária."><ConfidenceCheck /></Idea>
          </Group>
          <Group title="Ler e situar">
            <Idea code="8.7" title="Marca-texto de evidência" note="Toque nas palavras que provam a resposta."><EvidenceHighlighter /></Idea>
            <Idea code="8.8" title="Linha do tempo" note="Arraste a faixa; o fato no centro aparece embaixo."><DraggableTimeline /></Idea>
          </Group>
          <Group title="Jornada">
            <Idea code="8.9" title="Mapa de conceitos que acende" note="Dominar um conceito desenha a ligação até o próximo."><ConceptMap /></Idea>
            <Idea code="8.10" title="Card que vira aula" note="O card adesivo se expande e vira o cabeçalho da aula."><CardToLesson /></Idea>
            <Idea code="8.11" title="Meta do dia em torre" note="Cada tarefa feita cai como um bloco da cor da matéria."><GoalTower /></Idea>
            <Idea code="8.12" title="Modo foco" note="Anel da sessão e uma pausa que respira."><FocusTimer /></Idea>
            <Idea code="8.13" title="Contagem para a prova" note="Placar que vira a cada segundo." wide><ExamCountdown /></Idea>
          </Group>
        </MotionConfig>
      )}
    </section>
  );
}

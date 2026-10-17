"use client";

import { MotionConfig } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

import { ExamPace, FriendChallenge, HapticsDemo, NightPreview, StickerAlbum, WeeklyRecap } from "./app";
import { EquationBalance, LinearGraph, SentenceBuilder, TimeZones } from "./explore";
import { ReadAloud, Scratchpad, TrapExplained } from "./question-tools";

const noopSubscribe = () => () => {};

function Idea({ code, title, note, where, children }: Readonly<{ code: string; title: string; note: string; where: string; children: ReactNode }>) {
  return (
    <article className="dc-item" id={`item-${code}`} aria-labelledby={`item-${code}-title`}>
      <header className="dc-item-head"><span className="dc-code">{code}</span><h3 id={`item-${code}-title`}>{title}</h3></header>
      <p className="dc-note">{note}</p>
      <p className="ix2-where">Onde entra: {where}</p>
      {children}
    </article>
  );
}

/** Block 9: question/lesson tools vs app-level pieces. Rendered after hydration only (strict CSP). */
export function IdeasTwoBlock() {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <section className="dc-block" id="mais-ideias" aria-labelledby="mais-ideias-title">
      <h2 id="mais-ideias-title" className="type-title"><span className="dc-block-number">9</span>Mais ideias</h2>
      <p className="dc-note">Dividido pelo lugar onde cada peça mora. As da aula viram tipos de atividade (formato no Pack, corretor, evidência); as do app mexem nas telas.</p>
      {!hydrated ? <p className="dc-note" aria-busy="true">Carregando…</p> : (
        <MotionConfig reducedMotion="user">
          <h3 className="ix-group">Dentro da aula e da questão</h3>
          <div className="dc-grid">
            <Idea code="9.1" title="Rascunho na tela" note="Lápis, borracha, 3 tintas, desfazer." where="ao lado de toda questão e simulado"><Scratchpad /></Idea>
            <Idea code="9.3" title="Por que essa alternativa engana" note="A alternativa errada abre e mostra a armadilha." where="questões (usa os distratores que já existem)"><TrapExplained /></Idea>
            <Idea code="9.4" title="Balança de equações" note="Mude x ou tire o mesmo peso dos dois lados." where="aulas de equação do 1º grau"><EquationBalance /></Idea>
            <Idea code="9.5" title="Gráfico da função afim" note="Arraste os pontos (ou foque e use as setas)." where="aulas de função afim"><LinearGraph /></Idea>
            <Idea code="9.6" title="Fusos horários com o Sol" note="Arraste o Sol; cada cidade mostra a hora e se é dia." where="aula de fusos horários (GH)"><TimeZones /></Idea>
            <Idea code="9.7" title="Montar a frase" note="Toque nas palavras na ordem; elas voam para a linha." where="aulas de sintaxe (Português)"><SentenceBuilder /></Idea>
            <Idea code="9.11" title="Leitura em voz alta" note="A palavra lida acende; velocidade e tamanho do texto." where="aulas e enunciados longos"><ReadAloud /></Idea>
          </div>
          <h3 className="ix-group">No app, fora da aula</h3>
          <div className="dc-grid">
            <Idea code="9.2" title="Ritmo de prova" note="Compara seu ritmo com o tempo médio do IFSC; folha de respostas que sobe." where="Simulados e provas anteriores"><ExamPace /></Idea>
            <Idea code="9.8" title="Resumo da semana" note="Stories com o que você aprendeu e imagem pronta para postar." where="Hoje (domingo) e Progresso"><WeeklyRecap /></Idea>
            <Idea code="9.9" title="Álbum de adesivos" note="Cada adesivo vem de algo real que você aprendeu." where="Conquistas"><StickerAlbum /></Idea>
            <Idea code="9.10" title="Desafio com amigos" note="Mesmas 5 questões; compara só no fim, sem ranking público." where="Hoje e Simulados"><FriendChallenge /></Idea>
            <Idea code="9.12" title="Modo noite" note="Os mesmos componentes com cores escuras." where="Perfil (preferência)"><NightPreview /></Idea>
            <Idea code="9.13" title="Vibração leve" note="Só no acerto e na entrega; Android." where="questões e simulados (preferência)"><HapticsDemo /></Idea>
          </div>
        </MotionConfig>
      )}
    </section>
  );
}

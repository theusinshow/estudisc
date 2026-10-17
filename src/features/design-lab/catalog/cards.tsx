import { ArrowRight, BookOpen } from "lucide-react";

import { CatalogBlock, CatalogItem } from "./item";

const SAMPLE = [
  { subject: "mathematics", name: "Matemática", lesson: "Porcentagem", progress: 40 },
  { subject: "science", name: "Ciências", lesson: "Movimento", progress: 75 }
] as const;

function Progress({ value }: Readonly<{ value: number }>) {
  return <span className="dc-progress" role="img" aria-label={`${value}% concluído`}><span className="dc-progress-fill" data-value={Math.round(value / 5) * 5} /></span>;
}

export function CardsBlock() {
  return (
    <CatalogBlock id="cards" number={3} title="Cards">
      <CatalogItem code="3-A" title="Contorno + sombra (atual reforçado)">
        <div className="dc-cards">
          {SAMPLE.map((s) => (
            <article key={s.subject} className="dc-card" data-variant="a" data-subject={s.subject}>
              <p className="type-meta">{s.name}</p><h4>{s.lesson}</h4><p>Aula 3 de 12 · 8 min</p><Progress value={s.progress} />
            </article>
          ))}
        </div>
      </CatalogItem>
      <CatalogItem code="3-B" title="3D com aba lateral" note="Inspirado na 1ª referência: volume à direita com o nome da matéria na vertical.">
        <div className="dc-cards">
          {SAMPLE.map((s) => (
            <article key={s.subject} className="dc-card" data-variant="b" data-subject={s.subject}>
              <div className="dc-card-face"><p className="type-meta">Aula 3 de 12</p><h4>{s.lesson}</h4><Progress value={s.progress} /></div>
              <span className="dc-card-tab" aria-hidden="true">{s.name}</span>
            </article>
          ))}
        </div>
      </CatalogItem>
      <CatalogItem code="3-C" title="Adesivo" note="Levemente inclinado, etiqueta da matéria no canto; endireita e sobe no hover/toque.">
        <div className="dc-cards">
          {SAMPLE.map((s) => (
            <article key={s.subject} className="dc-card" data-variant="c" data-subject={s.subject} tabIndex={0}>
              <span className="dc-sticker">{s.name}</span><h4>{s.lesson}</h4><p>Aula 3 de 12 · 8 min</p><Progress value={s.progress} />
            </article>
          ))}
        </div>
      </CatalogItem>
      <CatalogItem code="3-D" title="Bloco grande" note="Cor chapada, título enorme, espaço para ilustração e ação direta.">
        <div className="dc-cards">
          {SAMPLE.map((s) => (
            <article key={s.subject} className="dc-card" data-variant="d" data-subject={s.subject}>
              <span className="dc-card-art" aria-hidden="true"><BookOpen /></span>
              <p className="type-meta">{s.name}</p><h4>{s.lesson}</h4><Progress value={s.progress} />
              <span className="dc-card-cta">Continuar <ArrowRight aria-hidden="true" /></span>
            </article>
          ))}
        </div>
      </CatalogItem>
      <CatalogItem code="3.5" title="Card de ação do Hoje" note="Um motivo, um destino.">
        <article className="dc-card dc-today" data-variant="a" data-subject="portuguese">
          <p className="type-meta">Próximo passo</p>
          <h4>Continue “Inferência e leitura de contexto”</h4>
          <p>Você parou no passo 4 de 9. Faltam cerca de 6 minutos.</p>
          <span className="primary-button">Continuar <ArrowRight aria-hidden="true" /></span>
        </article>
      </CatalogItem>
    </CatalogBlock>
  );
}

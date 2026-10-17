import { ArrowRight, Clock } from "lucide-react";

import { CatalogBlock, CatalogItem } from "./item";

const SAMPLE = [
  { subject: "mathematics", name: "Matemática", lesson: "Porcentagem", done: 4, total: 12 },
  { subject: "science", name: "Ciências", lesson: "Movimento", done: 9, total: 12 },
  { subject: "portuguese", name: "Português", lesson: "Inferência e leitura de contexto", done: 1, total: 9 },
  { subject: "history-geography", name: "Geografia e História", lesson: "Fusos horários", done: 12, total: 12 }
] as const;

export function Progress({ done, total, size = "md" }: Readonly<{ done: number; total: number; size?: "md" | "lg" }>) {
  const value = Math.round((done / total) * 20) * 5;
  return <span className="dc-progress" data-size={size} role="img" aria-label={`${done} de ${total}`}><span className="dc-progress-fill" data-value={value} /></span>;
}

export function CardsBlock() {
  return (
    <CatalogBlock id="cards" number={3} title="Cards">
      <CatalogItem code="3.1" title="Card de aula · adesivo (escolhido)" note="Etiqueta da matéria colada no canto; levemente inclinado, endireita e sobe no hover/toque.">
        <div className="dc-cards">
          {SAMPLE.map((s) => (
            <article key={s.subject} className="dc-card" data-variant="c" data-subject={s.subject} tabIndex={0}>
              <span className="dc-sticker">{s.name}</span>
              <h4>{s.lesson}</h4>
              <p className="dc-card-meta">{s.done === s.total ? "Concluída" : `Aula ${s.done + 1} de ${s.total}`}</p>
              <Progress done={s.done} total={s.total} />
            </article>
          ))}
        </div>
      </CatalogItem>
      <CatalogItem code="3.2" title="Card de ação do Hoje" note="Um motivo, um destino: o que fazer agora, quanto falta e um botão.">
        <article className="dc-today-card" data-subject="portuguese">
          <div className="dc-today-top"><span className="dc-sticker">Português</span><span className="dc-time-chip"><Clock aria-hidden="true" />6 min</span></div>
          <p className="type-meta">Próximo passo</p>
          <h4>Inferência e leitura de contexto</h4>
          <p>Você parou no passo 4 de 9.</p>
          <div className="dc-today-progress"><Progress done={4} total={9} size="lg" /><span>4/9</span></div>
          <button type="button" className="primary-button dc-today-cta">Continuar de onde parei <ArrowRight aria-hidden="true" /></button>
        </article>
      </CatalogItem>
    </CatalogBlock>
  );
}

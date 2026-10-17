import { Check, ChevronRight, Lightbulb, X } from "lucide-react";

import { CatalogBlock, CatalogItem } from "./item";

const CHOICES = [
  { letter: "A", text: "29 bilhetes, qualquer que fosse o total.", state: "idle" },
  { letter: "B", text: "29 em cada 100 bilhetes pedem revisão.", state: "correct" },
  { letter: "C", text: "29 vezes o total de bilhetes.", state: "wrong" },
  { letter: "D", text: "A parcela que não pediu revisão.", state: "selected" }
] as const;

const STATE_LABEL = { idle: "", selected: "marcada", correct: "certa", wrong: "errada" } as const;

export function AnswersBlock() {
  return (
    <CatalogBlock id="questao" number={4} title="Questão e resposta">
      <CatalogItem code="4.1" title="Alternativas · tecla 3D (escolhida)" note="Afunda ao tocar. Estados: A normal, B certa, C errada, D marcada.">
        <ul className="dc-answers" data-variant="key">
          {CHOICES.map((choice) => (
            <li key={choice.letter} className="dc-answer" data-state={choice.state}>
              <span className="dc-letter" aria-hidden="true">{choice.letter}</span>
              <span className="dc-answer-text">{choice.text}</span>
              {choice.state === "correct" ? <Check className="dc-answer-icon" aria-hidden="true" /> : null}
              {choice.state === "wrong" ? <X className="dc-answer-icon" aria-hidden="true" /> : null}
              {STATE_LABEL[choice.state] ? <span className="visually-hidden">({STATE_LABEL[choice.state]})</span> : null}
            </li>
          ))}
        </ul>
      </CatalogItem>
      <CatalogItem code="4.2" title="Resultado: carimbo">
        <div className="dc-result">
          <span className="dc-stamp" data-result="correct"><Check aria-hidden="true" />Acertou!</span>
          <span className="dc-stamp" data-result="wrong"><X aria-hidden="true" />Ainda não</span>
        </div>
      </CatalogItem>
      <CatalogItem code="4.3" title="Resultado: faixa inferior" note="Sobe da base da tela com o resultado, a explicação e o próximo passo.">
        <div className="dc-banners">
          <section className="dc-banner" data-result="correct" aria-label="Exemplo de acerto">
            <span className="dc-banner-icon"><Check aria-hidden="true" /></span>
            <div className="dc-banner-copy"><strong>Muito bem!</strong><p>29% significa 29 em cada 100.</p></div>
            <button type="button" className="dc-banner-button">Continuar <ChevronRight aria-hidden="true" /></button>
          </section>
          <section className="dc-banner" data-result="wrong" aria-label="Exemplo de erro">
            <span className="dc-banner-icon"><X aria-hidden="true" /></span>
            <div className="dc-banner-copy"><strong>Ainda não</strong><p>“Vezes o total” seria multiplicar; porcentagem é uma parte de 100.</p></div>
            <button type="button" className="dc-banner-button">Tentar de novo</button>
          </section>
        </div>
      </CatalogItem>
      <CatalogItem code="4.4" title="Dica" note="Abre sob demanda; mostra quantas dicas existem.">
        <aside className="dc-hint" aria-label="Dica 1 de 2">
          <span className="dc-hint-icon"><Lightbulb aria-hidden="true" /></span>
          <div className="dc-hint-copy">
            <span className="dc-hint-count">Dica 1 de 2</span>
            <p>Porcentagem compara uma parte com 100. Pense em “a cada 100 bilhetes”.</p>
            <button type="button" className="text-button">Ver próxima dica</button>
          </div>
        </aside>
      </CatalogItem>
    </CatalogBlock>
  );
}

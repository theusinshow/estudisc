import { Check, Lightbulb, X } from "lucide-react";

import { CatalogBlock, CatalogItem } from "./item";

const CHOICES = [
  { letter: "A", text: "29 bilhetes, qualquer que fosse o total.", state: "idle" },
  { letter: "B", text: "29 em cada 100 bilhetes pedem revisão.", state: "correct" },
  { letter: "C", text: "29 vezes o total de bilhetes.", state: "wrong" },
  { letter: "D", text: "A parcela que não pediu revisão.", state: "selected" }
] as const;

const STATE_LABEL = { idle: "", selected: "marcada", correct: "certa", wrong: "errada" } as const;

function AnswerVariant({ variant }: Readonly<{ variant: "pill" | "tile" | "key" | "sheet" }>) {
  return (
    <ul className="dc-answers" data-variant={variant}>
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
  );
}

export function AnswersBlock() {
  return (
    <CatalogBlock id="questao" number={4} title="Questão e resposta">
      <CatalogItem code="4-A" title="Linhas em pílula" note="Estados mostrados: A normal, B certa, C errada, D marcada.">
        <AnswerVariant variant="pill" />
      </CatalogItem>
      <CatalogItem code="4-B" title="Ladrilhos (2 colunas)" note="Letra grande, área de toque generosa.">
        <AnswerVariant variant="tile" />
      </CatalogItem>
      <CatalogItem code="4-C" title="Tecla 3D" note="Afunda ao tocar, como uma tecla.">
        <AnswerVariant variant="key" />
      </CatalogItem>
      <CatalogItem code="4-D" title="Folha de prova colorida" note="Bolinha de marcar como no gabarito do IFSC.">
        <AnswerVariant variant="sheet" />
      </CatalogItem>
      <CatalogItem code="4.5" title="Resultado: carimbo">
        <div className="dc-result" data-style="stamp">
          <span className="dc-stamp" data-result="correct"><Check aria-hidden="true" />Acertou!</span>
          <span className="dc-stamp" data-result="wrong"><X aria-hidden="true" />Ainda não</span>
        </div>
      </CatalogItem>
      <CatalogItem code="4.6" title="Resultado: faixa inferior" note="Como apps de idioma: a faixa sobe com a explicação e o botão de seguir.">
        <div className="dc-result" data-style="banner">
          <div className="dc-banner" data-result="correct"><strong><Check aria-hidden="true" /> Muito bem!</strong><p>29% significa 29 em cada 100.</p><span className="primary-button">Continuar</span></div>
          <div className="dc-banner" data-result="wrong"><strong><X aria-hidden="true" /> Ainda não</strong><p>“Vezes o total” seria multiplicar, não uma parte de 100.</p><span className="secondary-button">Tentar de novo</span></div>
        </div>
      </CatalogItem>
      <CatalogItem code="4.7" title="Dica">
        <aside className="dc-hint"><Lightbulb aria-hidden="true" /><div><strong>Dica 1 de 2</strong><p>Porcentagem compara uma parte com 100.</p></div></aside>
      </CatalogItem>
    </CatalogBlock>
  );
}

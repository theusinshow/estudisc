import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";

import { Tabs } from "@/components/ui/tabs";
import { CatalogBlock, CatalogItem } from "./item";

export function ControlsBlock() {
  return (
    <CatalogBlock id="controles" number={2} title="Controles">
      <CatalogItem code="2.1" title="Botão principal" note="Uma ação dominante por tela.">
        <div className="dc-row">
          <button type="button" className="primary-button">Continuar estudando <ArrowRight aria-hidden="true" /></button>
          <button type="button" className="primary-button" disabled>Desabilitado</button>
          <button type="button" className="primary-button" aria-busy="true"><LoaderCircle aria-hidden="true" className="dc-spin" />Salvando…</button>
        </div>
      </CatalogItem>
      <CatalogItem code="2.2" title="Botão secundário e de texto">
        <div className="dc-row">
          <button type="button" className="secondary-button">Ver plano</button>
          <button type="button" className="secondary-button" disabled>Desabilitado</button>
          <button type="button" className="text-button">Pular por agora</button>
        </div>
      </CatalogItem>
      <CatalogItem code="2.3" title="Campos de texto e seleção" note="Rótulo acima, ajuda abaixo; erro com ícone e texto, nunca só cor.">
        <div className="dc-form">
          <label className="dc-field"><span>Seu nome</span><input type="text" placeholder="Digite aqui" /><small>Como você quer ser chamado no app.</small></label>
          <label className="dc-field"><span>Quanto é 18% de 300?</span><input type="text" inputMode="decimal" defaultValue="abc" aria-invalid="true" aria-describedby="dc-error-1" /><small id="dc-error-1" className="dc-error-text"><CircleAlert aria-hidden="true" />Digite só números, como 54.</small></label>
          <label className="dc-field"><span>Matéria</span><select defaultValue="MAT"><option value="MAT">Matemática</option><option value="CIE">Ciências</option><option value="POR">Português</option></select></label>
          <label className="dc-field"><span>Sua explicação</span><textarea rows={3} placeholder="Explique com suas palavras" /></label>
        </div>
      </CatalogItem>
      <CatalogItem code="2.4" title="Caixa de seleção e rádio" note="A linha inteira é tocável; marcado fica com fundo amarelo.">
        <fieldset className="dc-options"><legend>Lembretes</legend>
          <label className="dc-option"><input type="checkbox" defaultChecked /><span>Lembrar de revisar amanhã</span></label>
          <label className="dc-option"><input type="checkbox" /><span>Mostrar dicas automaticamente</span></label>
        </fieldset>
        <fieldset className="dc-options"><legend>Tempo da sessão</legend>
          <label className="dc-option"><input type="radio" name="dc-radio" defaultChecked /><span>10 minutos</span></label>
          <label className="dc-option"><input type="radio" name="dc-radio" /><span>15 minutos</span></label>
        </fieldset>
      </CatalogItem>
      <CatalogItem code="2.5" title="Filtros (pílulas)">
        <div className="dc-row" role="group" aria-label="Período">
          <button type="button" className="dc-pill" aria-pressed="true">Hoje</button>
          <button type="button" className="dc-pill" aria-pressed="false">Semana</button>
          <button type="button" className="dc-pill" aria-pressed="false">Mês</button>
        </div>
      </CatalogItem>
      <CatalogItem code="2.6" title="Abas">
        <Tabs label="Exemplo de abas" tabs={[
          { id: "hoje", label: "Hoje", content: <p>Conteúdo da aba Hoje.</p> },
          { id: "semana", label: "Semana", content: <p>Conteúdo da aba Semana.</p> },
          { id: "tudo", label: "Tudo", content: <p>Conteúdo da aba Tudo.</p> }
        ]} />
      </CatalogItem>
    </CatalogBlock>
  );
}

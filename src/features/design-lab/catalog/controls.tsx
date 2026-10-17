import { ArrowRight, LoaderCircle } from "lucide-react";

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
      <CatalogItem code="2.3" title="Campos de texto e seleção">
        <div className="dc-form">
          <label className="dc-field">Seu nome<input type="text" placeholder="Digite aqui" /></label>
          <label className="dc-field">Com erro<input type="text" defaultValue="abc" aria-invalid="true" /><small className="dc-error-text">Digite um número.</small></label>
          <label className="dc-field">Matéria<select defaultValue="MAT"><option value="MAT">Matemática</option><option value="CIE">Ciências</option></select></label>
          <label className="dc-field">Sua explicação<textarea rows={3} placeholder="Explique com suas palavras" /></label>
        </div>
      </CatalogItem>
      <CatalogItem code="2.4" title="Caixa de seleção e rádio">
        <div className="dc-form">
          <label className="dc-check"><input type="checkbox" defaultChecked /> Lembrar de revisar amanhã</label>
          <label className="dc-check"><input type="checkbox" /> Mostrar dicas</label>
          <label className="dc-check"><input type="radio" name="dc-radio" defaultChecked /> 10 minutos</label>
          <label className="dc-check"><input type="radio" name="dc-radio" /> 15 minutos</label>
        </div>
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

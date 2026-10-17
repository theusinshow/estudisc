import { ArrowLeft, ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, Check, Clock, Flag, Flame, Lightbulb, MoreHorizontal, Play, RotateCcw, Sun, Trophy, X } from "lucide-react";

import tokens from "../../../../design-system/design-tokens.json";
import { resolveThemeColors } from "../contrast";
import { CatalogBlock, CatalogItem } from "./item";

const SUBJECTS = [
  ["mathematics", "Matemática"],
  ["science", "Ciências"],
  ["portuguese", "Português"],
  ["history-geography", "Geografia e História"]
] as const;

const STATES = [
  ["success", "Sucesso / acerto"],
  ["warning", "Aviso"],
  ["error", "Erro"],
  ["info", "Informação / foco"]
] as const;

const ICONS = [
  [Sun, "Hoje"], [BookOpen, "Aprender"], [ChartNoAxesColumnIncreasing, "Progresso"], [MoreHorizontal, "Mais"],
  [Check, "Certo"], [X, "Errado"], [Lightbulb, "Dica"], [Flag, "Marcar"], [Clock, "Tempo"], [Trophy, "Conquista"],
  [Flame, "Sequência"], [Play, "Começar"], [RotateCcw, "Revisar"], [ArrowLeft, "Voltar"], [ArrowRight, "Avançar"]
] as const;

export function FoundationsBlock() {
  const colors = resolveThemeColors("a");
  const masteryLabels = tokens.mastery as Record<string, string>;
  return (
    <CatalogBlock id="fundamentos" number={1} title="Fundamentos">
      <CatalogItem code="1.1" title="Cores base" note="Fundo da moldura, folha (cards e leitura), tinta, texto secundário e amarelo de ação.">
        <div className="dc-swatches">
          {([["paper", "Fundo"], ["panel", "Folha"], ["ink", "Tinta"], ["dim", "Texto secundário"], ["signal", "Ação"]] as const).map(([key, label]) => (
            <figure key={key} className="dc-swatch" data-color={key}><span className="dc-chip" /><figcaption>{label}<small>{colors[key]}</small></figcaption></figure>
          ))}
        </div>
      </CatalogItem>
      <CatalogItem code="1.2" title="Cores das matérias">
        <div className="dc-swatches">
          {SUBJECTS.map(([key, label]) => (
            <figure key={key} className="dc-swatch" data-subject={key}><span className="dc-chip" /><figcaption>{label}</figcaption></figure>
          ))}
        </div>
      </CatalogItem>
      <CatalogItem code="1.3" title="Cores de estado" note="Sempre acompanhadas de ícone ou texto; a cor nunca é o único sinal.">
        <div className="dc-swatches">
          {STATES.map(([key, label]) => (
            <figure key={key} className="dc-swatch" data-state={key}><span className="dc-chip" /><figcaption>{label}</figcaption></figure>
          ))}
        </div>
      </CatalogItem>
      <CatalogItem code="1.4" title="Níveis de domínio (0–5)" note="Escala do mastery por Conceito; símbolo + texto além do tom.">
        <ol className="dc-mastery">
          {Object.entries(masteryLabels).map(([level, label]) => <li key={level} data-level={level}><span className="dc-mastery-dot" />{label}</li>)}
        </ol>
      </CatalogItem>
      <CatalogItem code="1.5" title="Tipografia" note="Archivo pesado nos títulos; corpo em peso 500.">
        <div className="dc-type">
          <p className="dc-type-display">Estude para o IFSC</p>
          <p className="dc-type-hero">Título de tela</p>
          <p className="dc-type-title">Título de seção</p>
          <p className="dc-type-lead">Texto de destaque para introduzir uma aula ou explicar uma ação.</p>
          <p>Texto corrido das aulas e explicações, no tamanho de leitura confortável no celular.</p>
          <p className="type-meta">Legenda · Matemática · aula 3</p>
          <p><small>Texto pequeno para detalhes e rodapés.</small></p>
        </div>
      </CatalogItem>
      <CatalogItem code="1.6" title="Espaçamento" note="Escala em múltiplos de 2px.">
        <ul className="dc-spacing">
          {Object.entries(tokens.spacing).map(([key, value]) => <li key={key}><span className="dc-bar" data-space={key} />{key} · {value}</li>)}
        </ul>
      </CatalogItem>
      <CatalogItem code="1.7" title="Cantos">
        <div className="dc-radii">
          {(["sm", "md", "interactive", "learning-card", "sheet"] as const).map((key) => <span key={key} className="dc-radius" data-radius={key}>{key}</span>)}
          <span className="dc-radius" data-radius="pill">pílula</span>
        </div>
      </CatalogItem>
      <CatalogItem code="1.8" title="Elevação e sombras" note="Estrutura (só linha), superfície (sombra 4px) e ação (sombra 6px, afunda ao pressionar).">
        <div className="dc-elevation">
          <span className="elev-structure dc-elev">Estrutura</span>
          <span className="elev-surface dc-elev">Superfície</span>
          <span className="elev-action dc-elev">Ação</span>
        </div>
      </CatalogItem>
      <CatalogItem code="1.9" title="Ícones" note="Lucide, traço 2px, tamanhos 16 / 20 / 24.">
        <ul className="dc-icons">
          {ICONS.map(([Icon, label]) => <li key={label}><Icon aria-hidden="true" />{label}</li>)}
        </ul>
      </CatalogItem>
      <CatalogItem code="1.10" title="Foco do teclado" note="Anel visível em todo elemento interativo.">
        <div className="dc-row"><button type="button" className="secondary-button dc-focus-demo">Elemento focado</button></div>
      </CatalogItem>
    </CatalogBlock>
  );
}

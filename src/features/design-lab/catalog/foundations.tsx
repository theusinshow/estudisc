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
      <CatalogItem code="1.7" title="Cantos" note="Escala com saltos claros; cada nível tem um uso.">
        <ul className="dc-radii">
          {([["sm", "8px", "Etiquetas e caixas de seleção"], ["md", "12px", "Ícones em bloco"], ["interactive", "16px", "Campos e alternativas"], ["learning-card", "24px", "Cards"], ["sheet", "32px", "Folhas e diálogos"], ["pill", "999px", "Botões, filtros e barra inferior"]] as const).map(([key, size, use]) => (
            <li key={key} className="dc-radius-row"><span className="dc-radius" data-radius={key} /><span><strong>{size}</strong><small>{use}</small></span></li>
          ))}
        </ul>
      </CatalogItem>
      <CatalogItem code="1.8" title="Elevação e sombras" note="Sombra dura sempre para baixo-direita; quanto mais alto, mais clicável.">
        <ul className="dc-elevation">
          {([["0", "Plano", "Só contorno · fundo de seções"], ["1", "Elevado", "Sombra 4px · cards e folhas"], ["2", "Destaque", "Sombra 6px · hover e diálogos"], ["p", "Pressionado", "Sem sombra, desce 4px · toque"]] as const).map(([level, name, use]) => (
            <li key={level} className="dc-elev-row"><span className="dc-elev" data-level={level}>{name}</span><small>{use}</small></li>
          ))}
        </ul>
      </CatalogItem>
      <CatalogItem code="1.9" title="Ícones" note="Lucide com traço 2,5px; em bloco quando são o destaque, soltos ao lado de texto.">
        <ul className="dc-icons">
          {ICONS.map(([Icon, label]) => <li key={label}><span className="dc-icon-tile"><Icon aria-hidden="true" /></span>{label}</li>)}
        </ul>
        <div className="dc-icon-sizes" aria-label="Tamanhos">
          <span><BookOpen aria-hidden="true" data-size="16" />16</span><span><BookOpen aria-hidden="true" data-size="20" />20</span><span><BookOpen aria-hidden="true" data-size="24" />24</span><span><BookOpen aria-hidden="true" data-size="32" />32</span>
        </div>
      </CatalogItem>
      <CatalogItem code="1.10" title="Foco do teclado" note="Botões com sombra: contorno e sombra ficam azuis, alinhados à forma. Demais elementos: anel azul com folga de 3px.">
        <div className="dc-row">
          <button type="button" className="primary-button dc-focus-demo">Botão focado</button>
          <a href="#item-1.10" className="dc-focus-link dc-focus-demo">Link focado</a>
          <input className="dc-focus-demo" aria-label="Campo focado" defaultValue="Campo focado" />
        </div>
      </CatalogItem>
    </CatalogBlock>
  );
}

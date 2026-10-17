import { BookOpen, ChartNoAxesColumnIncreasing, Check, CheckCircle2, Flame, LogOut, MoreHorizontal, Sparkles, Sun, Trophy, X } from "lucide-react";

import { BrandLockup, BrandMark } from "@/components/brand/brand-lockup";
import { Progress } from "./cards";
import { CatalogBlock, CatalogItem } from "./item";

const BARS = [
  { subject: "mathematics", label: "Matemática", done: 4, total: 12 },
  { subject: "science", label: "Ciências", done: 9, total: 12 },
  { subject: "history-geography", label: "Geografia e História", done: 12, total: 12 }
] as const;

const BADGES = [
  { icon: Flame, value: "5", label: "dias seguidos", tone: "mathematics" },
  { icon: Trophy, value: "12", label: "conquistas", tone: "history-geography" },
  { icon: CheckCircle2, value: "38", label: "questões certas", tone: "science" }
] as const;

export function FeedbackBlock() {
  return (
    <CatalogBlock id="feedback" number={5} title="Feedback e navegação">
      <CatalogItem code="5.1" title="Barra de progresso" note="Rótulo e contagem acima; preenchimento na cor da matéria; concluída ganha check.">
        <ul className="dc-bars">
          {BARS.map((bar) => (
            <li key={bar.subject} data-subject={bar.subject}>
              <span className="dc-bar-label"><strong>{bar.label}</strong>{bar.done === bar.total ? <span className="dc-bar-done"><Check aria-hidden="true" />Concluída</span> : <span>{bar.done} de {bar.total} aulas</span>}</span>
              <Progress done={bar.done} total={bar.total} size="lg" />
            </li>
          ))}
        </ul>
      </CatalogItem>
      <CatalogItem code="5.2" title="Selos de status" note="Número grande, rótulo curto, ícone em bloco colorido.">
        <ul className="dc-badges">
          {BADGES.map(({ icon: Icon, value, label, tone }) => (
            <li key={label} className="dc-badge" data-subject={tone}><span className="dc-badge-icon"><Icon aria-hidden="true" /></span><span><strong>{value}</strong><small>{label}</small></span></li>
          ))}
        </ul>
      </CatalogItem>
      <CatalogItem code="5.3" title="Aviso (toast)">
        <div className="dc-toast" role="status"><CheckCircle2 aria-hidden="true" /><span>Progresso salvo.</span><button type="button" className="dc-icon-button" aria-label="Fechar aviso"><X aria-hidden="true" /></button></div>
      </CatalogItem>
      <CatalogItem code="5.4" title="Diálogo" note="Prévia estática. A ação segura é a principal; sair fica como secundária.">
        <div className="dc-dialog" role="group" aria-label="Prévia de diálogo">
          <button type="button" className="dc-icon-button dc-dialog-close" aria-label="Fechar"><X aria-hidden="true" /></button>
          <span className="dc-dialog-icon"><LogOut aria-hidden="true" /></span>
          <h4>Sair da sessão?</h4>
          <p>Seu progresso até aqui fica salvo. Você pode continuar depois de onde parou.</p>
          <div className="dc-dialog-actions">
            <button type="button" className="primary-button">Continuar estudando</button>
            <button type="button" className="secondary-button">Sair</button>
          </div>
        </div>
      </CatalogItem>
      <CatalogItem code="5.5" title="Cabeçalho">
        <div className="dc-topbar"><BrandLockup /><span className="dc-avatar" aria-hidden="true">M</span></div>
      </CatalogItem>
      <CatalogItem code="5.6" title="Barra inferior (celular)" note="Quatro itens com a mesma largura; ícone e rótulo centralizados; atual em amarelo.">
        <nav className="dc-bottom-nav" aria-label="Prévia da barra inferior">
          {([[Sun, "Hoje", true], [BookOpen, "Aprender", false], [ChartNoAxesColumnIncreasing, "Progresso", false], [MoreHorizontal, "Mais", false]] as const).map(([Icon, label, current]) => (
            <span key={label} className="dc-nav-item" aria-current={current ? "page" : undefined}><span className="dc-nav-icon"><Icon aria-hidden="true" /></span><span className="dc-nav-label">{label}</span></span>
          ))}
        </nav>
      </CatalogItem>
      <CatalogItem code="5.7" title="Estado vazio" note="Ilustração com o livro da marca até o mascote existir; mensagem positiva e dois caminhos.">
        <div className="dc-empty">
          <span className="dc-empty-art" aria-hidden="true"><BrandMark /><Sparkles className="dc-sparkle" data-i="1" /><Sparkles className="dc-sparkle" data-i="2" /></span>
          <h4>Tudo revisado por hoje!</h4>
          <p>Nada pendente. Que tal adiantar uma aula nova?</p>
          <div className="dc-row dc-center"><button type="button" className="primary-button">Estudar algo novo</button><button type="button" className="text-button">Ver progresso</button></div>
        </div>
      </CatalogItem>
    </CatalogBlock>
  );
}

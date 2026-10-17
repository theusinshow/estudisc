import { BookOpen, ChartNoAxesColumnIncreasing, CheckCircle2, Flame, MoreHorizontal, Sun, Trophy, X } from "lucide-react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { StatusBadge } from "@/components/ui/status-badge";
import { CatalogBlock, CatalogItem } from "./item";

export function FeedbackBlock() {
  return (
    <CatalogBlock id="feedback" number={5} title="Feedback e navegação">
      <CatalogItem code="5.1" title="Barra de progresso">
        <div className="dc-stack">
          {[20, 55, 100].map((value) => (
            <span key={value} className="dc-progress dc-progress-lg" role="img" aria-label={`${value}%`}><span className="dc-progress-fill" data-value={value} /></span>
          ))}
        </div>
      </CatalogItem>
      <CatalogItem code="5.2" title="Selos de status">
        <div className="dc-row">
          <StatusBadge icon={Flame} label="5 dias" detail="sequência" />
          <StatusBadge icon={Trophy} label="12" detail="conquistas" />
          <StatusBadge icon={CheckCircle2} label="38" detail="questões certas" />
        </div>
      </CatalogItem>
      <CatalogItem code="5.3" title="Aviso (toast)">
        <div className="dc-toast" role="status"><CheckCircle2 aria-hidden="true" /><span>Progresso salvo.</span><button type="button" className="dc-icon-button" aria-label="Fechar aviso"><X aria-hidden="true" /></button></div>
      </CatalogItem>
      <CatalogItem code="5.4" title="Diálogo" note="Prévia estática; o real abre como modal.">
        <div className="dc-dialog" role="group" aria-label="Prévia de diálogo">
          <h4>Sair da sessão?</h4>
          <p>Seu progresso até aqui fica salvo. Você pode continuar depois.</p>
          <div className="dc-row"><span className="primary-button">Sair</span><span className="secondary-button">Continuar estudando</span></div>
        </div>
      </CatalogItem>
      <CatalogItem code="5.5" title="Cabeçalho">
        <div className="dc-topbar"><BrandLockup /><span className="dc-avatar" aria-hidden="true">M</span></div>
      </CatalogItem>
      <CatalogItem code="5.6" title="Barra inferior (celular)" note="Pílula escura flutuante; item atual em amarelo.">
        <nav className="dc-bottom-nav" aria-label="Prévia da barra inferior">
          {([[Sun, "Hoje", true], [BookOpen, "Aprender", false], [ChartNoAxesColumnIncreasing, "Progresso", false], [MoreHorizontal, "Mais", false]] as const).map(([Icon, label, current]) => (
            <span key={label} className="dc-nav-item" aria-current={current ? "page" : undefined}><span className="dc-nav-icon"><Icon aria-hidden="true" /></span>{label}</span>
          ))}
        </nav>
      </CatalogItem>
      <CatalogItem code="5.7" title="Estado vazio" note="Espaço reservado para ilustração (mascote fica para depois).">
        <div className="dc-empty"><span className="dc-empty-art" aria-hidden="true" /><h4>Nada para revisar hoje</h4><p>Volte amanhã ou pratique uma matéria.</p><span className="secondary-button">Praticar</span></div>
      </CatalogItem>
    </CatalogBlock>
  );
}

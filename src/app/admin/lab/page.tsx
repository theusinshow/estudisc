import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedError, requireAdmin } from "@/features/auth/owner";
import { AnswersBlock } from "@/features/design-lab/catalog/answers";
import { CardsBlock } from "@/features/design-lab/catalog/cards";
import { ControlsBlock } from "@/features/design-lab/catalog/controls";
import { FeedbackBlock } from "@/features/design-lab/catalog/feedback";
import { FoundationsBlock } from "@/features/design-lab/catalog/foundations";
import { IdeasBlock } from "@/features/design-lab/catalog/ideas/block";
import { IdeasTwoBlock } from "@/features/design-lab/catalog/ideas2/block";
import { InteractiveBlock } from "@/features/design-lab/catalog/interactive";
import { MotionBlock } from "@/features/design-lab/catalog/motion";
import { contrastReport } from "@/features/design-lab/contrast";

export const dynamic = "force-dynamic";

const BLOCKS = [
  ["fundamentos", "1 Fundamentos"],
  ["controles", "2 Controles"],
  ["cards", "3 Cards"],
  ["questao", "4 Questão"],
  ["feedback", "5 Feedback"],
  ["movimento", "6 Movimento"],
  ["interacoes", "7 Interações"],
  ["estudar-mexendo", "8 Estudar mexendo"],
  ["mais-ideias", "9 Mais ideias"]
] as const;

/** Design catalog: every design-system piece in the chosen theme (vibrante · limão · Archivo), reviewed by code. */
export default async function DesignLabPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AccessDeniedError) notFound();
    throw error;
  }
  const report = contrastReport("a");

  return (
    <AppShell>
      <div className="lab-page">
        <header className="lab-controls"><h1 className="type-title">Lab de design</h1><p className="dc-note">Catálogo do Design System vibrante (ADR 0069), agora padrão no app inteiro.</p></header>
        <div className="dc" data-theme="vibrante" data-palette="a" data-type="archivo">
          <nav className="dc-toc" aria-label="Blocos do catálogo">
            {BLOCKS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </nav>
          <FoundationsBlock />
          <ControlsBlock />
          <CardsBlock />
          <AnswersBlock />
          <FeedbackBlock />
          <MotionBlock />
          <InteractiveBlock />
          <IdeasBlock />
          <IdeasTwoBlock />
          <section className="dc-block" aria-labelledby="contraste-title">
            <h2 id="contraste-title" className="type-title">Contraste (WCAG AA)</h2>
            <table className="lab-report">
              <thead><tr><th>Par</th><th>Razão</th><th>Resultado</th></tr></thead>
              <tbody>
                {report.map((pair) => (
                  <tr key={pair.label}><td>{pair.label}</td><td>{pair.ratio.toFixed(2)}:1</td><td>{pair.passes ? "Passa" : "Falha"}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

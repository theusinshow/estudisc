import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, Timer } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { daysUntilExam, examCountdownLabel } from "@/features/public-site/countdown";

export const dynamic = "force-dynamic";

/** "Provas" tab: mock exams in the IFSC format and the official past exams, side by side. */
export default function ExamsHubPage() {
  const days = daysUntilExam();
  return (
    <AppShell>
      <section className="hub" aria-labelledby="provas-title">
        <header className="hub-head">
          <p className="eyebrow">Treino no formato da prova</p>
          <h1 id="provas-title">Provas</h1>
          {days !== null ? <p className="hub-countdown"><Timer aria-hidden="true" />{examCountdownLabel(days)} · 29/11</p> : null}
        </header>
        <ul className="hub-cards">
          <li>
            <Link className="hub-card" href="/assessments" data-subject="mathematics">
              <span className="hub-card-sticker">Simulados</span>
              <span className="hub-card-icon" aria-hidden="true"><ClipboardList /></span>
              <strong>Simulados completos</strong>
              <span>No formato do IFSC, com tempo de prova e correção no fim.</span>
              <span className="hub-card-cta">Abrir simulados <ArrowRight aria-hidden="true" /></span>
            </Link>
          </li>
          <li>
            <Link className="hub-card" href="/past-exams" data-subject="science">
              <span className="hub-card-sticker">Oficiais</span>
              <span className="hub-card-icon" aria-hidden="true"><FileText /></span>
              <strong>Provas anteriores</strong>
              <span>Cadernos oficiais de 2022 a 2026 com cartão-resposta e correção pelo gabarito.</span>
              <span className="hub-card-cta">Ver provas <ArrowRight aria-hidden="true" /></span>
            </Link>
          </li>
        </ul>
      </section>
    </AppShell>
  );
}

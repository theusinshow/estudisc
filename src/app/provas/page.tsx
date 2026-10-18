import Link from "next/link";
import { ArrowRight, ClipboardList, FileText } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ExamCountdownBoard } from "@/features/study-tools/exam-countdown";
import { accessLastDay, CONTENT_SUMMARY } from "@/features/public-site/content-summary";

export const dynamic = "force-dynamic";

/** "Provas" tab: mock exams in the IFSC format and the official past exams, side by side. */
export default function ExamsHubPage() {
  return (
    <AppShell>
      <section className="hub" aria-labelledby="provas-title">
        <header className="hub-head">
          <p className="eyebrow">Treino no formato da prova</p>
          <h1 id="provas-title">Provas</h1>
          <ExamCountdownBoard />
          {/* The board counts to midnight of the exam day; the landing counts calendar days (42 vs 41 d 18 h). */}
          <p className="hub-countdown-note">até {accessLastDay().slice(0, 5)}, dia da prova</p>
        </header>
        <ul className="hub-cards">
          <li>
            <Link className="hub-card" href="/assessments" data-subject="mathematics">
              <span className="hub-card-sticker">Simulados</span>
              <span className="hub-card-icon" aria-hidden="true"><ClipboardList /></span>
              <strong>{CONTENT_SUMMARY.simulationTemplates} simulados completos</strong>
              <span>No formato do IFSC, com tempo de prova e correção no fim.</span>
              <span className="hub-card-cta">Abrir simulados <ArrowRight aria-hidden="true" /></span>
            </Link>
          </li>
          <li>
            <Link className="hub-card" href="/past-exams" data-subject="science">
              <span className="hub-card-sticker">Oficiais</span>
              <span className="hub-card-icon" aria-hidden="true"><FileText /></span>
              <strong>{CONTENT_SUMMARY.pastExams} provas, de 2022 a 2026</strong>
              <span>Cadernos oficiais com cartão-resposta e correção pelo gabarito.</span>
              <span className="hub-card-cta">Ver provas <ArrowRight aria-hidden="true" /></span>
            </Link>
          </li>
        </ul>
      </section>
    </AppShell>
  );
}

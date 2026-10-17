import Link from "next/link";
import { PendingAnchor } from "@/components/navigation/pending-anchor";
import { ArrowRight } from "lucide-react";

export type StudyActionVariant = "review" | "continue" | "lesson" | "practice" | "quick-review" | "simulation" | "project";
const actionLabels: Record<StudyActionVariant, string> = {
  review: "Revisar", continue: "Continuar", lesson: "Estudar aula", practice: "Praticar",
  "quick-review": "Revisão rápida", simulation: "Simulado", project: "Aplicar em projeto"
};

export function StudyActionCard({ variant, title, reason, href, estimatedMinutes, activityCount, subjectCode }: Readonly<{
  variant: StudyActionVariant;
  title: string;
  reason: string;
  href: string;
  estimatedMinutes?: number;
  activityCount?: number;
  /** Presentation only: colors the identification tab of the subject. */
  subjectCode?: string;
}>) {
  const ActionLink = href.startsWith("/study/") ? PendingAnchor : Link;
  return <ActionLink className="next-card study-action-card" data-kind={variant} data-subject={subjectCode} href={href}>
    <strong>{title}</strong><span>{reason}</span>
    {(activityCount !== undefined || estimatedMinutes !== undefined) && <span className="study-action-metadata">
      {activityCount !== undefined && <span>{activityCount} {activityCount === 1 ? "atividade" : "atividades"}</span>}
      {estimatedMinutes !== undefined && <span>~{estimatedMinutes} min</span>}
    </span>}
    <span className="study-action-cta">{actionLabels[variant]}<ArrowRight aria-hidden="true" /></span>
  </ActionLink>;
}

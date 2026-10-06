import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type StudyActionVariant = "review" | "continue" | "lesson" | "practice" | "quick-review" | "simulation" | "project";
const actionLabels: Record<StudyActionVariant, string> = {
  review: "Revisar", continue: "Continuar", lesson: "Estudar aula", practice: "Praticar",
  "quick-review": "Revisão rápida", simulation: "Simulado", project: "Aplicar em projeto"
};

export function StudyActionCard({ variant, title, reason, href, estimatedMinutes, activityCount }: Readonly<{
  variant: StudyActionVariant;
  title: string;
  reason: string;
  href: string;
  estimatedMinutes?: number;
  activityCount?: number;
}>) {
  return <Link className="next-card study-action-card" data-kind={variant} href={href}>
    <strong>{title}</strong><span>{reason}</span>
    {(activityCount !== undefined || estimatedMinutes !== undefined) && <span className="study-action-metadata">
      {activityCount !== undefined && <span>{activityCount} {activityCount === 1 ? "atividade" : "atividades"}</span>}
      {estimatedMinutes !== undefined && <span>~{estimatedMinutes} min</span>}
    </span>}
    <span className="study-action-cta">{actionLabels[variant]}<ArrowRight aria-hidden="true" /></span>
  </Link>;
}

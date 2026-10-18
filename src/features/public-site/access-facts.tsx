import { Check } from "lucide-react";
import { accessLastDay, CONTENT_SUMMARY, formatCount } from "./content-summary";

/**
 * What the paid access includes, with the refund right. One source for the landing price card and the
 * paywall so the price terms never drift apart (the landing FAQ restates them for FAQPage data).
 */
export function AccessFacts({ className = "offer-checks", withContent = true }: Readonly<{ className?: string; withContent?: boolean }>) {
  const c = CONTENT_SUMMARY;
  return (
    <ul className={className}>
      <li><Check aria-hidden="true" />Tudo liberado até {accessLastDay()}, o dia da prova.</li>
      {withContent ? <li><Check aria-hidden="true" />{formatCount(c.lessons)} aulas, {formatCount(c.lessonQuestions)} questões, {c.simulationTemplates} simulados e {c.pastExams} provas anteriores do IFSC.</li> : null}
      <li><Check aria-hidden="true" />Sem mensalidade e sem renovação automática.</li>
      <li><Check aria-hidden="true" />Pix ou cartão, pelo Mercado Pago.</li>
      <li><Check aria-hidden="true" />Desistiu em até 7 dias após a compra? Você recebe o valor de volta, como prevê o Código de Defesa do Consumidor.</li>
    </ul>
  );
}

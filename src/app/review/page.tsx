import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Check } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { completeConceptReview, getDueReviews } from "@/features/review/api";
import { masteryStateLabels, type MasteryState } from "@/features/mastery/mastery-policy";
import { getFeatureFlags } from "@/lib/feature-flags";
import { TargetedPracticeControls } from "@/features/study-sessions/targeted-practice-controls";

export const dynamic = "force-dynamic";

async function completeReviewAction(formData: FormData) {
  "use server";

  const conceptId = String(formData.get("conceptId") ?? "");

  if (conceptId) {
    await completeConceptReview(conceptId, 4);
    revalidatePath("/review");
    revalidatePath(`/concepts/${conceptId}`);
  }
}

export default async function ReviewPage() {
  const dueReviews = await getDueReviews();
  const enhanced=getFeatureFlags().FEATURE_SMART_MISTAKES;

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-review" aria-labelledby="review-title">
        <p className="eyebrow">Revisão</p>
        <h1 id="review-title">Revisões de hoje</h1>
        <p>{enhanced?"As revisões são previstas a partir das suas respostas registradas. Responder uma questão recupera o conteúdo; ler ou refletir não registra um acerto.":"Cada conceito volta quando está perto de ser esquecido. Revisar na hora certa fixa o conteúdo para a prova."}</p>

        {dueReviews.length === 0 ? (
          <div className="empty-state">
            <strong>Nada para revisar hoje</strong>
            <p>As revisões aparecem depois que você responde questões nas sessões de estudo.</p>
            <Link className="primary-action" href="/">Ir para Hoje</Link>
          </div>
        ) : (
          <>
            <p className="count-chip">{dueReviews.length === 1 ? "1 conceito" : `${dueReviews.length} conceitos`} para revisar</p>
            {enhanced&&<TargetedPracticeControls kind="review" label="Começar revisão rápida"/>}
            <ol className="review-list" aria-label="Revisões vencidas">
              {dueReviews.map((review) => (
                <li key={review.conceptStableId}>
                  <Link href={`/concepts/${review.conceptStableId}`}><strong>{review.conceptTitle}</strong></Link>
                  <span>{review.reason}</span>
                  <small>
                    {masteryStateLabels[review.currentMasteryState as MasteryState] ?? review.currentMasteryState} · {review.reviewCount === 1 ? "1 revisão" : `${review.reviewCount} revisões`}
                  </small>
                  {enhanced?<TargetedPracticeControls kind="review" conceptId={review.conceptStableId} label={`Praticar ${review.conceptTitle}`}/>:<form action={completeReviewAction}>
                    <input type="hidden" name="conceptId" value={review.conceptStableId} />
                    <button className="secondary-action" type="submit"><Check aria-hidden="true" />Concluir revisão</button>
                  </form>}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </AppShell>
  );
}

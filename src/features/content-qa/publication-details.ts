import { qaLayers } from "./policy";

export type PublicationDetails = { publicationMode: "editorial_reviewed" | "admin_direct" | "legacy_unknown" | null; published: boolean; authorizedBy: string | null; publishedAt: Date | null; reason: string | null; independentQaRecorded: boolean; approvedLayers: number; reviewedBy: string | null };
type Review = { layer: string; verdict: string; reviewerId: string; createdAt: Date };
export function derivePublicationDetails(release: { status: string; authorId: string }, events: readonly { actorId: string; mode?: string; reason: string; createdAt: Date }[], reviews: readonly Review[]): PublicationDetails {
  const latest = new Map<string, Review>();
  for (const review of [...reviews].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) latest.set(review.layer, review);
  const approved = qaLayers.flatMap(layer => { const review = latest.get(layer); return review?.verdict === "APPROVE" && review.reviewerId !== release.authorId ? [review] : []; });
  const independentQaRecorded = approved.length === qaLayers.length;
  const event = [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const published = release.status === "published";
  const finalReview = [...approved].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const mode = event ? event.mode === "editorial_reviewed" ? "editorial_reviewed" : !event.mode || event.mode === "admin_direct" ? "admin_direct" : "legacy_unknown" : independentQaRecorded ? "editorial_reviewed" : "legacy_unknown";
  return { publicationMode: published ? mode : null, published, authorizedBy: published ? event?.actorId ?? null : null, publishedAt: published ? event?.createdAt ?? null : null, reason: published ? event?.reason ?? null : null, independentQaRecorded, approvedLayers: approved.length, reviewedBy: finalReview?.reviewerId ?? null };
}

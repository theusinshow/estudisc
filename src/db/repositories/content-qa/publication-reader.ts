import { eq, inArray } from "drizzle-orm";
import { contentPublicationEvents, contentQaReviews, contentReleases } from "@/db/schema";
import { derivePublicationDetails } from "@/features/content-qa/publication-details";
import type { ContentDatabase } from "./types";

export async function readPublicationDetails(db: ContentDatabase, releaseIds: readonly string[]) {
  // One owner-independent content read per table; audit/reviews are content administration data.
  if (!releaseIds.length) return new Map();
  const ids = [...releaseIds];
  const [releases, events, reviews] = await Promise.all([db.select().from(contentReleases).where(inArray(contentReleases.id, ids)), db.select().from(contentPublicationEvents).where(inArray(contentPublicationEvents.releaseId, ids)), db.select().from(contentQaReviews).where(inArray(contentQaReviews.releaseId, ids))]);
  const selected = new Set(releaseIds);
  return new Map(releases.filter(release => selected.has(release.id)).map(release => [release.id, derivePublicationDetails(release, events.filter(event => event.releaseId === release.id), reviews.filter(review => review.releaseId === release.id))]));
}
export async function readOnePublicationDetail(db: ContentDatabase, releaseId: string) {
  const [release] = await db.select().from(contentReleases).where(eq(contentReleases.id, releaseId));
  if (!release) return null;
  const [events, reviews] = await Promise.all([db.select().from(contentPublicationEvents).where(eq(contentPublicationEvents.releaseId, releaseId)), db.select().from(contentQaReviews).where(eq(contentQaReviews.releaseId, releaseId))]);
  return derivePublicationDetails(release, events, reviews);
}

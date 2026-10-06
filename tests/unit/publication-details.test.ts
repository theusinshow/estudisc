import { expect, it } from "vitest";
import { derivePublicationDetails } from "@/features/content-qa/publication-details";
import { qaLayers } from "@/features/content-qa/policy";

it("derives direct publication from the real audit event without inventing reviews", () => {
  const result = derivePublicationDetails({ status: "published", authorId: "author" }, [{ actorId: "admin", reason: "Explicit human authorization", createdAt: new Date("2026-10-06") }], []);
  expect(result).toMatchObject({ published: true, publicationMode: "admin_direct", authorizedBy: "admin", independentQaRecorded: false, approvedLayers: 0 });
});
it("distinguishes recorded independent editorial layers from unknown historical publication", () => {
  const reviews = qaLayers.map(layer => ({ layer, verdict: "APPROVE", reviewerId: "reviewer", createdAt: new Date() }));
  expect(derivePublicationDetails({ status: "published", authorId: "author" }, [], reviews)).toMatchObject({ publicationMode: "editorial_reviewed", independentQaRecorded: true, authorizedBy: null, publishedAt: null, reviewedBy: "reviewer" });
  expect(derivePublicationDetails({ status: "published", authorId: "author" }, [], [])).toMatchObject({ publicationMode: "legacy_unknown", independentQaRecorded: false });
  expect(derivePublicationDetails({ status: "draft", authorId: "author" }, [], reviews).publicationMode).toBeNull();
  const timestamp = new Date("2026-10-06T15:00:00Z");
  expect(derivePublicationDetails({ status: "published", authorId: "author" }, [{ mode: "editorial_reviewed", actorId: "publisher", reason: "Four approvals recorded", createdAt: timestamp }], reviews)).toMatchObject({ publicationMode: "editorial_reviewed", authorizedBy: "publisher", publishedAt: timestamp, independentQaRecorded: true });
});

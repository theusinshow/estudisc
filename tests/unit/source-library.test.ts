import { describe, expect, it } from "vitest";
import { libraryMetadataSchema, type SourcePack, type Taxonomy } from "../../vecta-source-library/contracts";
import { duplicateCandidates, nextSourceId, normalizeUrl, validateLibrary } from "../../vecta-source-library/library";

const timestamp = "2026-10-02T12:00:00.000Z";
const taxonomy: Taxonomy = { schemaVersion: 1, sourceScopeVerified: false, existingSourceIds: ["src-existing-canonical"], origins: [], lessons: [],
  concepts: [{ id: "CIE.ATOM.Z", subjects: ["CIE"], lessonIds: ["CIE-06"], origins: ["test"], seedPresent: true }] };
const metadata = () => ({ schemaVersion: 1 as const, canonicalUrl: "https://example.org/resource?id=7", originalUrls: ["https://example.org/resource?id=7&utm_source=test"],
  resourceType: "ARTICLE" as const, subjects: ["CIE" as const], topics: ["Estrutura atômica"], conceptIds: ["CIE.ATOM.Z"], conceptMappingStatus: "MAPPED" as const,
  quality: "D" as const, qualityReason: "Test fixture, unverified", licenseStatus: "UNKNOWN" as const, license: "Unknown", publisher: "Test institution",
  recommendedUse: "Review before use", usageRole: "SUPPLEMENTAL" as const, status: "INBOX" as const, addedAt: timestamp,
  reviewReasons: ["LICENSE_UNKNOWN"], userNotes: [], identifiers: {}, replacementUrls: [], history: [], details: {} });
const fixture = (): SourcePack => ({ sources: [{ content: { id: "SRC-CIE-00001", type: "reference", title: "Atomic number", locator: {}, metadata: { library: metadata() } },
  organization: "Test institution", url: "https://example.org/resource?id=7", verification: "RESEARCH_REQUIRED", notes: "Synthetic metadata fixture; never cataloged" }], assertions: [], unresolved: [] });
const media = { images: [], videos: [], books: [] };

describe("source library curation invariants", () => {
  it("removes tracking but preserves resource identity and fragments", () => {
    expect(normalizeUrl("https://example.org/resource?utm_source=x&id=7&edition=2#section").canonicalUrl).toBe("https://example.org/resource?edition=2&id=7#section");
    expect(normalizeUrl("https://example.org/resource?id=8").canonicalUrl).not.toBe(normalizeUrl("https://example.org/resource?id=7").canonicalUrl);
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizeUrl("https://private:secret@example.org/")).toThrow();
  });
  it("deduplicates YouTube variants and retains supplied timestamps separately", () => {
    expect(normalizeUrl("https://youtu.be/abcdefghijk?t=3m20s&si=abc")).toEqual({ canonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk", videoId: "abcdefghijk", timestamp: "3m20s" });
    expect(normalizeUrl("https://m.youtube.com/shorts/abcdefghijk?start=200").canonicalUrl).toBe("https://www.youtube.com/watch?v=abcdefghijk");
    expect(normalizeUrl("https://youtube.com.evil.org/watch?v=abcdefghijk").canonicalUrl).toBe("https://youtube.com.evil.org/watch?v=abcdefghijk");
  });
  it("matches known URLs and identifiers; title/publisher is only a review candidate", () => {
    const pack = fixture();
    expect(duplicateCandidates(pack, { url: "https://example.org/resource?utm_campaign=a&id=7" })).toEqual([{ id: "SRC-CIE-00001", reason: "CANONICAL_URL" }]);
    expect(duplicateCandidates(pack, { url: "https://example.org/other", title: "  ATOMIC  NUMBER ", publisher: "test institution" })[0].reason).toBe("TITLE_PUBLISHER_REVIEW");
    pack.sources[0].content.metadata.library = { ...metadata(), identifiers: { "example.org:documentId": "doc7" } };
    expect(duplicateCandidates(pack, { url: "https://example.org/other", identifiers: { "example.org:documentId": "doc7" } })[0].reason).toBe("IDENTIFIER");
  });
  it("never reuses archived IDs or requires an unknown video duration", () => {
    const pack = fixture();
    pack.sources[0].content.id = "SRC-CIE-00042";
    pack.sources[0].content.metadata.library = { ...metadata(), status: "ARCHIVED", resourceType: "VIDEO", details: { durationStatus: "UNKNOWN" } };
    expect(nextSourceId(pack, "CIE")).toBe("SRC-CIE-00043");
    expect(nextSourceId(pack, "CROSS-SUBJECT")).toBe("SRC-CROSS-00001");
    expect(validateLibrary(pack, media, taxonomy).pack.sources).toHaveLength(1);
    pack.sources[0].content.id = "src-existing-canonical";
    expect(validateLibrary(pack, media, taxonomy).pack.sources[0].content.id).toBe("src-existing-canonical");
  });
  it("rejects invented Concepts, duplicate URLs and unsubstantiated embedding", () => {
    const pack = fixture();
    expect(validateLibrary(pack, media, taxonomy).pack.sources).toHaveLength(1);
    pack.sources[0].content.metadata.library = { ...metadata(), conceptIds: ["CIE.INVENTED"] };
    expect(() => validateLibrary(pack, media, taxonomy)).toThrow("Unknown Concept");
    const duplicate = fixture();
    duplicate.sources.push({ ...duplicate.sources[0], content: { ...duplicate.sources[0].content, id: "SRC-CIE-00002" } });
    expect(() => validateLibrary(duplicate, media, taxonomy)).toThrow("Duplicate canonical URL");
    expect(libraryMetadataSchema.safeParse({ ...metadata(), licenseStatus: "APPROVED_EMBED" }).success).toBe(false);
    expect(libraryMetadataSchema.safeParse({ ...metadata(), licenseStatus: "APPROVED_EMBED", licenseEvidenceUrl: "https://example.org/license", attribution: "Test attribution", lastVerifiedAt: timestamp }).success).toBe(true);
  });
  it("preserves reservation flags and rejects untraceable media", () => {
    const pack = fixture();
    pack.sources[0].content.metadata.library = { ...metadata(), subjects: ["IFSC"], official: { documentType: "Exam", officialStatus: "UNVERIFIED", protected: true, reservedForAssessment: true } };
    expect(() => validateLibrary(pack, media, taxonomy)).toThrow("Protected flag");
    pack.sources[0].content.metadata.protected = true;
    pack.sources[0].content.metadata.reservedForAssessment = true;
    expect(validateLibrary(pack, media, taxonomy).pack.sources).toHaveLength(1);
    expect(() => validateLibrary(fixture(), { ...media, books: [{ id: "missing-source", title: "Book", author: "Author", publisher: "Publisher", topic: "Atoms", reason: "Test", supplemental: true }] }, taxonomy)).toThrow("matching canonical source");
  });
});

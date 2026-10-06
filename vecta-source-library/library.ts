import { libraryMetadataSchema, sourcePackSchema, mediaPackSchema, type SourcePack, type Taxonomy } from "./contracts";

/** Remove known tracking only; preserve document/query identity and non-video fragments. */
export function normalizeUrl(raw: string): { canonicalUrl: string; videoId?: string; timestamp?: string } {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Public HTTP(S) URL required");
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ["fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid"].includes(key.toLowerCase())) url.searchParams.delete(key);
  }
  const host = url.hostname.toLowerCase();
  if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be", "www.youtu.be"].includes(host)) {
    const videoId = host.endsWith("youtu.be") ? url.pathname.split("/")[1] : url.searchParams.get("v") ?? (/^\/(?:shorts|embed|live)\/([^/]+)/.exec(url.pathname)?.[1]);
    if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      const timestamp = url.searchParams.get("t") ?? url.searchParams.get("start") ?? (url.hash.startsWith("#t=") ? url.hash.slice(3) : undefined);
      return { canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`, videoId, ...(timestamp ? { timestamp } : {}) };
    }
  }
  url.searchParams.sort();
  return { canonicalUrl: url.href };
}

export function duplicateCandidates(pack: SourcePack, candidate: { url: string; title?: string; publisher?: string; identifiers?: Record<string, string> }) {
  const normalized = normalizeUrl(candidate.url);
  const identifiers = { ...candidate.identifiers, ...(normalized.videoId ? { videoId: normalized.videoId } : {}) };
  const fold = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
  return pack.sources.flatMap(source => {
    const meta = libraryMetadataSchema.parse(source.content.metadata.library);
    const urls = [meta.canonicalUrl, ...meta.originalUrls, ...(source.url ? [source.url] : [])];
    let reason: string | undefined;
    if (urls.some(url => normalizeUrl(url).canonicalUrl === normalized.canonicalUrl)) reason = "CANONICAL_URL";
    else if (Object.entries(identifiers).some(([key, value]) => meta.identifiers[key] === value)) reason = "IDENTIFIER";
    else if (candidate.title && candidate.publisher && fold(candidate.title) === fold(source.content.title) && fold(candidate.publisher) === fold(meta.publisher)) reason = "TITLE_PUBLISHER_REVIEW";
    return reason ? [{ id: source.content.id, reason }] : [];
  });
}

/** Allocate across active, inbox, broken and archived records. Never reuse an ID. */
export function nextSourceId(pack: SourcePack, subject: string) {
  const prefix = subject === "CROSS-SUBJECT" ? "CROSS" : subject;
  if (!["MAT", "POR", "CIE", "GH", "IFSC", "CROSS"].includes(prefix)) throw new Error("Unknown subject");
  const expression = new RegExp(`^SRC-${prefix}-(\\d+)$`);
  const max = Math.max(0, ...pack.sources.map(source => Number(expression.exec(source.content.id)?.[1] ?? 0)));
  return `SRC-${prefix}-${String(max + 1).padStart(5, "0")}`;
}

export function validateLibrary(raw: unknown, rawMedia: unknown, taxonomy: Taxonomy) {
  const pack = sourcePackSchema.parse(raw);
  const media = mediaPackSchema.parse(rawMedia);
  const knownConcepts = new Set(taxonomy.concepts.map(concept => concept.id));
  const seen = new Set<string>();
  const canonicalUrls = new Set<string>();
  const identifiers = new Set<string>();
  for (const source of pack.sources) {
    if (seen.has(source.content.id)) throw new Error(`Duplicate source ID: ${source.content.id}`);
    seen.add(source.content.id);
    const meta = libraryMetadataSchema.parse(source.content.metadata.library);
    if (!/^SRC-(?:MAT|POR|CIE|GH|IFSC|CROSS)-\d{5,}$/.test(source.content.id) && !taxonomy.existingSourceIds.includes(source.content.id)) throw new Error(`Invalid stable ID: ${source.content.id}`);
    if (normalizeUrl(meta.canonicalUrl).canonicalUrl !== meta.canonicalUrl) throw new Error(`URL is not canonical: ${source.content.id}`);
    if (canonicalUrls.has(meta.canonicalUrl)) throw new Error(`Duplicate canonical URL: ${source.content.id}`);
    canonicalUrls.add(meta.canonicalUrl);
    if (source.url !== meta.canonicalUrl) throw new Error(`Studio URL must match canonical URL: ${source.content.id}`);
    for (const [key, value] of Object.entries(meta.identifiers)) {
      const identity = JSON.stringify([key, value]);
      if (identifiers.has(identity)) throw new Error(`Duplicate resource identifier: ${source.content.id}`);
      identifiers.add(identity);
    }
    for (const concept of meta.conceptIds) if (!knownConcepts.has(concept)) throw new Error(`Unknown Concept: ${concept}`);
    if (source.verification === "VERIFIED" && source.verifiedAt !== meta.lastVerifiedAt) throw new Error(`Verification dates disagree: ${source.content.id}`);
    if (meta.official?.protected !== undefined && source.content.metadata.protected !== meta.official.protected) throw new Error(`Protected flag must match runtime metadata: ${source.content.id}`);
    if (meta.official && source.content.metadata.reservedForAssessment !== meta.official.reservedForAssessment) throw new Error(`Reservation flag must match runtime metadata: ${source.content.id}`);
  }
  for (const assertion of pack.assertions) for (const id of assertion.sourceIds) if (!seen.has(id)) throw new Error(`Unresolved assertion source: ${id}`);
  const mediaIds = new Set<string>();
  for (const item of [...media.images, ...media.videos, ...media.books]) {
    if (mediaIds.has(item.id) || !seen.has(item.id)) throw new Error(`Media must have one matching canonical source: ${item.id}`);
    mediaIds.add(item.id);
    const source = pack.sources.find(source => source.content.id === item.id)!;
    const meta = libraryMetadataSchema.parse(source.content.metadata.library);
    const itemUrl = "sourceUrl" in item ? item.sourceUrl : "url" in item ? item.url : undefined;
    if (itemUrl && normalizeUrl(itemUrl).canonicalUrl !== meta.canonicalUrl) throw new Error(`Media URL mismatch: ${item.id}`);
    if ("licenseStatus" in item && item.licenseStatus !== meta.licenseStatus) throw new Error(`Media license mismatch: ${item.id}`);
    if ("conceptIds" in item) for (const concept of item.conceptIds) if (!meta.conceptIds.includes(concept)) throw new Error(`Media Concept mismatch: ${item.id}`);
    if ("src" in item && item.src) throw new Error("Library holds metadata only; produced assets belong in a reviewed private Studio job");
  }
  return { pack, media };
}

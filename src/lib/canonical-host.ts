// Sends visitors on alias hosts (Railway service domain, bare domain) to the APP_URL host,
// so cookies, Auth.js callbacks and the mutation-origin check all see one origin.
const EXEMPT_HOSTS = new Set(["healthcheck.railway.app"]);

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "0.0.0.0" || hostname === "::1" || hostname.startsWith("127.");
}

export function getCanonicalRedirectUrl(headers: Headers, url: URL, appUrl: string | undefined): URL | null {
  if (!appUrl) return null;
  let canonical: URL;
  try {
    canonical = new URL(appUrl);
  } catch {
    return null;
  }
  if (isLocalHost(canonical.hostname)) return null;

  const rawHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim() || headers.get("host") || "";
  const hostname = rawHost.replace(/:\d+$/, "").toLowerCase();
  if (!hostname || hostname === canonical.hostname || EXEMPT_HOSTS.has(hostname) || isLocalHost(hostname)) return null;

  return new URL(`${url.pathname}${url.search}`, canonical.origin);
}

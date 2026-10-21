export const CSP_NONCE_HEADER = "x-nonce";

export const BASE_SECURITY_HEADERS = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()"
  }
] as const;

export function buildContentSecurityPolicy({
  nonce,
  isDevelopment
}: Readonly<{
  nonce: string;
  isDevelopment: boolean;
}>) {
  const scriptSources = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];

  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss: https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://insights.codedbym.com",
    "frame-src https://accounts.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests"
  ].join("; ");
}

export function applyBaseSecurityHeaders(headers: Headers) {
  for (const header of BASE_SECURITY_HEADERS) {
    headers.set(header.key, header.value);
  }
}

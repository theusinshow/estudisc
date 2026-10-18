import type { NextConfig } from "next";

import { BASE_SECURITY_HEADERS } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...BASE_SECURITY_HEADERS]
      },
      {
        // JSON endpoints are never search results (SEO pass); pages carry noindex through metadata.
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
      }
    ];
  },
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;

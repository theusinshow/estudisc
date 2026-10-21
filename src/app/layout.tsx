import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { siteUrl } from "@/features/public-site/site-url";
import { NOINDEX_ROBOTS } from "@/features/public-site/seo";
import { getServerEnv } from "@/lib/env";
// Private owner state is always request-scoped, never a shared prerendered page.
export const dynamic="force-dynamic";

// Self-hosted at build time, so the CSP `font-src 'self'` stays intact.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const googleSiteVerification = getServerEnv().GOOGLE_SITE_VERIFICATION;
  return {
    metadataBase: new URL(await siteUrl()),
    title: "Estudisc",
    description: "Preparação para a prova do IFSC 2027 com aulas, questões explicadas, simulados e provas anteriores.",
    applicationName: "Estudisc",
    // Private by default: only public pages built with publicPageMetadata opt into indexing (SEO pass).
    robots: NOINDEX_ROBOTS,
    ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
    openGraph: { title: "Estudisc — preparação para o IFSC 2027", description: "Aulas, questões explicadas, simulados e provas anteriores do IFSC.", siteName: "Estudisc", locale: "pt_BR", type: "website" }
  };
}

/** ADR 0069: the vibrante theme (lime frame, Archivo heavy) is the default for everyone. */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Proxy sets this per request. The tracker script is parser-inserted, so it needs the nonce or CSP blocks it.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="pt-BR" className={`${archivo.variable} ${mono.variable}`} data-theme="vibrante" data-palette="a" data-type="archivo">
      <head>
        <script
          defer
          nonce={nonce}
          src="https://insights.codedbym.com/tracker/v1.js"
          data-site="ci_pub_1fd6036cc05e5bd72833ee1845a3fed0"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

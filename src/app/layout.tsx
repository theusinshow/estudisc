import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/features/public-site/site-url";
// Private owner state is always request-scoped, never a shared prerendered page.
export const dynamic="force-dynamic";

// Self-hosted at build time, so the CSP `font-src 'self'` stays intact.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(await siteUrl()),
    title: "Estudisc",
    description: "Preparação para a prova do IFSC 2027 com aulas, questões explicadas, simulados e provas anteriores.",
    applicationName: "Estudisc",
    openGraph: { title: "Estudisc — preparação para o IFSC 2027", description: "Aulas, questões explicadas, simulados e provas anteriores do IFSC.", siteName: "Estudisc", locale: "pt_BR", type: "website" }
  };
}

/** ADR 0069: the vibrante theme (lime frame, Archivo heavy) is the default for everyone. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${mono.variable}`} data-theme="vibrante" data-palette="a" data-type="archivo">
      <body>{children}</body>
    </html>
  );
}

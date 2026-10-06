import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
// Private owner state is always request-scoped, never a shared prerendered page.
export const dynamic="force-dynamic";

// Self-hosted at build time, so the CSP `font-src 'self'` stays intact.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Estudisc",
  description: "Estudo para o IFSC com aulas, prática e revisão baseadas em evidências.",
  applicationName: "Estudisc",
  openGraph: { title: "Estudisc", description: "Estudo, prática e revisão para o IFSC.", siteName: "Estudisc", locale: "pt_BR", type: "website" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Archivo, Fredoka, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { getOwnerProfile } from "@/features/auth/owner";
import { parseThemeCookie, THEME_COOKIE, themeAttributes } from "@/features/design-lab/theme-cookie";
import { siteUrl } from "@/features/public-site/site-url";
// Private owner state is always request-scoped, never a shared prerendered page.
export const dynamic="force-dynamic";

// Self-hosted at build time, so the CSP `font-src 'self'` stays intact.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
// Rounded title face for the design lab's vibrante theme ([data-type="rounded"]).
const rounded = Fredoka({ subsets: ["latin"], variable: "--font-rounded", display: "swap" });

/** The vibrante preview cookie is honored only for ADMIN; the profile is read only when the cookie exists. */
async function adminLabTheme() {
  const theme = parseThemeCookie((await cookies()).get(THEME_COOKIE)?.value);
  if (!theme) return null;
  try {
    return (await getOwnerProfile()).role === "ADMIN" ? theme : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(await siteUrl()),
    title: "Estudisc",
    description: "Preparação para a prova do IFSC 2027 com aulas, questões explicadas, simulados e provas anteriores.",
    applicationName: "Estudisc",
    openGraph: { title: "Estudisc — preparação para o IFSC 2027", description: "Aulas, questões explicadas, simulados e provas anteriores do IFSC.", siteName: "Estudisc", locale: "pt_BR", type: "website" }
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = await adminLabTheme();
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${mono.variable} ${rounded.variable}`} {...themeAttributes(theme)}>
      <body>{children}</body>
    </html>
  );
}

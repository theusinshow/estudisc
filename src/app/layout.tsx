import type { Metadata } from "next";
import "./globals.css";
// Private owner state is always request-scoped, never a shared prerendered page.
export const dynamic="force-dynamic";

export const metadata: Metadata = {
  title: "KNOW/OS",
  description: "Personal Learning Operating System"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

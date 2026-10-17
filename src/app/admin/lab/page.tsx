import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedError, requireAdmin } from "@/features/auth/owner";
import { contrastReport, type LabPalette } from "@/features/design-lab/contrast";
import { LabGallery } from "@/features/design-lab/lab-gallery";
import { parseThemeCookie, THEME_COOKIE, type LabTheme } from "@/features/design-lab/theme-cookie";
import { loadSampleQuestion } from "@/features/public-site/sample-question-loader";
import { setLabTheme } from "./actions";

export const dynamic = "force-dynamic";

const PALETTE_NAMES: Record<LabPalette, string> = { a: "Limão", b: "Lavanda", c: "Pêssego" };

export default async function DesignLabPage({ searchParams }: Readonly<{ searchParams: Promise<{ palette?: string; type?: string }> }>) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AccessDeniedError) notFound();
    throw error;
  }
  const params = await searchParams;
  const saved = parseThemeCookie((await cookies()).get(THEME_COOKIE)?.value);
  const palette: LabPalette = params.palette === "a" || params.palette === "b" || params.palette === "c" ? params.palette : saved?.palette ?? "a";
  const type: LabTheme["type"] = params.type === "archivo" || params.type === "rounded" ? params.type : saved?.type ?? "archivo";
  const sample = await loadSampleQuestion();
  const report = contrastReport(palette);

  return (
    <AppShell>
      <div className="lab-page">
        <form className="lab-controls" method="get">
          <h1 className="type-title">Lab de design</h1>
          <label>Paleta{" "}
            <select name="palette" defaultValue={palette}>
              {(Object.keys(PALETTE_NAMES) as LabPalette[]).map((key) => <option key={key} value={key}>{PALETTE_NAMES[key]}</option>)}
            </select>
          </label>
          <label>Fonte dos títulos{" "}
            <select name="type" defaultValue={type}>
              <option value="archivo">Archivo pesado</option>
              <option value="rounded">Arredondada</option>
            </select>
          </label>
          <button type="submit" className="secondary-action">Comparar</button>
        </form>
        <form className="lab-controls" action={setLabTheme}>
          <input type="hidden" name="palette" value={palette} />
          <input type="hidden" name="type" value={type} />
          <button type="submit" name="apply" value="on" className="primary-action">Ver o app inteiro neste tema</button>
          <button type="submit" name="apply" value="off" className="secondary-action">Voltar ao tema atual</button>
          <p role="status">{saved ? `App inteiro: Vibrante (${PALETTE_NAMES[saved.palette]}, ${saved.type === "rounded" ? "arredondada" : "Archivo"})` : "App inteiro: tema atual"}</p>
        </form>
        <div className="lab-columns">
          <div className="lab-column" data-theme-preview="current">
            <p className="type-meta">Atual</p>
            <LabGallery sample={sample} />
          </div>
          <div className="lab-column" data-theme="vibrante" data-palette={palette} data-type={type}>
            <p className="type-meta">Vibrante · {PALETTE_NAMES[palette]}</p>
            <LabGallery sample={sample} />
          </div>
        </div>
        <section className="lab-report-section">
          <h2 className="type-title">Contraste (WCAG AA)</h2>
          <table className="lab-report">
            <thead><tr><th>Par</th><th>Razão</th><th>Resultado</th></tr></thead>
            <tbody>
              {report.map((pair) => (
                <tr key={pair.label}><td>{pair.label}</td><td>{pair.ratio.toFixed(2)}:1</td><td>{pair.passes ? "Passa" : "Falha"}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}

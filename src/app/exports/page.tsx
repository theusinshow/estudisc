import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { getExportPreviews } from "@/features/export/api";
import { RestorePreviewPanel } from "@/features/restore/components/restore-preview-panel";

export const dynamic = "force-dynamic";

export default async function ExportsPage() {
  const previews = await getExportPreviews();

  return (
    <AppShell>
      <section className="foundation-panel content-panel" aria-labelledby="exports-title">
        <p className="eyebrow">Seus dados</p>
        <h1 id="exports-title">Exports</h1>
        <p>Pré-visualize categorias e avisos de privacidade antes de gerar JSON local.</p>

        <ol className="record-list" aria-label="Tipos de export">
          {previews.map((preview) => (
            <li key={preview.kind}>
              <div>
                <strong>{preview.label}</strong>
                <span>{preview.approximateRecordCount} registro(s) estimados.</span>
                <small>{preview.warnings.length > 0 ? preview.warnings.join(" ") : "Sem aviso privado."}</small>
                <ul className="inline-list" aria-label={`Categorias de ${preview.label}`}>
                  {preview.categories.map((category) => (
                    <li key={category.id}>
                      {category.label}: {category.count}
                      {category.private ? " · privado" : ""}
                    </li>
                  ))}
                </ul>
                <Link href={`/api/export?type=${preview.kind}`}>Gerar JSON</Link>
              </div>
            </li>
          ))}
        </ol>

        <RestorePreviewPanel />
      </section>
    </AppShell>
  );
}

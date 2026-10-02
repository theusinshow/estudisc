import "@/styles/admin-review.css";
import { AppShell } from "@/components/layout/app-shell";
import { WeekImportCard } from "@/features/import/components/week-import-card";
import { TrackPackImporter } from "@/features/import/components/track-pack-importer";
import { getDeepSeekGenerationConfig } from "@/features/generation/infrastructure/deepseek-config.server";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  const deepSeek = getDeepSeekGenerationConfig();

  return (
    <AppShell>
      <section className="foundation-panel content-panel import-panel accent-panel accent-import" aria-labelledby="import-title">
        <p className="eyebrow">Importar conteúdo</p>
        <h1 id="import-title">Ativar catálogo</h1>
        <p>Importe a trilha do IFSC com um clique. Depois, revise e publique cada aula para o aluno.</p>

        <WeekImportCard />

        <details className="editorial-advanced">
          <summary>Importação avançada (JSON ou aula gerada por IA)</summary>
          <TrackPackImporter deepSeek={deepSeek} />
        </details>
      </section>
    </AppShell>
  );
}

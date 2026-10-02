import { AppShell } from "@/components/layout/app-shell";
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
        <p>
          Escolha entre estudar uma trilha pronta ou criar uma aula nova. Em ambos os caminhos, o Vecta faz
          preview antes de aplicar e bloqueia conflitos.
        </p>

        <TrackPackImporter deepSeek={deepSeek} />
      </section>
    </AppShell>
  );
}

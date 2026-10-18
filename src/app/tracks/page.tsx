import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { listTracks } from "@/features/tracks/api";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  const tracks = await safeListTracks();
  // One published track: "Estudar" opens it directly instead of a one-card catalog.
  if (tracks.status === "ok" && tracks.items.length === 1) redirect(`/tracks/${encodeURIComponent(tracks.items[0]!.stableId)}`);

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-learn" aria-labelledby="tracks-title">
        <p className="eyebrow">Trilhas</p>
        <h1 id="tracks-title">Catálogo</h1>
        {tracks.status === "not_configured" ? (
          <p>Configure `DATABASE_URL` ou use `pglite://memory` em desenvolvimento para importar conteúdo.</p>
        ) : tracks.items.length === 0 ? (
          <FirstRunCallout
            title="Nenhuma trilha importada."
            description="O catálogo fica vazio até você validar e ativar um Pack ou uma lição."
          />
        ) : (
          <ul className="record-list" aria-label="Trilhas disponíveis">
            {tracks.items.map((track) => (
              <li key={track.stableId}>
                <Link href={`/tracks/${track.stableId}`}>
                  <strong>{track.title}</strong>
                  <span>{track.description ?? "Sem descrição"}</span>
                  <small>{track.lessonCount} {track.lessonCount === 1 ? "aula" : "aulas"}</small>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

async function safeListTracks() {
  try {
    return { status: "ok" as const, items: await listTracks() };
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL is not configured") {
      return { status: "not_configured" as const, items: [] };
    }

    throw error;
  }
}

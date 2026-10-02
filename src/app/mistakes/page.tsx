import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { listMistakes } from "@/features/mistakes/api";

export const dynamic = "force-dynamic";

export default async function MistakesPage() {
  const mistakes = await listMistakes();

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-mistakes" aria-labelledby="mistakes-title">
        <p className="eyebrow">Erros</p>
        <h1 id="mistakes-title">Erros registrados</h1>
        <p>
          Erros ficam ligados à tentativa e ao conceito. Quando corrigidos, mudam para resolvido sem
          desaparecer do histórico.
        </p>

        {mistakes.length === 0 ? (
          <FirstRunCallout
            title="Nenhum erro categorizado."
            description="Erros úteis aparecem depois de praticar uma atividade importada e enviar uma solução."
            studentTitle="Nenhum erro por enquanto."
            studentDescription="Quando uma resposta não der certo, o erro fica guardado aqui para você corrigir depois."
          />
        ) : (
          <ol className="record-list" aria-label="Erros categorizados">
            {mistakes.map((mistake) => (
              <li key={mistake.id}>
                <div>
                  <Link href={`/concepts/${mistake.conceptStableId}`}>
                    <strong>{mistake.conceptTitle}</strong>
                  </Link>
                  <span>{mistake.summary}</span>
                  <small>
                    {mistake.category} · {mistake.status}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AppShell>
  );
}

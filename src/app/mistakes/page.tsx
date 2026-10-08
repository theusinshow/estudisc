import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { getMistakeReflections, listMistakes } from "@/features/mistakes/api";
import { groupMistakeObservations } from "@/features/mistakes/mistake-patterns";
import { TargetedPracticeControls } from "@/features/study-sessions/targeted-practice-controls";
import { getFeatureFlags } from "@/lib/feature-flags";
import { MistakeReflectionForm } from "@/features/mistakes/reflection-form";
import { pedagogicalMistakeLabels } from "@/features/mistakes/mistake-patterns";
import { AiActionControl } from "@/features/ai/action-control";

export const dynamic = "force-dynamic";

export default async function MistakesPage() {
  const mistakes = await listMistakes();
  const enhanced=getFeatureFlags().FEATURE_SMART_MISTAKES,groups=enhanced?groupMistakeObservations(mistakes):[];
  const reflections=enhanced?await getMistakeReflections():[];

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-mistakes" aria-labelledby="mistakes-title">
        <p className="eyebrow">Erros</p>
        <h1 id="mistakes-title">Erros registrados</h1>
        <p>
          Erros ficam ligados à tentativa e ao conceito. Quando corrigidos, mudam para resolvido sem
          desaparecer do histórico.
        </p>
        {getFeatureFlags().FEATURE_AI_LEARNING&&mistakes.length>0&&<details className="activity-technical-details"><summary>Síntese opcional dos registros</summary><p>A IA resume os fatos registrados. Ela não identifica a causa do erro nem muda seu domínio.</p><AiActionControl label="Resumir registros com IA" spec={{action:"analyze_mistakes",target:{kind:"mistakes"}}}/></details>}

        {mistakes.length === 0 ? (
          <FirstRunCallout
            title="Nenhum erro categorizado."
            description="Erros úteis aparecem depois de praticar uma atividade importada e enviar uma solução."
            studentTitle="Nenhum erro por enquanto."
            studentDescription="Quando uma resposta não der certo, o erro fica guardado aqui para você corrigir depois."
          />
        ) : enhanced ? <>
          <p>O agrupamento mostra registros do mesmo conceito. Recorrência não é um diagnóstico da causa.</p>
          <ol className="record-list" aria-label="Padrões observados por conceito">{groups.map(group=><li key={group.conceptId}>
            <div><Link href={`/concepts/${encodeURIComponent(group.conceptId)}`}><strong>{group.conceptTitle}</strong></Link>
              <span>{group.recurring?"Tentativas recorrentes":"Uma tentativa observada"}</span><p>{group.explanation}</p>
              <small>{group.resolvedCount} {group.resolvedCount===1?"registro resolvido":"registros resolvidos"} · causa ainda não estabelecida</small>
              <Link href={`/concepts/${encodeURIComponent(group.conceptId)}`}>Ver explicação e aulas do conceito</Link>
              {group.activeMistakeId&&<TargetedPracticeControls kind="remediation" mistakeId={group.activeMistakeId}/>}
              <MistakeReflectionForm mistakeId={group.activeMistakeId??group.mistakeIds[0]}/>
              {reflections.filter(r=>group.mistakeIds.includes(r.mistakeId)).length>0&&<details><summary>Percepções informadas por você</summary><ul>{reflections.filter(r=>group.mistakeIds.includes(r.mistakeId)).map(r=><li key={r.id}><strong>{pedagogicalMistakeLabels[r.category]} · relato do aluno</strong>{r.note&&<p>{r.note}</p>}</li>)}</ul></details>}
              <details><summary>Registros originais</summary><ul>{mistakes.filter(row=>group.mistakeIds.includes(row.id)).map(row=><li key={row.id}>{row.summary} · {row.category} · {row.status}</li>)}</ul></details>
            </div>
          </li>)}</ol>
        </> : (
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

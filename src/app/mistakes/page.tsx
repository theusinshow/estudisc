import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isLearningAiAvailable } from "@/features/ai/availability";

import { AppShell } from "@/components/layout/app-shell";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { getMistakeReflections, listMistakes } from "@/features/mistakes/api";
import { groupMistakeObservations } from "@/features/mistakes/mistake-patterns";
import { PracticeMinutesPicker, PracticeMinutesProvider, TargetedPracticeControls } from "@/features/study-sessions/targeted-practice-controls";
import { getFeatureFlags } from "@/lib/feature-flags";
import { MistakeReflectionForm } from "@/features/mistakes/reflection-form";
import { pedagogicalMistakeLabels } from "@/features/mistakes/mistake-patterns";
import { AiActionControl } from "@/features/ai/action-control";
import { studentConceptLabel } from "@/features/concepts/student-label";

export const dynamic = "force-dynamic";

/** Student words for the stored category and status codes. */
const categoryLabel = (category: string) => ({ CALCULATION: "na conta", INTERPRETATION: "na leitura do enunciado" } as Record<string, string>)[category] ?? "no raciocínio";
const statusLabel = (status: string) => status === "resolved" ? "corrigido" : "para corrigir";
const dayMonth = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });

export default async function MistakesPage() {
  const mistakes = await listMistakes();
  const enhanced=getFeatureFlags().FEATURE_SMART_MISTAKES,groups=enhanced?groupMistakeObservations(mistakes):[];
  const reflections=enhanced?await getMistakeReflections():[];

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-mistakes" aria-labelledby="mistakes-title">
        <p className="eyebrow">Erros</p>
        <h1 id="mistakes-title">Meus erros</h1>
        <p>
          Aqui ficam as questões que você errou, juntas por assunto. Errar faz parte: quando você
          acertar de novo sem ajuda, o erro conta como corrigido e continua no seu histórico.
        </p>
        {isLearningAiAvailable()&&mistakes.length>0&&<details className="activity-technical-details"><summary>Quer um resumo dos seus erros?</summary><p>A IA resume o que você errou. Ela não muda seu progresso.</p><AiActionControl label="Resumir meus erros com IA" spec={{action:"analyze_mistakes",target:{kind:"mistakes"}}}/></details>}

        {mistakes.length === 0 ? (
          <FirstRunCallout
            title="Nenhum erro por enquanto."
            description="Erros úteis aparecem depois de praticar uma atividade importada e enviar uma solução."
            studentTitle="Nenhum erro por enquanto."
            studentDescription="Quando uma resposta não der certo, o erro fica guardado aqui para você corrigir depois."
          />
        ) : enhanced ? <PracticeMinutesProvider>
          <p>Comece pelo assunto em que você errou mais vezes.</p>
          {/* One practice length for every subject below. */}
          <PracticeMinutesPicker />
          <ol className="record-list mistake-queue" aria-label="Erros por assunto">{groups.map(group=><li key={group.conceptId}>
            <div><Link href={`/concepts/${encodeURIComponent(group.conceptId)}`}><strong>{studentConceptLabel(group.conceptTitle)}</strong></Link>
              <span>{group.recurring?"Errou mais de uma vez":"Errou uma vez"}</span><p>{group.explanation}</p>
              {group.resolvedCount>0&&<small>{group.resolvedCount} {group.resolvedCount===1?"já corrigido":"já corrigidos"}</small>}
              <Link className="mistake-review-link" href={`/concepts/${encodeURIComponent(group.conceptId)}`}>Rever a explicação e as aulas<ArrowRight aria-hidden="true" /></Link>
              {group.activeMistakeId&&<TargetedPracticeControls kind="remediation" mistakeId={group.activeMistakeId} showTime={false}/>}
              {!reflections.some(r=>group.mistakeIds.includes(r.mistakeId))&&<p>Ainda não sabemos por que você errou. Quer contar?</p>}
              <MistakeReflectionForm mistakeId={group.activeMistakeId??group.mistakeIds[0]}/>
              {reflections.filter(r=>group.mistakeIds.includes(r.mistakeId)).length>0&&<details><summary>O que você anotou</summary><ul>{reflections.filter(r=>group.mistakeIds.includes(r.mistakeId)).map(r=><li key={r.id}><strong>{pedagogicalMistakeLabels[r.category]} </strong>{r.note&&<p>{r.note}</p>}</li>)}</ul></details>}
              <details><summary>Ver cada erro</summary><ul>{mistakes.filter(row=>group.mistakeIds.includes(row.id)).map(row=><li key={row.id}>Erro {categoryLabel(row.category)}, em {dayMonth.format(row.createdAt)} · {statusLabel(row.status)}</li>)}</ul></details>
            </div>
          </li>)}</ol>
        </PracticeMinutesProvider> : (
          <ol className="record-list mistake-queue" aria-label="Erros por assunto">
            {mistakes.map((mistake) => (
              <li key={mistake.id}>
                <div>
                  <Link href={`/concepts/${mistake.conceptStableId}`}>
                    <strong>{studentConceptLabel(mistake.conceptTitle)}</strong>
                  </Link>
                  <span><time className="type-meta" dateTime={mistake.createdAt.toISOString()}>registrado em {dayMonth.format(mistake.createdAt)}</time> · {mistake.summary}</span>
                  <small>
                    Erro {categoryLabel(mistake.category)} · {statusLabel(mistake.status)}
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

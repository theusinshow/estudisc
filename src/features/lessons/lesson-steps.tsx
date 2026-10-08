import { Fragment, type ReactNode } from "react";
import { AiActionControl } from "@/features/ai/action-control";

import { ActivityList, type ActivityRecord } from "@/features/activities/registry";
import { LessonBlockRenderer, type ImportedLessonBlock } from "./blocks";
import { LessonStepper, type LessonCompletion, type LessonStep } from "./lesson-stepper";
import { LessonResumeProvider } from "./resume-provider";
import type { ResumeScope, ResumeSnapshot } from "./resume-contracts";

const blockKind: Record<string, LessonStep["kind"]> = { concept: "concept", "worked-example": "example", example: "example", warning: "warning", summary: "summary", figure: "figure", prediction: "prediction" };
const stepLabel: Record<LessonStep["kind"], string> = { intro: "Para começar", concept: "Conceito", example: "Exemplo resolvido", warning: "Cuidado", summary: "Resumo", check: "Checagem rápida", practice: "Prática", exit: "Desafio final", interaction: "Atividade", figure: "Observe", prediction: "Pare e pense" };
const config = (activity: ActivityRecord) => (activity.config ?? {}) as { phase?: string; checkpointFor?: string };

/** Turns the existing lesson blocks and activities into one-idea-per-screen steps. Content-driven, no subject branches. */
export function LessonSteps({ blocks, activities, completion, resumeScope, resumeSnapshot = null, aiScope }: Readonly<{ blocks: ReadonlyArray<ImportedLessonBlock>; activities: ReadonlyArray<ActivityRecord>; completion?: LessonCompletion; resumeScope?: ResumeScope; resumeSnapshot?: ResumeSnapshot | null; aiScope?: Pick<ResumeScope,"trackId"|"lessonId"|"version"> }>) {
  const steps: Array<Omit<LessonStep, "label"> & { node: ReactNode }> = [];
  const used = new Set<string>();
  let pendingText: ImportedLessonBlock[] = [];
  let openConcept: string | undefined;
  const renderGroup=(group:ImportedLessonBlock[])=>{
    const target=[...group].reverse().find(item=>["text","concept","note","warning","example","worked-example","summary"].includes(item.type)&&typeof (item.payload as {content?:unknown}|null)?.content==="string");
    return <Fragment>{group.map(item=><LessonBlockRenderer block={item} key={item.stableId}/>)}{aiScope&&target&&<details className="activity-technical-details"><summary>Explicação opcional deste trecho</summary><AiActionControl key={JSON.stringify([aiScope,target.stableId])} label="Explicar de outro jeito" spec={{action:"explain_differently",target:{kind:"lesson",...aiScope,blockId:target.stableId}}}/></details>}</Fragment>;
  };
  const closeConcept = () => {
    for (const activity of activities) if (openConcept && config(activity).checkpointFor === openConcept && !used.has(activity.stableId)) {
      used.add(activity.stableId);
      steps.push({ id: activity.stableId, kind: "check", node: <ActivityList activities={[activity]} /> });
    }
    openConcept = undefined;
  };
  blocks.forEach((block, index) => {
    // A prediction is never part of a concept, so the previous concept's quick check comes before it.
    if (block.type === "concept" || block.type === "summary" || block.type === "prediction") closeConcept();
    if (block.type === "text" && index > 0) { pendingText.push(block); return; }
    const group = [...pendingText, block];
    pendingText = [];
    steps.push({ id: block.stableId, kind: index === 0 && block.type === "text" ? "intro" : blockKind[block.type] ?? "interaction", node: renderGroup(group) });
    if (block.type === "concept") openConcept = block.stableId;
  });
  closeConcept();
  if (pendingText.length) steps.push({ id: pendingText[0].stableId, kind: "interaction", node: renderGroup(pendingText) });
  const remaining = activities.filter(activity => !used.has(activity.stableId));
  for (const exit of [false, true]) for (const activity of remaining) if ((config(activity).phase === "exit_ticket") === exit) steps.push({ id: activity.stableId, kind: exit ? "exit" : "practice", node: <ActivityList activities={[activity]} /> });

  const body = <LessonStepper steps={steps.map(step => ({ ...step, label: stepLabel[step.kind] }))} completion={completion} />;
  return resumeScope ? <LessonResumeProvider scope={resumeScope} initial={resumeSnapshot}>{body}</LessonResumeProvider> : body;
}

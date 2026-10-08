import type { MistakeRecord } from "@/db/repositories/mistake-repository";

export const pedagogicalMistakeCategories = ["concept_gap", "procedure_error", "misconception", "attention_error", "interpretation_error", "calculation_error", "prerequisite_gap"] as const;
export type PedagogicalMistakeCategory = typeof pedagogicalMistakeCategories[number];
export const pedagogicalMistakeLabels: Record<PedagogicalMistakeCategory,string> = {
  concept_gap:"Lacuna de conceito",procedure_error:"Procedimento",misconception:"Concepção equivocada",attention_error:"Atenção",interpretation_error:"Interpretação",calculation_error:"Cálculo",prerequisite_gap:"Pré-requisito"
};
export type MistakePattern = Readonly<{
  conceptId:string;conceptTitle:string;attemptIds:readonly string[];mistakeIds:readonly string[];
  activeCount:number;resolvedCount:number;latestAt:Date;categories:readonly string[];recurring:boolean;
  activeMistakeId:string|null;explanation:string;causeStatus:"not_established";
}>;
/** Factual read projection. Counts never diagnose causes or mutate canonical evidence. */
export function groupMistakeObservations(records:readonly MistakeRecord[]):MistakePattern[]{
  const grouped=new Map<string,MistakeRecord[]>();
  for(const row of records){const items=grouped.get(row.conceptStableId)??[];if(!items.some(old=>old.id===row.id))items.push(row);grouped.set(row.conceptStableId,items);}
  return [...grouped].map(([conceptId,rows])=>{
    const sorted=rows.slice().sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()||a.id.localeCompare(b.id));
    const attemptIds=[...new Set(sorted.map(row=>row.attemptId))].sort();
    const active=sorted.filter(row=>row.status==="active"),resolved=sorted.filter(row=>row.status==="resolved");
    return {conceptId,conceptTitle:sorted[0].conceptTitle,attemptIds,mistakeIds:sorted.map(row=>row.id),activeCount:active.length,resolvedCount:resolved.length,latestAt:sorted[0].createdAt,categories:[...new Set(sorted.map(row=>row.category))].sort(),recurring:attemptIds.length>=2,activeMistakeId:active[0]?.id??null,
      explanation:`${attemptIds.length} ${attemptIds.length===1?"tentativa registrada":"tentativas registradas"} neste conceito; ${active.length} ${active.length===1?"erro ativo":"erros ativos"}. A resposta incorreta, sozinha, não identifica a causa.`,causeStatus:"not_established" as const};
  }).sort((a,b)=>b.activeCount-a.activeCount||b.latestAt.getTime()-a.latestAt.getTime()||a.conceptId.localeCompare(b.conceptId));
}

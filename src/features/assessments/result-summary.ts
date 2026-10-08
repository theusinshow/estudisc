export function summarizeAssessmentConcepts(items:readonly {outcome:string;conceptIds:readonly string[]}[]){
  const result=new Map<string,{conceptId:string;correct:number;scored:number;annulled:number}>();
  for(const item of items)for(const conceptId of new Set(item.conceptIds)){const row=result.get(conceptId)??{conceptId,correct:0,scored:0,annulled:0};if(item.outcome==="annulled")row.annulled++;else{row.scored++;if(item.outcome==="passed")row.correct++;}result.set(conceptId,row);}
  return [...result.values()].sort((a,b)=>a.conceptId.localeCompare(b.conceptId));
}

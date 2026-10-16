const letters=["A","B","C","D","E"] as const;
/** 28-item 2025.1-shaped sheet; key at position p is letters[(p-1)%5]; position 15 is annulled. */
export function sheetTemplateInput(overrides:Record<string,unknown>={}){
  return {id:"past-exam-test-2025-1",version:1,title:"Prova 2025.1",kind:"PAST_EXAM_SHEET",trackId:"ifsc-2027",durationMinutes:240,status:"published",
    exam:{examId:"ifsc-integrado-2025-1",edition:"2025.1",year:2025,variant:"Aplicação geral",appliedOn:"2024-11-24",examType:"Exame de Classificação - Cursos Técnicos Integrados ao Ensino Médio",publisher:"IFSC - Instituto Federal de Santa Catarina"},
    subjects:[{name:"Português",start:1,end:7},{name:"Matemática",start:8,end:14},{name:"Geografia e História",start:15,end:21},{name:"Ciências",start:22,end:28}],
    items:Array.from({length:28},(_,index)=>({position:index+1,key:index===14?"ANNULLED":letters[index%5]})),
    links:{examUrl:"https://www.ifsc.edu.br/documents/d/ingresso/prova-teste",answerKeyUrl:"https://www.ifsc.edu.br/documents/d/ingresso/gabarito-teste",sourcePage:"https://www.ifsc.edu.br/provas-e-gabaritos"},
    provenance:{catalogDataset:"IFSC-provas-anteriores-integrado",catalogVerifiedAt:"2026-10-16",catalogSha256:"a".repeat(64),transcriptionNote:"Gabarito transcrito do gabarito definitivo.",publication:{mode:"ADMIN_DIRECT",reason:"Fixture de teste do cartão-resposta."}},
    ...overrides};
}

import Link from "next/link";
import type { SheetView } from "./sheet-view";
const outcomeLabel={correct:"Acertou",incorrect:"Errou",blank:"Em branco",annulled:"Anulada"} as const;
const dateOnly=(value:string)=>value.split("-").reverse().join("/");
export function PastExamResult({view}:{view:SheetView}){
  const result=view.result;if(!result)return <p>Resultado indisponível.</p>;
  return <>
    <section className="score-card" aria-label="Pontuação"><strong>{result.correct}<span>/{result.scored}</span></strong><p>{result.annulled?`${result.annulled} anulada(s) fora da conta. `:""}Critério de treino do Estudisc; não reproduz a regra oficial de classificação.</p></section>
    {result.bySubject.length>0&&<section className="module-section" aria-labelledby="sheet-by-subject"><h2 id="sheet-by-subject">Por área</h2><ul className="subject-bars">{result.bySubject.map(subject=><li key={subject.name}><span>{subject.name}</span><progress className="bar" value={subject.correct} max={Math.max(subject.scored,1)} aria-hidden="true"/><strong>{subject.correct}/{subject.scored}</strong>{subject.annulled?<small>{subject.annulled} anulada(s)</small>:null}</li>)}</ul></section>}
    <section className="module-section" aria-labelledby="sheet-positions"><h2 id="sheet-positions">Questão por questão</h2>
      <table className="sheet-result-table"><thead><tr><th scope="col">Questão</th><th scope="col">Sua resposta</th><th scope="col">Gabarito</th><th scope="col">Resultado</th></tr></thead>
        <tbody>{result.byPosition.map(row=><tr key={row.position} data-outcome={row.outcome}><th scope="row">{row.position}</th><td>{row.answer??"—"}</td><td>{row.key==="ANNULLED"?"Anulada":row.key}</td><td>{outcomeLabel[row.outcome]}</td></tr>)}</tbody></table>
    </section>
    <p className="past-exam-actions"><a className="past-exam-link" href={view.links.examUrl} target="_blank" rel="noopener noreferrer">Caderno oficial</a>{view.links.answerKeyUrl&&<a className="past-exam-link" href={view.links.answerKeyUrl} target="_blank" rel="noopener noreferrer">Gabarito oficial</a>}</p>
    <p className="past-exam-notice">{view.provenance.transcriptionNote} Catálogo conferido em {dateOnly(view.provenance.catalogVerifiedAt)}.</p>
    <Link className="primary-action" href="/past-exams">Voltar às provas anteriores</Link>
  </>;
}

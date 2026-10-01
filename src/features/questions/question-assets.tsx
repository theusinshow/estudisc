import type { StudentQuestion } from "./student-view";
export function QuestionAssets({assets}:Pick<StudentQuestion,"assets">){return <>{assets.map(asset=><figure className="question-source-figure" key={asset.id}>
  {/* Authenticated images must remain outside the public optimizer cache. */}
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src={`/api/question-assets/${asset.id}`} alt={asset.alt} width={asset.width} height={asset.height} loading="lazy"/>
  <figcaption>Página {asset.page} do caderno original. <a href={`/api/question-assets/${asset.id}`} target="_blank" rel="noopener noreferrer">Ampliar imagem</a></figcaption></figure>)}</>;}

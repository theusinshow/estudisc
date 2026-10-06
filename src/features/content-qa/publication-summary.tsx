import type { PublicationDetails } from "./publication-details";
const labels = { editorial_reviewed: "Revisão editorial", admin_direct: "Publicação direta por ADMIN", legacy_unknown: "Publicação histórica sem modo comprovado" };
export function PublicationSummary({ details }: { details: PublicationDetails | null | undefined }) {
  if (!details?.published) return null;
  return <div className="editorial-meta"><strong>{details.publicationMode ? labels[details.publicationMode] : "Publicada"}</strong><p>{details.authorizedBy ? `Autorizada por ${details.authorizedBy}.` : "Autorização histórica não registrada."} {details.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(details.publishedAt) : "Data exata não registrada."}</p><p>Revisão editorial independente registrada: {details.independentQaRecorded ? `sim (${details.approvedLayers}/4 camadas, autor diferente do revisor)` : "não comprovada"}.</p>{details.reason && <p>Motivo: {details.reason}</p>}</div>;
}

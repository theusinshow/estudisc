import type { SellerIdentity } from "./seller";

/** Who sells and answers for the service. Without configured data it says so instead of showing blanks. */
export function SellerBlock({ seller }: Readonly<{ seller: SellerIdentity | null }>) {
  if (!seller) return <p className="public-note" role="status">Os dados do responsável pelo Estudisc serão publicados aqui antes do início das vendas.</p>;
  return (
    <dl className="public-seller">
      <div><dt>Responsável</dt><dd>{seller.name}</dd></div>
      <div><dt>CPF/CNPJ</dt><dd>{seller.document}</dd></div>
      <div><dt>Contato</dt><dd><a href={`mailto:${seller.email}`}>{seller.email}</a></dd></div>
    </dl>
  );
}

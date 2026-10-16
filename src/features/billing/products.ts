/** Sellable access products (ADR 0061). Configuration, not curriculum: one product per exam cohort. */
export type Product = Readonly<{ id: string; title: string; description: string; priceCents: number; currency: "BRL"; accessEndsAt: string }>;

export const products: readonly Product[] = [
  {
    id: "ifsc-2027-1-full",
    title: "Estudisc — acesso completo até a prova do IFSC 2027/1",
    description: "Todas as aulas, questões, revisão e simulados de Matemática, Português, Ciências e Geografia e História até o dia da prova (29/11/2026).",
    priceCents: 5000,
    currency: "BRL",
    // End of the exam day in Brasília (UTC−3).
    accessEndsAt: "2026-11-30T03:00:00.000Z"
  }
];

export const DEFAULT_PRODUCT_ID = "ifsc-2027-1-full";
export function findProduct(id: string) { return products.find(product => product.id === id) ?? null; }
export function formatPrice(product: Product) {
  return (product.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: product.currency });
}

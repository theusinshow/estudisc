"use client";

import { useId, useState } from "react";
import type { z } from "zod";
import { numericExplorerSchema } from "./numeric-explorer-schema";

export function NumericExplorer({ initialValue, initialPercentage }: z.infer<typeof numericExplorerSchema>) {
  const id = useId();
  const [base, setBase] = useState(String(initialValue));
  const [percentage, setPercentage] = useState(String(initialPercentage));
  const numericBase = Number(base.replace(",", "."));
  const numericPercentage = Number(percentage.replace(",", "."));
  const valid = base.trim() !== "" && percentage.trim() !== "" && numericExplorerSchema.safeParse({ initialValue: numericBase, initialPercentage: numericPercentage }).success;
  return <section className="learning-interaction" aria-labelledby={`${id}-title`}><h3 id={`${id}-title`}>Explore a porcentagem</h3><div className="learning-controls"><label className="learning-field">Valor base<input inputMode="decimal" value={base} onChange={event => setBase(event.target.value)} /></label><label className="learning-field">Porcentagem<input inputMode="decimal" value={percentage} onChange={event => setPercentage(event.target.value)} /></label></div><output aria-live="polite">{valid ? `${numericPercentage.toLocaleString("pt-BR")}% de ${numericBase.toLocaleString("pt-BR")} = ${(numericBase * numericPercentage / 100).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}` : "Informe uma base entre 0 e 1.000.000 e uma porcentagem entre 0 e 500."}</output><p>A porcentagem representa uma parte a cada 100. Alterar os valores ajuda a comparar a parte com o total.</p></section>;
}

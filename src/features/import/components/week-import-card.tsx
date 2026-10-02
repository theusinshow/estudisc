"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Download } from "lucide-react";

type State = { kind: "idle" } | { kind: "busy" } | { kind: "done"; already: boolean } | { kind: "error"; message: string };

/** One-click import of the bundled IFSC Week 1 (draft). Publication stays in /admin/review. */
export function WeekImportCard() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function importWeek() {
    setState({ kind: "busy" });
    try {
      const response = await fetch("/api/admin/import-week", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message ?? "A importação falhou.");
      setState({ kind: "done", already: body.status === "already_imported" });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "A importação falhou." });
    }
  }

  return (
    <section className="editorial-import" aria-labelledby="week-import-title">
      <h2 id="week-import-title">Trilha IFSC 2027: Semana 1</h2>
      <p>
        12 aulas das quatro áreas, com figuras e atividades. Elas entram como rascunho: o aluno só vê cada aula depois que você revisar e publicar.
      </p>
      {state.kind === "done" ? (
        <>
          <p className="editorial-message" data-kind="ok" role="status">
            {state.already ? "A Semana 1 já estava importada." : "Semana 1 importada como rascunho."} Agora revise cada aula para liberar ao aluno.
          </p>
          <Link href="/admin/review" className="primary-action">Revisar aulas <ArrowRight aria-hidden="true" /></Link>
        </>
      ) : (
        <button type="button" className="primary-button" onClick={() => void importWeek()} disabled={state.kind === "busy"}>
          <Download aria-hidden="true" /> {state.kind === "busy" ? "Importando…" : "Importar a Semana 1"}
        </button>
      )}
      {state.kind === "error" ? <p className="editorial-message" data-kind="error" role="alert">Nada foi importado: {state.message}</p> : null}
    </section>
  );
}

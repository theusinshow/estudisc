import Link from "next/link";

import { getOwnerProfile } from "@/features/auth/owner";

type FirstRunCalloutProps = Readonly<{
  title?: string;
  description?: string;
  studentTitle?: string;
  studentDescription?: string;
}>;

/**
 * Empty state for pages that depend on published content. Students only learn that lessons are on the
 * way; the admin gets the steps that actually release content.
 */
export async function FirstRunCallout({
  title = "Nenhuma aula publicada.",
  description = "Importe uma trilha e publique as aulas revisadas para liberar o estudo.",
  studentTitle = "Suas aulas ainda não foram liberadas.",
  studentDescription = "Assim que o conteúdo for publicado, ele aparece aqui. Você não precisa fazer nada."
}: FirstRunCalloutProps) {
  const isAdmin = await getOwnerProfile().then((profile) => profile.role === "ADMIN").catch(() => false);

  if (!isAdmin) {
    return (
      <div className="lesson-callout first-run-callout" role="status" aria-label="Conteúdo em preparação">
        <span className="lesson-callout-label">Em preparação</span>
        <strong>{studentTitle}</strong>
        <p>{studentDescription}</p>
      </div>
    );
  }

  return (
    <div className="lesson-callout first-run-callout" role="status" aria-label="Primeiro uso">
      <span className="lesson-callout-label">Primeiro uso</span>
      <strong>{title}</strong>
      <p>{description}</p>
      <ol className="first-run-steps" aria-label="Ordem para começar">
        <li>
          <strong>1. Importar a trilha</strong>
          <span>Em Importar, envie o Pack da trilha. O conteúdo entra como rascunho.</span>
        </li>
        <li>
          <strong>2. Revisar e publicar</strong>
          <span>Em Administração, revise cada versão nas quatro camadas e publique.</span>
        </li>
        <li>
          <strong>3. Conferir como aluno</strong>
          <span>Entre com a conta de aluno e abra a primeira aula liberada.</span>
        </li>
      </ol>
      <Link className="primary-action" href="/import">
        Importar trilha
      </Link>
    </div>
  );
}

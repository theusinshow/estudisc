import Link from "next/link";
import { notFound } from "next/navigation";

import "@/styles/admin-review.css";
import { AppShell } from "@/components/layout/app-shell";
import { getDatabase, getDatabaseUrl } from "@/db/connection";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { AccessDeniedError, requireAdmin } from "@/features/auth/owner";

export const dynamic = "force-dynamic";

const subjectLabel: Record<string, string> = { MAT: "Matemática", POR: "Português", CIE: "Ciências", GH: "Geografia e História" };
const statusLabel: Record<string, string> = { draft: "Rascunho", published: "Publicada", retired: "Retirada" };

export default async function LessonReviewQueuePage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AccessDeniedError) notFound();
    throw error;
  }

  if (!getDatabaseUrl() || getDatabaseUrl() === "memory://local") {
    return (
      <AppShell>
        <div className="editorial-page">
          <h1>Revisão de aulas</h1>
          <p className="editorial-lede">A revisão usa o banco de dados persistente. O modo de demonstração não aprova conteúdo.</p>
        </div>
      </AppShell>
    );
  }

  const queue = await new ContentQaRepository(getDatabase()).lessonQueue();
  const subjects = [...new Set(queue.map((item) => item.lesson.subject))];

  return (
    <AppShell>
      <div className="editorial-page">
        <header>
          <h1>Revisão de aulas</h1>
          <p className="editorial-lede">
            Abra uma aula, confira como o aluno vai vê-la, leia as questões e registre as quatro camadas de revisão. Ao aprovar, a aula e as questões dela são publicadas juntas.
          </p>
        </header>

        {queue.length === 0 ? (
          <p className="editorial-empty">Nenhuma aula importada ainda. Importe a trilha em <Link href="/import">Importar</Link>.</p>
        ) : (
          subjects.map((subject) => (
            <section key={subject} className="editorial-group" aria-labelledby={`subject-${subject}`}>
              <h2 id={`subject-${subject}`}>{subjectLabel[subject] ?? subject}</h2>
              <ul className="editorial-list">
                {queue.filter((item) => item.lesson.subject === subject).map((item) => {
                  const status = item.release?.status ?? "unregistered";
                  const published = item.questions.filter((question) => question.release?.status === "published").length;
                  return (
                    <li key={`${item.lesson.id}@${item.lesson.version}`}>
                      <Link href={`/admin/review/${encodeURIComponent(item.lesson.id)}?version=${item.lesson.version}`} className="editorial-item" data-status={status}>
                        <span className="editorial-item-title">
                          <strong>{item.lesson.title}</strong>
                          <small>{item.lesson.id} · versão {item.lesson.version} · {published}/{item.questions.length} questões publicadas</small>
                        </span>
                        <span className="editorial-status">{statusLabel[status] ?? "Sem registro"}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { StudyActionCard } from "@/features/today/study-action-card";
import type { NextLesson } from "./next-lesson";

const subjectNames: Record<string, string> = { MAT: "Matemática", CIE: "Ciências", GH: "Geografia e História", POR: "Língua Portuguesa" };
const subjectName = (code: string) => subjectNames[code] ?? code;

/** ADR 0060: one whole lesson at a time; leaving mid-way resumes on the lesson page. */
export function ContinueStudy({ next, bySubject }: Readonly<{ next: NextLesson | null; bySubject: readonly NextLesson[] }>) {
  const others = bySubject.filter(entry => entry.lesson.id !== next?.lesson.id);
  return <>
    <section className="today-next" aria-labelledby="continue-title">
      <h2 id="continue-title">Continuar estudando</h2>
      {next ? <StudyActionCard variant={next.resume ? "continue" : "lesson"} title={next.lesson.title}
        reason={next.resume ? `${subjectName(next.lesson.subjectCode)} · você parou no meio desta aula. Continue de onde parou.`
          : `${subjectName(next.lesson.subjectCode)} · próxima aula. Faça no seu ritmo: se sair no meio, continua de onde parou.`}
        href={`/lessons/${next.lesson.id}`} estimatedMinutes={next.lesson.estimatedMinutes} />
        : <p>Você terminou todas as aulas publicadas. Use Revisão e Erros para manter o que aprendeu.</p>}
    </section>
    {others.length > 0 && <section className="today-queue" aria-labelledby="subjects-title">
      <h2 id="subjects-title">Ou escolha outra matéria</h2>
      <ol>{others.map(entry => <li key={entry.lesson.id}>
        <Link href={`/lessons/${entry.lesson.id}`} data-kind="continue">
          <span><strong>{subjectName(entry.lesson.subjectCode)}</strong><small>{entry.resume ? "Continuar: " : "Próxima: "}{entry.lesson.title} · ~{entry.lesson.estimatedMinutes} min</small></span>
        </Link>
      </li>)}</ol>
    </section>}
  </>;
}

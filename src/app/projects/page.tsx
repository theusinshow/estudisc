import { AppShell } from "@/components/layout/app-shell";
import { listProjects } from "@/features/projects/api";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <AppShell>
      <section className="foundation-panel content-panel" aria-labelledby="projects-title">
        <p className="eyebrow">Projetos</p>
        <h1 id="projects-title">Projetos</h1>
        <p>
          Contextos de projeto conectam conceitos e atividades a aplicação real. Eles são opcionais; o
          fluxo principal de lições continua independente.
        </p>

        {projects.length === 0 ? (
          <div className="lesson-callout" role="status">
            <strong>Nenhum projeto registrado.</strong>
            <span>Projetos aparecerão aqui quando um contexto for criado ou importado.</span>
          </div>
        ) : (
          <ol className="record-list" aria-label="Projetos registrados">
            {projects.map((project) => (
              <li key={project.stableId}>
                <div>
                  <strong>{project.title}</strong>
                  <span>{project.description ?? "Sem descrição."}</span>
                  <small>
                    {project.status} · {project.conceptCount} conceito vinculado · {project.activityCount} atividade
                    vinculada
                  </small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AppShell>
  );
}

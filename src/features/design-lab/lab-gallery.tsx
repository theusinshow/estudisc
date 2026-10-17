import { BrandLockup } from "@/components/brand/brand-lockup";
import { SampleQuestion, type SampleQuestionData } from "@/features/public-site/sample-question";

const SUBJECTS = [
  { token: "mathematics", name: "Matemática", lesson: "Porcentagem" },
  { token: "science", name: "Ciências", lesson: "Movimento" },
  { token: "portuguese", name: "Português", lesson: "Inferência e leitura de contexto" },
  { token: "history-geography", name: "Geografia e História", lesson: "Fusos horários" }
] as const;

/** Real components and app classes, rendered once per theme column in /admin/lab. */
export function LabGallery({ sample }: Readonly<{ sample: SampleQuestionData | null }>) {
  return (
    <div className="lab-gallery">
      <BrandLockup />
      <section>
        <h2 className="type-title">Botões e filtros</h2>
        <div className="lab-row">
          <button type="button" className="primary-action elev-action">Continuar estudando</button>
          <button type="button" className="secondary-action">Ver plano</button>
          <span className="lab-chip">Hoje</span>
          <span className="lab-chip">Semana</span>
        </div>
        <label className="lab-field">Seu nome<input type="text" placeholder="Digite aqui" /></label>
      </section>
      <section>
        <h2 className="type-title">Matérias</h2>
        <div className="lab-subjects">
          {SUBJECTS.map((subject) => (
            <article key={subject.token} className="lab-subject elev-surface" style={{ background: `var(--estudisc-color-subject-accent-${subject.token})` }}>
              <p className="type-meta">{subject.name}</p>
              <h3>{subject.lesson}</h3>
              <p>Aula 3 de 12 · 8 min</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="type-title">Questão</h2>
        {sample ? <SampleQuestion question={sample} /> : <p>Sem questão de amostra.</p>}
      </section>
      <section>
        <h2 className="type-title">Leitura</h2>
        <div className="reading-column">
          <p>Porcentagem é uma razão com denominador 100. Dizer que 29% dos bilhetes pedem revisão significa que, a cada 100 bilhetes, 29 pedem.</p>
          <p>Para achar 18% de 300, calcule 0,18 × 300 = 54.</p>
        </div>
      </section>
      <section>
        <h2 className="type-title">Estado vazio</h2>
        <div className="lab-empty elev-surface">
          <div className="lab-illustration" aria-hidden="true" />
          <p>Nada para revisar hoje. Volte amanhã!</p>
        </div>
      </section>
    </div>
  );
}

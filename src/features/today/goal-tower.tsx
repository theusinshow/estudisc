/** Daily goal tower (ADR 0069, lab 8.11): one block per Question answered today, from the real record. */
export const DAILY_GOAL = 10;

export function goalTowerText(answered: number, goal = DAILY_GOAL) {
  if (answered >= goal) return `Meta feita! ${answered} questões hoje.`;
  if (answered === 0) return `Cada questão respondida hoje empilha um bloco. Meta sugerida: ${goal}.`;
  const left = goal - answered;
  return `${answered} de ${goal}. ${left === 1 ? "Falta 1 questão" : `Faltam ${left} questões`} para a meta.`;
}

/** `decorative`: a screenshot-like copy (landing) whose title must not become a page heading. */
export function GoalTower({ answered, goal = DAILY_GOAL, decorative = false }: Readonly<{ answered: number; goal?: number; decorative?: boolean }>) {
  const blocks = Math.min(answered, goal);
  return (
    <section className="goal-tower" aria-labelledby={decorative ? undefined : "goal-title"} data-done={answered >= goal || undefined}>
      <div className="goal-tower-text">
        {decorative ? <p className="goal-tower-title">Meta do dia</p> : <h2 id="goal-title">Meta do dia</h2>}
        <p>{goalTowerText(answered, goal)}</p>
      </div>
      <div className="goal-tower-stack" role="img" aria-label={`${blocks} de ${goal} blocos empilhados`}>
        {Array.from({ length: blocks }, (_, index) => <span key={index} className="goal-block" />)}
        <span className="goal-tower-base">{Math.min(answered, 999)}/{goal}</span>
      </div>
    </section>
  );
}

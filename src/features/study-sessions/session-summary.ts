import { sessionItemsSchema } from "./contracts";

type Answer = { key: string; outcome: string };
type Evidence = { conceptId: string; title: string; strength: number; conditions: Record<string, unknown> };

export function summarizeSession(session: { budgetMinutes: number; items: unknown; startedAt: Date | null; endedAt: Date | null }, answers: readonly Answer[], evidence: readonly Evidence[]) {
  const items = sessionItemsSchema.parse(session.items), latest = new Map(answers.map(answer => [answer.key, answer]));
  const independent = evidence.filter(fact => fact.conditions.outcome === "passed" && fact.conditions.hintLevel === 0 && fact.conditions.solutionRevealed === false && fact.strength > 0);
  return { budgetMinutes: session.budgetMinutes, plannedMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
    wallMinutes: session.startedAt && session.endedAt ? Math.max(0, (session.endedAt.getTime() - session.startedAt.getTime()) / 60_000) : null,
    answered: latest.size, correct: [...latest.values()].filter(answer => answer.outcome === "passed").length, attempts: answers.length,
    independentConcepts: [...new Map(independent.map(fact => [fact.conceptId, { id: fact.conceptId, title: fact.title }])).values()],
    reviewedConcepts: [...new Set(independent.filter(fact => fact.conditions.delayedRetrieval === true).map(fact => fact.conceptId))].length };
}

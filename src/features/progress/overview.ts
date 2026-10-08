import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";
import { masteryStateLabels, type MasteryState } from "@/features/mastery/mastery-policy";
import { calculateVersionedMastery } from "@/features/mastery/mastery-policy-v2";

export const masteryOrder: readonly MasteryState[] = ["unseen", "introduced", "understood", "practicing", "strong", "mastered"];

/** Saving availability is configuration, not evidence that a study day happened. */
export function studyActivityDates(events: readonly { type: string; occurredAt: Date }[]) {
  return events.filter(event => !["study_plan_applied","evolution_schema_activation","ai_request"].includes(event.type)).map(event => event.occurredAt);
}

export type OverviewConcept = Readonly<{ stableId: string; title: string; areaTitles: readonly string[] }>;

export type LadderRung = Readonly<{
  state: MasteryState;
  level: number;
  label: string;
  count: number;
  concepts: ReadonlyArray<Readonly<{ stableId: string; title: string }>>;
}>;

/** `fading`: retention fell below the review threshold; `missed`: the latest answer failed after a success. */
export type CoolingConcept = Readonly<{ stableId: string; title: string; state: MasteryState; label: string; retention: number; reason: "fading" | "missed" }>;

export type AreaBalance = Readonly<{ title: string; conceptCount: number; practicedCount: number; averageLevel: number }>;

export type ActivityDay = Readonly<{ date: string; count: number; weekday: number; isToday: boolean; isFuture: boolean }>;

export type ProgressOverview = Readonly<{
  totalConcepts: number;
  conceptsWithEvidence: number;
  practicingOrAbove: number;
  ladder: readonly LadderRung[];
  cooling: readonly CoolingConcept[];
  areas: readonly AreaBalance[];
  activity: readonly ActivityDay[];
  week: readonly ActivityDay[];
  activeDaysLast28: number;
  activeDaysThisWeek: number;
}>;

type OverviewInput = Readonly<{
  concepts: readonly OverviewConcept[];
  evidence: readonly ConceptEvidenceRecord[];
  eventDates: readonly Date[];
  now: Date;
  timeZone?: string;
  weeks?: number;
}>;

// Retention below this is what the v2 review policy already treats as due.
const COOLING_THRESHOLD = 0.6;
const COOLING_LIMIT = 5;

/**
 * Progress is described by concept mastery from append-only evidence, computed with the same versioned
 * policy used everywhere else. Study days count study events and answered attempts; there is no streak to lose.
 */
export function buildProgressOverview({ concepts, evidence, eventDates, now, timeZone = "America/Sao_Paulo", weeks = 16 }: OverviewInput): ProgressOverview {
  const evidenceByConcept = new Map<string, ConceptEvidenceRecord[]>();
  for (const item of evidence) {
    const list = evidenceByConcept.get(item.conceptStableId) ?? [];
    list.push(item);
    evidenceByConcept.set(item.conceptStableId, list);
  }

  const assessed = concepts.map((concept) => {
    const conceptEvidence = evidenceByConcept.get(concept.stableId) ?? [];
    const mastery = calculateVersionedMastery(conceptEvidence, now);
    const retention = "retention" in mastery ? mastery.retention : null;
    return { concept, state: mastery.state, level: masteryOrder.indexOf(mastery.state), hasEvidence: conceptEvidence.length > 0, retention, reviewDue: "reviewDue" in mastery && mastery.reviewDue };
  });

  const ladder = masteryOrder.map((state, level) => {
    const members = assessed.filter((entry) => entry.state === state);
    return { state, level, label: masteryStateLabels[state], count: members.length, concepts: members.map(({ concept }) => ({ stableId: concept.stableId, title: concept.title })) };
  });

  // Retention 0 means no independent success yet: nothing was learned to forget, so it is not cooling.
  const cooling = assessed
    .flatMap((entry) => {
      if (entry.retention === null || entry.retention <= 0) return [];
      const reason = entry.retention < COOLING_THRESHOLD ? "fading" as const : entry.reviewDue ? "missed" as const : null;
      return reason ? [{ stableId: entry.concept.stableId, title: entry.concept.title, state: entry.state, label: masteryStateLabels[entry.state], retention: entry.retention, reason }] : [];
    })
    .sort((left, right) => (left.reason === right.reason ? left.retention - right.retention : left.reason === "fading" ? -1 : 1))
    .slice(0, COOLING_LIMIT);

  const areaMap = new Map<string, { conceptCount: number; practicedCount: number; levelSum: number }>();
  for (const entry of assessed) {
    for (const title of entry.concept.areaTitles) {
      const area = areaMap.get(title) ?? { conceptCount: 0, practicedCount: 0, levelSum: 0 };
      area.conceptCount += 1;
      area.levelSum += entry.level;
      if (entry.hasEvidence) area.practicedCount += 1;
      areaMap.set(title, area);
    }
  }
  const areas = [...areaMap.entries()]
    .map(([title, area]) => ({ title, conceptCount: area.conceptCount, practicedCount: area.practicedCount, averageLevel: area.levelSum / area.conceptCount }))
    .sort((left, right) => left.title.localeCompare(right.title, "pt-BR"));

  // Question answers are recorded as attempts with evidence, not always as study events, so both count.
  const attemptDates = new Map(evidence.map((item) => [item.attemptId ?? item.id, item.createdAt]));
  const { activity, week } = buildActivity([...eventDates, ...attemptDates.values()], now, timeZone, weeks);
  const todayIndex = activity.findIndex((day) => day.isToday);
  const last28 = activity.slice(Math.max(0, todayIndex - 27), todayIndex + 1);

  return {
    totalConcepts: concepts.length,
    conceptsWithEvidence: assessed.filter((entry) => entry.hasEvidence).length,
    practicingOrAbove: assessed.filter((entry) => entry.level >= masteryOrder.indexOf("practicing")).length,
    ladder,
    cooling,
    areas,
    activity,
    week,
    activeDaysLast28: last28.filter((day) => day.count > 0).length,
    activeDaysThisWeek: week.filter((day) => day.count > 0).length
  };
}

/** Sunday-aligned day grid ending on the current week, so each heatmap row is one weekday. */
function buildActivity(eventDates: readonly Date[], now: Date, timeZone: string, weeks: number) {
  const keyOf = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const counts = new Map<string, number>();
  for (const date of eventDates) {
    const key = keyOf.format(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const todayKey = keyOf.format(now);
  const today = new Date(`${todayKey}T00:00:00Z`);
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - today.getUTCDay() - (weeks - 1) * 7);

  const days: ActivityDay[] = [];
  for (let cursor = new Date(start); days.length < weeks * 7; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    days.push({ date, count: counts.get(date) ?? 0, weekday: cursor.getUTCDay(), isToday: date === todayKey, isFuture: date > todayKey });
  }

  return { activity: days.filter((day) => !day.isFuture), week: days.slice(-7) };
}

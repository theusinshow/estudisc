import { AppShell } from "@/components/layout/app-shell";
import { getGamificationSummary } from "@/features/gamification/api";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const gamification = await getGamificationSummary();

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-progress" aria-labelledby="achievements-title">
        <p className="eyebrow">Conquistas</p>
        <h1 id="achievements-title">Rank, badges e missões</h1>
        <p>Critérios são determinísticos. XP mede jornada; Mastery continua separado.</p>

        <section className="module-section" aria-labelledby="rank-title">
          <h2 id="rank-title">Rank</h2>
          <div className="mastery-panel" aria-label="Rank atual">
            <p className="technical-label">Nível</p>
            <p className="mastery-score">
              {gamification.rank.label} <span>{gamification.rank.currentXp} XP</span>
            </p>
            <p className="lesson-text">{gamification.rank.explanation}</p>
          </div>
        </section>

        <section className="module-section" aria-labelledby="badges-title">
          <h2 id="badges-title">Badges</h2>
          <ol className="record-list" aria-label="Badges">
            {gamification.badges.map((badge) => (
              <li key={badge.id}>
                <div>
                  <strong>{badge.label}</strong>
                  <span>{badge.criteria}</span>
                  <small>{badge.earned ? `earned${formatTimestamp(badge.awardedAt)}` : "locked"}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="module-section" aria-labelledby="missions-title">
          <h2 id="missions-title">Missões</h2>
          <ol className="record-list" aria-label="Missões">
            {gamification.missions.map((mission) => (
              <li key={mission.id}>
                <div>
                  <strong>{mission.label}</strong>
                  <span>{mission.criteria}</span>
                  <small>
                    {mission.status}
                    {formatTimestamp(mission.completedAt ?? mission.persistedAt)}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </section>
    </AppShell>
  );
}

function formatTimestamp(value: Date | null) {
  if (!value) {
    return "";
  }

  return ` · ${value.toISOString().slice(0, 10)}`;
}

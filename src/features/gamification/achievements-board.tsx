import Link from "next/link";
import { ArrowRight, Backpack, Brain, CalendarDays, Check, Code2, LockKeyhole, Rocket, RotateCcw, Trophy, Zap } from "lucide-react";
import type { BadgeSummary, GamificationSummary } from "./gamification-rules";

const badgeIcons = {
  "first-submit": Rocket,
  "study-practice-five": Zap,
  "study-practice-twenty": Backpack,
  "returned-stronger": Brain,
  "study-comeback": RotateCcw,
  "study-steady-three": CalendarDays
};

function BadgeMark({ badge }: Readonly<{ badge: BadgeSummary }>) {
  const Icon = badgeIcons[badge.id as keyof typeof badgeIcons] ?? Code2;
  return <span className="achievement-mark" data-category={badge.category} data-badge={badge.id}><Icon aria-hidden="true" /></span>;
}

export function AchievementsBoard({ summary }: Readonly<{ summary: GamificationSummary }>) {
  const { rank, week, missions } = summary;
  const badges = summary.badges.filter(badge => badge.category !== "legacy");
  const legacy = summary.badges.filter(badge => badge.category === "legacy");
  const earned = badges.filter(badge => badge.earned);
  const next = badges.filter(badge => !badge.earned).sort((a, b) => b.current / b.target - a.current / a.target)[0];
  const weeklyComplete = week.activeDays >= week.targetDays;
  const rankDistance = rank.nextRankAt === null ? 0 : rank.nextRankAt - rank.currentXp;

  return <div className="achievements-page">
    <header className="achievements-heading">
      <h1>Suas conquistas</h1>
      <p>Uma questão, uma descoberta, um passo a mais na preparação para o IFSC.</p>
    </header>

    <section className="achievement-next" aria-labelledby="next-achievement-title">
      {next ? <>
        <BadgeMark badge={next} />
        <div className="achievement-next-copy">
          <p className="achievement-status"><LockKeyhole aria-hidden="true" /> Próxima conquista</p>
          <h2 id="next-achievement-title">{next.label}</h2>
          <p>{next.criteria}</p>
          <div className="achievement-meter">
            <progress max={next.target} value={next.current} aria-label={`Progresso para ${next.label}`} />
            <strong>{next.current}/{next.target} {next.unit}</strong>
          </div>
          <Link href={next.href} className="primary-action">Buscar essa conquista <ArrowRight aria-hidden="true" /></Link>
        </div>
      </> : <>
        <span className="achievement-mark" data-category="rhythm"><Trophy aria-hidden="true" /></span>
        <div className="achievement-next-copy">
          <p className="achievement-status"><Check aria-hidden="true" /> Coleção completa</p>
          <h2 id="next-achievement-title">Olha o caminho que você fez.</h2>
          <p>Seus selos ficam com você. Continue praticando e revisitando o que aprendeu.</p>
          <Link href="/" className="primary-action">Continuar meu estudo <ArrowRight aria-hidden="true" /></Link>
        </div>
      </>}
    </section>

    <section className="achievement-week" aria-labelledby="study-week-title">
      <div className="achievement-week-heading">
        <div><h2 id="study-week-title">Um pouco, mais vezes.</h2><p>Responda questões em 3 dias nesta semana. Você escolhe quais.</p></div>
        <strong className="achievement-week-count">{weeklyComplete && <Check aria-hidden="true" />}{Math.min(week.activeDays, week.targetDays)}/{week.targetDays} dias{weeklyComplete && <span>Meta feita!</span>}</strong>
      </div>
      <ol className="achievement-days" aria-label="Seus dias de estudo nesta semana">
        {week.days.map(day => <li key={day.date} data-active={day.active} data-today={day.today} aria-current={day.today ? "date" : undefined}>
          <span>{day.label}</span>
          <span className="achievement-day-mark" aria-hidden="true">{day.active ? <Check /> : day.today ? <span className="achievement-day-dot" /> : <span />}</span>
          <span className="visually-hidden">{day.date}: {day.active ? "questão respondida" : day.future ? "dia futuro" : "sem resposta"}{day.today ? ", hoje" : ""}</span>
          {day.today && <small aria-hidden="true">hoje</small>}
        </li>)}
      </ol>
      <p className="achievement-week-note">Errou? A tentativa conta como prática. Perdeu um dia? Suas conquistas continuam com você.</p>
    </section>

    <section aria-labelledby="badge-album-title" className="achievement-album">
      <div className="achievement-section-heading"><div><h2 id="badge-album-title">Seu álbum de estudo</h2><p>Abra um selo para ver como conquistar.</p></div><strong>{earned.length}/{badges.length} conquistados</strong></div>
      <ul className="achievement-collection" aria-label="Selos de estudo">
        {badges.map(badge => <li key={badge.id}>
          <details className="achievement-badge" data-earned={badge.earned}>
            <summary>
              <BadgeMark badge={badge} />
              <strong>{badge.label}</strong>
              <span className="achievement-badge-state">{badge.earned ? <Check aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}{badge.earned ? "Conquistado" : "A conquistar"}</span>
              <span className="achievement-badge-count">{badge.earned ? "Selo na coleção" : `${badge.current}/${badge.target} ${badge.unit}`}</span>
            </summary>
            <div className="achievement-badge-detail">
              <p>{badge.criteria}</p>
              {badge.awardedAt && <p className="achievement-date">Conquistado em {formatDate(badge.awardedAt)}</p>}
              {!badge.earned && <Link href={badge.href}>Praticar para conquistar <ArrowRight aria-hidden="true" /></Link>}
            </div>
          </details>
        </li>)}
      </ul>
    </section>

    <section aria-labelledby="study-missions-title" className="achievement-missions">
      <div className="achievement-section-heading"><div><h2 id="study-missions-title">Missões que fazem você avançar</h2><p>Cada missão tem uma regra clara. Sem adivinhar o que falta.</p></div></div>
      <ol className="achievement-mission-list">
        {missions.map(mission => <li key={mission.id} data-complete={mission.status === "complete"}>
          <span className="achievement-mission-icon" aria-hidden="true">{mission.status === "complete" ? <Check /> : <ArrowRight />}</span>
          <div><h3>{mission.label}</h3><p>{mission.criteria}</p><span className="achievement-mission-progress">{mission.current}/{mission.target} {mission.unit}{mission.status === "complete" ? " · Concluída" : " · Em andamento"}</span></div>
          {mission.status === "available" && <Link href={mission.href} aria-label={`Praticar: ${mission.label}`}>Praticar <ArrowRight aria-hidden="true" /></Link>}
        </li>)}
      </ol>
    </section>

    <section className="achievement-rank" aria-labelledby="study-rank-title">
      <div><h2 id="study-rank-title">Seu nível de jornada</h2><p className="achievement-rank-name">{rank.label} <span>{rank.currentXp} XP</span></p></div>
      {rank.nextRankAt !== null ? <div className="achievement-rank-progress">
        <progress value={rank.currentXp - rank.startsAt} max={rank.nextRankAt - rank.startsAt} aria-label={`Progresso para o nível ${rank.nextLabel}`} />
        <p>Faltam {rankDistance} XP para <strong>{rank.nextLabel}</strong>.</p>
      </div> : <p>Você chegou ao nível mais alto desta jornada. Continue ampliando sua bagagem.</p>}
      <p className="achievement-xp-rule">+20 XP no primeiro acerto de cada questão de estudo, sem dica nem solução aberta. Repetir a mesma questão não soma XP.</p>
      <p className="achievement-separation">{rank.explanation} <Link href="/progress">Ver meu aprendizado <ArrowRight aria-hidden="true" /></Link></p>
    </section>

    {legacy.length > 0 && <details className="achievement-history">
      <summary>Conquistas de programação · {legacy.length}</summary>
      <ul>{legacy.map(badge => <li key={badge.id}><Code2 aria-hidden="true" /><div><strong>{badge.label}</strong><p>{badge.criteria}</p>{badge.awardedAt && <small>{formatDate(badge.awardedAt)}</small>}</div></li>)}</ul>
    </details>}
  </div>;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short" }).format(value);
}

"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import type { MasteryState } from "@/features/mastery/mastery-policy";
import { MasteryGlyph } from "./mastery-glyph";
import type { LadderRung } from "./overview";

// Wording follows mastery.v2 thresholds; concepts still on mastery.v1 evidence use the older policy.
const rungMeaning: Record<MasteryState, string> = {
  unseen: "Ainda sem nenhuma resposta registrada.",
  introduced: "Já apareceu nas suas respostas, mas sem acerto independente.",
  understood: "Pelo menos um acerto sem dica e sem ver a solução.",
  practicing: "Dois ou mais acertos independentes.",
  strong: "Acertos em dias e questões diferentes, incluindo uma recuperação depois de um intervalo.",
  mastered: "Recuperação depois de um intervalo e aplicação num contexto diferente."
};

const VISIBLE_CONCEPTS = 12;

/** The frontier: the lowest practiced rung that has concepts, where the next evidence matters most. */
function defaultRung(rungs: readonly LadderRung[]) {
  return rungs.find((rung) => rung.level > 0 && rung.count > 0)?.state ?? "unseen";
}

export function MasteryLadder({ rungs }: Readonly<{ rungs: readonly LadderRung[] }>) {
  const [selected, setSelected] = useState<MasteryState>(() => defaultRung(rungs));
  const panelId = useId();
  const current = rungs.find((rung) => rung.state === selected) ?? rungs[0];
  const topDown = [...rungs].reverse();

  return (
    <div className="ladder">
      <ol className="ladder-steps" aria-label="Degraus de domínio, do mais alto ao mais baixo">
        {topDown.map((rung) => (
          <Reveal as="li" key={rung.state} index={rung.level} className="ladder-rung" data-level={String(rung.level)}>
            <button
              type="button"
              className="ladder-step"
              data-empty={rung.count === 0 ? "true" : undefined}
              aria-pressed={rung.state === selected}
              aria-controls={panelId}
              onClick={() => setSelected(rung.state)}
            >
              <span className="ladder-name">
                <MasteryGlyph level={rung.level} />
                {rung.label}
              </span>
              <span className="ladder-count">
                <CountUp value={rung.count} delay={0.15 + rung.level * 0.06} />
                <small>{rung.count === 1 ? "conceito" : "conceitos"}</small>
              </span>
            </button>
          </Reveal>
        ))}
      </ol>

      <section id={panelId} className="ladder-panel" aria-live="polite" aria-labelledby={`${panelId}-title`}>
        <h3 id={`${panelId}-title`}>
          <MasteryGlyph level={current.level} />
          {current.label}
        </h3>
        <p>{rungMeaning[current.state]}</p>
        {current.count === 0 ? (
          <p className="ladder-empty">Nenhum conceito neste degrau agora.</p>
        ) : (
          <ul className="ladder-concepts">
            {current.concepts.slice(0, VISIBLE_CONCEPTS).map((concept) => (
              <li key={concept.stableId}>
                <Link href={`/concepts/${concept.stableId}`}>{concept.title}</Link>
              </li>
            ))}
            {current.count > VISIBLE_CONCEPTS ? (
              <li>
                <Link href="/knowledge-map" className="ladder-more">
                  Mais {current.count - VISIBLE_CONCEPTS} no mapa de conhecimento
                </Link>
              </li>
            ) : null}
          </ul>
        )}
      </section>
    </div>
  );
}

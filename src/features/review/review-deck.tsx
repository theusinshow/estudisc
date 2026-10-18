"use client";

import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { TargetedPracticeControls } from "@/features/study-sessions/targeted-practice-controls";

export type ReviewCard = Readonly<{ conceptId: string; title: string; reason: string; due: string; blindSpot: boolean }>;

/**
 * The review queue as a deck (ADR 0069, lab 8.5). Swiping or the arrows only move between cards; nothing is
 * recorded until the student practises, because only answered Questions count as review (no self-rating).
 */
export function ReviewDeck({ cards }: Readonly<{ cards: readonly ReviewCard[] }>) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const start = useRef<number | null>(null);
  const count = cards.length, card = cards[Math.min(index, count - 1)];
  const go = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= count) return;
    setLeaving(delta > 0 ? "left" : "right");
    window.setTimeout(() => { setIndex(next); setLeaving(null); }, 180);
  };
  const onDown = (event: PointerEvent<HTMLDivElement>) => { if (!(event.target as HTMLElement).closest("button, a")) start.current = event.clientX; };
  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    if (start.current === null) return;
    const dx = event.clientX - start.current; start.current = null;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  };
  if (!card) return null;
  return (
    <section className="review-deck" aria-roledescription="baralho" aria-label="Revisões em cartões">
      <div className="review-deck-stage" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { start.current = null; }}>
        {index + 1 < count ? <div className="review-card review-card-under" aria-hidden="true" /> : null}
        <article key={card.conceptId} className="review-card" data-leaving={leaving ?? undefined} data-blind-spot={card.blindSpot || undefined} aria-live="polite">
          <p className="review-card-count">Cartão {index + 1} de {count}</p>
          {card.blindSpot ? <p className="review-card-flag"><Flame aria-hidden="true" />Ponto cego</p> : null}
          <h2>{card.title}</h2>
          <p>{card.reason}</p>
          <small>{card.due}</small>
          {/* The time is chosen once, above the deck; a card starts a 10-minute practice. */}
          <TargetedPracticeControls kind="review" conceptId={card.conceptId} label="Praticar este conceito" ariaLabel={`Praticar ${card.title}`} showTime={false} />
        </article>
      </div>
      <div className="review-deck-nav">
        <button type="button" className="secondary-button" disabled={index === 0} onClick={() => go(-1)}><ChevronLeft aria-hidden="true" />Anterior</button>
        <button type="button" className="secondary-button" disabled={index >= count - 1} onClick={() => go(1)}>Próximo<ChevronRight aria-hidden="true" /></button>
      </div>
      <p className="review-deck-hint">Deslize para passar os cartões.</p>
    </section>
  );
}

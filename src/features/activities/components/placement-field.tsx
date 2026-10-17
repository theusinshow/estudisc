"use client";

import { LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { MathText } from "@/components/ui/paragraphs";

type Option = Readonly<{ id: string; label: string }>;
type Props = Readonly<{
  items: readonly Option[]; destinations: readonly Option[]; response: Readonly<Record<string, string>>;
  onChange: (next: Record<string, string>) => void; marks?: Record<string, boolean>; pairs?: Record<string, string>;
  disabled?: boolean; name: string;
}>;

const SPRING = { type: "spring", stiffness: 500, damping: 34 } as const;

/** Long sentences make a tall tray that pushes the boxes off a phone screen: answer them row by row instead. */
export function prefersRows(items: readonly Option[]) {
  return items.length > 6 || items.some(item => item.label.length > 40);
}

function PlacementRows({ items, destinations, response, onChange, marks, pairs, disabled }: Props) {
  const label = (id?: string) => destinations.find(destination => destination.id === id)?.label;
  return (
    <div className="place-rows">
      {items.map(item => (
        <fieldset key={item.id} className="place-row" data-correct={marks?.[item.id]}>
          <legend><MathText text={item.label} /></legend>
          <div className="place-options">
            {destinations.map(destination => (
              <button key={destination.id} type="button" className="place-option" disabled={disabled} aria-pressed={response[item.id] === destination.id}
                onClick={() => onChange({ ...response, [item.id]: destination.id })}><MathText text={destination.label} /></button>
            ))}
          </div>
          <input className="place-required" tabIndex={-1} aria-hidden="true" required value={response[item.id] ?? ""} onChange={() => {}} title="Escolha uma opção para cada item." />
          {marks?.[item.id] !== undefined ? <span className="item-mark" data-correct={marks[item.id]}>{marks[item.id] ? "✓ Certo" : "✗ Revise"}</span> : null}
          {pairs && !marks?.[item.id] && pairs[item.id] ? <span className="place-key">Correto: {label(pairs[item.id])}</span> : null}
        </fieldset>
      ))}
    </div>
  );
}

/**
 * Classification and matching as "tap a piece, then its box" (ADR 0069, lab 8.4). Every action is a button,
 * so touch and keyboard work the same; the piece flies into the box (shared layout). Response shape unchanged.
 */
export function PlacementField(props: Props) {
  return prefersRows(props.items) ? <PlacementRows {...props} /> : <PlacementTap {...props} />;
}

function PlacementTap({ items, destinations, response, onChange, marks, pairs, disabled, name }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const loose = items.filter(item => !response[item.id]);
  const place = (destinationId: string) => { if (!picked) return; onChange({ ...response, [picked]: destinationId }); setPicked(null); };
  const unplace = (itemId: string) => { const next = { ...response }; delete next[itemId]; onChange(next); };
  const piece = (item: Option, inBox: boolean) => (
    <motion.button layout layoutId={`${name}-${item.id}`} key={item.id} type="button" className="place-piece" transition={SPRING} disabled={disabled}
      data-picked={picked === item.id || undefined} data-correct={inBox ? marks?.[item.id] : undefined} aria-pressed={inBox ? undefined : picked === item.id}
      onClick={() => (inBox ? unplace(item.id) : setPicked(picked === item.id ? null : item.id))}
      aria-label={inBox ? `${item.label}${marks?.[item.id] === undefined ? "" : marks[item.id] ? ", certo" : ", revise"}, toque para devolver` : `Pegar ${item.label}`}>
      <MathText text={item.label} />{inBox && marks?.[item.id] !== undefined ? <span aria-hidden="true">{marks[item.id] ? " ✓" : " ✗"}</span> : null}
    </motion.button>
  );
  return (
    <LayoutGroup id={name}>
      <div className="place-field">
        <div className="place-tray" aria-label="Peças">{loose.length ? loose.map(item => piece(item, false)) : <span className="order-hint">Todas no lugar.</span>}</div>
        <p className="place-status" aria-live="polite">{disabled ? " " : picked ? `Agora toque na caixa para “${items.find(item => item.id === picked)?.label}”.` : loose.length ? "Toque numa peça para pegar." : " "}</p>
        {/* Same rule as the old selects: every piece needs a box before the answer can be sent. */}
        {items.map(item => <input key={item.id} className="place-required" tabIndex={-1} aria-hidden="true" required value={response[item.id] ?? ""} onChange={() => {}} title="Coloque todas as peças nas caixas." />)}
        <div className="place-boxes" data-count={destinations.length}>
          {destinations.map(destination => (
            <div key={destination.id} className="place-box" data-ready={picked !== null || undefined}>
              <button type="button" className="place-box-label" disabled={disabled || !picked} onClick={() => place(destination.id)}><MathText text={destination.label} /></button>
              <div className="place-box-body">
                {items.filter(item => response[item.id] === destination.id).map(item => piece(item, true))}
                {pairs ? items.filter(item => pairs[item.id] === destination.id && response[item.id] !== destination.id).map(item => <span key={item.id} className="place-key">Correto aqui: {item.label}</span>) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutGroup>
  );
}

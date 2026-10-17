"use client";

import { ArrowDown, ArrowUp, GripVertical, RotateCcw } from "lucide-react";
import { LayoutGroup, motion, Reorder, useDragControls } from "motion/react";
import { useState } from "react";
import { MathText } from "@/components/ui/paragraphs";

type Item = Readonly<{ id: string; label: string }>;
type Props = Readonly<{ items: readonly Item[]; response: readonly string[]; onChange: (next: string[]) => void; marks?: Record<string, boolean>; disabled?: boolean; name: string }>;

const SPRING = { type: "spring", stiffness: 500, damping: 34 } as const;

/** Short labels read as words of a sentence; longer ones as steps of a solution (ADR 0069 lab 8.3 / 9.7). */
export function isWordOrdering(items: readonly Item[]) {
  return items.length >= 3 && items.every(item => item.label.length <= 18 && !item.label.includes("$"));
}

function Mark({ correct }: Readonly<{ correct?: boolean }>) {
  return correct === undefined ? null : <span className="item-mark" data-correct={correct}>{correct ? "✓ Certo" : "✗ Revise"}</span>;
}

function StepRow({ item, index, count, mark, disabled, onMove }: Readonly<{ item: Item; index: number; count: number; mark?: boolean; disabled?: boolean; onMove: (index: number, delta: number) => void }>) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={item.id} dragListener={false} dragControls={controls} className="order-step" data-correct={mark} whileDrag={{ scale: 1.02, zIndex: 2 }}>
      <span className="order-grip" aria-hidden="true" onPointerDown={event => { if (!disabled) controls.start(event); }}><GripVertical /></span>
      <span className="order-index">{index + 1}</span>
      <span className="order-text"><MathText text={item.label} /></span>
      <Mark correct={mark} />
      <span className="order-moves">
        <button type="button" className="order-move" disabled={disabled || index === 0} aria-label={`Mover ${item.label} para cima`} onClick={() => onMove(index, -1)}><ArrowUp aria-hidden="true" /></button>
        <button type="button" className="order-move" disabled={disabled || index === count - 1} aria-label={`Mover ${item.label} para baixo`} onClick={() => onMove(index, 1)}><ArrowDown aria-hidden="true" /></button>
      </span>
    </Reorder.Item>
  );
}

/** Steps: drag by the grip (the page still scrolls under a finger on the text) or use the arrows. */
function StepsOrdering({ items, response, onChange, marks, disabled }: Props) {
  const byId = new Map(items.map(item => [item.id, item]));
  const move = (index: number, delta: number) => { const next = [...response]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; onChange(next); };
  return (
    <Reorder.Group axis="y" values={[...response]} onReorder={next => { if (!disabled) onChange(next); }} className="order-steps">
      {response.map((id, index) => { const item = byId.get(id); return item ? <StepRow key={id} item={item} index={index} count={response.length} mark={marks?.[`${index}`]} disabled={disabled} onMove={move} /> : null; })}
    </Reorder.Group>
  );
}

/**
 * Words: tap words in order; they fly into the sentence line, tap again to send one back.
 * The response stays a full ordering: placed words first, then the rest as they are in the bank.
 */
function WordsOrdering({ items, response, onChange, marks, disabled, name }: Props) {
  const byId = new Map(items.map(item => [item.id, item]));
  const [placedCount, setPlacedCount] = useState(0);
  const count = Math.min(placedCount, response.length);
  const placed = response.slice(0, count), bank = response.slice(count);
  const remember = (next: number) => setPlacedCount(next);
  const place = (id: string) => { const rest = bank.filter(other => other !== id); remember(placed.length + 1); onChange([...placed, id, ...rest]); };
  const unplace = (id: string) => { const rest = placed.filter(other => other !== id); remember(rest.length); onChange([...rest, id, ...bank]); };
  const chip = (id: string, inLine: boolean, index: number) => (
    <motion.button layout layoutId={`${name}-${id}`} key={id} type="button" className="order-chip" transition={SPRING} disabled={disabled}
      data-correct={inLine ? marks?.[`${index}`] : undefined} onClick={() => (inLine ? unplace(id) : place(id))}
      aria-label={inLine ? `${byId.get(id)?.label}, toque para tirar da frase` : `Colocar ${byId.get(id)?.label} na frase`}>
      <MathText text={byId.get(id)?.label ?? ""} />
    </motion.button>
  );
  return (
    <LayoutGroup id={name}>
      <div className="order-words">
        <div className="order-line" aria-label="Sua ordem">{placed.length ? placed.map((id, index) => chip(id, true, index)) : <span className="order-hint">Toque nas palavras na ordem certa.</span>}</div>
        <div className="order-bank" aria-label="Palavras">{bank.map((id, index) => chip(id, false, placed.length + index))}</div>
        {placed.length > 0 && !disabled ? <button type="button" className="order-reset" onClick={() => { remember(0); onChange([...response]); }}><RotateCcw aria-hidden="true" />Recomeçar</button> : null}
      </div>
    </LayoutGroup>
  );
}

export function OrderingField(props: Props) {
  return isWordOrdering(props.items) ? <WordsOrdering {...props} /> : <StepsOrdering {...props} />;
}

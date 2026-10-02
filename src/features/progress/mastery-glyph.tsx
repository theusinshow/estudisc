/**
 * Drawn counterpart of the design-system mastery glyphs (○ ◔ ◑ ◕ ● ★): a ring that fills by quarters,
 * with a check for "Dominado". Always paired with the text label, never the only cue.
 */
export function MasteryGlyph({ level, className }: Readonly<{ level: number; className?: string }>) {
  const fraction = Math.min(Math.max(level, 0), 4) / 4;
  const angle = fraction * 2 * Math.PI - Math.PI / 2;
  const x = 8 + 6 * Math.cos(angle);
  const y = 8 + 6 * Math.sin(angle);

  return (
    <svg viewBox="0 0 16 16" className={["mastery-glyph", className].filter(Boolean).join(" ")} aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6.5" className="mastery-glyph-ring" />
      {fraction >= 1 ? (
        <circle cx="8" cy="8" r="6" className="mastery-glyph-fill" />
      ) : fraction > 0 ? (
        <path d={`M8 8 L8 2 A6 6 0 ${fraction > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`} className="mastery-glyph-fill" />
      ) : null}
      {level >= 5 ? <path d="M5 8.2 L7.2 10.3 L11 6" className="mastery-glyph-check" /> : null}
    </svg>
  );
}

import type { ReactNode } from "react";

import { numberedSteps, parseMathNotation, type MathSegment } from "./math-notation";

/**
 * Renders recognized notation (contract v1 in math-notation.ts). The visual form is aria-hidden and not
 * selectable; the exact authored characters stay in the DOM for assistive technology, search and copy.
 */
function renderSegments(segments: readonly MathSegment[], visualOnly = false): ReactNode[] {
  return segments.map((segment, index) => {
    if (segment.kind === "text") return segment.text;
    const visual = segment.kind === "sup" ? <sup className="math-sup">{segment.display}</sup>
      : segment.kind === "frac" ? <span className="math-frac"><span className="math-frac-num">{renderSegments(segment.numerator, true)}</span><span className="math-frac-den">{renderSegments(segment.denominator, true)}</span></span>
      : <span className="math-root"><span className="math-root-sign">√</span><span className="math-radicand">{renderSegments(segment.radicand, true)}</span></span>;
    if (visualOnly) return <span key={index}>{visual}</span>;
    return <span className="math-notation" key={index}><span className="math-visual" aria-hidden="true">{visual}</span><span className="math-source">{segment.text}</span></span>;
  });
}

/** Inline authored text (stems, choices, hints, captions) with recognized math notation. */
export function MathText({ text }: Readonly<{ text: string }>) {
  return <>{renderSegments(parseMathNotation(text))}</>;
}

/** A line that is only a web address becomes a link that opens in a new tab. */
function webLink(line: string) {
  const text = line.trim();
  if (!/^https?:\/\/\S+$/.test(text)) return null;
  try { return new URL(text); } catch { return null; }
}
function Line({ text }: Readonly<{ text: string }>) {
  const url = webLink(text);
  return url ? <a href={url.href} target="_blank" rel="noopener noreferrer">Abrir em {url.hostname.replace(/^www\./, "")} ↗</a> : <MathText text={text} />;
}
function Lines({ lines }: Readonly<{ lines: readonly string[] }>) {
  return <>{lines.flatMap((line, index) => index ? [<br key={`br-${index}`} />, <Line key={index} text={line} />] : [<Line key={index} text={line} />])}</>;
}

function Paragraph({ text }: Readonly<{ text: string }>) {
  const lines = text.split("\n");
  const steps = numberedSteps(lines);
  if (!steps) return <p><Lines lines={lines} /></p>;
  return <>
    {steps.lead.length > 0 && <p><Lines lines={steps.lead} /></p>}
    <ol className="math-steps" start={steps.start}>{steps.items.map((item, index) => <li key={index}><MathText text={item} /></li>)}</ol>
    {steps.trail.length > 0 && <p><Lines lines={steps.trail} /></p>}
  </>;
}

// Authored content separates paragraphs with a blank line; numbered steps and verse lines stay one per line.
export function Paragraphs({ text }: Readonly<{ text: string }>) {
  return <>{text.split(/\n\s*\n/).map((paragraph, index) => <Paragraph key={index} text={paragraph} />)}</>;
}

/**
 * Math notation contract v1 (docs/estudisc/FRONTEND-REFINEMENT-2026-10-11.md).
 *
 * A presentation-only reading of authored text. It never evaluates, normalizes or rewrites the source:
 * every recognized segment keeps its exact original text, and anything outside the contract stays a plain
 * text segment. Recognized forms are deliberately narrow:
 * - Unicode superscript runs (`m²`, `10⁻²`, `aᵐ⁺ⁿ`) → exponent rendered with the reading font;
 * - integer fractions `a/b` not touching other digits, letters, `/`, `:` or decimal separators, and
 *   not year-shaped (`2027/1`, `2020/2021` are periods);
 * - `√` followed by a number, one letter, or a balanced parenthesized group, not continued by a letter,
 *   digit or exponent (`√2x`, `√x²` are ambiguous and stay plain).
 */
export type MathSegment =
  | Readonly<{ kind: "text"; text: string }>
  | Readonly<{ kind: "sup"; text: string; display: string }>
  | Readonly<{ kind: "frac"; text: string; numerator: readonly MathSegment[]; denominator: readonly MathSegment[] }>
  | Readonly<{ kind: "root"; text: string; radicand: readonly MathSegment[] }>;

const superscripts: Readonly<Record<string, string>> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "⁺": "+", "⁻": "−", "⁼": "=", "⁽": "(", "⁾": ")", "ⁿ": "n", "ⁱ": "i",
  "ᵃ": "a", "ᵇ": "b", "ᶜ": "c", "ᵈ": "d", "ᵉ": "e", "ᶠ": "f", "ᵍ": "g", "ʰ": "h", "ʲ": "j", "ᵏ": "k",
  "ˡ": "l", "ᵐ": "m", "ᵒ": "o", "ᵖ": "p", "ʳ": "r", "ˢ": "s", "ᵗ": "t", "ᵘ": "u", "ᵛ": "v", "ʷ": "w",
  "ˣ": "x", "ʸ": "y", "ᶻ": "z"
};
const supClass = Object.keys(superscripts).join("");
const supRun = new RegExp(`[${supClass}]+`, "gu");
// Integer over integer (the denominator may carry an exponent). Neighbours exclude dates, URLs, units,
// decimals (`2,5/5`, `1/2.5`) and letter fractions.
const fraction = new RegExp(`(?<![\\p{L}\\p{N}/:.,_\\\\])(\\d+)/(\\d+[${supClass}]*)(?![\\p{L}\\p{N}/_]|[.,]\\d)`, "gu");
const rootNumber = new RegExp(`^(\\d+(?:,\\d+)?)(?![\\p{L}\\p{N}(${supClass}])`, "u");
const rootLetter = new RegExp(`^(\\p{L})(?![\\p{L}\\p{N}(${supClass}])`, "u");

function superscriptSegments(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(supRun)) {
    if (match.index > last) segments.push({ kind: "text", text: text.slice(last, match.index) });
    segments.push({ kind: "sup", text: match[0], display: [...match[0]].map(char => superscripts[char]).join("") });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ kind: "text", text: text.slice(last) });
  return segments;
}

function fractionSegments(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(fraction)) {
    // Year-shaped numerators are periods (`2027/1`, `2020/2021`), not fractions.
    if (/^(19|20)\d\d$/.test(match[1])) continue;
    if (match.index > last) segments.push(...superscriptSegments(text.slice(last, match.index)));
    segments.push({ kind: "frac", text: match[0], numerator: superscriptSegments(match[1]), denominator: superscriptSegments(match[2]) });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push(...superscriptSegments(text.slice(last)));
  return segments;
}

/** Index just after the parenthesis that closes the one at `start`, or -1 when unbalanced. */
function closingParenthesis(text: string, start: number) {
  let depth = 0;
  for (let index = start; index < text.length; index++) {
    if (text[index] === "(") depth++;
    else if (text[index] === ")" && --depth === 0) return index + 1;
  }
  return -1;
}

export function parseMathNotation(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let plainStart = 0;
  let index = text.indexOf("√");
  while (index !== -1) {
    const rest = text.slice(index + 1);
    let radicand: string | null = null;
    let end = -1;
    if (rest.startsWith("(")) {
      const close = closingParenthesis(rest, 0);
      const after = close === -1 ? "" : rest.slice(close);
      if (close > 2 && !new RegExp(`^[\\p{L}\\p{N}${supClass}]`, "u").test(after)) { radicand = rest.slice(1, close - 1); end = index + 1 + close; }
    } else {
      const match = rootNumber.exec(rest) ?? rootLetter.exec(rest);
      if (match) { radicand = match[1]; end = index + 1 + match[1].length; }
    }
    if (radicand !== null) {
      if (index > plainStart) segments.push(...fractionSegments(text.slice(plainStart, index)));
      segments.push({ kind: "root", text: text.slice(index, end), radicand: fractionSegments(radicand) });
      plainStart = end;
    }
    index = text.indexOf("√", Math.max(index + 1, plainStart));
  }
  if (plainStart < text.length) segments.push(...fractionSegments(text.slice(plainStart)));
  return segments;
}

/**
 * Worked steps inside one paragraph: optional lead lines, then at least two consecutive `n. text` (or
 * `n) text`) lines, then optional closing lines such as "Conferência:". Any other shape stays plain.
 */
export function numberedSteps(lines: readonly string[]): Readonly<{ lead: string[]; start: number; items: string[]; trail: string[] }> | null {
  const parsed = lines.map(line => /^\s*(\d{1,3})[.)]\s+(\S.*)$/u.exec(line));
  const first = parsed.findIndex(Boolean);
  if (first === -1) return null;
  let end = first;
  while (end < parsed.length && parsed[end]) end++;
  if (end - first < 2 || parsed.slice(end).some(Boolean)) return null;
  const start = Number(parsed[first]![1]);
  if (parsed.slice(first, end).some((match, position) => Number(match![1]) !== start + position)) return null;
  return { lead: lines.slice(0, first), start, items: parsed.slice(first, end).map(match => match![2]), trail: lines.slice(end) };
}

/**
 * Only the actual question is a heading; the base text before it reads as normal paragraphs.
 * Multi-line stems keep their last line as the question; a long single paragraph keeps its last sentence.
 */
export function splitStem(stem: string): { body?: string; question: string } {
  const text = stem.trim();
  const lines = text.split("\n"), last = lines.length - 1;
  if (last > 0) return { body: lines.slice(0, last).join("\n").trim(), question: lines[last].trim() };
  if (text.length <= 280) return { question: text };
  const sentences = text.match(/[^.!?]+(?:[.!?]+["”»)]*\s*|$)/g)?.filter(Boolean) ?? [text];
  const tail = sentences[sentences.length - 1]?.trim() ?? text;
  return sentences.length > 1 && /[?:]$/.test(tail) ? { body: text.slice(0, text.length - tail.length).trim(), question: tail } : { question: text };
}

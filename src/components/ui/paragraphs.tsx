// Authored content separates paragraphs with a blank line; numbered steps and verse lines stay one per line.
export function Paragraphs({ text }: Readonly<{ text: string }>) {
  return <>{text.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph.split("\n").flatMap((line, lineIndex) => lineIndex ? [<br key={lineIndex} />, line] : [line])}</p>)}</>;
}

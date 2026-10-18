/** Anchor id of a numbered legal section, shared by the heading and the index link. */
export const legalSectionId = (number: number) => `secao-${number}`;

/** Numbered legal section heading; the title comes from the page's section list, the single source. */
export function LegalHeading({ number, sections }: Readonly<{ number: number; sections: readonly string[] }>) {
  return <h2 id={legalSectionId(number)}>{number}. {sections[number - 1]}</h2>;
}

/** "Neste documento": collapsed list of links to every numbered section of a legal page. */
export function LegalIndex({ sections }: Readonly<{ sections: readonly string[] }>) {
  return (
    <details className="legal-index">
      <summary>Neste documento <span>({sections.length} seções)</span></summary>
      <ol>
        {sections.map((title, index) => <li key={title}><a href={`#${legalSectionId(index + 1)}`}>{title}</a></li>)}
      </ol>
    </details>
  );
}

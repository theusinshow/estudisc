import type { ReactNode } from "react";

/** One reviewable piece of the design system, addressed by its code (e.g. "3-B"). */
export function CatalogItem({ code, title, note, children }: Readonly<{ code: string; title: string; note?: string; children: ReactNode }>) {
  return (
    <article className="dc-item" id={`item-${code}`} aria-labelledby={`item-${code}-title`}>
      <header className="dc-item-head">
        <span className="dc-code">{code}</span>
        <h3 id={`item-${code}-title`}>{title}</h3>
      </header>
      {note ? <p className="dc-note">{note}</p> : null}
      <div className="dc-item-body">{children}</div>
    </article>
  );
}

export function CatalogBlock({ id, number, title, children }: Readonly<{ id: string; number: number; title: string; children: ReactNode }>) {
  return (
    <section className="dc-block" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="type-title"><span className="dc-block-number">{number}</span>{title}</h2>
      <div className="dc-grid">{children}</div>
    </section>
  );
}

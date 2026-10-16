import { BrandLockup } from "@/components/brand/brand-lockup";

/** Plain legal page shell; content is reviewed by the owner before FEATURE_PAID_ACCESS is turned on (ADR 0061). */
export function LegalPage({ title, sections }: Readonly<{ title: string; sections: readonly { heading: string; body: readonly string[] }[] }>) {
  return <main className="auth-surface" aria-labelledby="legal-title">
    <section className="auth-panel legal-panel">
      <div className="auth-panel-header"><BrandLockup /><p className="eyebrow">Estudisc</p></div>
      <div className="auth-copy"><h1 id="legal-title">{title}</h1><p>Versão de 16/10/2026.</p></div>
      {sections.map(section => <section key={section.heading} className="legal-section">
        <h2>{section.heading}</h2>
        {section.body.map(paragraph => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
      </section>)}
    </section>
  </main>;
}

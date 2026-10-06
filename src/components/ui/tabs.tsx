"use client";

import { useId, useRef, useState, type ReactNode } from "react";

type Tab = Readonly<{ id: string; label: string; content: ReactNode }>;

/** Manual activation avoids changing the visible panel while scanning tabs with arrows. */
export function Tabs({ label, tabs }: Readonly<{ label: string; tabs: readonly Tab[] }>) {
  const id = useId();
  const [selected, setSelected] = useState(tabs[0]?.id);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <div className="foundation-tabs">
      <div className="foundation-tablist" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => (
          <button key={tab.id} ref={element => { buttons.current[index] = element; }}
            id={`${id}-tab-${tab.id}`} role="tab" type="button" aria-selected={selected === tab.id}
            aria-controls={`${id}-panel-${tab.id}`} tabIndex={selected === tab.id ? 0 : -1}
            onClick={() => setSelected(tab.id)} onKeyDown={event => {
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
                : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
                  : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : undefined;
              if (next !== undefined) { event.preventDefault(); buttons.current[next]?.focus(); }
            }}>{tab.label}</button>
        ))}
      </div>
      {tabs.map(tab => <section key={tab.id} id={`${id}-panel-${tab.id}`} role="tabpanel"
        aria-labelledby={`${id}-tab-${tab.id}`} tabIndex={0} hidden={selected !== tab.id}>{tab.content}</section>)}
    </div>
  );
}

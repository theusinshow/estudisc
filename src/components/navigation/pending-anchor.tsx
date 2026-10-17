"use client";
import { useState, type AnchorHTMLAttributes } from "react";

/** A full-page link (study sessions open fresh) that says it is opening as soon as it is pressed. */
export function PendingAnchor({ children, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const [pending, setPending] = useState(false);
  return <a {...props} aria-busy={pending || undefined} data-pending={pending || undefined} onClick={event => { onClick?.(event); if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) setPending(true); }}>
    {children}{pending && <span className="link-pending" role="status">Abrindo…</span>}
  </a>;
}

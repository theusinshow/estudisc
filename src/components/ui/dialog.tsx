"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export type DialogProps = Readonly<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  variant?: "dialog" | "sheet";
}>;

/** Native modal owns focus containment, Escape and inert background behavior. */
export function Dialog({ open, title, description, onClose, children, variant = "dialog" }: DialogProps) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  return (
    <dialog ref={ref} className={`foundation-dialog foundation-${variant}`}
      aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClose={() => { if (open) onClose(); }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]'
        )).filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0);
        const first = controls[0], last = controls.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}>
      <div className="dialog-heading">
        <h2 id={`${id}-title`}>{title}</h2>
        <button className="dialog-close" type="button" aria-label={`Fechar ${title}`} onClick={onClose}><X aria-hidden="true" /></button>
      </div>
      {description && <p id={`${id}-description`}>{description}</p>}
      {children}
    </dialog>
  );
}

export function Sheet(props: Omit<DialogProps, "variant">) {
  return <Dialog {...props} variant="sheet" />;
}

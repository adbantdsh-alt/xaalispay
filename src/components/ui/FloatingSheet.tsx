"use client";

import { useEffect } from "react";

export function FloatingSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="sheet-panel animate-fade-up"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-panel-head">
          <div className="sheet-handle" aria-hidden="true" />
          <h2 className="sheet-panel-title">{title}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="sheet-panel-body">{children}</div>
      </div>
    </div>
  );
}

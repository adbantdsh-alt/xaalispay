"use client";

import { useState } from "react";
import { FloatingSheet } from "@/components/ui/FloatingSheet";

/** Bouton "Personnalisé" qui ouvre un calendrier (FloatingSheet) pour
 * choisir une plage de dates, à la place de deux champs de date toujours
 * visibles à côté des filtres rapides. */
export function AdminDateRangePopover({
  dateFrom,
  dateTo,
  isActive,
  maxDate,
  onApply,
}: {
  dateFrom: string;
  dateTo: string;
  isActive: boolean;
  maxDate: string;
  onApply: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);

  const openSheet = () => {
    setDraftFrom(dateFrom);
    setDraftTo(dateTo);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={`admin-filter${isActive ? " is-active" : ""}`}
        onClick={openSheet}
      >
        Personnalisé
      </button>
      <FloatingSheet open={open} onClose={() => setOpen(false)} title="Plage personnalisée">
        <div className="admin-daterange-popover-body">
          <label className="admin-daterange-popover-field">
            Du
            <input
              type="date"
              className="input-field input-compact"
              value={draftFrom}
              max={draftTo}
              onChange={(e) => setDraftFrom(e.target.value)}
            />
          </label>
          <label className="admin-daterange-popover-field">
            Au
            <input
              type="date"
              className="input-field input-compact"
              value={draftTo}
              min={draftFrom}
              max={maxDate}
              onChange={(e) => setDraftTo(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onApply(draftFrom, draftTo);
              setOpen(false);
            }}
          >
            Appliquer
          </button>
        </div>
      </FloatingSheet>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { AdminSearchHit, AdminTab } from "./admin-types";

export function AdminSearchBar({
  onNavigate,
}: {
  onNavigate: (tab: AdminTab) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setHits(data.hits || []);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (hit: AdminSearchHit) => {
    setOpen(false);
    setQuery("");
    if (hit.type === "order") onNavigate("orders");
    else if (hit.type === "vendor") onNavigate("vendors");
    else onNavigate("payouts");
  };

  return (
    <div ref={ref} className="admin-search">
      <input
        type="search"
        className="admin-search-input"
        placeholder="Rechercher commande, @vendeur, téléphone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Recherche admin"
      />
      {loading && <span className="admin-search-spinner" aria-hidden="true" />}
      {open && hits.length > 0 && (
        <ul className="admin-search-dropdown" role="listbox">
          {hits.map((hit) => (
            <li key={`${hit.type}-${hit.id}`}>
              <button type="button" className="admin-search-item" onClick={() => pick(hit)}>
                <span className="admin-search-item-type">{hit.type}</span>
                <span className="admin-search-item-label">{hit.label}</span>
                <span className="admin-search-item-sub">
                  {hit.sublabel}
                  {hit.amount != null ? ` · ${formatCurrency(hit.amount)}` : ""}
                  {hit.status ? ` · ${hit.status}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

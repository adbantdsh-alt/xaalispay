"use client";

import { ORDER_FILTERS, type OrderFilterKey } from "@/lib/order-filters";

export function OrderFilterTabs({
  filter,
  onFilterChange,
}: {
  filter: OrderFilterKey;
  onFilterChange: (key: OrderFilterKey) => void;
}) {
  return (
    <div className="history-filters" role="tablist" aria-label="Filtrer les commandes">
      {ORDER_FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          role="tab"
          aria-selected={filter === f.key}
          className={`history-filter ${filter === f.key ? "is-active" : ""}`}
          onClick={() => onFilterChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

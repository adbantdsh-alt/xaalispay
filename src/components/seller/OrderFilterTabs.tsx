"use client";

import type { Order } from "@/lib/types";
import {
  ORDER_FILTERS,
  countOrdersForFilter,
  type OrderFilterKey,
} from "@/lib/order-filters";

export function OrderFilterTabs({
  orders,
  filter,
  onFilterChange,
}: {
  orders: Order[];
  filter: OrderFilterKey;
  onFilterChange: (key: OrderFilterKey) => void;
}) {
  return (
    <div className="history-filters" role="tablist" aria-label="Filtrer les commandes">
      {ORDER_FILTERS.map((f) => {
        const count = countOrdersForFilter(orders, f.key);
        return (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={`history-filter ${filter === f.key ? "is-active" : ""}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
            <span className="history-filter-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

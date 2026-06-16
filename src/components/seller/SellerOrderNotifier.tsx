"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { useSellerData } from "./SellerDataProvider";

const STORAGE_KEY = "xp_seen_order_ids";
const NOTIFY_STATUSES = new Set<Order["status"]>(["paid", "protection", "dispute"]);

function loadSeenIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(-300)));
  } catch {
    /* ignore */
  }
}

interface ToastState {
  message: string;
  detail?: string;
}

export function SellerOrderNotifier() {
  const { data } = useSellerData();
  const bootstrapped = useRef(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!data?.orders) return;

    const seen = loadSeenIds();
    const relevant = data.orders.filter((o) => NOTIFY_STATUSES.has(o.status));

    if (!bootstrapped.current) {
      relevant.forEach((o) => seen.add(o.id));
      saveSeenIds(seen);
      bootstrapped.current = true;
      return;
    }

    const fresh = relevant.filter((o) => !seen.has(o.id));
    if (fresh.length === 0) return;

    fresh.forEach((o) => seen.add(o.id));
    saveSeenIds(seen);

    const first = fresh[0];
    const message =
      fresh.length === 1
        ? `Nouvelle commande — ${first.productName}`
        : `${fresh.length} nouvelles commandes`;
    const detail =
      fresh.length === 1 ? formatCurrency(getOrderTotal(first)) : undefined;

    setToast({ message, detail });
    const timer = window.setTimeout(() => setToast(null), 8000);

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("XaalisPay", {
          body: detail ? `${message} · ${detail}` : message,
          tag: `order-${first.id}`,
        });
      } catch {
        /* ignore */
      }
    }

    return () => window.clearTimeout(timer);
  }, [data?.orders]);

  if (!toast) return null;

  return (
    <div className="seller-order-toast animate-fade-up" role="status">
      <div className="seller-order-toast-body">
        <p className="seller-order-toast-title">{toast.message}</p>
        {toast.detail && <p className="seller-order-toast-detail">{toast.detail}</p>}
      </div>
      <Link href="/dashboard" className="seller-order-toast-link">
        Voir
      </Link>
      <button
        type="button"
        className="seller-order-toast-close"
        aria-label="Fermer"
        onClick={() => setToast(null)}
      >
        ×
      </button>
    </div>
  );
}

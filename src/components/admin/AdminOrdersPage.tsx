"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { adaptOrderRow } from "./admin-adapters";
import { AdminOrdersSection } from "./AdminOrdersSection";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import type { OrderRow } from "./admin-types";

const AUTO_REFRESH_MS = 30_000;

export function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const res = await apiFetch("/api/admin/orders");
      if (handleAdminAuthStatus(res.status, router, "/admin/orders")) return;
      if (res.ok) setOrders((await res.json()).map(adaptOrderRow));
      if (!silent) setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!detailOpen) fetchOrders(true);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchOrders, detailOpen]);

  if (loading && orders.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return <AdminOrdersSection orders={orders} onDetailOpenChange={setDetailOpen} />;
}

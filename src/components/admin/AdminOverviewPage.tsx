"use client";

import { useRouter } from "next/navigation";
import { AdminOverviewSection } from "./AdminOverviewSection";
import { useAdminData } from "./AdminDataProvider";

export function AdminOverviewPage() {
  const router = useRouter();
  const { overview, loading } = useAdminData();

  if (loading && !overview) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!overview) return null;

  return (
    <AdminOverviewSection
      overview={overview}
      onNavigate={(route) => router.push(`/admin/${route}`)}
    />
  );
}

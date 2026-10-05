import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WalletPayoutHistory } from "@/components/seller/WalletPayoutHistory";

export default function AllPayoutsPage() {
  return (
    <div className="seller-dashboard">
      <div className="dashboard-orders-head" style={{ marginBottom: "1rem" }}>
        <Link
          href="/wallet"
          className="btn-ghost"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", minHeight: "auto", padding: "0.25rem 0.5rem" }}
        >
          <ChevronLeft size={15} strokeWidth={1.5} /> Portefeuille
        </Link>
        <h1 className="dashboard-orders-title">Historique des retraits</h1>
      </div>
      <WalletPayoutHistory variant="full" />
    </div>
  );
}

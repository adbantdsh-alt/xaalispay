import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WalletTransactionHistory } from "@/components/seller/WalletTransactionHistory";

export default function AllTransactionsPage() {
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
        <h1 className="dashboard-orders-title">Tous les mouvements</h1>
      </div>
      <WalletTransactionHistory variant="full" />
    </div>
  );
}

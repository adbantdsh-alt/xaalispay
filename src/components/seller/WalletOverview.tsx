import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { WalletBreakdown } from "@/lib/wallet-breakdown";
import { ReleaseCountdown } from "@/components/ReleaseCountdown";
import { QuickActions } from "@/components/seller/QuickActions";

export function WalletOverview({
  breakdown,
  shopUrl,
  username,
  releasing,
  protectionMinutes,
  onCountdownExpire,
}: {
  breakdown: WalletBreakdown;
  shopUrl: string;
  username: string;
  releasing?: { protectionEndsAt: string; productName: string };
  protectionMinutes: number;
  onCountdownExpire?: () => void;
}) {
  const soonAvailable = breakdown.pendingRefund;

  return (
    <section className="wallet-card-blue">
      <div className="wallet-card-blue-inner">
        <p className="wallet-card-blue-label">Solde disponible</p>
        <Link href="/wallet" className="wallet-balance-link" aria-label="Voir le portefeuille">
          <p className="wallet-card-blue-amount">{formatCurrency(breakdown.available)}</p>
          <span className="wallet-balance-link-hint">Appuyez pour retirer →</span>
        </Link>

        <div className="wallet-funds-grid">
          <div className="wallet-funds-item">
            <span className="wallet-funds-label">En séquestre</span>
            <span className="wallet-funds-value">{formatCurrency(breakdown.sequestered)}</span>
            <span className="wallet-funds-hint">En attente de livraison</span>
          </div>
          <div className="wallet-funds-item">
            <span className="wallet-funds-label">Bientôt disponible</span>
            <span className="wallet-funds-value">{formatCurrency(soonAvailable)}</span>
            <span className="wallet-funds-hint">Après période de protection</span>
          </div>
          <div className="wallet-funds-item wallet-funds-item-blocked">
            <span className="wallet-funds-label">Bloqué (litige)</span>
            <span className="wallet-funds-value">{formatCurrency(breakdown.blocked)}</span>
            <span className="wallet-funds-hint">Litige en cours</span>
          </div>
        </div>

        {releasing?.protectionEndsAt && (
          <div className="wallet-countdown">
            <p className="wallet-countdown-title">
              Libération · {releasing.productName}
            </p>
            <ReleaseCountdown
              endsAt={releasing.protectionEndsAt}
              minutes={protectionMinutes}
              onExpire={onCountdownExpire}
            />
          </div>
        )}

        <QuickActions
          shopUrl={shopUrl}
          username={username}
          embedded
        />
      </div>
    </section>
  );
}

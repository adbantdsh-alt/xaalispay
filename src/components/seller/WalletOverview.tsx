import Link from "next/link";
import { ArrowRight, BookmarkCheck, Clock } from "lucide-react";
import { splitCurrency } from "@/lib/utils";
import type { WalletBreakdown } from "@/lib/wallet-breakdown";
import { ReleaseCountdown } from "@/components/ReleaseCountdown";

export function WalletOverview({
  breakdown,
  releasing,
  protectionMinutes,
  onCountdownExpire,
}: {
  breakdown: WalletBreakdown;
  releasing?: { protectionEndsAt: string; productName: string; amount: number };
  protectionMinutes: number;
  onCountdownExpire?: () => void;
}) {
  const [availAmount, availSuffix] = splitCurrency(breakdown.available);

  return (
    <section className="wallet-card-blue">
      <div className="wallet-card-blue-inner">
        <div className="wallet-card-blue-head">
          <p className="wallet-card-blue-label">Solde disponible</p>
          <BookmarkCheck size={18} strokeWidth={1.5} className="wallet-card-blue-icon" />
        </div>
        <p className="wallet-card-blue-amount">
          {availAmount}
          {availSuffix && <span className="wallet-card-blue-amount-suffix">{availSuffix}</span>}
        </p>
        <Link href="/wallet" className="wallet-card-blue-withdraw">
          Retirer vers mobile money
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>

        <div className="wallet-funds-grid">
          <div className="wallet-funds-item">
            <span className="wallet-funds-label">En séquestre</span>
            <span className="wallet-funds-value">{splitCurrency(breakdown.sequestered)[0]}</span>
          </div>
          <div className="wallet-funds-divider" />
          <div className="wallet-funds-item wallet-funds-item-wide">
            <span className="wallet-funds-label">
              <Clock size={11} strokeWidth={1.5} /> Prochaine libération
            </span>
            {releasing?.protectionEndsAt ? (
              <ReleaseCountdown
                endsAt={releasing.protectionEndsAt}
                minutes={protectionMinutes}
                onExpire={onCountdownExpire}
                compact
                compactAmount={splitCurrency(releasing.amount)[0]}
              />
            ) : (
              <span className="wallet-funds-value">—</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

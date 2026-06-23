import { AlertTriangle, ChevronRight } from "lucide-react";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import type { Order } from "@/lib/types";

function earliestDeadlineHours(orders: Order[]): number | null {
  const deadlines = orders
    .map((o) => o.dispute?.sellerResponseDeadlineAt)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime());
  if (deadlines.length === 0) return null;
  const hours = (Math.min(...deadlines) - Date.now()) / (1000 * 60 * 60);
  return Math.max(0, Math.round(hours));
}

export function DisputeAlertBanner({
  disputeOrders,
  onClick,
}: {
  disputeOrders: Order[];
  onClick?: () => void;
}) {
  if (disputeOrders.length === 0) return null;

  const blocked = disputeOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
  const deadlineHours = earliestDeadlineHours(disputeOrders);

  return (
    <button type="button" onClick={onClick} className="dispute-alert-banner animate-fade-up">
      <AlertTriangle size={19} strokeWidth={1.5} className="dispute-alert-icon" />
      <div className="dispute-alert-body">
        <p className="dispute-alert-title">
          {disputeOrders.length} litige{disputeOrders.length > 1 ? "s" : ""} en cours
        </p>
        <p className="dispute-alert-desc">
          <span className="mono">{formatCurrency(blocked)}</span> bloqués
          {deadlineHours !== null && ` · répondez sous ${deadlineHours} h`}
        </p>
      </div>
      <ChevronRight size={18} strokeWidth={1.5} className="dispute-alert-chevron" />
    </button>
  );
}

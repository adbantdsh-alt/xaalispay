import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/utils";
import { getSellerHumanStatus } from "@/lib/order-timeline";
import { getOrderStatusVisual } from "@/lib/order-status-ui";
import type { OrderStatus } from "@/lib/types";
import { ProductImage } from "@/components/ui/ProductImage";

function StatusIcon({ type }: { type: ReturnType<typeof getOrderStatusVisual>["icon"] }) {
  const paths: Record<string, ReactNode> = {
    pending: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    hold: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    timer: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    done: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    warn: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    refund: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  };
  return <>{paths[type]}</>;
}

export function AssetRow({
  title,
  subtitle,
  amount,
  status,
  imageUrl,
  onClick,
}: {
  title: string;
  subtitle: string;
  amount: number;
  status: OrderStatus;
  imageUrl?: string;
  onClick?: () => void;
}) {
  const visual = getOrderStatusVisual(status);
  const clickable = typeof onClick === "function";

  const interactiveProps = clickable
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        },
      }
    : {};

  return (
    <article
      className={`asset-row ${clickable ? "asset-row-clickable" : ""}`}
      {...interactiveProps}
    >
      <div className={`asset-row-icon asset-row-icon-${visual.tone}`}>
        {imageUrl ? (
          <ProductImage
            src={imageUrl}
            alt=""
            className="asset-row-thumb"
            placeholderClassName="asset-row-thumb-empty"
            iconSize={18}
          />
        ) : (
          <StatusIcon type={visual.icon} />
        )}
      </div>
      <div className="asset-row-body">
        <p className="asset-row-title">{title}</p>
        <p className="asset-row-sub">{subtitle}</p>
        <p className="asset-row-status">{getSellerHumanStatus(status)}</p>
      </div>
      <p className="asset-row-amount">{formatCurrency(amount)}</p>
      {clickable && (
        <svg
          className="asset-row-chevron"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </article>
  );
}

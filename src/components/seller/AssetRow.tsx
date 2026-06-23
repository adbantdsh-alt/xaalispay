import { splitCurrency } from "@/lib/utils";
import { getSellerBadgeStatus } from "@/lib/order-timeline";
import { getOrderBadgeTone } from "@/lib/order-status-ui";
import type { OrderStatus } from "@/lib/types";
import { ProductImage } from "@/components/ui/ProductImage";
import { IconPackage } from "@/components/ui/AppIcon";

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
  const [amountValue] = splitCurrency(amount);
  const tone = getOrderBadgeTone(status);

  return (
    <article
      className="asset-row"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {imageUrl ? (
        <ProductImage
          src={imageUrl}
          alt=""
          className="asset-row-thumb"
          placeholderClassName="asset-row-thumb-empty"
          iconSize={17}
          width={38}
          height={38}
        />
      ) : (
        <div className="asset-row-icon">
          <IconPackage size={17} />
        </div>
      )}
      <div className="asset-row-body">
        <p className="asset-row-title">{title}</p>
        <p className="asset-row-sub">{subtitle}</p>
      </div>
      <div className="asset-row-end">
        <p className="asset-row-amount">{amountValue}</p>
        <span className={`asset-row-badge asset-row-badge-${tone}`}>
          {getSellerBadgeStatus(status)}
        </span>
      </div>
    </article>
  );
}

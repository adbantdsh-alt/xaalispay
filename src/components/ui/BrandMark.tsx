import Link from "next/link";
import { XaalisIcon } from "./XaalisIcon";

export function BrandMark({
  size = "md",
  variant = "full",
  href = "/",
  light = false,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  /** Lien accueil — `null` pour désactiver */
  href?: string | null;
  /** Variante claire (blanc+coral) pour fonds sombres (ex: sidebar admin) */
  light?: boolean;
}) {
  const sizes = { sm: "brand-sm", md: "brand-md", lg: "brand-lg" };
  const iconSizes = { sm: 24, md: 32, lg: 40 };

  const inner =
    variant === "icon" ? (
      <span className="brand-icon" aria-hidden="true">
        <XaalisIcon size={iconSizes[size]} light={light} />
      </span>
    ) : (
      <>
        <span className="brand-icon" aria-hidden="true">
          <XaalisIcon size={iconSizes[size]} light={light} />
        </span>
        <span className="brand-name">
          <span className="brand-name-light">Xaalis</span><span className="brand-name-strong">Pay</span>
        </span>
      </>
    );

  const mark = <div className={`brand-mark ${sizes[size]}`}>{inner}</div>;

  if (href) {
    return (
      <Link href={href} className="brand-mark-link" aria-label="Xaalis Pay — Accueil">
        {mark}
      </Link>
    );
  }

  return mark;
}

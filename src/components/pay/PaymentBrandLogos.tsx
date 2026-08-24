/** Logos Wave / Orange Money — design validé, ne pas modifier. */

export function WaveFavicon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brands/wave-favicon.png"
      alt=""
      className={className}
      draggable={false}
      aria-hidden="true"
    />
  );
}

export function OrangeFavicon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brands/orange-favicon.png"
      alt=""
      className={className}
      draggable={false}
      aria-hidden="true"
    />
  );
}

/** Pas de logo officiel disponible pour ces opérateurs (MTN/Moov/Togocell/
 * Mobicash/MaxIt) — badge générique (initiale + couleur de marque) plutôt
 * que d'inventer une image de marque. À remplacer par un vrai logo si/quand
 * fourni. */
export function OperatorMonogram({
  label,
  color,
  className = "",
}: {
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "999px",
        backgroundColor: color,
        color: "#fff",
        fontWeight: 700,
        fontSize: "0.7em",
      }}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

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

/** Logo réel MaxIt (Sénégal) — recadré depuis le logo fourni par l'utilisateur
 * (logoMaxIt.png) pour retirer le bandeau "SN" et centrer le wordmark sur une
 * tuile carrée, même traitement que wave-favicon.png. */
export function MaxitFavicon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brands/maxit-favicon.png"
      alt=""
      className={className}
      draggable={false}
      aria-hidden="true"
    />
  );
}

export function MtnFavicon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brands/mtn-favicon.png" alt="" className={className} draggable={false} aria-hidden="true" />
  );
}

export function MoovFavicon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brands/moov-favicon.png" alt="" className={className} draggable={false} aria-hidden="true" />
  );
}

export function TogocellFavicon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brands/togocell-favicon.png" alt="" className={className} draggable={false} aria-hidden="true" />
  );
}

export function MobicashFavicon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brands/mobicash-favicon.png" alt="" className={className} draggable={false} aria-hidden="true" />
  );
}

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

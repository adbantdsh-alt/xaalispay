/** Logos Wave / Orange Money — design validé, ne pas modifier. */

export function WaveFavicon({ className = "" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brands/wave-brand.png" alt="" draggable={false} />
    </span>
  );
}

export function OrangeMoneyBrandLogo({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brands/orange-brand.png"
      alt="Orange Money"
      className={className}
      draggable={false}
    />
  );
}

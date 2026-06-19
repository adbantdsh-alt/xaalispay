"use client";

import { useState } from "react";
import { IconPackage } from "@/components/ui/AppIcon";

export function ProductImage({
  src,
  alt = "",
  className,
  placeholderClassName,
  iconSize = 22,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
  iconSize?: number;
}) {
  const resolved = src?.trim() || "";
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return (
      <div className={placeholderClassName} aria-hidden={!alt}>
        <IconPackage size={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

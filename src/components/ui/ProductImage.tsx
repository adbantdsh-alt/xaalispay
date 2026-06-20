"use client";

import { useState } from "react";
import Image from "next/image";
import { IconPackage } from "@/components/ui/AppIcon";

export function ProductImage({
  src,
  alt = "",
  className,
  placeholderClassName,
  iconSize = 22,
  fill = false,
  width,
  height,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
  iconSize?: number;
  /** Le parent doit avoir position: relative + une taille définie. */
  fill?: boolean;
  width?: number;
  height?: number;
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

  if (fill) {
    return (
      <Image src={resolved} alt={alt} fill className={className} onError={() => setFailed(true)} />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={width ?? 96}
      height={height ?? 96}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

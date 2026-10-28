"use client";

import Image from "next/image";
import { useState } from "react";

/** Photo éditoriale de la landing (public/landing/*.webp). Tant que le
 * fichier n'existe pas (images IA pas encore générées), affiche un bloc sable
 * avec le nom du shot attendu au lieu d'une image cassée — la mise en page
 * reste livrable avant les visuels. */
export function LandingPhoto({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  objectPosition = "center",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  objectPosition?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-[#F7EEE3] ${className}`}>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#B8895D]/70">{src.split("/").pop()}</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition }}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

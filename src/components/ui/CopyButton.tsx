"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/share";

export function CopyButton({
  text,
  label = "Copier",
  copiedLabel = "Copié",
  className = "btn-secondary",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {copied ? copiedLabel : label}
    </button>
  );
}

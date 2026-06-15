"use client";

import { useRouter } from "next/navigation";
import { DisputeDialog } from "./DisputeDialog";

export function DisputePageClient({ initialPin }: { initialPin?: string }) {
  const router = useRouter();

  return (
    <DisputeDialog
      open
      onClose={() => router.push("/")}
      initialPin={initialPin}
      variant="page"
    />
  );
}

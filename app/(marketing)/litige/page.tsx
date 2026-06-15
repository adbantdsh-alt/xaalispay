"use client";

import { useSearchParams } from "next/navigation";
import { DisputeDialog } from "@/components/marketing/DisputeDialog";

export default function DisputePage() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";

  return (
    <section className="lp-dispute-page">
      <div className="lp-container">
        <div className="lp-dispute-page-head">
          <span className="lp-eyebrow">Assistance litige</span>
          <h1 className="serif">Ouvrir un litige</h1>
          <p>
            Utilisez le code livraison de votre commande. Si vous venez de la page de
            paiement, le code est déjà rempli.
          </p>
        </div>
        <DisputeDialog open onClose={() => {}} initialPin={pin} embedded />
      </div>
    </section>
  );
}

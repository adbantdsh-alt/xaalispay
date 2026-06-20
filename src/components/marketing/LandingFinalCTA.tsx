import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

export function LandingFinalCTA() {
  return (
    <section className="lp-section lp-final">
      <div className="lp-container">
        <Reveal className="lp-final-inner">
          <h2 className="serif">Prêt à payer les yeux fermés ?</h2>
          <p>
            Rejoignez les milliers d&apos;acheteurs et de vendeurs qui sécurisent leurs
            transactions au Sénégal avec XaalisPay.
          </p>
          <Link href="/auth?mode=signup" className="lp-btn lp-btn-primary lp-btn-xl">
            Créer un compte
            <ArrowRight size={20} strokeWidth={1.5} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

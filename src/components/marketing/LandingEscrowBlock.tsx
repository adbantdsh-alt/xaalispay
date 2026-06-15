import { IconKey, IconPackage, IconShield, IconWave } from "@/components/ui/AppIcon";

const FLOW = [
  { label: "Payez", Icon: IconWave },
  { label: "Séquestre", Icon: IconShield },
  { label: "PIN livreur", Icon: IconKey },
] as const;

export function LandingEscrowBlock() {
  return (
    <section className="landing-escrow" aria-labelledby="landing-escrow-title">
      <div className="landing-escrow-card">
        <div className="landing-escrow-copy">
          <p className="landing-kicker">Vous ne nous connaissez pas ?</p>
          <h2 id="landing-escrow-title" className="landing-escrow-title">
            Votre argent reste bloqué jusqu&apos;à validation
          </h2>
          <p className="landing-escrow-lead">
            Payez par Wave ou Orange Money. L&apos;argent est gardé chez XaalisPay — le vendeur
            n&apos;est payé qu&apos;après livraison.
          </p>
        </div>

        <div className="landing-flow-diagram" aria-hidden="true">
          {FLOW.map((step, i) => (
            <div key={step.label} className="landing-flow-step">
              <div className="landing-flow-icon">
                <step.Icon size={20} />
              </div>
              <span className="landing-flow-label">{step.label}</span>
              {i < FLOW.length - 1 && <span className="landing-flow-arrow" />}
            </div>
          ))}
          <div className="landing-flow-step landing-flow-step-muted">
            <div className="landing-flow-icon landing-flow-icon-muted">
              <IconPackage size={20} />
            </div>
            <span className="landing-flow-label">Colis reçu</span>
          </div>
        </div>
      </div>
    </section>
  );
}

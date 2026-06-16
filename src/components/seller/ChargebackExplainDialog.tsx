"use client";

export function ChargebackExplainDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet chargeback-explain-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-sheet-handle" />
        <h3 className="chargeback-explain-title">Qu&apos;est-ce qu&apos;un chargeback ?</h3>
        <div className="chargeback-explain-body">
          <p>
            Un <strong>chargeback</strong>, c&apos;est un remboursement forcé au client : litige
            perdu, annulation après paiement, ou livraison non effectuée dans les délais.
          </p>
          <p>
            Sur XaalisPay, si vous ne livrez pas dans les <strong>48 h après paiement</strong>,
            le client est remboursé automatiquement — cela compte comme un chargeback sur votre
            compte vendeur.
          </p>
          <div className="chargeback-explain-box">
            <p className="chargeback-explain-box-title">Seuil de sanction</p>
            <p>
              Au-delà de <strong className="chargeback-explain-danger">10 chargebacks sur 100 commandes</strong>{" "}
              (10 %), des mesures s&apos;appliquent :
            </p>
            <ul>
              <li>Hold de 48 h sur vos prochains retraits</li>
              <li>Surveillance renforcée de votre boutique</li>
              <li>Risque de suspension si le taux reste élevé</li>
            </ul>
          </div>
          <p className="chargeback-explain-tip">
            Livrez à temps, validez le code PIN client, et évitez les annulations inutiles pour
            protéger votre réputation vendeur.
          </p>
        </div>
        <button type="button" className="btn-seller-primary btn-compact" onClick={onClose}>
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}

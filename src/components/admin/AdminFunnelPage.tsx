"use client";

import { useEffect, useState } from "react";
import { TrendingDown, UserCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatAdminDate } from "./admin-types";
import { AdminSellerDetail } from "./AdminSellerDetail";
import { EmptyState, EntityCell, Panel, StatStrip, Tabs } from "./AdminUI";

type Period = "7d" | "30d" | "90d" | "all";

type FunnelStep = {
  key: string;
  label: string;
  count: number;
  rate_from_start: number | null;
  rate_from_previous: number | null;
  lost_from_previous: number;
};

type StuckSeller = {
  id: number;
  username: string;
  name: string;
  phone: string;
  created_at: string;
  days_since_signup: number;
};

type FunnelData = {
  period: Period;
  tracking_since: string | null;
  steps: FunnelStep[];
  biggest_drop: string | null;
  stuck: { step: string; label: string; total: number; sellers: StuckSeller[] }[];
  links: { shares: number; opens: number; orders_started: number; orders_paid: number };
};

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "all", label: "Depuis le début" },
];

// Ce qu'il faut faire pour débloquer un vendeur arrêté à cette étape — la
// liste sert à passer à l'action, pas seulement à constater.
const NEXT_ACTION: Record<string, string> = {
  signup: "Inscrits sans produit : les aider à créer leur premier lien de paiement.",
  product: "Produit créé mais jamais partagé : leur montrer comment l'envoyer sur WhatsApp.",
  shared: "Lien partagé mais personne ne l'a ouvert : revoir le message, la cible ou le canal.",
  opened: "Lien ouvert mais jamais payé : prix, confiance ou paiement qui bloque côté acheteur.",
  paid: "Payé mais jamais livré et validé : livraison en retard ou PIN pas transmis.",
  validated: "Argent disponible mais jamais retiré : vérifier le moyen de retrait du vendeur.",
};

function pct(value: number | null) {
  return value == null ? "—" : `${value.toLocaleString("fr-FR")} %`;
}

// Largeur d'une tranche de l'entonnoir, en % de la colonne : proportionnelle
// au taux depuis l'inscription, avec un plancher pour que le nombre reste
// lisible même sur une étape quasi vide.
function bandWidth(rateFromStart: number | null) {
  return Math.max(rateFromStart ?? 0, 14);
}

function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function AdminFunnelPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<FunnelData | null>(null);
  const [error, setError] = useState("");
  const [stuckStep, setStuckStep] = useState<string | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/admin/funnel?period=${period}`).then(async (res) => {
      if (cancelled) return;
      if (res.ok) {
        setData(await res.json());
        setError("");
      } else {
        setError("Impossible de charger l'entonnoir.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (error) return <p className="admin-section-hint">{error}</p>;
  if (!data) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  const signups = data.steps[0].count;
  const drop = data.steps.find((s) => s.key === data.biggest_drop);
  const dropIndex = drop ? data.steps.indexOf(drop) : -1;
  // Par défaut, la liste montre l'étape où l'on perd le plus de monde.
  const activeStuckKey = stuckStep ?? (dropIndex > 0 ? data.steps[dropIndex - 1].key : "signup");
  const activeStuck = data.stuck.find((s) => s.step === activeStuckKey) ?? data.stuck[0];
  const { links } = data;

  return (
    <section className="admin-section">
      <div className="ax-filterbar">
        <Tabs label="Période d'inscription" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
        <span className="ax-muted">Vendeurs inscrits sur la période, comptés à l&apos;étape la plus loin atteinte.</span>
      </div>

      {drop && dropIndex > 0 && (
        <div className="ax-funnel-alert">
          <TrendingDown size={18} aria-hidden="true" />
          <p>
            <strong>Plus grosse fuite : {data.steps[dropIndex - 1].label} → {drop.label}.</strong>{" "}
            {drop.lost_from_previous > 1
              ? `${drop.lost_from_previous} vendeurs s'arrêtent là`
              : "1 vendeur s'arrête là"}
            {`, soit ${pct(Math.round((drop.lost_from_previous * 1000) / data.steps[dropIndex - 1].count) / 10)} de ceux qui ont atteint l'étape d'avant.`}
          </p>
        </div>
      )}

      <Panel title="Entonnoir vendeur" count={signups} flush={false}>
        {signups === 0 ? (
          <EmptyState icon={UserCheck} title="Aucun inscrit sur la période" hint="Élargissez la période pour voir l'entonnoir." />
        ) : (
          <ol className="ax-funnel">
            {data.steps.map((step, i) => {
              const isDrop = step.key === data.biggest_drop;
              const stuckKey = i > 0 ? data.steps[i - 1].key : null;
              const width = bandWidth(step.rate_from_start);
              const prevWidth = i > 0 ? bandWidth(data.steps[i - 1].rate_from_start) : width;
              return (
                <li key={step.key} className="ax-funnel-step">
                  {i > 0 && (
                    <div className="ax-funnel-neck">
                      <span
                        className={`ax-funnel-connector ${isDrop ? "is-worst" : ""}`}
                        aria-hidden="true"
                        style={{
                          clipPath: `polygon(${50 - prevWidth / 2}% 0, ${50 + prevWidth / 2}% 0, ${50 + width / 2}% 100%, ${50 - width / 2}% 100%)`,
                        }}
                      />
                      <button
                        type="button"
                        className={`ax-funnel-loss ${isDrop ? "is-worst" : ""} ${stuckKey === activeStuckKey ? "is-active" : ""}`}
                        onClick={() => setStuckStep(stuckKey)}
                        disabled={step.lost_from_previous === 0}
                        title="Voir les vendeurs arrêtés avant cette étape"
                      >
                        {step.lost_from_previous > 0
                          ? `−${step.lost_from_previous} · ${pct(step.rate_from_previous)} passent`
                          : "aucune perte"}
                      </button>
                    </div>
                  )}
                  <div className="ax-funnel-row">
                    <span className="ax-funnel-name">
                      <span className="ax-funnel-index admin-mono">{i + 1}</span>
                      <span className="ax-funnel-label">{step.label}</span>
                    </span>
                    <span className="ax-funnel-stage">
                      <span
                        className={`ax-funnel-band ${step.count === 0 ? "is-empty" : ""}`}
                        style={{ width: `${width}%`, opacity: step.count === 0 ? 1 : 1 - i * 0.07 }}
                      >
                        <span className="admin-mono">{step.count}</span>
                      </span>
                    </span>
                    <span className="ax-funnel-rate admin-mono">{pct(step.rate_from_start)}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {data.tracking_since == null ? (
          <p className="ax-muted ax-funnel-foot">
            Partages et ouvertures de liens : suivi en place, aucun événement reçu pour l&apos;instant. Un vendeur déjà payé
            compte quand même comme ayant partagé et fait ouvrir son lien.
          </p>
        ) : (
          <p className="ax-muted ax-funnel-foot">
            Partages et ouvertures suivis depuis le {formatAdminDate(data.tracking_since)}. Avant, un vendeur payé compte
            quand même comme ayant partagé et fait ouvrir son lien.
          </p>
        )}
      </Panel>

      <StatStrip
        items={[
          { label: "Liens partagés", value: links.shares, hint: "par les vendeurs, sur la période" },
          { label: "Liens ouverts", value: links.opens, hint: "visiteurs uniques par lien" },
          {
            label: "Commandes lancées",
            value: links.orders_started,
            hint: links.opens ? `${pct(Math.round((links.orders_started * 1000) / links.opens) / 10)} des ouvertures` : "formulaire acheteur envoyé",
          },
          {
            label: "Commandes payées",
            value: links.orders_paid,
            hint: links.orders_started
              ? `${pct(Math.round((links.orders_paid * 1000) / links.orders_started) / 10)} des commandes lancées`
              : "argent encaissé",
            tone: "accent",
          },
        ]}
      />

      <Panel
        title="Vendeurs arrêtés"
        count={activeStuck.total}
        toolbar={
          <Tabs
            label="Étape où ils se sont arrêtés"
            options={data.stuck.map((s) => ({ value: s.step, label: s.label, count: s.total }))}
            value={activeStuck.step}
            onChange={setStuckStep}
          />
        }
      >
        <p className="ax-panel-note">{NEXT_ACTION[activeStuck.step]}</p>
        {activeStuck.sellers.length === 0 ? (
          <EmptyState icon={UserCheck} title="Personne n'est bloqué ici" hint="Tous les vendeurs de la période ont passé cette étape." />
        ) : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>Vendeur</th>
                <th>Téléphone</th>
                <th>Inscrit le</th>
                <th className="is-num">Depuis</th>
              </tr>
            </thead>
            <tbody>
              {activeStuck.sellers.map((s) => (
                <tr
                  key={s.id}
                  className="ax-row"
                  tabIndex={0}
                  onClick={() => setSelectedSellerId(s.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedSellerId(s.id)}
                >
                  <td>
                    <EntityCell name={s.name} sub={`@${s.username}`} />
                  </td>
                  <td>
                    <a
                      className="admin-mono ax-funnel-phone"
                      href={whatsappHref(s.phone)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {s.phone}
                    </a>
                  </td>
                  <td className="is-nowrap is-muted">{formatAdminDate(s.created_at)}</td>
                  <td className="is-num">{s.days_since_signup} j</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeStuck.total > activeStuck.sellers.length && (
          <p className="ax-muted ax-funnel-foot">
            {activeStuck.sellers.length} plus récents affichés sur {activeStuck.total}.
          </p>
        )}
      </Panel>

      {selectedSellerId && (
        <AdminSellerDetail sellerId={selectedSellerId} onClose={() => setSelectedSellerId(null)} />
      )}
    </section>
  );
}

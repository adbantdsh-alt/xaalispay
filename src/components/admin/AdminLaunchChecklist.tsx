"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PilotAutoCheck, PilotPreflightReport } from "@/lib/pilot-preflight";

const STORAGE_KEY = "xp-pilot-checklist-v1";

const MANUAL_STEPS = [
  {
    id: "supabase_sql",
    label: "Exécuter setup_prod.sql puis schema_v1.sql dans Supabase",
    doc: "supabase/LANCEMENT.md §1",
  },
  {
    id: "supabase_auth",
    label: "Configurer Site URL + Redirect URLs dans Supabase Auth",
    doc: "Authentication → URL Configuration",
  },
  {
    id: "vercel_env",
    label: "Remplir toutes les variables Vercel Production (DEV_AUTO_LOGIN=false)",
    doc: ".env.example",
  },
  {
    id: "vercel_cron",
    label: "Activer le cron GET /api/maintenance (horaire) avec CRON_SECRET",
    doc: "vercel.json",
  },
  {
    id: "bictorys_webhook",
    label: "Configurer le webhook Bictorys prod vers /api/webhook",
    doc: "Dashboard Bictorys",
  },
  {
    id: "test_payin",
    label: "Tester un paiement Wave/Orange réel (petit montant)",
  },
  {
    id: "test_refund",
    label: "Tester un remboursement (litige ou annulation)",
  },
  {
    id: "test_payout",
    label: "Tester un retrait vendeur vers votre numéro",
  },
  {
    id: "admin_sync",
    label: "Synchroniser app_state → tables (une fois)",
  },
  {
    id: "pilot_journey",
    label: "Parcours vendeur pilote complet (produit → paiement → PIN → retrait)",
  },
  {
    id: "go_live_dns",
    label: "DNS xaalispay.com → Vercel + SSL actif",
  },
  {
    id: "go_live_pilots",
    label: "5–10 vendeurs pilotes identifiés et contactés",
  },
  {
    id: "go_live_support",
    label: "Canal support WhatsApp / contact prêt",
  },
] as const;

const GROUP_LABELS: Record<PilotAutoCheck["group"], string> = {
  env: "Environnement",
  infra: "Infrastructure",
  bictorys: "Bictorys",
  data: "Données",
};

function loadManualDone(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveManualDone(done: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
}

export function AdminLaunchChecklist() {
  const [report, setReport] = useState<PilotPreflightReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manualDone, setManualDone] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setManualDone(loadManualDone());
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/preflight");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Impossible de charger le preflight");
        return;
      }
      setReport(await res.json());
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const toggleManual = (id: string) => {
    setManualDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveManualDone(next);
      return next;
    });
  };

  const copyUrl = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const manualProgress = useMemo(() => {
    const done = MANUAL_STEPS.filter((s) => manualDone[s.id]).length;
    return { done, total: MANUAL_STEPS.length };
  }, [manualDone]);

  const autoProgress = useMemo(() => {
    if (!report) return { ok: 0, total: 0, requiredOk: 0, requiredTotal: 0 };
    const required = report.autoChecks.filter((c) => c.required);
    return {
      ok: report.autoChecks.filter((c) => c.ok).length,
      total: report.autoChecks.length,
      requiredOk: required.filter((c) => c.ok).length,
      requiredTotal: required.length,
    };
  }, [report]);

  const groupedChecks = useMemo(() => {
    if (!report) return [];
    const groups = new Map<PilotAutoCheck["group"], PilotAutoCheck[]>();
    for (const check of report.autoChecks) {
      const list = groups.get(check.group) || [];
      list.push(check);
      groups.set(check.group, list);
    }
    return Array.from(groups.entries());
  }, [report]);

  const pilotReady =
    report?.autoReady &&
    manualProgress.done >= Math.ceil(manualProgress.total * 0.85);

  return (
    <article className="admin-card admin-launch-card">
      <div className="admin-launch-header">
        <div>
          <h2 className="admin-card-title">Lancement pilote — Phase 5A</h2>
          <p className="admin-section-hint">
            Vérifications auto + checklist manuelle avant 5–10 vendeurs réels.
          </p>
        </div>
        <button type="button" className="admin-refresh" onClick={() => void fetchReport()}>
          {loading ? "…" : "Actualiser"}
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {report && (
        <>
          <div className={`admin-launch-status${pilotReady ? " admin-launch-status--ready" : ""}`}>
            {pilotReady ? (
              <strong>Prêt pour le pilote</strong>
            ) : report.autoReady ? (
              <strong>Infra OK — terminer la checklist manuelle</strong>
            ) : (
              <strong>
                {report.missingRequired.length} point(s) bloquant(s) — corriger avant go-live
              </strong>
            )}
            <span>
              Vendeurs : {report.pilot.sellerCount} / objectif {report.pilot.targetMin}–
              {report.pilot.targetMax}
            </span>
          </div>

          <div className="admin-launch-progress-row">
            <div className="admin-launch-progress">
              <span>Auto ({autoProgress.requiredOk}/{autoProgress.requiredTotal} requis)</span>
              <div className="admin-launch-bar">
                <div
                  className="admin-launch-bar-fill"
                  style={{
                    width: `${autoProgress.requiredTotal ? (autoProgress.requiredOk / autoProgress.requiredTotal) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="admin-launch-progress">
              <span>Manuel ({manualProgress.done}/{manualProgress.total})</span>
              <div className="admin-launch-bar">
                <div
                  className="admin-launch-bar-fill admin-launch-bar-fill--manual"
                  style={{
                    width: `${(manualProgress.done / manualProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="admin-launch-urls">
            <p className="admin-launch-urls-title">URLs à copier</p>
            {(
              [
                ["webhook", "Webhook Bictorys", report.urls.webhook],
                ["maintenance", "Cron maintenance", report.urls.maintenance],
                ["auth", "Auth callback", report.urls.authCallback],
              ] as const
            ).map(([key, label, url]) => (
              <div key={key} className="admin-launch-url-row">
                <span>{label}</span>
                <code>{url}</code>
                <button type="button" onClick={() => void copyUrl(key, url)}>
                  {copied === key ? "Copié" : "Copier"}
                </button>
              </div>
            ))}
          </div>

          <details className="admin-launch-details" open>
            <summary>Vérifications automatiques</summary>
            {groupedChecks.map(([group, checks]) => (
              <div key={group} className="admin-launch-group">
                <p className="admin-launch-group-title">{GROUP_LABELS[group]}</p>
                <ul className="admin-health-list">
                  {checks.map((check) => (
                    <li key={check.id}>
                      <span>
                        {check.label}
                        {check.hint && !check.ok && (
                          <em className="admin-launch-hint"> — {check.hint}</em>
                        )}
                      </span>
                      <strong className={check.ok ? "admin-health-ok" : "admin-health-bad"}>
                        {check.ok ? "OK" : check.required ? "Manquant" : "—"}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </details>

          <details className="admin-launch-details" open>
            <summary>Checklist manuelle (persistée dans ce navigateur)</summary>
            <ul className="admin-launch-manual-list">
              {MANUAL_STEPS.map((step) => (
                <li key={step.id}>
                  <label className="admin-launch-check">
                    <input
                      type="checkbox"
                      checked={!!manualDone[step.id]}
                      onChange={() => toggleManual(step.id)}
                    />
                    <span>{step.label}</span>
                  </label>
                  {"doc" in step && step.doc && (
                    <span className="admin-launch-step-doc">{step.doc}</span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}

      {loading && !report && <p className="admin-loading">Chargement du preflight…</p>}
    </article>
  );
}

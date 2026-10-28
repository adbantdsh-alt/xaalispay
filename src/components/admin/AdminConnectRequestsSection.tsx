"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { COUNTRIES } from "@/lib/utils";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import { formatAdminDate } from "./admin-types";
import { EmptyState, EntityCell, Panel, StatusPill, Tabs, type Tone } from "./AdminUI";

type RequestStatus = "new" | "contacted" | "accepted" | "rejected";

type AccessRequest = {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  country: string;
  website: string;
  monthly_volume: string;
  use_case: string;
  status: RequestStatus;
  created_at: string;
};

const STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  new: { label: "Nouvelle", tone: "info" },
  contacted: { label: "Contactée", tone: "warn" },
  accepted: { label: "Acceptée", tone: "good" },
  rejected: { label: "Refusée", tone: "neutral" },
};

// Aligné sur ConnectAccessRequest.Volume (backend).
const VOLUME_LABELS: Record<string, string> = {
  lt_1m: "< 1 M F / mois",
  "1m_10m": "1–10 M F / mois",
  "10m_50m": "10–50 M F / mois",
  gt_50m: "> 50 M F / mois",
};

const FILTERS = [
  { value: "", label: "Toutes" },
  ...(Object.keys(STATUS) as RequestStatus[]).map((s) => ({ value: s, label: STATUS[s].label })),
];

/** Demandes d'accès bêta Connect déposées depuis la landing (section #connect). */
export function AdminConnectRequestsSection() {
  const router = useRouter();
  const [rows, setRows] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    const res = await apiFetch(`/api/admin/connect/access-requests${filter ? `?status=${filter}` : ""}`);
    if (handleAdminAuthStatus(res.status, router, "/admin/connect/requests")) return;
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, [filter, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial + changement de filtre
    fetchRows();
  }, [fetchRows]);

  async function updateStatus(id: string, status: RequestStatus) {
    const res = await apiFetch(`/api/admin/connect/access-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.ok) await fetchRows();
  }

  const countryLabel = (code: string) => COUNTRIES.find((c) => c.code === code)?.label ?? code;

  return (
    <section className="admin-section">
      <Panel
        title="Demandes d'accès bêta"
        count={rows.length}
        toolbar={<Tabs label="Statut" value={filter} onChange={setFilter} options={FILTERS} />}
      >
        {loading && rows.length === 0 ? (
          <p className="ax-muted ax-pad">Chargement…</p>
        ) : rows.length === 0 ? (
          <EmptyState icon={Inbox} title="Aucune demande" hint="Les demandes du formulaire Connect de la landing arrivent ici." />
        ) : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>Plateforme</th>
                <th>Contact</th>
                <th>Volume</th>
                <th>Reçue le</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <tr
                    className="ax-row"
                    tabIndex={0}
                    onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    onKeyDown={(e) => e.key === "Enter" && setOpenId(openId === r.id ? null : r.id)}
                  >
                    <td>
                      <EntityCell name={r.company} sub={`${countryLabel(r.country)}${r.website ? ` · ${r.website}` : ""}`} />
                    </td>
                    <td>
                      <span className="ax-cell-strong">{r.contact_name}</span>
                      <span className="ax-cell-sub">
                        {r.email} · {r.phone}
                      </span>
                    </td>
                    <td className="is-nowrap">{VOLUME_LABELS[r.monthly_volume] ?? r.monthly_volume}</td>
                    <td className="is-nowrap">{formatAdminDate(r.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <StatusPill tone={STATUS[r.status].tone} label={STATUS[r.status].label} />
                      <select
                        aria-label="Changer le statut"
                        className="ax-select"
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value as RequestStatus)}
                        style={{ marginLeft: 8 }}
                      >
                        {(Object.keys(STATUS) as RequestStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS[s].label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {openId === r.id ? (
                    <tr>
                      <td colSpan={5} className="ax-pad" style={{ whiteSpace: "pre-wrap" }}>
                        {r.use_case}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </section>
  );
}

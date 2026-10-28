"use client";

import { useState, type FormEvent } from "react";
import { IconCheck } from "@/components/icons";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { COUNTRIES } from "@/lib/utils";

// Doit rester aligné sur ConnectAccessRequest.Volume (xaalispay-backend/apps/connect/models.py).
const VOLUMES = [
  { value: "lt_1m", label: "Moins de 1 M FCFA / mois" },
  { value: "1m_10m", label: "1 à 10 M FCFA / mois" },
  { value: "10m_50m", label: "10 à 50 M FCFA / mois" },
  { value: "gt_50m", label: "Plus de 50 M FCFA / mois" },
];

const EMPTY = {
  contact_name: "",
  company: "",
  email: "",
  phone: "",
  country: "SN",
  website: "",
  monthly_volume: "",
  use_case: "",
};

export function ConnectAccessForm() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    const website = form.website.trim();
    const res = await apiFetch("/api/v1/connect/access-requests", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        website: website && !/^https?:\/\//.test(website) ? `https://${website}` : website,
      }),
    });
    setSending(false);
    if (!res.ok) {
      if (res.status === 429) {
        setError("Trop de demandes envoyées. Réessayez dans une heure.");
        return;
      }
      setError(extractApiError(await res.json().catch(() => null), "Envoi impossible. Réessayez."));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-[24px] bg-white p-8 text-center text-[#1E3A5F]">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#F7EEE3] text-[#B8895D]">
          <IconCheck size={22} />
        </span>
        <h3 className="mt-5 text-[22px] font-semibold">Demande envoyée, merci !</h3>
        <p className="mt-2 text-[15px] text-[#6B7280]">
          Notre équipe étudie votre projet et vous recontacte sous 48 h par email ou WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[24px] bg-white p-6 md:p-8 text-[#1E3A5F]">
      <h3 className="text-[20px] font-semibold">Demander un accès bêta</h3>
      <p className="mt-1 text-[14px] text-[#6B7280]">Places limitées : on onboarde les plateformes une par une.</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Votre nom">
          <input required maxLength={120} value={form.contact_name} onChange={set("contact_name")} className="lp-input" placeholder="Awa Ndiaye" />
        </Field>
        <Field label="Plateforme / entreprise">
          <input required maxLength={120} value={form.company} onChange={set("company")} className="lp-input" placeholder="CopyStore" />
        </Field>
        <Field label="Email professionnel">
          <input required type="email" value={form.email} onChange={set("email")} className="lp-input" placeholder="awa@entreprise.com" />
        </Field>
        <Field label="WhatsApp">
          <input required type="tel" value={form.phone} onChange={set("phone")} className="lp-input" placeholder="+221 77 123 45 67" />
        </Field>
        <Field label="Pays">
          <select value={form.country} onChange={set("country")} className="lp-input">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Volume mensuel estimé">
          <select required value={form.monthly_volume} onChange={set("monthly_volume")} className="lp-input">
            <option value="" disabled>
              Choisir…
            </option>
            {VOLUMES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Site web (optionnel)" className="sm:col-span-2">
          <input value={form.website} onChange={set("website")} className="lp-input" placeholder="https://votre-plateforme.com" />
        </Field>
        <Field label="Votre projet" className="sm:col-span-2">
          <textarea
            required
            maxLength={2000}
            rows={4}
            value={form.use_case}
            onChange={set("use_case")}
            className="lp-input resize-none"
            placeholder="Marketplace, livraison, services… Qui paie qui, et quand l'argent doit-il être libéré ?"
          />
        </Field>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-[14px] font-medium text-[#B3261E]">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={sending} className="lp-btn lp-btn-primary mt-6 w-full justify-center disabled:opacity-60">
        {sending ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-medium text-[#1E3A5F]">{label}</span>
      {children}
    </label>
  );
}

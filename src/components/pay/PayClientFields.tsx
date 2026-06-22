/** Formulaire infos client — zone de livraison ajoutée pour la tarification
 * par zone (voir ProductForm côté vendeur) ; reste de la mise en page
 * inchangée par rapport au design validé. */
"use client";

import { formatCurrency } from "@/lib/utils";
import s from "./PayClientFields.module.css";

export interface PayClientFieldsValues {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  deliveryZoneId: string;
}

interface PayClientFieldsProps {
  values: PayClientFieldsValues;
  onChange: (values: PayClientFieldsValues) => void;
  zones: Array<{ id: string; name: string; price: number }>;
}

export function PayClientFields({ values, onChange, zones }: PayClientFieldsProps) {
  const set = (key: keyof PayClientFieldsValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className={s.form}>
      <div className={s.row}>
        <div className={s.field}>
          <label className={s.label} htmlFor="pay-first-name">
            Prénom
          </label>
          <input
            id="pay-first-name"
            className={s.input}
            placeholder="Ex. Aminata"
            value={values.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="pay-last-name">
            Nom
          </label>
          <input
            id="pay-last-name"
            className={s.input}
            placeholder="Ex. Diop"
            value={values.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="pay-phone">
          Numéro de téléphone
        </label>
        <div className={s.phoneRow}>
          <span className={s.prefix}>+221</span>
          <input
            id="pay-phone"
            className={`${s.input} ${s.phoneInput}`}
            type="tel"
            placeholder="77 123 45 67"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            autoComplete="tel"
          />
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="pay-zone">
          Zone de livraison
        </label>
        <select
          id="pay-zone"
          className={s.input}
          value={values.deliveryZoneId}
          onChange={(e) => set("deliveryZoneId", e.target.value)}
        >
          <option value="">Choisir une zone…</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} — {formatCurrency(z.price)}
            </option>
          ))}
        </select>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="pay-address">
          Adresse de livraison <span className="text-muted">(optionnel)</span>
        </label>
        <textarea
          id="pay-address"
          className={s.textarea}
          placeholder="Quartier, rue, point de repère…"
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
          rows={2}
          autoComplete="street-address"
        />
      </div>
    </div>
  );
}

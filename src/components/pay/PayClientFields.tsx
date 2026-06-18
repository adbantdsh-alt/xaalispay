"use client";

import { useEffect, useId, useRef, useState } from "react";
import { filterSenegalRegions } from "@/lib/senegal-regions";
import s from "./PayClientFields.module.css";

export interface PayClientFieldsValues {
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  address: string;
}

interface PayClientFieldsProps {
  values: PayClientFieldsValues;
  onChange: (values: PayClientFieldsValues) => void;
}

export function PayClientFields({ values, onChange }: PayClientFieldsProps) {
  const set = (key: keyof PayClientFieldsValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  const regionListId = useId();
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionQuery, setRegionQuery] = useState("");
  const regionWrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredRegions = filterSenegalRegions(regionQuery);

  useEffect(() => {
    if (!regionOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!regionWrapRef.current?.contains(e.target as Node)) {
        setRegionOpen(false);
        setRegionQuery("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [regionOpen]);

  useEffect(() => {
    if (regionOpen) searchRef.current?.focus();
  }, [regionOpen]);

  const selectRegion = (region: string) => {
    set("region", region);
    setRegionOpen(false);
    setRegionQuery("");
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
        <span className={s.label}>Adresse de livraison</span>
        <div className={s.addressRow}>
          <div className={s.field} ref={regionWrapRef}>
            <label className={s.srOnly} htmlFor={`${regionListId}-trigger`}>
              Région
            </label>
            <button
              id={`${regionListId}-trigger`}
              type="button"
              className={`${s.input} ${s.regionTrigger} ${regionOpen ? s.regionTriggerOpen : ""}`}
              onClick={() => setRegionOpen((o) => !o)}
              aria-expanded={regionOpen}
              aria-haspopup="listbox"
              aria-controls={`${regionListId}-list`}
            >
              <span className={values.region ? s.regionValue : s.regionPlaceholder}>
                {values.region || "Région"}
              </span>
              <span className={s.chevron} aria-hidden="true" />
            </button>

            {regionOpen && (
              <div className={s.regionPanel} id={`${regionListId}-list`} role="listbox">
                <input
                  ref={searchRef}
                  className={s.regionSearch}
                  type="search"
                  placeholder="Rechercher une région…"
                  value={regionQuery}
                  onChange={(e) => setRegionQuery(e.target.value)}
                  aria-label="Rechercher une région"
                />
                <ul className={s.regionList}>
                  {filteredRegions.length === 0 ? (
                    <li className={s.regionEmpty}>Aucune région trouvée</li>
                  ) : (
                    filteredRegions.map((region) => (
                      <li key={region}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={values.region === region}
                          className={`${s.regionOption} ${values.region === region ? s.regionOptionActive : ""}`}
                          onClick={() => selectRegion(region)}
                        >
                          {region}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className={s.field}>
            <label className={s.srOnly} htmlFor="pay-address">
              Détail de l&apos;adresse
            </label>
            <input
              id="pay-address"
              className={s.input}
              placeholder="Quartier, rue, repère…"
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              autoComplete="street-address"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

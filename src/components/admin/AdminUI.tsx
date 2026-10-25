"use client";

import { Search, X } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

/* Briques visuelles de l'admin v2 — chaque page se compose avec elles plutôt
 * que de réinventer cartes, filtres et tableaux. Styles : bloc "ADMIN V2"
 * de app/globals.css (classes ax-*). */

export type Tone = "good" | "warn" | "bad" | "neutral" | "info";

export function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={`ax-pill ax-pill--${tone}`}>
      <span className="ax-pill-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export type StatItem = { label: string; value: ReactNode; hint?: ReactNode; tone?: "default" | "accent" | "warn" };

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div className="ax-stats">
      {items.map((item) => (
        <div key={item.label} className={`ax-stat ax-stat--${item.tone ?? "default"}`}>
          <span className="ax-stat-label">{item.label}</span>
          <span className="ax-stat-value admin-mono">{item.value}</span>
          {item.hint != null && <span className="ax-stat-hint">{item.hint}</span>}
        </div>
      ))}
    </div>
  );
}

export function Panel({
  title,
  count,
  actions,
  toolbar,
  children,
  flush = true,
}: {
  title?: ReactNode;
  count?: number;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  /** true : le contenu (un tableau) touche les bords de la carte. */
  flush?: boolean;
}) {
  return (
    <section className="ax-panel">
      {(title || actions) && (
        <header className="ax-panel-head">
          {title && (
            <h2 className="ax-panel-title">
              {title}
              {count != null && <span className="ax-count admin-mono">{count}</span>}
            </h2>
          )}
          {actions && <div className="ax-panel-actions">{actions}</div>}
        </header>
      )}
      {toolbar && <div className="ax-toolbar">{toolbar}</div>}
      <div className={flush ? "ax-panel-body ax-panel-body--flush" : "ax-panel-body"}>{children}</div>
    </section>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="ax-search">
      <Search size={15} aria-hidden="true" />
      <span className="ax-sr-only">{placeholder}</span>
      <input type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="ax-tabs" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value || "all"}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={`ax-tab ${value === option.value ? "is-active" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count != null && <span className="ax-tab-count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "—";
}

export function EntityCell({ name, sub, mono }: { name: string; sub?: ReactNode; mono?: boolean }) {
  return (
    <span className="ax-entity">
      <span className="ax-avatar" aria-hidden="true">
        {initialsOf(name)}
      </span>
      <span className="ax-entity-text">
        <span className="ax-entity-name">{name}</span>
        {sub && <span className={`ax-entity-sub ${mono ? "admin-mono" : ""}`}>{sub}</span>}
      </span>
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="ax-empty">
      <span className="ax-empty-icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <p className="ax-empty-title">{title}</p>
      {hint && <p className="ax-empty-hint">{hint}</p>}
    </div>
  );
}

/** Fiche de détail : panneau latéral à droite sur ordinateur, panneau du bas
 * sur téléphone. */
export function DetailPanel({
  title,
  subtitle,
  badge,
  onClose,
  wide,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="ax-drawer-backdrop" onClick={onClose}>
      <aside
        className={`ax-drawer ${wide ? "ax-drawer--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ax-drawer-head">
          <div className="ax-drawer-titles">
            <h2 className="ax-drawer-title">{title}</h2>
            {subtitle && <p className="ax-drawer-subtitle">{subtitle}</p>}
          </div>
          {badge}
          <button type="button" className="ax-icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="ax-drawer-body">{children}</div>
      </aside>
    </div>
  );
}

export function DetailSection({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="ax-dsection">
      <div className="ax-dsection-head">
        <h3 className="ax-dsection-title">{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function KeyValues({ rows }: { rows: { label: string; value: ReactNode; strong?: boolean }[] }) {
  return (
    <dl className="ax-kv">
      {rows.map((row) => (
        <div key={row.label} className={row.strong ? "is-strong" : undefined}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ContactCard({ role, name, phone, sub }: { role: string; name: string; phone?: string | null; sub?: ReactNode }) {
  return (
    <div className="ax-contact">
      <EntityCell name={name} sub={role} />
      {phone ? (
        <div className="ax-contact-actions">
          <a className="ax-btn ax-btn--sm" href={`tel:${phone}`}>
            Appeler
          </a>
          <a
            className="ax-btn ax-btn--sm ax-btn--wa"
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </div>
      ) : (
        <span className="ax-muted">Téléphone non renseigné</span>
      )}
      {sub && <p className="ax-contact-sub">{sub}</p>}
    </div>
  );
}

export type TimelineItem = { label: string; date?: string; tone?: "ok" | "bad" | "default" };

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="ax-timeline">
      {items.map((item) => (
        <li key={item.label} className={`ax-timeline-item is-${item.tone ?? "default"}`}>
          <span className="ax-timeline-dot" aria-hidden="true" />
          <span className="ax-timeline-label">{item.label}</span>
          {item.date && <span className="ax-timeline-date">{item.date}</span>}
        </li>
      ))}
    </ol>
  );
}

/** Ton visuel d'un statut métier (commandes, retraits, remboursements…). */
export function toneForStatus(status: string): Tone {
  if (["released", "succeeded", "active", "approved"].includes(status)) return "good";
  if (["dispute", "failed", "rejected"].includes(status)) return "bad";
  if (["pending", "pending_payment", "processing"].includes(status)) return "warn";
  if (["paid", "protection", "funded", "partially_released"].includes(status)) return "info";
  return "neutral";
}

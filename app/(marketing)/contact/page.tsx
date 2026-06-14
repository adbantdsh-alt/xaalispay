"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(
      `Nom: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    const subject = encodeURIComponent(`[XaalisPay] ${form.subject || "Contact"}`);
    window.location.href = `mailto:contact@xaalispay.sn?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="content-page">
      <header className="content-hero">
        <p className="section-label">Contact</p>
        <h1 className="content-title">Parlons ensemble</h1>
        <p className="content-lead">
          Une question sur le séquestre, un litige, ou l&apos;ouverture de votre boutique ?
          Notre équipe vous répond du lundi au vendredi, 9h–18h (GMT).
        </p>
      </header>

      <div className="content-two-col">
        <form onSubmit={handleSubmit} className="glass-card-blue content-form">
          <input
            className="input-field"
            placeholder="Votre nom *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input-field"
            type="email"
            placeholder="Votre email *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="input-field"
            placeholder="Sujet"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <textarea
            className="input-field min-h-[140px]"
            placeholder="Votre message *"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
          <button type="submit" className="btn-relief-blue w-full">
            Envoyer le message
          </button>
          {sent && (
            <p className="alert-info text-center">
              Votre client mail va s&apos;ouvrir — envoyez le message pour nous contacter.
            </p>
          )}
        </form>

        <aside className="content-aside">
          <div className="glass-card content-aside-block">
            <p className="section-label">Email</p>
            <a href="mailto:contact@xaalispay.sn" className="content-link">
              contact@xaalispay.sn
            </a>
          </div>
          <div className="glass-card content-aside-block">
            <p className="section-label">Adresse</p>
            <p className="text-black">Dakar, Sénégal</p>
          </div>
          <div className="glass-card content-aside-block">
            <p className="section-label">Support litiges</p>
            <p className="text-sm text-muted">
              Pour un litige en cours, utilisez le bouton sur votre page de paiement ou écrivez-nous
              avec votre référence de commande.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

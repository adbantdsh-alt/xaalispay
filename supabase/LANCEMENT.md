# XaalisPay — Checklist lancement manuel (Phase 5A)

À faire **une fois** avant d'ouvrir aux vrais vendeurs (prod). Coche au fur et à mesure.

## Outils intégrés

| Outil | Usage |
|-------|--------|
| `npm run preflight` | Vérifie `.env.local` / variables avant deploy |
| `/admin` → **Lancement pilote** | Checklist auto + manuelle, URLs webhook/cron |
| `GET /api/admin/preflight` | Rapport JSON (super_admin) |

---

## 1. Supabase

1. Créer le projet Supabase (région proche du Sénégal si possible).
2. **SQL Editor** → exécuter dans l'ordre :
   - `supabase/setup_prod.sql`
   - `supabase/schema_v1.sql`
3. **Authentication → URL Configuration** :
   - Site URL : `https://xaalispay.com`
   - Redirect URLs : `https://xaalispay.com/auth/callback`
4. Récupérer **Project URL**, **anon key**, **service_role key**.

---

## 2. Vercel — variables d'environnement

Copier depuis `.env.example` et remplir en **Production** :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://xaalispay.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service (secrète) |
| `AUTH_SECRET` | 32+ caractères aléatoires |
| `CRON_SECRET` | secret pour cron maintenance |
| `DEV_AUTO_LOGIN` | **`false`** |
| `BICTORYS_PUBLIC_KEY` + `BICTORYS_API_KEY` | clés **prod** Bictorys |
| `BICTORYS_BASE_URL` | `https://api.bictorys.com` |
| `BICTORYS_WEBHOOK_SECRET` | secret webhook payin |
| `BICTORYS_REFUND_API_KEY` | remboursements |
| `BICTORYS_PAYOUT_API_KEY` | retraits vendeurs |

---

## 3. Vercel — Cron

Créer un cron job :

- **URL** : `GET https://xaalispay.com/api/maintenance`
- **Fréquence** : toutes les heures (ou selon besoin)
- **Header** : `Authorization: Bearer <CRON_SECRET>`

---

## 4. Bictorys

1. Passer en compte **production** (pas test.bictorys.com).
2. Configurer l'URL webhook : `https://xaalispay.com/api/webhook`
3. Tester un paiement Wave/Orange de bout en bout (petit montant).
4. Tester un remboursement litige / annulation.
5. Tester un retrait vendeur vers votre numéro.

---

## 5. Admin XaalisPay

1. Se connecter avec le compte **super_admin**.
2. Aller sur `/admin` → **Checklist production** = tout vert.
3. **Synchroniser app_state → tables** (une fois, puis après gros imports).
4. Vérifier qu'un litige test s'arbitre correctement.

---

## 6. Compte vendeur pilote

1. Inscription réelle (email vérifié).
2. Créer 1 produit avec photo.
3. Payer en tant qu'acheteur (autre téléphone).
4. Valider livraison (PIN).
5. Retirer vers Wave/Orange.
6. Vérifier **Portefeuille → Mouvements** et **Historique retraits**.

---

## 7. Dev local (optionnel)

| Variable | Usage |
|----------|--------|
| `DEV_AUTO_LOGIN=true` | auto-login sur `/auth` et routes vendeur |
| Landing `/` | visible sans redirect — bannière « Dashboard démo » en dev |

**Ne jamais** activer `DEV_AUTO_LOGIN=true` en production.

---

## 8. Go live

- [ ] DNS `xaalispay.com` → Vercel
- [ ] SSL actif
- [ ] Test paiement prod OK
- [ ] Test retrait prod OK
- [ ] 5–10 vendeurs pilotes identifiés
- [ ] Support WhatsApp / contact prêt

---

## 9. Phase 7 — Pilote vendeurs (5–10)

### Variables

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Numéro support (sans +) — lien WhatsApp vendeur + page contact |

### Admin → onglet **Pilote**

- Entonnoir : inscrit → email vérifié → produit → commande payée → livraison → retrait
- Liste vendeurs avec statut et lien WhatsApp direct
- Objectif : **5–10 parcours complets** (payin → livraison → retrait)

### Session onboarding (1 vendeur, ~30 min)

1. Inscription + vérification email
2. Créer 1 produit avec photo (`/create`)
3. Partager le lien (WhatsApp) — acheteur test sur autre téléphone
4. Payer Wave/Orange → webhook ou polling confirme le paiement
5. Valider livraison avec PIN (`/dashboard`)
6. Attendre fin Séquestre Flash → retrait Wave/Orange (`/wallet`)
7. Vérifier email confirmation + mouvements portefeuille

### Côté vendeur

- **Premiers pas** (dashboard) : 5 étapes dont retrait
- Bannière **Support pilote WhatsApp** (14 premiers jours)
- Paramètres → lien support WhatsApp

---

## 10. Phase 5B — Infra durable (post-pilote)

| Variable | Rôle |
|----------|------|
| `XP_RELATIONAL_DUAL_WRITE` | Sync auto app_state → xp_* après chaque écriture (défaut : `true` en prod) |
| `XP_RELATIONAL_READ` | Lire depuis xp_* au lieu de app_state (`true` après validation) |
| `RESEND_API_KEY` + `EMAIL_FROM` | Emails vendeur (commande payée, retrait confirmé) |
| `ADMIN_ALERT_EMAIL` | Alerte email litige ouvert |

**Admin → Exports CSV** : commandes et retraits (depuis xp_* si synchronisé).

**Cron maintenance** : sync relationnelle de secours toutes les heures si dual-write actif.

---

## En cas de problème

- **Admin → Santé système** : Supabase, Bictorys, webhooks
- Logs Vercel : Functions → `/api/webhook`, `/api/maintenance`
- Table `app_state` dans Supabase : backup JSON avant migration manuelle

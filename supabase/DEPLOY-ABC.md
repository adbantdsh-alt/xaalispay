# XaalisPay — Déploiement Phases A · B · C

Guide unique : **SQL Supabase** + **variables Vercel** + ordre d’exécution.

---

## 1. SQL Supabase (dans l’ordre)

Ouvrir **Supabase → SQL Editor** et exécuter **chaque fichier une fois** :

### Étape 1 — `supabase/setup_prod.sql`
- Table `app_state` (persistance JSON)
- Bucket `product-images`

### Étape 2 — `supabase/schema_v1.sql`
- Tables relationnelles `xp_*` (profiles, orders, payouts, ledger…)
- Requis pour performance Phase B

### Vérification après SQL

```sql
-- Doit retourner 1 ligne
SELECT id, updated_at FROM public.app_state WHERE id = 'main';

-- Doit lister les tables xp_
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'xp_%'
ORDER BY table_name;
```

### Sync initiale (une fois en prod)

1. Se connecter super_admin sur `https://xaalispay.com/admin`
2. **Paramètres techniques** → bouton synchroniser **app_state → tables**
3. Ou appeler : `POST /api/admin/migrate-relational` (session admin)

---

## 2. Variables Vercel — Production

**Settings → Environment Variables → Production**

### Obligatoires (Phase A)

| Variable | Exemple / note |
|----------|----------------|
| `NEXT_PUBLIC_SITE_URL` | `https://xaalispay.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (secret) |
| `AUTH_SECRET` | min. 32 caractères aléatoires |
| `CRON_SECRET` | min. 32 caractères aléatoires |
| `DEV_AUTO_LOGIN` | `false` |
| `BICTORYS_API_KEY` | clé prod encaissement |
| `BICTORYS_PUBLIC_KEY` | clé publique prod |
| `BICTORYS_PRIVATE_KEY` | clé privée prod |
| `BICTORYS_BASE_URL` | `https://api.bictorys.com` |
| `BICTORYS_WEBHOOK_SECRET` | secret webhook payin |
| `BICTORYS_MERCHANT_SECRET_CODE` | code marchand |
| `BICTORYS_REFUND_API_KEY` | remboursements |
| `BICTORYS_PAYOUT_API_KEY` | retraits Wave/Orange |
| `BICTORYS_PAYOUT_WEBHOOK_SECRET` | webhook retraits |
| `PROTECTION_MINUTES` | `30` |

### Performance (Phase B) — activer après sync SQL

| Variable | Valeur | Quand |
|----------|--------|-------|
| `XP_RELATIONAL_DUAL_WRITE` | `true` | Défaut prod — garde `app_state` + `xp_*` sync |
| `XP_RELATIONAL_READ` | `false` puis `true` | Passer à `true` **après** sync + test pilote OK |

### Support & emails (recommandé)

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | `221771234567` (sans +) |
| `RESEND_API_KEY` | clé Resend |
| `EMAIL_FROM` | `XaalisPay <noreply@xaalispay.com>` |
| `ADMIN_ALERT_EMAIL` | votre email |

---

## 3. Supabase Auth — URLs

**Authentication → URL Configuration**

| Champ | Valeur |
|-------|--------|
| Site URL | `https://xaalispay.com` |
| Redirect URLs | `https://xaalispay.com/auth/callback` |

---

## 4. Vercel — Cron

Fichier `vercel.json` : cron quotidien `GET /api/maintenance`

Vercel envoie : `Authorization: Bearer <CRON_SECRET>`

Le cron fait maintenant :
- libération commandes (protection expirée)
- retraits auto
- **réconciliation paiements Bictorys en attente**
- sync relationnelle

---

## 5. Bictorys — Webhooks prod

| Type | URL |
|------|-----|
| Payin | `https://xaalispay.com/api/webhook` |
| Payout | `https://xaalispay.com/api/payout/webhook` |
| Refund | `https://xaalispay.com/api/refund/webhook` |

---

## 6. Admin — nouvelles fonctions (Phase C)

| Onglet | Usage |
|--------|-------|
| **Commandes** | Réconcilier / expirer paiements test bloqués |
| **Vendeurs** | Soldes, litiges, WhatsApp |
| **Recherche** | Slug, téléphone, @vendeur |
| **Alertes** | Bandeau en haut — actions 1 clic |

### Nettoyer tes tests (18 pending)

1. `/admin` → alerte **Expirer tests > 6 h** (commandes abandonnées)
2. Ou **Réconcilier Bictorys** si le client a vraiment payé
3. Onglet **Commandes** → action ligne par ligne

---

## 7. Vérification finale

```text
GET https://www.xaalispay.com/api/health/db
→ "commit" = dernier déploiement
→ storage = "remote" (pas "local")
```

Admin → Santé système :
- Stockage : **remote**
- Checklist prod : vert
- Paiements en attente : 0 (après nettoyage tests)

---

## 8. Ordre recommandé pour toi

1. Exécuter SQL (setup_prod + schema_v1)
2. Coller toutes les variables Vercel ci-dessus
3. Redéployer Production (`master` ou promote Preview)
4. `/admin` → sync tables → expirer tests pending
5. Tester 1 paiement + 1 retrait réel
6. Après 1 semaine pilote OK → `XP_RELATIONAL_READ=true`

import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { CopyButton } from "@/components/ui/CopyButton";

export const metadata: Metadata = buildPageMetadata({
  title: "Documentation Connect",
  description:
    "Guide d'intégration XaalisPay Connect : Platform, commissions scindées, authentification, webhooks, code de livraison, erreurs et exemples curl.",
  path: "/connect/docs",
  noIndex: true,
});

function Code({
  lang,
  id,
  copyText,
  children,
}: {
  lang: string;
  id?: string;
  copyText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="docs-code" id={id}>
      <div className="docs-code-head">
        <span className="docs-code-lang">{lang}</span>
        {copyText ? <CopyButton text={copyText} className="btn-ghost" /> : null}
      </div>
      <pre>{children}</pre>
    </div>
  );
}

function Callout({
  kind,
  title,
  children,
}: {
  kind: "info" | "warn" | "danger";
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`docs-callout docs-callout-${kind}`}>
      {title ? <strong>{title}</strong> : null}
      {children}
    </div>
  );
}

const roundingPy = `import math
frais = math.floor(montant * taux + 0.5)`;

const roundingJs = `// Math.round() de JavaScript arrondit déjà les .5 vers le haut pour les
// nombres positifs — identique à la formule ci-dessus, rien à changer.
const frais = Math.round(montant * taux);`;

const sigPy = `import hashlib, hmac, time

def verify(secret: str, signature_header: str, raw_body: bytes, tolerance_seconds: int = 300) -> bool:
    parts = dict(p.split("=", 1) for p in signature_header.split(","))
    timestamp, v1 = parts["t"], parts["v1"]
    if abs(time.time() - int(timestamp)) > tolerance_seconds:
        return False  # rejoue trop ancien
    expected = hmac.new(
        secret.encode(), f"{timestamp}.{raw_body.decode()}".encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, v1)`;

const sigJs = `const crypto = require("crypto");

function verify(secret, signatureHeader, rawBody, toleranceSeconds = 300) {
  const parts = Object.fromEntries(signatureHeader.split(",").map((p) => p.split("=")));
  const { t: timestamp, v1 } = parts;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSeconds) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`\${timestamp}.\${rawBody.toString()}\`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}`;

const exAccount = `curl -X POST $XAALISPAY_API/api/v1/connect/accounts \\
  -H "Authorization: Bearer $SK" -H "Content-Type: application/json" \\
  -d '{"external_ref":"merchant-1","display_name":"Boutique Adba","kind":"merchant"}'`;

const exTxnNoCharge = `curl -X POST $XAALISPAY_API/api/v1/connect/transactions \\
  -H "Authorization: Bearer $SK" -H "Content-Type: application/json" \\
  -H "X-Idempotency-Key: order-42-attempt-1" \\
  -d '{
    "amount": 10000,
    "beneficiary": "merchant-1",
    "application_fee": 1000,
    "release_policy": "manual",
    "external_ref": "order-42",
    "payer": {"name": "Awa", "phone": "+221770000000"},
    "initiate_charge": false
  }'`;

const exOperators = `curl $XAALISPAY_API/api/v1/connect/operators?country=SN \\
  -H "Authorization: Bearer $SK"`;

const exTxnCharge = `curl -X POST $XAALISPAY_API/api/v1/connect/transactions \\
  -H "Authorization: Bearer $SK" -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "beneficiary": "merchant-1",
    "application_fee": 1000,
    "release_policy": "on_funding",
    "external_ref": "order-43",
    "payment_method": "wave",
    "initiate_charge": true
  }'`;

const exWebhookRegister = `curl -X POST $XAALISPAY_API/api/v1/connect/webhook-endpoints \\
  -H "Authorization: Bearer $SK" -H "Content-Type: application/json" \\
  -d '{"url":"https://api.votre-plateforme.com/webhooks/xaalispay"}'`;

const exPayout = `curl -X POST $XAALISPAY_API/api/v1/connect/accounts/b5013175-dcfa-4e9b-bb29-c29f4e6f4ce4/payouts \\
  -H "Authorization: Bearer $SK" -H "Content-Type: application/json" \\
  -d '{"amount": 8850}'`;

export default function ConnectDocsPage() {
  return (
    <div className="docs-shell">
      <aside className="docs-sidebar">
        <div className="docs-brand">
          <span className="docs-brand-name">XaalisPay</span>
          <span className="docs-brand-tag">Connect</span>
        </div>
        <div className="docs-status">
          Vérifié contre <code>apps/connect/</code> · MAJ 2026-09-05
          <br />
          Référence de champs : <code>/api/schema/swagger-ui/</code>
        </div>
        <nav className="docs-nav">
          <div className="docs-nav-group">
            <div className="docs-nav-label">Démarrer</div>
            <a href="#apercu">Aperçu</a>
            <a href="#demarrage">Démarrage rapide</a>
            <a className="docs-nav-sub" href="#platform">La Platform</a>
            <a className="docs-nav-sub" href="#frais-financement">Frais — financement</a>
            <a className="docs-nav-sub" href="#frais-retrait">Frais — retrait</a>
            <a className="docs-nav-sub" href="#arrondi">Règle d&apos;arrondi</a>
            <a className="docs-nav-sub" href="#flux">Flux d&apos;intégration</a>
          </div>
          <div className="docs-nav-group">
            <div className="docs-nav-label">Référence</div>
            <a href="#authentification">Authentification</a>
            <a className="docs-nav-sub" href="#cles-api">Clés API</a>
            <a className="docs-nav-sub" href="#portail">Portail self-serve</a>
            <a href="#webhooks">Webhooks</a>
            <a className="docs-nav-sub" href="#signature">Vérifier la signature</a>
            <a className="docs-nav-sub" href="#evenements">Catalogue d&apos;événements</a>
            <a href="#code-livraison">Code de livraison</a>
            <a href="#erreurs">Erreurs &amp; limites</a>
          </div>
          <div className="docs-nav-group">
            <div className="docs-nav-label">Pratique</div>
            <a href="#exemples">Exemples curl</a>
          </div>
        </nav>
      </aside>

      <main className="docs-main">
        <section className="docs-section" id="apercu">
          <div className="docs-eyebrow">XaalisPay Connect</div>
          <h1 className="docs-h1">Documentation d&apos;intégration</h1>
          <p className="docs-lede">
            XaalisPay Connect est la brique de paiement séquestre (escrow) branchable de
            XaalisPay, façon Stripe Connect : votre plateforme pilote la création, le
            financement, la libération, le remboursement et le litige de transactions
            séquestre via une API REST, sans réimplémenter la logique de séquestre
            elle-même.
          </p>

          <Callout kind="info" title="Onboarding — pas de self-service">
            XaalisPay Connect n&apos;a pas d&apos;inscription automatique : contactez
            XaalisPay pour être onboardé. Une fois votre <code>Platform</code> créée, vous
            recevez une clé API (<code>sk_test_…</code> ou <code>sk_live_…</code>), et si vous
            voulez gérer vos clés et webhooks vous-même par la suite, un accès au portail
            self-serve (email + mot de passe).
          </Callout>

          <h3 className="docs-h3">Dans cette page</h3>
          <ul>
            <li>
              <a href="#demarrage">Démarrage rapide</a> — la <code>Platform</code>, mode
              test/live, le modèle de commission scindé.
            </li>
            <li>
              <a href="#authentification">Authentification</a> — clés API, portail self-serve.
            </li>
            <li>
              <a href="#webhooks">Webhooks</a> — signature HMAC, catalogue d&apos;événements, retry.
            </li>
            <li>
              <a href="#code-livraison">Code de livraison</a> —{" "}
              <code>release_policy=on_delivery_code</code>.
            </li>
            <li>
              <a href="#erreurs">Erreurs et limites de débit</a>.
            </li>
            <li>
              <a href="#exemples">Exemples de bout en bout</a> — curl, vérifiés contre l&apos;API réelle.
            </li>
          </ul>

          <Callout kind="warn" title="Opérateurs mobile money">
            <code>GET /operators?country=SN</code> renvoie la liste blanche opérateur/pays — à
            interroger avant de proposer un choix d&apos;opérateur à votre client plutôt que de
            la deviner ou la dupliquer (voir <a href="#exemples">exemples §3</a>), elle évolue
            indépendamment.
          </Callout>
        </section>

        <section className="docs-section" id="demarrage">
          <div className="docs-eyebrow">Démarrage rapide</div>
          <h2 className="docs-h2" id="platform">
            Qu&apos;est-ce qu&apos;une <code>Platform</code> ?
          </h2>
          <p>
            Une <code>Platform</code> est votre tenant Connect — l&apos;entité qui pilote
            l&apos;escrow via l&apos;API (création de transactions, comptes, release/refund/
            dispute). Chaque transaction, compte connecté, clé API et endpoint webhook
            appartient à une <code>Platform</code> et n&apos;est jamais visible d&apos;une autre
            plateforme.
          </p>
          <p>Une <code>Platform</code> porte trois réglages qui déterminent l&apos;économie de chaque transaction et de chaque retrait :</p>
          <ul>
            <li>
              <code>xaalispay_fee_percent</code> — la part que XaalisPay prélève{" "}
              <strong>au financement</strong>. Taux fixe, identique pour toutes les plateformes
              connectées : <strong>1,5&nbsp;%</strong>. Non négociable, rien à configurer.
            </li>
            <li>
              <code>xaalispay_payout_fee_percent</code> — la part que XaalisPay prélève{" "}
              <strong>au retrait</strong>, sur chaque payout. Taux fixe : <strong>3,5&nbsp;%</strong>.
            </li>
            <li>
              Son propre compte de trésorerie, qui reçoit votre <code>application_fee</code>{" "}
              (votre commission, définie transaction par transaction).
            </li>
          </ul>
          <p>
            XaalisPay facture donc en <strong>deux temps</strong>, chacun au moment où son
            propre coût de traitement (Bictorys) est réellement engagé : une petite part au
            financement, une part plus importante au retrait — plutôt qu&apos;un taux unique
            prélevé d&apos;un coup à la création.
          </p>

          <h3 className="docs-h3">Onboarding</h3>
          <ol>
            <li>
              Un ingénieur XaalisPay crée votre <code>Platform</code> et vous transmet une{" "}
              <strong>clé API</strong> (<code>sk_test_…</code> en test, <code>sk_live_…</code>{" "}
              en live) — voir <a href="#authentification">Authentification</a>.
            </li>
            <li>
              Optionnellement, un accès au <strong>portail self-serve</strong> (
              <code>/connect/portal</code>) pour gérer vos clés et vos webhooks vous-même.
            </li>
          </ol>
          <Callout kind="info">
            Mode test et mode live sont <strong>la même API, le même environnement</strong> —
            seule la clé change de préfixe. Il n&apos;y a pas de bac à sable séparé : testez avec
            de petits montants réels ou coordonnez-vous avec XaalisPay pour du mode test.
          </Callout>

          <h2 className="docs-h2" id="frais-financement">
            Au financement
          </h2>
          <p>
            Sur chaque transaction, le montant payé par l&apos;acheteur (<code>amount</code>) se
            répartit en trois parts, prélevées à la source, avant tout versement :
          </p>
          <Code lang="formule">
            amount = xaalispay_fee + application_fee + Σ(splits vers vos bénéficiaires)
          </Code>
          <ul>
            <li>
              <code>xaalispay_fee</code> — la part de XaalisPay (composante payin), calculée
              automatiquement : <code>amount × xaalispay_fee_percent</code>. Vous ne
              l&apos;envoyez jamais dans la requête.
            </li>
            <li>
              <code>application_fee</code> — votre commission, fixée par vous, transaction par
              transaction.
            </li>
            <li>Le reste va à votre/vos bénéficiaire(s).</li>
          </ul>
          <p>
            Exemple chiffré (utilisé dans nos propres tests) : <code>amount = 10 000</code> FCFA,{" "}
            <code>application_fee = 1 000</code> FCFA (10&nbsp;%) :
          </p>
          <div className="docs-fee-row">
            <div className="docs-fee-part docs-fee-house">
              <div className="docs-fee-amt">150 FCFA</div>
              <div className="docs-fee-who">
                xaalispay_fee (1,5&nbsp;% de 10&nbsp;000)
                <br />→ trésorerie XaalisPay
              </div>
            </div>
            <div className="docs-fee-part docs-fee-you">
              <div className="docs-fee-amt">1 000 FCFA</div>
              <div className="docs-fee-who">
                application_fee
                <br />→ votre trésorerie plateforme
              </div>
            </div>
            <div className="docs-fee-part docs-fee-merchant">
              <div className="docs-fee-amt">8 850 FCFA</div>
              <div className="docs-fee-who">
                le reste
                <br />→ compte connecté désigné
              </div>
            </div>
          </div>
          <Callout kind="warn" title="Validation à la création">
            L&apos;acheteur paie exactement <code>amount</code> — jamais de frais ajoutés au
            paiement. Si <code>xaalispay_fee + application_fee + Σ splits ≠ amount</code>,
            l&apos;API renvoie <code>400</code>. Vous n&apos;avez jamais à calculer{" "}
            <code>xaalispay_fee</code> vous-même : fixez <code>amount</code>,{" "}
            <code>application_fee</code> et vos <code>splits</code>/<code>beneficiary</code>,
            l&apos;API calcule et vérifie le reste.
          </Callout>

          <h2 className="docs-h2" id="frais-retrait">
            Au retrait — nouveau
          </h2>
          <p>
            Contrairement au financement, <strong>le retrait n&apos;est pas gratuit</strong> :
            quand un compte connecté retire ses fonds <code>available</code> (
            <code>POST /accounts/{"{id}"}/payouts</code>), XaalisPay prélève{" "}
            <code>xaalispay_payout_fee_percent</code> (3,5&nbsp;%) sur le montant demandé, avant
            d&apos;envoyer le reste à l&apos;opérateur mobile money :
          </p>
          <Code lang="formule">
            net_amount = amount − xaalispay_fee <span className="docs-code-dim"># frais PAYOUT, distinct du frais payin ci-dessus</span>
          </Code>
          <p>Sur les 8&nbsp;850 FCFA <code>available</code> de l&apos;exemple ci-dessus, un retrait de la totalité donne :</p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Champ (réponse <code>POST /payouts</code>)</th>
                  <th>Valeur</th>
                  <th>Signification</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>amount</code></td><td>8 850 FCFA</td><td>Montant demandé (débité de <code>available</code> en entier)</td></tr>
                <tr><td><code>xaalispay_fee</code></td><td>310 FCFA</td><td>3,5&nbsp;% de 8 850, arrondi — prélevé par XaalisPay</td></tr>
                <tr><td><code>net_amount</code></td><td>8 540 FCFA</td><td><strong>Ce qui est réellement envoyé</strong> à l&apos;opérateur mobile money</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Le frais n&apos;est prélevé — et le montant crédité à XaalisPay — <strong>qu&apos;une
            fois le retrait confirmé réussi</strong> côté Bictorys, jamais à la simple demande :
            un retrait qui échoue est intégralement recrédité, sans aucun frais.
          </p>

          <h2 className="docs-h2" id="arrondi">Règle d&apos;arrondi</h2>
          <p>
            Il n&apos;existe pas d&apos;endpoint de prévisualisation : la seule façon
            d&apos;obtenir un <code>xaalispay_fee</code> exact est de créer une vraie
            transaction ou un vrai payout. Pour le calculer côté vous avant d&apos;appeler
            l&apos;API, reproduisez cette formule — un arrondi au plus proche, moitié arrondie
            vers le haut (jamais l&apos;arrondi bancaire de Python <code>round()</code>, qui
            arrondirait <code>0.5</code> vers le pair le plus proche, parfois vers le bas) :
          </p>
          <Code lang="python" copyText={roundingPy}>{roundingPy}</Code>
          <Code lang="javascript" copyText={roundingJs}>{roundingJs}</Code>
          <p>
            Exemple : 8850 × 0,035 = 309,75 → 309,75 + 0,5 = 310,25 → floor(310,25) = 310 (le{" "}
            <code>xaalispay_fee</code> ci-dessus). Un calcul qui ne suit pas cette règle peut
            diverger d&apos;1 FCFA sur les montants tombant pile sur <code>,5</code> —
            l&apos;API reste dans tous les cas la seule source de vérité.
          </p>

          <h2 className="docs-h2" id="flux">Flux type — produit numérique</h2>
          <p>Libération immédiate, dès le financement.</p>
          <ol className="docs-steps">
            <li>
              <span className="docs-step-num">1</span>
              <div className="docs-step-body">
                <span className="docs-step-title">Créer le compte connecté</span>
                <p>Une fois, réutilisé ensuite par <code>external_ref</code> — <code>POST /accounts</code>.</p>
              </div>
            </li>
            <li>
              <span className="docs-step-num">2</span>
              <div className="docs-step-body">
                <span className="docs-step-title">Créer la transaction</span>
                <p><code>POST /transactions</code> avec <code>release_policy=on_funding</code> et <code>initiate_charge=true</code> → l&apos;API renvoie un <code>checkout_url</code> (lien de paiement Bictorys).</p>
              </div>
            </li>
            <li>
              <span className="docs-step-num">3</span>
              <div className="docs-step-body">
                <span className="docs-step-title">Rediriger l&apos;acheteur</span>
                <p>Vers <code>checkout_url</code>. Après paiement, Bictorys le renvoie sur la page de retour XaalisPay (<code>/connect/pay/{"{id}"}</code>), qui redirige vers <strong>votre</strong> <code>success_url</code>/<code>error_url</code>.</p>
              </div>
            </li>
            <li>
              <span className="docs-step-num">4</span>
              <div className="docs-step-body">
                <span className="docs-step-title">Financement + libération immédiate</span>
                <p>Dès confirmation côté Bictorys, XaalisPay finance puis libère immédiatement — vos bénéficiaires voient les fonds passer en <code>available</code>.</p>
              </div>
            </li>
          </ol>

          <h2 className="docs-h2">Flux type — produit physique</h2>
          <p>Deux politiques de libération selon que vous avez un signal de livraison fiable :</p>
          <ul>
            <li><code>release_policy=manual</code> — vous appelez vous-même <code>POST /transactions/{"{id}"}/release</code> quand votre système confirme la livraison.</li>
            <li><code>release_policy=on_delivery_code</code> — XaalisPay gère la confirmation via un code à 4 chiffres. Voir <a href="#code-livraison">Code de livraison</a>.</li>
          </ul>

          <h3 className="docs-h3">Suivre l&apos;activité</h3>
          <ul>
            <li><span className="docs-method docs-method-get">GET</span><code>/accounts/{"{id}"}/balance</code> — soldes séquestre / disponible / bloqué / déjà versé.</li>
            <li><span className="docs-method docs-method-get">GET</span><code>/accounts/{"{id}"}/statement</code> — relevé des écritures, filtrable par période, poche, <code>store_id</code>.</li>
            <li><span className="docs-method docs-method-get">GET</span><code>/transactions</code> — vos 200 transactions les plus récentes.</li>
            <li>Avec un accès portail : <code>/connect/portal</code> affiche la même chose sans appel API.</li>
          </ul>
        </section>

        <section className="docs-section" id="authentification">
          <div className="docs-eyebrow">Référence</div>
          <h2 className="docs-h2" id="cles-api">Authentification — clés API</h2>
          <p>
            Deux mécanismes, pour deux usages différents, non exclusifs : une même{" "}
            <code>Platform</code> peut avoir des clés API pour ses serveurs <strong>et</strong>{" "}
            des utilisateurs portail pour ses humains. Les clés API sont l&apos;authentification
            de <strong>votre serveur</strong> vers l&apos;API Connect.
          </p>
          <Code lang="header" copyText="Authorization: Bearer sk_live_ab12cd34EXAMPLE...">
            Authorization: Bearer sk_live_ab12cd34EXAMPLE...
          </Code>
          <ul>
            <li>Préfixe <code>sk_live_</code> en production, <code>sk_test_</code> en mode test — fait partie de la clé, ne le retirez pas.</li>
            <li>La clé n&apos;est montrée <strong>qu&apos;une fois</strong>, à sa création. XaalisPay ne stocke que son hash — en cas de perte, il faut en régénérer une.</li>
            <li>Requête sans clé valide → <code>401</code>. Une clé révoquée est traitée comme invalide, même <code>401</code>.</li>
          </ul>
          <Callout kind="danger" title="Scopes non appliqués">
            <code>scopes</code> existe sur la clé à la création mais n&apos;est pas encore
            appliqué côté serveur : n&apos;importe quelle clé active a accès à toute l&apos;API
            de sa plateforme, quels que soient les scopes déclarés. Ne construisez pas de
            contrôle d&apos;accès dessus pour l&apos;instant.
          </Callout>

          <h3 className="docs-h3">Rotation</h3>
          <ul>
            <li><strong>Sans portail</strong> : contactez XaalisPay pour générer une nouvelle clé et révoquer l&apos;ancienne.</li>
            <li><strong>Avec portail</strong> : <span className="docs-method docs-method-post">POST</span><code>/connect/portal/api-keys</code> (création, secret montré une fois) et <span className="docs-method docs-method-post">POST</span><code>/connect/portal/api-keys/{"{id}"}/revoke</code> — la révocation est immédiate et irréversible.</li>
          </ul>

          <h2 className="docs-h2" id="portail">Portail self-serve</h2>
          <p>
            Le portail (<code>/connect/portal</code>) est un accès web pour un humain de votre
            équipe : consulter transactions et soldes, gérer clés API et endpoints webhook. Ce
            n&apos;est <strong>pas</strong> un mécanisme d&apos;auto-inscription — un compte
            portail est créé par XaalisPay à votre demande (email + mot de passe temporaire,
            changement forcé à la première connexion).
          </p>
          <p>
            Un token portail est un JWT distinct des clés API : il ne donne accès qu&apos;à
            l&apos;API de <strong>votre</strong> plateforme. Utilisation programmatique possible
            (mêmes endpoints <code>/api/v1/connect/*</code>), mais pour une intégration
            serveur-à-serveur durable, préférez une clé API — le token portail expire (30 min)
            et suppose un flux de refresh, une clé API non.
          </p>

          <h3 className="docs-h3">Endpoints portail (<code>/api/v1/connect/portal/…</code>)</h3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Endpoint</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td><span className="docs-method docs-method-post">POST</span><code>auth/login</code></td><td><code>{"{email, password}"}</code> → <code>{"{access, refresh, user}"}</code>.</td></tr>
                <tr><td><span className="docs-method docs-method-post">POST</span><code>auth/refresh</code></td><td><code>{"{refresh}"}</code> → <code>{"{access}"}</code> (rotation du refresh activée).</td></tr>
                <tr><td><span className="docs-method docs-method-post">POST</span><code>auth/logout</code></td><td><code>{"{refresh}"}</code> → invalide ce refresh token.</td></tr>
                <tr><td><span className="docs-method docs-method-get">GET</span><code>me</code></td><td>Profil de l&apos;utilisateur portail connecté + sa plateforme.</td></tr>
                <tr><td><span className="docs-method docs-method-post">POST</span><code>change-password</code></td><td><code>{"{new_password}"}</code> (10 caractères minimum).</td></tr>
                <tr><td><span className="docs-method docs-method-get">GET</span>/<span className="docs-method docs-method-post">POST</span><code>api-keys</code></td><td>Liste / création de clés API (secret montré une fois).</td></tr>
                <tr><td><span className="docs-method docs-method-post">POST</span><code>api-keys/{"{id}"}/revoke</code></td><td>Révoque une clé.</td></tr>
                <tr><td><span className="docs-method docs-method-get">GET</span>/<span className="docs-method docs-method-patch">PATCH</span><code>webhook-endpoints/{"{id}"}</code></td><td>Détail / édition (URL, activé, événements souscrits).</td></tr>
                <tr><td><span className="docs-method docs-method-get">GET</span><code>webhook-endpoints/{"{id}"}/deliveries</code></td><td>200 dernières tentatives de livraison.</td></tr>
              </tbody>
            </table>
          </div>
          <p>La création/liste des endpoints webhook se fait sur l&apos;endpoint partagé <code>POST/GET /api/v1/connect/webhook-endpoints</code> (clé API ou token portail).</p>

          <Callout kind="warn" title="Anti-bruteforce">
            5 mots de passe erronés verrouillent le compte avec un backoff exponentiel (1 min,
            puis 2, 4, 8… jusqu&apos;à 60 min max) — <code>429</code> pendant le verrouillage,{" "}
            <code>400</code> pour un mauvais mot de passe hors verrouillage.
          </Callout>
        </section>

        <section className="docs-section" id="webhooks">
          <div className="docs-eyebrow">Référence</div>
          <h2 className="docs-h2">Webhooks</h2>
          <p>
            XaalisPay Connect notifie votre plateforme des changements d&apos;état par webhook
            sortant, signé — plutôt que de faire du polling sur <code>GET /transactions</code>.
          </p>

          <h3 className="docs-h3">Configurer un endpoint</h3>
          <Code lang="http">
            POST /api/v1/connect/webhook-endpoints
            {"\n"}{"{"} &quot;url&quot;: &quot;https://api.votre-plateforme.com/webhooks/xaalispay&quot;, &quot;events&quot;: [] {"}"}
          </Code>
          <p>
            <code>events</code> vide = souscrit à <strong>tous</strong> les événements. Donnez
            une liste (ex. <code>[&quot;transaction.released&quot;, &quot;transaction.refunded&quot;]</code>) pour filtrer.
            La réponse contient <code>secret</code> (préfixe <code>whsec_...</code>) — montré{" "}
            <strong>une seule fois</strong>, gardez-le.
          </p>

          <h3 className="docs-h3">Format de la requête reçue</h3>
          <Code lang="http">
            {`POST <votre url>
Content-Type: application/json
X-XaalisPay-Signature: t=1735300000,v1=5257a869e7...
X-XaalisPay-Event: transaction.released

{"id":"<event_id>","type":"transaction.released","data":{...}}`}
          </Code>
          <p><code>data</code> a la même forme pour tous les événements <code>transaction.*</code> :</p>
          <Code lang="json">
            {`{
  "transaction_id": "d1f9b3a0-...",
  "external_ref": "order-42",
  "status": "released",
  "amount": 10000,
  "currency": "XOF",
  "application_fee": 1000,
  "xaalispay_fee": 200,
  "metadata": { "...": "..." }
}`}
          </Code>
          <p>Et pour les événements <code>payout.*</code> :</p>
          <Code lang="json">
            {`{
  "payout_id": "b2e7...",
  "account_id": "a91c...",
  "account_external_ref": "merchant-1",
  "amount": 9800,
  "status": "succeeded"
}`}
          </Code>

          <h2 className="docs-h2" id="signature">Vérifier la signature</h2>
          <p>
            <code>v1</code> est un HMAC-SHA256, clé = votre <code>secret</code> d&apos;endpoint,
            message = <code>&quot;{"{timestamp}"}.{"{corps brut}"}&quot;</code>. Ne
            re-sérialisez jamais le JSON avant de vérifier — un JSON re-sérialisé n&apos;a
            aucune raison de produire les mêmes octets, la signature ne matchera plus.
          </p>
          <Code lang="python" copyText={sigPy}>{sigPy}</Code>
          <Code lang="node.js" copyText={sigJs}>{sigJs}</Code>
          <Callout kind="warn">
            Dans les deux cas, lisez le corps <strong>brut</strong> (avant tout parsing JSON) —
            en Express par exemple, montez <code>express.raw({"{ type: \"application/json\" }"})</code>{" "}
            sur cette route plutôt que le <code>express.json()</code> global.
          </Callout>

          <h2 className="docs-h2" id="evenements">Catalogue des événements</h2>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Événement</th><th>Déclenché quand</th></tr></thead>
              <tbody>
                <tr><td><code>transaction.funded</code></td><td>Le paiement est confirmé côté Bictorys et les fonds entrent en séquestre.</td></tr>
                <tr><td><code>transaction.released</code></td><td>Libération totale (manuelle, <code>on_funding</code> immédiat, ou code de livraison confirmé).</td></tr>
                <tr><td><code>transaction.partially_released</code></td><td>Libération partielle (marketplace multi-splits, tranches).</td></tr>
                <tr><td><code>transaction.refunded</code></td><td>Remboursement à l&apos;acheteur (via <code>/refund</code>, ou automatique si <code>on_delivery_code</code> jamais confirmé).</td></tr>
                <tr><td><code>transaction.disputed</code></td><td>La transaction est bloquée en litige (<code>/dispute</code>).</td></tr>
                <tr><td><code>payout.succeeded</code></td><td>Un retrait vers l&apos;opérateur mobile money a réussi.</td></tr>
                <tr><td><code>payout.failed</code></td><td>Un retrait a échoué (solde recrédité automatiquement).</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="docs-h3">Retry</h3>
          <p>
            Un échec (statut hors 2xx, timeout, erreur réseau) déclenche un retry avec ce
            backoff exact : <strong>15 s, 30 s, 1 min, 2 min, 5 min</strong>, soit 6 tentatives
            au total. Après la 6ᵉ tentative infructueuse, la livraison passe en{" "}
            <code>failed</code> et n&apos;est plus retentée.
          </p>
          <p>
            Votre endpoint doit répondre <strong>2xx rapidement</strong> (timeout de 15 s côté
            XaalisPay) : traitez l&apos;événement de façon asynchrone si besoin, répondez{" "}
            <code>200</code> tout de suite. Chaque livraison porte un <code>id</code>{" "}
            d&apos;événement stable à travers ses tentatives — utilisez-le pour dédupliquer.
          </p>
          <p>
            Historique de livraison via le portail :{" "}
            <code>GET /api/v1/connect/portal/webhook-endpoints/{"{id}"}/deliveries</code>{" "}
            (statut, tentatives, dernière erreur) — pas d&apos;équivalent côté clé API
            aujourd&apos;hui.
          </p>
        </section>

        <section className="docs-section" id="code-livraison">
          <div className="docs-eyebrow">Référence</div>
          <h2 className="docs-h2">Validation de livraison par code</h2>
          <p>
            <code>release_policy=on_delivery_code</code> délègue à XaalisPay la confirmation de
            livraison d&apos;un produit physique, quand vous n&apos;avez pas vous-même de signal
            de livraison fiable. Si vous en avez un, préférez <code>release_policy=manual</code>{" "}
            et appelez <code>/release</code> vous-même.
          </p>

          <ol className="docs-steps">
            <li>
              <span className="docs-step-num">1</span>
              <div className="docs-step-body">
                <span className="docs-step-title">Transaction créée</span>
                <p><code>create_transaction(release_policy=on_delivery_code)</code>.</p>
              </div>
            </li>
            <li>
              <span className="docs-step-num">2</span>
              <div className="docs-step-body">
                <span className="docs-step-title">Financement</span>
                <p>Webhook Bictorys → <code>transaction.funded</code>.</p>
              </div>
            </li>
            <li>
              <span className="docs-step-num">3</span>
              <div className="docs-step-body">
                <span className="docs-step-title">Code envoyé</span>
                <p>Code à 4 chiffres généré, envoyé par SMS à l&apos;acheteur (<code>txn.payer.phone</code>) — le statut reste <code>FUNDED</code>, pas libéré.</p>
              </div>
            </li>
          </ol>

          <div className="docs-branch">
            <div className="docs-branch-card docs-branch-ok">
              <div className="docs-branch-label">Code soumis</div>
              <p><code>POST /transactions/{"{id}"}/confirm-delivery {"{\"code\": \"1234\"}"}</code> → libération <strong>immédiate</strong> → <code>transaction.released</code>.</p>
            </div>
            <div className="docs-branch-card docs-branch-timeout">
              <div className="docs-branch-label">Jamais confirmé (72h)</div>
              <p>Remboursement automatique → <code>transaction.refunded</code>.</p>
            </div>
          </div>

          <p>
            Le code est aussi renvoyé dans <code>EscrowTransactionSerializer.delivery_code</code>{" "}
            — vous pouvez l&apos;afficher vous-même à l&apos;acheteur en plus du SMS, ou le faire
            saisir par votre vendeur. Ce code ne change plus jamais une fois émis : aucun moyen
            de le régénérer, ni côté API ni côté acheteur.
          </p>

          <Callout kind="warn" title="Anti-bruteforce sur le code">
            5 tentatives de code erroné verrouillent la transaction avec le même backoff
            exponentiel que le login. Pendant le verrouillage, même le bon code est refusé —{" "}
            <code>POST /confirm-delivery</code> renvoie <code>400</code> avec un message
            générique dans les deux cas.
          </Callout>

          <Callout kind="info" title="Échéance">
            Par défaut, une transaction <code>on_delivery_code</code> jamais confirmée est
            remboursée automatiquement <strong>72 heures</strong> après le financement
            (réglable côté XaalisPay, <code>CONNECT_DELIVERY_CONFIRMATION_HOURS</code>). Aucune
            action de votre part n&apos;est nécessaire — vous recevrez{" "}
            <code>transaction.refunded</code>.
          </Callout>
        </section>

        <section className="docs-section" id="erreurs">
          <div className="docs-eyebrow">Référence</div>
          <h2 className="docs-h2">Erreurs et limites de débit</h2>

          <h3 className="docs-h3">Forme des erreurs</h3>
          <p>Trois formes possibles, selon la couche qui répond — vérifiez les trois côté client :</p>
          <Code lang="fallback client">error ?? detail ?? Object.values(body)[0]?.[0]</Code>
          <ul>
            <li>Vues Connect maison (règles métier) : <code>{"{\"error\": \"message en français\"}"}</code>.</li>
            <li>Authentification/permission (DRF natif) : <code>{"{\"detail\": \"message\"}"}</code>.</li>
            <li>Validation de serializer : format DRF standard <code>{"{\"champ\": [\"message\"]}"}</code>.</li>
          </ul>

          <h3 className="docs-h3">Référence par code HTTP</h3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Code</th><th>Cas</th></tr></thead>
              <tbody>
                <tr><td><strong>400</strong></td><td>Requête invalide côté vous : violation d&apos;invariant de montant, état ne permettant pas l&apos;action, opérateur non activé pour le pays, code de livraison erroné, mot de passe portail trop court.</td></tr>
                <tr><td><strong>401</strong></td><td>Aucune credential valide — clé API absente/invalide/révoquée, ou token portail absent/expiré.</td></tr>
                <tr><td><strong>403</strong></td><td>Authentification réussie mais n&apos;autorise pas cette action — ex. une clé API appelant un endpoint portail-only.</td></tr>
                <tr><td><strong>404</strong></td><td>Ressource introuvable <strong>ou appartenant à une autre plateforme</strong> — jamais de fuite d&apos;existence inter-plateforme.</td></tr>
                <tr><td><strong>409</strong></td><td>Conflit d&apos;idempotence : <code>external_ref</code> déjà utilisé pour cette plateforme.</td></tr>
                <tr><td><strong>429</strong></td><td>Limite de débit dépassée, ou compte verrouillé après trop d&apos;échecs.</td></tr>
                <tr><td><strong>502</strong></td><td>Requête acceptée mais l&apos;appel sortant vers Bictorys a échoué — un retry a du sens.</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="docs-h3">Idempotence</h3>
          <ul>
            <li><strong>Création de compte/transaction</strong> : <code>external_ref</code> unique par plateforme. Un doublon renvoie <code>409</code>, jamais une deuxième ressource créée en silence.</li>
            <li><strong>En-tête <code>X-Idempotency-Key</code></strong> sur création de transaction : un rejeu de la même clé dans les 5 minutes renvoie la réponse mise en cache de la première requête plutôt que d&apos;exécuter à nouveau.</li>
          </ul>

          <h3 className="docs-h3">Limites de débit</h3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Scope</th><th>Limite</th><th>Clé de comptage</th></tr></thead>
              <tbody>
                <tr><td>API Connect (hors portail)</td><td>600 req/min</td><td>par <code>Platform</code> (pas par IP)</td></tr>
                <tr><td>Auth portail (<code>login</code>)</td><td>40 req/min</td><td>par IP</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Une réponse <code>429</code> de limite de débit (par opposition au verrouillage
            anti-bruteforce, qui renvoie aussi 429 mais avec un message différent) suit le
            format DRF standard : <code>{"{\"detail\": \"Request was throttled. Expected available in N seconds.\"}"}</code>
          </p>
        </section>

        <section className="docs-section" id="exemples">
          <div className="docs-eyebrow">Pratique</div>
          <h2 className="docs-h2">Exemples de bout en bout</h2>
          <p>
            Tous les exemples ci-dessous ont été rejoués contre un environnement de test
            XaalisPay Connect réel (pas inventés) — remplacez <code>$XAALISPAY_API</code> par
            l&apos;URL de votre environnement et <code>$SK</code> par votre clé API test.
          </p>
          <Code lang="bash">
            {`export XAALISPAY_API="https://api.xaalispay.com"
export SK="sk_test_..."`}
          </Code>

          <h3 className="docs-h3">1. Créer un compte connecté</h3>
          <Code lang="bash" copyText={exAccount}>{exAccount}</Code>
          <Code lang="json — réponse">
            {`{
  "id": "317b47db-c715-4d1d-bad5-39bffe5cbbff",
  "kind": "merchant",
  "external_ref": "merchant-1",
  "display_name": "Boutique Adba",
  "parent": null,
  "payout_method": "",
  "payout_phone": "",
  "status": "active",
  "metadata": {},
  "created_at": "2026-08-24T22:42:58.900976Z"
}`}
          </Code>
          <p><code>external_ref</code> est unique par plateforme — réutilisez-le directement (<code>&quot;beneficiary&quot;: &quot;merchant-1&quot;</code>), pas besoin de retenir l&apos;UUID.</p>

          <h3 className="docs-h3">2. Créer une transaction (sans initier de paiement)</h3>
          <p>Utile pour un flux où <strong>vous</strong> gérez l&apos;encaissement et ne voulez que le séquestre/split (<code>initiate_charge: false</code>, défaut <code>true</code>) :</p>
          <Code lang="bash" copyText={exTxnNoCharge}>{exTxnNoCharge}</Code>
          <Code lang="json — réponse">
            {`{
  "id": "1e6b3789-bff0-4404-bc22-73f746a12628",
  "external_ref": "order-42",
  "amount": 10000,
  "currency": "XOF",
  "country": "SN",
  "status": "pending_payment",
  "release_policy": "manual",
  "application_fee": 1000,
  "xaalispay_fee": 150,
  "payer": { "name": "Awa", "phone": "+221770000000" },
  "splits": [
    {
      "id": 3,
      "beneficiary_account": "317b47db-c715-4d1d-bad5-39bffe5cbbff",
      "beneficiary_external_ref": "merchant-1",
      "amount": 8850,
      "released_amount": 0,
      "status": "pending"
    }
  ],
  "funded_at": null,
  "released_at": null,
  "refunded_at": null,
  "created_at": "2026-08-24T22:43:07.834695Z"
}`}
          </Code>
          <p>Notez <code>xaalispay_fee: 150</code> calculé automatiquement (1,5&nbsp;% de 10 000) et <code>splits[0].amount: 8850</code> = le reste.</p>

          <h3 className="docs-h3">3. Lister les opérateurs mobile money valides pour un pays</h3>
          <Code lang="bash" copyText={exOperators}>{exOperators}</Code>
          <Code lang="json — réponse">{`{ "operators": ["wave", "orange", "maxit"] }`}</Code>
          <p>Un pays inconnu ou sans opérateur activé renvoie une liste vide, jamais une erreur : <code>{"{\"operators\": []}"}</code>. Envoyer un <code>payment_method</code> hors liste est rejeté en 400.</p>

          <h3 className="docs-h3">4. Créer une transaction avec paiement (checkout Bictorys)</h3>
          <Code lang="bash" copyText={exTxnCharge}>{exTxnCharge}</Code>
          <Code lang="json — réponse">
            {`{
  "id": "caa2fc15-22b3-4e08-b42b-f37c09173158",
  "external_ref": "order-43",
  "status": "pending_payment",
  "payment_provider": "bictorys",
  "payment_provider_status": "pending",
  "checkout_url": "https://pay.bictorys.com/checkout/9653db5a-...",
  "...": "mêmes champs que l'exemple 2"
}`}
          </Code>
          <p>Avec <code>release_policy=on_funding</code>, la transaction passe directement <code>pending_payment → funded → released</code> et vous recevez <code>transaction.funded</code> puis <code>transaction.released</code> en webhook — pas besoin de poller.</p>

          <h3 className="docs-h3">5. Consulter une transaction libérée</h3>
          <Code lang="bash">
            {`curl $XAALISPAY_API/api/v1/connect/transactions/caa2fc15-22b3-4e08-b42b-f37c09173158 \\
  -H "Authorization: Bearer $SK"`}
          </Code>
          <Code lang="json — réponse">
            {`{
  "id": "caa2fc15-22b3-4e08-b42b-f37c09173158",
  "status": "released",
  "payment_provider_status": "succeeded",
  "splits": [
    { "amount": 8850, "released_amount": 8850, "status": "released", "...": "" }
  ],
  "funded_at": "2026-08-24T22:43:53.800154Z",
  "released_at": "2026-08-24T22:43:53.839537Z"
}`}
          </Code>

          <h3 className="docs-h3">6. Consulter le solde et le relevé d&apos;un compte</h3>
          <Code lang="bash">
            {`curl $XAALISPAY_API/api/v1/connect/accounts/317b47db-.../balance \\
  -H "Authorization: Bearer $SK"`}
          </Code>
          <Code lang="json — réponse">
            {`{ "escrow_balance": 0, "available_balance": 8850, "blocked_balance": 0, "paid_out_balance": 0, "updated_at": "2026-09-05T11:29:52.816148Z" }`}
          </Code>
          <Code lang="bash">
            {`curl "$XAALISPAY_API/api/v1/connect/accounts/317b47db-.../statement" \\
  -H "Authorization: Bearer $SK"`}
          </Code>
          <p>Renvoie les écritures comptables (append-only), plus récentes d&apos;abord — filtrable avec <code>?pocket=available</code>, <code>?from=</code>, <code>?to=</code>, <code>?store_id=</code>.</p>

          <h3 className="docs-h3">7. Enregistrer un endpoint webhook</h3>
          <Code lang="bash" copyText={exWebhookRegister}>{exWebhookRegister}</Code>
          <Code lang="json — réponse">
            {`{
  "id": "620d63d2-1922-4b5b-ad9b-9edd6108ccfa",
  "url": "https://api.votre-plateforme.com/webhooks/xaalispay",
  "enabled": true,
  "events": [],
  "created_at": "2026-08-24T22:44:38.971851Z",
  "secret": "whsec_H81I9n21TI-sdU46OSmw5JdeoSMp5gyFVAAalWX6V2U"
}`}
          </Code>
          <p><code>secret</code> n&apos;est renvoyé qu&apos;ici, à la création — copiez-le.</p>

          <h3 className="docs-h3">8. Effectuer un retrait (payout)</h3>
          <p><code>amount</code> est débité en entier du solde <code>available</code>, mais seul <code>net_amount</code> est réellement envoyé à l&apos;opérateur mobile money :</p>
          <Code lang="bash" copyText={exPayout}>{exPayout}</Code>
          <Code lang="json — réponse">
            {`{
  "id": "104f2d5d-ebae-43ad-b9c2-72357568d186",
  "account": "b5013175-dcfa-4e9b-bb29-c29f4e6f4ce4",
  "amount": 8850,
  "net_amount": 8540,
  "xaalispay_fee": 310,
  "method": "wave",
  "phone": "+221770000000",
  "country": "SN",
  "status": "succeeded",
  "provider_id": "px-doc-1",
  "failure_reason": "",
  "created_at": "2026-09-05T11:30:32.382304Z"
}`}
          </Code>
          <p>
            Le statut peut aussi revenir <code>processing</code> (résolution différée, vous
            recevrez <code>payout.succeeded</code> ou <code>payout.failed</code> en webhook) —{" "}
            <code>xaalispay_fee</code>/<code>net_amount</code> sont déjà calculés dès la
            création. Un payout qui échoue est intégralement recrédité sur{" "}
            <code>available</code> — <strong>aucun frais n&apos;est prélevé</strong> :
          </p>
          <Code lang="json — GET /payouts">
            {`[
  { "id": "104f2d5d-...", "status": "succeeded", "amount": 8850, "net_amount": 8540, "xaalispay_fee": 310, "...": "" },
  {
    "id": "69473afe-b5f7-4d82-9e73-65ea7d21d7e2",
    "status": "failed",
    "amount": 8850,
    "net_amount": 8540,
    "xaalispay_fee": 310,
    "failure_reason": "{\\"status\\":400,\\"title\\":\\"BAD_REQUEST\\",\\"details\\":\\"E400-38: Insufficient balance\\",\\"source\\":\\"pay\\"}",
    "...": ""
  }
]`}
          </Code>

          <h3 className="docs-h3">Erreurs — formes réelles</h3>
          <Code lang="bash">
            {`# external_ref déjà utilisé sur cette plateforme
curl -X POST $XAALISPAY_API/api/v1/connect/accounts -H "Authorization: Bearer $SK" \\
  -H "Content-Type: application/json" -d '{"external_ref":"merchant-1","display_name":"Doublon","kind":"merchant"}'
# → 409 {"error":"external_ref déjà utilisé : merchant-1"}

# opérateur non activé pour ce pays (SN n'a pas mtn)
curl -X POST $XAALISPAY_API/api/v1/connect/transactions -H "Authorization: Bearer $SK" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":5000,"beneficiary":"merchant-1","release_policy":"manual","payment_method":"mtn","initiate_charge":true}'
# → 400 {"error":"Opérateur 'mtn' non disponible pour le pays 'SN'."}

# aucune authentification
curl $XAALISPAY_API/api/v1/connect/accounts
# → 401 {"detail":"Informations d'authentification non fournies."}

# clé API valide sur un endpoint portail-only
curl $XAALISPAY_API/api/v1/connect/portal/me -H "Authorization: Bearer $SK"
# → 403 {"detail":"Vous n'avez pas la permission d'effectuer cette action."}

# remboursement d'une transaction pas encore financée
curl -X POST $XAALISPAY_API/api/v1/connect/transactions/{id}/refund -H "Authorization: Bearer $SK"
# → 400 {"error":"Transaction non remboursable dans l'état pending_payment."}`}
          </Code>
        </section>

        <footer className="docs-footer">
          Rédigé et vérifié contre le code et les tests réels d&apos;<code>apps/connect/</code>,
          dernière mise à jour le 2026-09-05 (modèle de commission scindé — 1,5&nbsp;% au
          financement + 3,5&nbsp;% au retrait, remplace le taux plat unique). Si un exemple ne
          correspond plus au comportement de l&apos;API, il doit être rejoué contre un
          environnement de test avant d&apos;être corrigé.
        </footer>
      </main>
    </div>
  );
}

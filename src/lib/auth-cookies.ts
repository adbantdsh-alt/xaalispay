/** Nom du cookie httpOnly portant le refresh token Django. Posé/lu uniquement
 * par les routes proxy app/api/auth/* — jamais lu en JS côté client. */
export const REFRESH_COOKIE_NAME = "xp_refresh";

/** Doit correspondre à SIMPLE_JWT.REFRESH_TOKEN_LIFETIME côté backend Django
 * (config/settings/base.py) — sinon le cookie expire avant le token lui-même,
 * et la session "glissante longue durée façon Wave" ne dure en réalité que
 * ce délai-ci, pas les 180 jours prévus. */
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 jours

/** Cookie DISTINCT de REFRESH_COOKIE_NAME pour la session du portail Connect
 * (utilisateur PlatformPortalUser, voir apps.connect.portal_authentication
 * côté backend) — un même navigateur peut avoir une session vendeur/admin ET
 * une session portail simultanément (deux onglets différents, deux mondes
 * différents), jamais partager le même cookie sous peine de collision. */
export const CONNECT_PORTAL_REFRESH_COOKIE_NAME = "xp_connect_portal_refresh";

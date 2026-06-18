/** Nom du cookie httpOnly portant le refresh token Django. Posé/lu uniquement
 * par les routes proxy app/api/auth/* — jamais lu en JS côté client. */
export const REFRESH_COOKIE_NAME = "xp_refresh";

/** Doit correspondre à SIMPLE_JWT.REFRESH_TOKEN_LIFETIME côté backend Django. */
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 jours

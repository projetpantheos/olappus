/**
 * OLAPPUS — règles de détection de secrets.
 *
 * Séparées du script pour être **testables**. Un scanner que personne n'a mis
 * à l'épreuve est un scanner que personne ne devrait croire : jusqu'au
 * 2026-09-09, celui-ci ne détectait pas `client_secret`, et rien ne le disait.
 *
 * Portée assumée : ce module reconnaît des formes de secrets connues, pas des
 * secrets arbitraires. Une valeur nue, sans nom de clé à côté — un UUID seul
 * sur sa ligne, par exemple — n'est pas détectable sans noyer le rapport de
 * faux positifs. Le scanner ne remplace donc pas une revue.
 */

/** Motifs de secrets. `name` sert au rapport, `re` au test. */
const PATTERNS = [
  { name: 'Clé privée PEM', re: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'JWT', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'Clé API Google', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Client secret Google (OAuth)', re: /\bGOCSPX-[0-9A-Za-z_-]{20,}\b/ },
  { name: 'Jeton GitHub', re: /\bgh[pousr]_[0-9A-Za-z]{30,}\b/ },
  { name: 'Clé AWS', re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: 'Jeton Slack', re: /\bxox[abprs]-[0-9A-Za-z-]{10,}\b/ },
  { name: 'Jeton Stripe', re: /\b[sr]k_(live|test)_[0-9A-Za-z]{20,}\b/ },
  { name: 'Clé service_role Supabase', re: /\bservice_role\b[^\n]{0,80}\beyJ/ },
  { name: 'URL avec identifiants', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s:@/]+@/ },
  {
    // Le préfixe libre est délibéré. Avec un simple \b, « client_secret »
    // n'était PAS détecté : le souligné est un caractère de mot, il n'y a donc
    // pas de limite entre « client_ » et « secret ». Défaut trouvé le
    // 2026-09-09, sur le type d'identifiant qu'utilise précisément PISTE.
    name: 'Affectation de secret en clair',
    re: /[A-Za-z0-9_.-]*(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key)\s*[:=]\s*["'][^"'\s]{8,}["']/i,
  },
  {
    // Identifiants OAuth, guillemets facultatifs : dans un fichier .env ou une
    // commande shell, une valeur n'est pas entourée de guillemets.
    name: 'Identifiant OAuth en clair',
    re: /[A-Za-z0-9_.-]*client[_-]?(id|secret)\s*[:=]\s*["']?[A-Za-z0-9_.~-]{16,}["']?/i,
  },
  {
    // Variable d'environnement de credential renseignée en dur dans le dépôt.
    // Le nom suffit : c'est la valeur à côté qui n'a rien à y faire.
    name: 'Variable de credential renseignée',
    re: /\b[A-Z][A-Z0-9_]*(SECRET|TOKEN|PASSWORD|APIKEY|API_KEY|CLIENT_ID|CLIENT_SECRET|KEY)\s*=\s*["']?[A-Za-z0-9_.~-]{12,}["']?/,
  },
];

/** Valeurs manifestement fictives : un gabarit n'est pas une fuite. */
const PLACEHOLDER =
  /(YOUR|EXAMPLE|PLACEHOLDER|CHANGEME|CHANGE_ME|XXXX|<[^>]+>|\.\.\.|TODO|FIXME|REDACTED|A_REMPLIR|VOTRE)/i;

/**
 * Référence à une variable d'environnement : `env(NOM)`, `${NOM}`, `process.env.NOM`.
 * Ce n'est pas une valeur, c'est un pointeur vers une valeur tenue ailleurs.
 */
const ENV_REFERENCE = /(\benv\([A-Z0-9_]+\)|\$\{[A-Z0-9_]+\}|process\.env)/;

/**
 * Dérogation explicite : `secret-scan:allow <justification>` sur la ligne
 * ou sur la précédente. La justification est obligatoire — une dérogation
 * sans motif est traitée comme une détection.
 *
 * Ce mécanisme existe pour que les exceptions soient visibles et relues,
 * jamais pour abaisser le seuil de détection globalement.
 */
const ALLOW = /secret-scan:allow\s+(\S.*)$/;

/** Extensions binaires ou non pertinentes. */
const SKIP_EXT =
  /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|tgz|7z|rar|mp4|mp3|wav|woff2?|ttf|eot|otf|lock)$/i;

/**
 * Détections sur une ligne. Retourne les noms des motifs déclenchés, après
 * exclusion des gabarits et des références à l'environnement.
 */
export function detect(line) {
  if (line.length > 3000) return [];
  if (PLACEHOLDER.test(line)) return [];
  if (ENV_REFERENCE.test(line)) return [];
  return PATTERNS.filter(({ re }) => re.test(line)).map(({ name }) => name);
}

export { PATTERNS, PLACEHOLDER, ENV_REFERENCE, ALLOW, SKIP_EXT };

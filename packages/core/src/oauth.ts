/**
 * Connecteur externe — flux OAuth (G6, `docs/15`, `SEC-35`).
 *
 * Condition de sortie de G6 : **PKCE + `state`, échange côté serveur, scopes
 * minimaux, purge à la déconnexion**, et aucun jeton dans les journaux
 * (`SEC-34`, déjà tenu).
 *
 * Ce module ne contient aucun appel réseau et ne connaît aucun fournisseur.
 * C'est délibéré : les propriétés que G6 exige sont celles du **mécanisme**,
 * pas celles de Google. Elles se démontrent donc sans compte externe, sans
 * compteur démarré et sans une seule donnée personnelle — puis le fournisseur
 * réel n'apporte plus qu'une configuration.
 *
 * L'aléa et le condensat sont **injectés**, comme l'horloge des moteurs de
 * règles : le même code sert côté serveur (`node:crypto`) et côté appareil
 * (WebCrypto), et les tests contrôlent ce qu'ils fournissent.
 */

/** Source d'aléa et de condensat, fournie par la plateforme appelante. */
export interface OAuthCrypto {
  /** Aléa **cryptographique**. Jamais `Math.random` (`SEC-31`). */
  randomBytes(length: number): Uint8Array;
  sha256(data: Uint8Array): Promise<Uint8Array>;
}

export class OAuthError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

// =============================================================================
// Encodage
// =============================================================================

const UNRESERVED = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  // `btoa` existe côté navigateur et côté Node moderne ; pas de dépendance
  // à `Buffer`, qui n'existe pas dans un bundle client.
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Chaîne aléatoire de caractères non réservés.
 * Le modulo introduirait un biais imperceptible mais réel ; on rejette les
 * octets hors plage plutôt que de les replier.
 */
function randomUnreserved(crypto: OAuthCrypto, length: number): string {
  const out: string[] = [];
  while (out.length < length) {
    for (const byte of crypto.randomBytes(length * 2)) {
      if (out.length >= length) break;
      if (byte < 256 - (256 % UNRESERVED.length)) {
        out.push(UNRESERVED[byte % UNRESERVED.length] as string);
      }
    }
  }
  return out.join('');
}

// =============================================================================
// PKCE
// =============================================================================

/** Longueurs imposées par RFC 7636 : 43 à 128 caractères non réservés. */
export const VERIFIER_MIN = 43;
export const VERIFIER_MAX = 128;

export interface PkcePair {
  readonly verifier: string;
  readonly challenge: string;
  readonly method: 'S256';
}

export async function createPkcePair(crypto: OAuthCrypto, length = 64): Promise<PkcePair> {
  if (length < VERIFIER_MIN || length > VERIFIER_MAX) {
    throw new OAuthError(
      `Vérificateur de ${String(length)} caractères hors des bornes RFC 7636.`,
      'PKCE_LENGTH',
    );
  }
  const verifier = randomUnreserved(crypto, length);
  return { verifier, challenge: await challengeFor(crypto, verifier), method: 'S256' };
}

export async function challengeFor(crypto: OAuthCrypto, verifier: string): Promise<string> {
  const bytes = new TextEncoder().encode(verifier);
  return base64UrlEncode(await crypto.sha256(bytes));
}

/**
 * `plain` n'est jamais accepté. RFC 7636 l'autorise ; il ne protège de rien
 * quand l'attaquant voit la requête d'autorisation, c'est-à-dire dans le cas
 * même où PKCE sert.
 */
export async function verifyPkce(
  crypto: OAuthCrypto,
  verifier: string,
  challenge: string,
): Promise<boolean> {
  if (verifier.length < VERIFIER_MIN || verifier.length > VERIFIER_MAX) return false;
  return (await challengeFor(crypto, verifier)) === challenge;
}

// =============================================================================
// Scopes — deny by default
// =============================================================================

/**
 * Scopes autorisés par fournisseur.
 *
 * `docs/15` : lecture seule, métadonnées et extraits structurés, jamais le
 * corps complet ni les pièces jointes par défaut. Cette liste est la
 * **décision produit** de R4 rendue exécutable : demander autre chose échoue,
 * au lieu de dépendre de la vigilance de celui qui construit l'URL.
 */
export const ALLOWED_SCOPES: Readonly<Record<string, readonly string[]>> = {
  'google-synthetique': ['metadata.read'],
};

export function assertScopesAllowed(provider: string, scopes: readonly string[]): void {
  const allowed = ALLOWED_SCOPES[provider];
  if (allowed === undefined) {
    // Fournisseur inconnu : refusé, comme une source inconnue au License Gate.
    throw new OAuthError(`Fournisseur « ${provider} » non déclaré.`, 'UNKNOWN_PROVIDER');
  }
  if (scopes.length === 0) {
    throw new OAuthError('Aucun scope demandé.', 'NO_SCOPE');
  }
  const excess = scopes.filter((s) => !allowed.includes(s));
  if (excess.length > 0) {
    throw new OAuthError(
      `Scopes non autorisés pour ${provider} : ${excess.join(', ')}.`,
      'SCOPE_NOT_ALLOWED',
    );
  }
}

// =============================================================================
// Requête d'autorisation
// =============================================================================

export interface PendingAuthorization {
  readonly state: string;
  readonly verifier: string;
  readonly challenge: string;
  readonly provider: string;
  readonly scopes: readonly string[];
  readonly redirect_uri: string;
  readonly expires_at: number;
}

export interface AuthorizationRequest {
  readonly url: string;
  readonly pending: PendingAuthorization;
}

/** Une autorisation non aboutie n'a aucune raison de rester valide longtemps. */
export const STATE_TTL_MS = 10 * 60 * 1000;

export async function createAuthorizationRequest(
  crypto: OAuthCrypto,
  input: {
    provider: string;
    authorizeEndpoint: string;
    clientId: string;
    redirectUri: string;
    scopes: readonly string[];
    now: number;
  },
): Promise<AuthorizationRequest> {
  assertScopesAllowed(input.provider, input.scopes);

  const { verifier, challenge, method } = await createPkcePair(crypto);
  const state = randomUnreserved(crypto, 32);

  const url = new URL(input.authorizeEndpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', input.clientId);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('scope', input.scopes.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', method);

  return {
    url: url.toString(),
    pending: {
      state,
      verifier,
      challenge,
      provider: input.provider,
      scopes: input.scopes,
      redirect_uri: input.redirectUri,
      expires_at: input.now + STATE_TTL_MS,
    },
  };
}

// =============================================================================
// Retour d'autorisation
// =============================================================================

export interface CallbackParams {
  readonly state?: string;
  readonly code?: string;
  readonly error?: string;
}

/**
 * Registre des autorisations en cours. **À usage unique** : consommer une
 * autorisation la retire. C'est ce qui fait échouer un rejeu, et un rejeu est
 * exactement ce contre quoi `state` existe.
 */
export class AuthorizationStore {
  private readonly pending = new Map<string, PendingAuthorization>();

  put(authorization: PendingAuthorization): void {
    this.pending.set(authorization.state, authorization);
  }

  /** Retire et rend l'autorisation. Un second appel ne trouve rien. */
  take(state: string): PendingAuthorization | undefined {
    const found = this.pending.get(state);
    if (found) this.pending.delete(state);
    return found;
  }

  /** Nettoyage des autorisations périmées. Une trace qui traîne finit par servir. */
  purgeExpired(now: number): number {
    let removed = 0;
    for (const [state, authorization] of this.pending) {
      if (authorization.expires_at <= now) {
        this.pending.delete(state);
        removed += 1;
      }
    }
    return removed;
  }

  get size(): number {
    return this.pending.size;
  }
}

/**
 * Valide un retour d'autorisation et rend l'autorisation consommée.
 *
 * Toute anomalie lève. Rien n'est « toléré » : un retour OAuth qu'on ne
 * comprend pas entièrement est un retour qu'on refuse.
 */
export function consumeCallback(
  store: AuthorizationStore,
  params: CallbackParams,
  now: number,
): PendingAuthorization {
  if (params.error !== undefined && params.error !== '') {
    throw new OAuthError(`Le fournisseur a refusé : ${params.error}.`, 'PROVIDER_ERROR');
  }
  if (params.state === undefined || params.state === '') {
    // Sans `state`, aucune corrélation possible : c'est la forme même d'une
    // requête forgée depuis un autre site.
    throw new OAuthError('Retour sans `state`.', 'STATE_MISSING');
  }
  if (params.code === undefined || params.code === '') {
    throw new OAuthError("Retour sans code d'autorisation.", 'CODE_MISSING');
  }

  const pending = store.take(params.state);
  if (pending === undefined) {
    // Inconnu **ou déjà consommé** : la distinction n'a pas à être faite, et la
    // faire renseignerait un attaquant.
    throw new OAuthError('`state` inconnu ou déjà utilisé.', 'STATE_UNKNOWN');
  }
  if (pending.expires_at <= now) {
    throw new OAuthError('Autorisation expirée.', 'STATE_EXPIRED');
  }
  return pending;
}

// =============================================================================
// Machine à états d'une connexion
// =============================================================================

export const CONNECTION_STATUSES = [
  'DISCONNECTED',
  'AUTHORIZING',
  'CONNECTED',
  'EXPIRED',
  'REVOKED',
] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

/**
 * Transitions permises. Tout ce qui n'y figure pas est refusé.
 *
 * `REVOKED` et `EXPIRED` ne reviennent jamais directement à `CONNECTED` : il
 * faut repasser par une autorisation. Un consentement retiré ne se rétablit
 * pas côté serveur.
 */
const TRANSITIONS: Readonly<Record<ConnectionStatus, readonly ConnectionStatus[]>> = {
  DISCONNECTED: ['AUTHORIZING'],
  AUTHORIZING: ['CONNECTED', 'DISCONNECTED'],
  CONNECTED: ['EXPIRED', 'REVOKED', 'DISCONNECTED'],
  EXPIRED: ['AUTHORIZING', 'DISCONNECTED'],
  REVOKED: ['DISCONNECTED'],
};

export function canTransition(from: ConnectionStatus, to: ConnectionStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(from: ConnectionStatus, to: ConnectionStatus): void {
  if (!canTransition(from, to)) {
    throw new OAuthError(`Transition ${from} → ${to} interdite.`, 'BAD_TRANSITION');
  }
}

/**
 * Une connexion peut-elle servir à lire des données ?
 *
 * Seul `CONNECTED` le permet. Un jeton expiré ou un consentement révoqué rend
 * la connexion **inerte**, comme une source non approuvée au License Gate — et
 * pour la même raison : l'absence de droit ne se rattrape pas en réessayant.
 */
export function isUsable(status: ConnectionStatus, expiresAt: number, now: number): boolean {
  return status === 'CONNECTED' && expiresAt > now;
}

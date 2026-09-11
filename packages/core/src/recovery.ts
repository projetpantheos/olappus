/**
 * Secret de récupération — `SEC-31`, ADR-0008.
 *
 * C'est le secret dont dérive la KEK, donc la seule chose au monde qui ouvre
 * les données L3 d'un utilisateur. Il n'existe **aucune copie côté serveur**,
 * même chiffrée. Le perdre, c'est perdre les données ; il n'y a pas de
 * réparation, et le produit doit le dire avant, pas après.
 *
 * ## Un secret, pas N codes
 *
 * `SEC-31` décrit une dérivation unique : « Recovery codes → KEK utilisateur ».
 * Les « codes » au pluriel sont donc les **segments d'un seul secret**, tous
 * nécessaires — et non N codes indépendants à usage unique comme pour une
 * double authentification.
 *
 * Ce choix a une conséquence dure, et elle est voulue : perdre un segment,
 * c'est perdre les données. L'alternative — N copies de la DEK, chacune
 * enveloppée par un code — serait plus indulgente, mais multiplierait par N les
 * cibles à voler pour un même secret.
 *
 * ## Lisibilité
 *
 * L'alphabet exclut `I`, `L`, `O` et `U` : les trois premiers se confondent
 * avec `1` et `0` sur un papier recopié à la main, le dernier avec `V`. Ces
 * confusions sont corrigées silencieusement à la saisie — quelqu'un qui recopie
 * son secret six mois plus tard ne doit pas perdre ses données sur une
 * ambiguïté typographique.
 */

/** Crockford base32, amputé des caractères ambigus. 32 symboles, 5 bits chacun. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const RECOVERY_GROUPS = 8;
export const RECOVERY_GROUP_SIZE = 5;

/** 40 caractères : 39 de secret et 1 de contrôle, soit 195 bits d'entropie. */
export const RECOVERY_LENGTH = RECOVERY_GROUPS * RECOVERY_GROUP_SIZE;

export class RecoveryError extends Error {}

/**
 * Confusions corrigées à la saisie. Elles ne réduisent pas l'entropie : ces
 * caractères ne sont jamais produits, ils sont seulement acceptés en entrée.
 */
const CONFUSIONS: Readonly<Record<string, string>> = {
  I: '1',
  L: '1',
  O: '0',
  U: 'V',
};

/**
 * Caractère de contrôle : somme pondérée modulo 32.
 * Le poids par position fait qu'une **transposition** de deux caractères change
 * le contrôle — c'est l'erreur de recopie la plus fréquente après la confusion
 * de caractères.
 */
function checksumOf(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const value = ALPHABET.indexOf(body[i] as string);
    if (value < 0) throw new RecoveryError('Caractère hors alphabet.');
    sum = (sum + value * (i + 1)) % ALPHABET.length;
  }
  return ALPHABET[sum] as string;
}

/** Met en groupes lisibles : `ABCDE-FGHJK-…`. Le tiret n'est jamais significatif. */
export function formatRecoverySecret(canonical: string): string {
  const groups: string[] = [];
  for (let i = 0; i < canonical.length; i += RECOVERY_GROUP_SIZE) {
    groups.push(canonical.slice(i, i + RECOVERY_GROUP_SIZE));
  }
  return groups.join('-');
}

/**
 * Forme canonique d'une saisie : majuscules, sans séparateur, confusions
 * corrigées. C'est cette forme, et elle seule, qui alimente la dérivation —
 * sans quoi le même secret saisi différemment donnerait une KEK différente.
 */
export function normalizeRecoveryInput(input: string): string {
  const upper = input.toUpperCase().replace(/[^0-9A-Z]/g, '');
  let out = '';
  for (const character of upper) out += CONFUSIONS[character] ?? character;
  return out;
}

/** Aléa **cryptographique** de la plateforme. Jamais `Math.random` (`SEC-31`). */
export type RandomBytes = (length: number) => Uint8Array;

/**
 * Produit un secret de récupération.
 *
 * Les octets hors plage sont **rejetés** plutôt que repliés par modulo : un
 * repli introduirait un biais faible mais réel sur un secret qui protège tout.
 */
export function generateRecoverySecret(randomBytes: RandomBytes): string {
  const body: string[] = [];
  while (body.length < RECOVERY_LENGTH - 1) {
    for (const byte of randomBytes(RECOVERY_LENGTH * 2)) {
      if (body.length >= RECOVERY_LENGTH - 1) break;
      if (byte < 256 - (256 % ALPHABET.length)) {
        body.push(ALPHABET[byte % ALPHABET.length] as string);
      }
    }
  }
  const canonical = body.join('');
  return formatRecoverySecret(canonical + checksumOf(canonical));
}

export type RecoveryCheck =
  | { readonly ok: true; readonly canonical: string }
  | { readonly ok: false; readonly reason: 'length' | 'alphabet' | 'checksum' };

/**
 * Vérifie une saisie **avant** de tenter la dérivation.
 *
 * L'intérêt n'est pas la sécurité — un attaquant peut calculer le contrôle
 * aussi bien que nous. C'est l'utilisateur : sans cette vérification, une faute
 * de recopie et un secret réellement perdu produisent le même message, et la
 * personne conclut à tort que ses données sont détruites.
 */
export function checkRecoverySecret(input: string): RecoveryCheck {
  const canonical = normalizeRecoveryInput(input);
  if (canonical.length !== RECOVERY_LENGTH) return { ok: false, reason: 'length' };
  for (const character of canonical) {
    if (!ALPHABET.includes(character)) return { ok: false, reason: 'alphabet' };
  }
  const body = canonical.slice(0, -1);
  if (checksumOf(body) !== canonical.slice(-1)) return { ok: false, reason: 'checksum' };
  return { ok: true, canonical };
}

// =============================================================================
// L'ordre imposé par SEC-31
// =============================================================================

/**
 * État du parcours de récupération pour un utilisateur.
 *
 * `acknowledged_at` n'est pas « l'écran a été affiché » : c'est « la personne a
 * confirmé avoir mis son secret en sécurité ». La nuance est tout le contrôle.
 */
export interface RecoveryState {
  readonly generated_at: string | null;
  readonly acknowledged_at: string | null;
}

/**
 * Peut-on collecter une donnée sensible ?
 *
 * `SEC-31` : « L'utilisateur est informé **avant** la collecte de la première
 * donnée sensible, pas au moment de la perte. »
 *
 * Cette fonction existe pour que cette phrase soit une condition vérifiable,
 * et non une intention documentaire. Elle est appelée avant toute connexion à
 * un fournisseur externe.
 */
export function canCollectSensitiveData(state: RecoveryState): boolean {
  return state.generated_at !== null && state.acknowledged_at !== null;
}

/** Ce qui manque, en langage compréhensible. Jamais un code d'erreur. */
export function missingBeforeCollection(state: RecoveryState): readonly string[] {
  const missing: string[] = [];
  if (state.generated_at === null) {
    missing.push('Aucun secret de récupération n’a été créé.');
  }
  if (state.acknowledged_at === null) {
    missing.push('Vous n’avez pas encore confirmé l’avoir mis en sécurité.');
  }
  return missing;
}

// =============================================================================
// Récupération : le compte et les données ne se récupèrent pas ensemble
// =============================================================================

/**
 * Ce qu'une tentative de récupération permet réellement.
 *
 * `SEC-31` impose de distinguer explicitement **retrouver son compte** et
 * **retrouver ses données**. Le premier est possible, le second non — et
 * laisser croire le contraire, ne serait-ce qu'un instant, est la faute que
 * cette distinction existe pour empêcher.
 */
export interface RecoveryOutcome {
  readonly account_recovered: boolean;
  readonly data_recovered: boolean;
  readonly message: string;
}

export function recoveryOutcome(hasSecret: boolean): RecoveryOutcome {
  if (hasSecret) {
    return {
      account_recovered: true,
      data_recovered: true,
      message: 'Votre compte et vos données protégées sont de nouveau accessibles.',
    };
  }
  return {
    account_recovered: true,
    data_recovered: false,
    // Dit au présent et sans détour. Une formulation qui laisse espérer un
    // recours serait une cruauté, pas une délicatesse.
    message:
      'Vous retrouvez votre compte, mais pas les données qu’il protégeait. ' +
      'Sans votre secret de récupération, personne ne peut les déchiffrer — ' +
      'nous non plus. C’est ce qui empêche quiconque d’y accéder sans vous.',
  };
}

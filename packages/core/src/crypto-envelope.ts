/**
 * Format d'enveloppe chiffrée — partie **neutre de plateforme** (`SEC-31`).
 *
 * Isolée dans son propre module pour une raison précise : `crypto.ts` dépend
 * de `node:crypto` et n'a rien à faire dans un bundle client, tandis que
 * `crypto-web.ts` doit y entrer. Les deux ont pourtant besoin du **même**
 * format, de la **même** liaison au contexte et de la **même** garde de forme.
 *
 * Les partager par ce module est ce qui rend l'interopérabilité possible.
 * Les dupliquer aurait rendu la divergence inévitable — et une divergence d'un
 * seul octet dans les données authentifiées rend la donnée illisible pour
 * toujours.
 */

/** Version du format d'enveloppe. Change si la structure change, jamais l'algorithme seul. */
export const ENVELOPE_VERSION = 1;

export const ALGORITHM = 'AES-256-GCM' as const;

export const KEY_BYTES = 32; // AES-256
export const IV_BYTES = 12; // taille recommandée pour GCM
export const TAG_BYTES = 16;
export const SALT_BYTES = 16;

export class CryptoError extends Error {}

/**
 * Paramètres de dérivation. Stockés **avec** chaque clé enveloppée : sans eux,
 * durcir les paramètres demain rendrait les clés d'hier indéchiffrables.
 */
export interface KdfParams {
  readonly N?: number;
  readonly r?: number;
  readonly p?: number;
  readonly iterations?: number;
}

/**
 * Enveloppe chiffrée. Chaque valeur porte sa version de clé : **sans
 * versionnement, aucune rotation n'est possible** — seulement une réécriture
 * atomique de toute la base, c'est-à-dire une migration à risque.
 */
export interface Ciphertext {
  readonly v: number;
  readonly alg: typeof ALGORITHM;
  /** Version de clé. Permet de lire l'ancien pendant qu'on écrit le nouveau. */
  readonly kv: number;
  readonly iv: string;
  readonly ct: string;
  readonly tag: string;
}

/**
 * Contexte auquel une valeur chiffrée est liée cryptographiquement.
 *
 * Sans cette liaison, un attaquant ayant l'écriture en base peut **déplacer**
 * un cryptogramme d'une ligne à l'autre : il ne lit rien, mais il fait lire à
 * la victime la valeur de quelqu'un d'autre. GCM authentifie ces données
 * additionnelles gratuitement ; s'en passer serait un choix, pas une économie.
 */
export interface Binding {
  readonly actorId: string;
  readonly entity: string;
  readonly field: string;
  readonly rowId: string;
}

/**
 * Chaîne liée au cryptogramme. **Irréversible** (ADR-0017) : elle entre dans
 * le calcul du tag d'authentification, donc la modifier rendrait illisible
 * tout ce qui a été écrit avant.
 */
export function bindingString(binding: Binding): string {
  return `olappus:v${String(ENVELOPE_VERSION)}:${binding.actorId}:${binding.entity}:${binding.field}:${binding.rowId}`;
}

export function bindingUtf8(binding: Binding): Uint8Array {
  return new TextEncoder().encode(bindingString(binding));
}

function byteLengthOfBase64(value: string): number {
  // Sans décoder : évite d'allouer pour une simple vérification de taille.
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  return Math.floor((value.length * 3) / 4) - padding;
}

/**
 * Garde de forme, miroir exact de `core.is_ciphertext_envelope` en base.
 *
 * Les deux existent, et c'est voulu : la base refuse le clair même si le code
 * se trompe, le code refuse le clair sans aller jusqu'à la base. Un contrôle
 * porté uniquement par la discipline de l'appelant n'est pas un contrôle.
 */
export function isCiphertext(value: unknown): value is Ciphertext {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate['v'] === ENVELOPE_VERSION &&
    candidate['alg'] === ALGORITHM &&
    typeof candidate['kv'] === 'number' &&
    typeof candidate['iv'] === 'string' &&
    typeof candidate['ct'] === 'string' &&
    typeof candidate['tag'] === 'string' &&
    byteLengthOfBase64(candidate['iv']) === IV_BYTES &&
    byteLengthOfBase64(candidate['tag']) === TAG_BYTES
  );
}

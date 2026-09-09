/**
 * Chiffrement applicatif des champs L3 — `SEC-31`, décision fondatrice ADR-0008.
 *
 * Ce que ce module protège : une base compromise, une sauvegarde exfiltrée, un
 * accès administrateur abusif, une réquisition portant sur les serveurs.
 *
 * Ce qu'il ne protège pas : un appareil compromis, une session volée, une
 * erreur de politique RLS. **C'est une défense en profondeur, jamais un
 * substitut à RLS.**
 *
 * Conséquence directe d'ADR-0008 : aucune clé maître serveur ne permet de
 * déchiffrer les données d'un utilisateur. La KEK dérive d'un secret que seul
 * l'utilisateur détient ; le serveur ne stocke que la DEK **enveloppée**.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

/** Version du format d'enveloppe. Change si la structure change, jamais l'algorithme seul. */
export const ENVELOPE_VERSION = 1;

export const ALGORITHM = 'AES-256-GCM' as const;

/** Algorithme de dérivation. Voir ADR-0017 pour le choix de scrypt. */
export const KDF = 'scrypt' as const;

const KEY_BYTES = 32; // AES-256
const IV_BYTES = 12; // taille recommandée pour GCM
const TAG_BYTES = 16;
const SALT_BYTES = 16;

/**
 * Paramètres de dérivation. Stockés **avec** chaque clé enveloppée : sans eux,
 * durcir les paramètres demain rendrait les clés d'hier indéchiffrables.
 */
export interface KdfParams {
  readonly N: number;
  readonly r: number;
  readonly p: number;
}

export const DEFAULT_KDF_PARAMS: KdfParams = { N: 32768, r: 8, p: 1 };

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

export function bindingBytes(binding: Binding): Buffer {
  return Buffer.from(
    `olappus:v${String(ENVELOPE_VERSION)}:${binding.actorId}:${binding.entity}:${binding.field}:${binding.rowId}`,
    'utf8',
  );
}

/** Clé de données d'un utilisateur, accompagnée de sa version. */
export interface VersionedKey {
  readonly version: number;
  readonly key: Buffer;
}

/** Trousseau de déchiffrement : version de clé → clé. Une rotation en garde deux. */
export type Keyring = ReadonlyMap<number, Buffer>;

export class CryptoError extends Error {}

/** Aléa cryptographique de la plateforme. Jamais `Math.random` (`SEC-31`). */
export function randomDek(): Buffer {
  return randomBytes(KEY_BYTES);
}

export function randomSalt(): Buffer {
  return randomBytes(SALT_BYTES);
}

/**
 * Dérive la KEK du secret détenu par l'utilisateur (ses recovery codes).
 *
 * Le secret n'est jamais stocké, la KEK non plus : elle est recalculée à chaque
 * déverrouillage. Perdre le secret, c'est perdre les données — c'est ADR-0008,
 * et l'utilisateur doit en être informé **avant** la première collecte.
 */
export function deriveKek(
  secret: string,
  salt: Buffer,
  params: KdfParams = DEFAULT_KDF_PARAMS,
): Buffer {
  if (secret.length === 0) {
    throw new CryptoError('Secret de dérivation vide.');
  }
  return scryptSync(Buffer.from(secret, 'utf8'), salt, KEY_BYTES, {
    N: params.N,
    r: params.r,
    p: params.p,
    // scrypt exige explicitement la mémoire qu'il va consommer : 128 * N * r.
    maxmem: 256 * params.N * params.r,
  });
}

function seal(plaintext: Buffer, key: Buffer, keyVersion: number, aad: Buffer): Ciphertext {
  if (key.length !== KEY_BYTES) {
    throw new CryptoError(`Clé de ${String(key.length)} octets ; ${String(KEY_BYTES)} attendus.`);
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aad);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    v: ENVELOPE_VERSION,
    alg: ALGORITHM,
    kv: keyVersion,
    iv: iv.toString('base64'),
    ct: ct.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

function open(envelope: Ciphertext, key: Buffer, aad: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(aad);
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  try {
    return Buffer.concat([decipher.update(Buffer.from(envelope.ct, 'base64')), decipher.final()]);
  } catch {
    // GCM est un chiffrement authentifié : une altération est **détectée**, et
    // non silencieusement déchiffrée en n'importe quoi. C'est tout l'intérêt.
    throw new CryptoError('Valeur chiffrée altérée ou clé incorrecte : lecture refusée.');
  }
}

/** Enveloppe la DEK avec la KEK. Le serveur ne verra jamais que ce résultat. */
export function wrapDek(
  dek: Buffer,
  kek: Buffer,
  keyVersion: number,
  binding: Binding,
): Ciphertext {
  return seal(dek, kek, keyVersion, bindingBytes(binding));
}

export function unwrapDek(envelope: Ciphertext, kek: Buffer, binding: Binding): Buffer {
  return open(envelope, kek, bindingBytes(binding));
}

/** Chiffre une valeur de champ L3. La valeur en clair ne quitte jamais l'appelant. */
export function encryptField(plaintext: string, key: VersionedKey, binding: Binding): Ciphertext {
  return seal(Buffer.from(plaintext, 'utf8'), key.key, key.version, bindingBytes(binding));
}

/**
 * Déchiffre une valeur de champ L3.
 *
 * Le trousseau accepte plusieurs versions : pendant une rotation
 * `CREATE NEW → TEST → SWITCH → REVOKE OLD`, les valeurs de l'ancienne clé
 * restent lisibles pendant que les nouvelles écritures utilisent la nouvelle.
 */
export function decryptField(envelope: Ciphertext, keyring: Keyring, binding: Binding): string {
  if (envelope.v !== ENVELOPE_VERSION) {
    throw new CryptoError(`Version d'enveloppe ${String(envelope.v)} inconnue.`);
  }
  if (envelope.alg !== ALGORITHM) {
    throw new CryptoError(`Algorithme « ${envelope.alg} » non supporté.`);
  }
  const key = keyring.get(envelope.kv);
  if (key === undefined) {
    // Une clé révoquée n'est pas une clé absente par accident : on refuse, on
    // ne tente pas les autres versions « au cas où ».
    throw new CryptoError(`Version de clé ${String(envelope.kv)} absente du trousseau.`);
  }
  return open(envelope, key, bindingBytes(binding)).toString('utf8');
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
    Buffer.from(candidate['iv'], 'base64').length === IV_BYTES &&
    Buffer.from(candidate['tag'], 'base64').length === TAG_BYTES
  );
}

/**
 * Comparaison en temps constant, pour les cas où l'on compare un secret.
 * Une comparaison `===` sur un secret fuit sa longueur et son préfixe.
 */
export function secretEquals(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

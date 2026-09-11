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

import {
  ALGORITHM,
  CryptoError,
  ENVELOPE_VERSION,
  IV_BYTES,
  KEY_BYTES,
  SALT_BYTES,
  bindingString,
  bindingUtf8,
  isCiphertext,
  type Binding,
  type Ciphertext,
  type KdfParams,
} from './crypto-envelope';

// Le format, la liaison au contexte et la garde de forme vivent dans
// `crypto-envelope.ts` : ce module dépend de `node:crypto`, son jumeau
// `crypto-web.ts` ne le peut pas, et les deux doivent produire exactement la
// même enveloppe. Les dupliquer aurait rendu la divergence inévitable.
export {
  ALGORITHM,
  CryptoError,
  ENVELOPE_VERSION,
  bindingString,
  bindingUtf8,
  isCiphertext,
  type Binding,
  type Ciphertext,
  type KdfParams,
};

/** Algorithme de dérivation côté serveur. Voir ADR-0017 pour le choix de scrypt. */
export const KDF = 'scrypt' as const;

export const DEFAULT_KDF_PARAMS: KdfParams = { N: 32768, r: 8, p: 1 };

/** Clé de données d'un utilisateur, accompagnée de sa version. */
export interface VersionedKey {
  readonly version: number;
  readonly key: Buffer;
}

/** Trousseau de déchiffrement : version de clé → clé. Une rotation en garde deux. */
export type Keyring = ReadonlyMap<number, Buffer>;

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
  const N = params.N ?? 32768;
  const r = params.r ?? 8;
  const p = params.p ?? 1;
  return scryptSync(Buffer.from(secret, 'utf8'), salt, KEY_BYTES, {
    N,
    r,
    p,
    // scrypt exige explicitement la mémoire qu'il va consommer : 128 * N * r.
    maxmem: 256 * N * r,
  });
}

function seal(plaintext: Buffer, key: Buffer, keyVersion: number, aad: Uint8Array): Ciphertext {
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

function open(envelope: Ciphertext, key: Buffer, aad: Uint8Array): Buffer {
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
  return seal(dek, kek, keyVersion, bindingUtf8(binding));
}

export function unwrapDek(envelope: Ciphertext, kek: Buffer, binding: Binding): Buffer {
  return open(envelope, kek, bindingUtf8(binding));
}

/** Chiffre une valeur de champ L3. La valeur en clair ne quitte jamais l'appelant. */
export function encryptField(plaintext: string, key: VersionedKey, binding: Binding): Ciphertext {
  return seal(Buffer.from(plaintext, 'utf8'), key.key, key.version, bindingUtf8(binding));
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
  return open(envelope, key, bindingUtf8(binding)).toString('utf8');
}

/**
 * Comparaison en temps constant, pour les cas où l'on compare un secret.
 * Une comparaison `===` sur un secret fuit sa longueur et son préfixe.
 */
export function secretEquals(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

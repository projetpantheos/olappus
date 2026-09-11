/**
 * Chiffrement L3 **côté appareil** — `SEC-31`, ADR-0008, ADR-0017.
 *
 * Jumeau de `crypto.ts`, écrit contre WebCrypto au lieu de `node:crypto`.
 * Les deux produisent et lisent **exactement la même enveloppe** : un test
 * d'interopérabilité le vérifie dans les deux sens, et c'est lui qui compte —
 * deux implémentations qui divergent d'un octet rendent la donnée illisible
 * pour toujours.
 *
 * Pourquoi ce jumeau existe : ADR-0008 veut qu'**aucune clé maître serveur**
 * ne permette de déchiffrer un utilisateur. Tant que seul le serveur sait
 * déchiffrer, cette garantie tient par la forme du schéma, pas par le chemin
 * d'exécution réel. C'est ici qu'elle devient vraie.
 *
 * Ce module ne dépend d'aucun module Node : il peut entrer dans le bundle
 * client, et la garde de barillet le vérifie.
 */

import {
  ALGORITHM,
  CryptoError,
  ENVELOPE_VERSION,
  IV_BYTES,
  KEY_BYTES,
  TAG_BYTES,
  bindingUtf8,
  isCiphertext,
  type Binding,
  type Ciphertext,
  type KdfParams,
} from './crypto-envelope';

export { ALGORITHM, ENVELOPE_VERSION, CryptoError, isCiphertext };
export type { Binding, Ciphertext, KdfParams };

/**
 * Fournisseur WebCrypto.
 *
 * Injecté plutôt que lu globalement : React Native **n'expose pas
 * `crypto.subtle` nativement**. Sur le web il existe ; sur iOS et Android il
 * faudra une implémentation (polyfill ou module natif) que le projet n'a pas
 * encore choisie. L'injection rend ce manque visible à l'appel plutôt que
 * découvert à l'exécution sur un appareil réel.
 */
export interface WebCryptoLike {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
  subtle: SubtleCrypto;
}

/**
 * Rend le fournisseur de la plateforme, ou échoue en le disant.
 * Échouer bruyamment vaut mieux que se rabattre sur un aléa non
 * cryptographique — `SEC-31` interdit `Math.random`, et un repli silencieux
 * reviendrait à l'autoriser.
 */
export function platformCrypto(): WebCryptoLike {
  const candidate = (globalThis as { crypto?: Partial<WebCryptoLike> }).crypto;
  if (
    candidate === undefined ||
    typeof candidate.getRandomValues !== 'function' ||
    candidate.subtle === undefined
  ) {
    throw new CryptoError(
      'WebCrypto indisponible sur cette plateforme : le chiffrement L3 ne peut pas fonctionner. ' +
        'Aucun repli n’est tenté — un chiffrement dégradé serait pire qu’une absence de chiffrement.',
    );
  }
  return candidate as WebCryptoLike;
}

/**
 * Aléa cryptographique seul, sans exiger `subtle`.
 *
 * Générer un secret de récupération ne demande que des octets imprévisibles.
 * Exiger `subtle` pour cela couplerait deux capacités sans rapport, et
 * rendrait le parcours de récupération indisponible sur une plateforme où le
 * chiffrement, lui, le serait par un autre chemin.
 */
export function platformRandom(): (length: number) => Uint8Array {
  const candidate = (globalThis as { crypto?: Partial<WebCryptoLike> }).crypto;
  if (candidate === undefined || typeof candidate.getRandomValues !== 'function') {
    throw new CryptoError(
      'Aucun générateur cryptographique sur cette plateforme. ' +
        'Aucun repli n’est tenté : un secret tiré d’un aléa faible donnerait ' +
        'l’apparence d’une protection.',
    );
  }
  const getRandomValues = candidate.getRandomValues.bind(candidate);
  return (length) => getRandomValues(new Uint8Array(length));
}

function base64UrlSafeEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** `Uint8Array` → `ArrayBuffer` sans copier la vue hôte. */
function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function randomDekWeb(webCrypto: WebCryptoLike = platformCrypto()): Uint8Array {
  return webCrypto.getRandomValues(new Uint8Array(KEY_BYTES));
}

async function importKey(webCrypto: WebCryptoLike, raw: Uint8Array): Promise<CryptoKey> {
  if (raw.length !== KEY_BYTES) {
    throw new CryptoError(`Clé de ${String(raw.length)} octets ; ${String(KEY_BYTES)} attendus.`);
  }
  return webCrypto.subtle.importKey('raw', toBuffer(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * Chiffre une valeur de champ L3, dans le format exact de `crypto.ts`.
 *
 * WebCrypto concatène le tag d'authentification au cryptogramme ; `crypto.ts`
 * les sépare. On sépare donc ici aussi — sans quoi les deux implémentations
 * produiraient des enveloppes incompatibles tout en se croyant d'accord.
 */
export async function encryptFieldWeb(
  plaintext: string,
  key: { version: number; key: Uint8Array },
  binding: Binding,
  webCrypto: WebCryptoLike = platformCrypto(),
): Promise<Ciphertext> {
  const iv = webCrypto.getRandomValues(new Uint8Array(IV_BYTES));
  const sealed = new Uint8Array(
    await webCrypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: toBuffer(iv),
        additionalData: toBuffer(bindingUtf8(binding)),
        tagLength: TAG_BYTES * 8,
      },
      await importKey(webCrypto, key.key),
      toBuffer(new TextEncoder().encode(plaintext)),
    ),
  );

  return {
    v: ENVELOPE_VERSION,
    alg: ALGORITHM,
    kv: key.version,
    iv: base64UrlSafeEncode(iv),
    ct: base64UrlSafeEncode(sealed.subarray(0, sealed.length - TAG_BYTES)),
    tag: base64UrlSafeEncode(sealed.subarray(sealed.length - TAG_BYTES)),
  };
}

/** Trousseau de déchiffrement : version de clé → clé. Une rotation en garde deux. */
export type WebKeyring = ReadonlyMap<number, Uint8Array>;

export async function decryptFieldWeb(
  envelope: Ciphertext,
  keyring: WebKeyring,
  binding: Binding,
  webCrypto: WebCryptoLike = platformCrypto(),
): Promise<string> {
  if (envelope.v !== ENVELOPE_VERSION) {
    throw new CryptoError(`Version d'enveloppe ${String(envelope.v)} inconnue.`);
  }
  if (envelope.alg !== ALGORITHM) {
    throw new CryptoError(`Algorithme « ${envelope.alg} » non supporté.`);
  }
  const raw = keyring.get(envelope.kv);
  if (raw === undefined) {
    throw new CryptoError(`Version de clé ${String(envelope.kv)} absente du trousseau.`);
  }

  const ct = decodeBase64(envelope.ct);
  const tag = decodeBase64(envelope.tag);
  const sealed = new Uint8Array(ct.length + tag.length);
  sealed.set(ct);
  sealed.set(tag, ct.length);

  try {
    const clear = await webCrypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toBuffer(decodeBase64(envelope.iv)),
        additionalData: toBuffer(bindingUtf8(binding)),
        tagLength: TAG_BYTES * 8,
      },
      await importKey(webCrypto, raw),
      toBuffer(sealed),
    );
    return new TextDecoder().decode(clear);
  } catch {
    // Chiffrement authentifié : une altération est détectée, pas silencieusement
    // déchiffrée en n'importe quoi.
    throw new CryptoError('Valeur chiffrée altérée ou clé incorrecte : lecture refusée.');
  }
}

/**
 * Dérive la KEK depuis le secret de l'utilisateur — variante appareil.
 *
 * **PBKDF2 et non scrypt**, parce que WebCrypto ne propose pas scrypt. C'est
 * un écart par rapport à ADR-0017, et il est rendu visible par le champ `kdf`
 * stocké avec chaque clé : une KEK dérivée ici porte `pbkdf2`, une KEK dérivée
 * côté serveur porte `scrypt`, et chacune reste déchiffrable.
 *
 * Le nombre d'itérations est élevé à dessein. Le secret d'entrée reste des
 * recovery codes à haute entropie, générés par le système et non choisis par
 * un humain : c'est le cas où l'écart entre fonctions de dérivation pèse le
 * moins.
 */
export const PBKDF2_ITERATIONS = 600_000;

export async function deriveKekWeb(
  secret: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
  webCrypto: WebCryptoLike = platformCrypto(),
): Promise<Uint8Array> {
  if (secret.length === 0) throw new CryptoError('Secret de dérivation vide.');

  const material = await webCrypto.subtle.importKey(
    'raw',
    toBuffer(new TextEncoder().encode(secret)),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await webCrypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: toBuffer(salt), iterations },
    material,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

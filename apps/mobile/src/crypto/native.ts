import { bindingUtf8, CryptoError, type Binding, type Ciphertext } from '@olappus/core';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha2';
import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
  getRandomValues,
} from 'expo-crypto';

/**
 * Chiffrement L3 sur l'appareil — ADR-0019, `SEC-31`.
 *
 * Troisième implémentation du **même** contrat que `crypto.ts` (serveur) et
 * `crypto-web.ts` (navigateur). Le format, la liaison au contexte et la garde
 * de forme viennent tous de `crypto-envelope.ts` : ils ne sont écrits qu'une
 * fois, parce que deux implémentations qui divergent d'un octet dans les
 * données authentifiées rendent la donnée illisible pour toujours.
 *
 * `expo-crypto` s'adosse aux primitives du système — CryptoKit sur Apple,
 * Keystore et JCA sur Android. C'est ce qui l'a fait préférer à une
 * implémentation logicielle sur le chemin où passent les jetons.
 *
 * La dérivation de clé, elle, n'existe pas dans `expo-crypto` : PBKDF2 vient
 * de `@noble/hashes`, employé pour cela et rien d'autre.
 */

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importKey(raw: Uint8Array): Promise<AESEncryptionKey> {
  if (raw.length !== KEY_BYTES) {
    throw new CryptoError(`Clé de ${String(raw.length)} octets ; ${String(KEY_BYTES)} attendus.`);
  }
  return AESEncryptionKey.import(raw);
}

/** Aléa du système. Jamais `Math.random` (`SEC-31`). */
export function randomDekNative(): Uint8Array {
  return getRandomValues(new Uint8Array(KEY_BYTES));
}

/**
 * Chiffre une valeur de champ L3, dans le format exact des deux autres
 * implémentations.
 *
 * `expo-crypto` sépare déjà nonce, cryptogramme et tag — c'est précisément la
 * forme de notre enveloppe, là où WebCrypto oblige à les recoller puis à les
 * redécouper à la main.
 */
export async function encryptFieldNative(
  plaintext: string,
  key: { version: number; key: Uint8Array },
  binding: Binding,
): Promise<Ciphertext> {
  const iv = getRandomValues(new Uint8Array(IV_BYTES));
  const sealed = await aesEncryptAsync(
    new TextEncoder().encode(plaintext),
    await importKey(key.key),
    {
      nonce: { bytes: iv },
      tagLength: TAG_BYTES,
      additionalData: bindingUtf8(binding),
    },
  );

  return {
    v: 1,
    alg: 'AES-256-GCM',
    kv: key.version,
    iv: await sealed.iv('base64'),
    ct: await sealed.ciphertext({ includeTag: false, encoding: 'base64' }),
    tag: await sealed.tag('base64'),
  };
}

export type NativeKeyring = ReadonlyMap<number, Uint8Array>;

export async function decryptFieldNative(
  envelope: Ciphertext,
  keyring: NativeKeyring,
  binding: Binding,
): Promise<string> {
  if (envelope.v !== 1) {
    throw new CryptoError(`Version d'enveloppe ${String(envelope.v)} inconnue.`);
  }
  if (envelope.alg !== 'AES-256-GCM') {
    throw new CryptoError(`Algorithme « ${envelope.alg} » non supporté.`);
  }
  const raw = keyring.get(envelope.kv);
  if (raw === undefined) {
    throw new CryptoError(`Version de clé ${String(envelope.kv)} absente du trousseau.`);
  }

  try {
    const clear = await aesDecryptAsync(
      AESSealedData.fromParts(
        fromBase64(envelope.iv),
        fromBase64(envelope.ct),
        fromBase64(envelope.tag),
      ),
      await importKey(raw),
      { output: 'bytes', additionalData: bindingUtf8(binding) },
    );
    return new TextDecoder().decode(clear);
  } catch {
    // Chiffrement authentifié : une altération est détectée, pas silencieusement
    // déchiffrée en n'importe quoi.
    throw new CryptoError('Valeur chiffrée altérée ou clé incorrecte : lecture refusée.');
  }
}

/**
 * Dérive la KEK depuis le secret de récupération — variante appareil.
 *
 * PBKDF2, comme sur le web (ADR-0017 amendée) : `expo-crypto` ne propose
 * aucune fonction de dérivation, et l'appareil doit pouvoir ouvrir ce que le
 * navigateur a scellé.
 *
 * `pbkdf2Async` cède la main entre les tours : sans cela, six cent mille
 * itérations figeraient l'interface pendant plusieurs secondes, et l'attente
 * annoncée par l'écran de déverrouillage ne s'afficherait jamais.
 */
export async function deriveKekNative(
  secret: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  if (secret.length === 0) throw new CryptoError('Secret de dérivation vide.');
  return pbkdf2Async(sha256, new TextEncoder().encode(secret), salt, {
    c: iterations,
    dkLen: KEY_BYTES,
  });
}

/** Réexporté pour les tests : l'encodage doit être le même des trois côtés. */
export { toBase64 as encodeBase64Native };

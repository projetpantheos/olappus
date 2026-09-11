/**
 * Chiffrement L3 côté appareil, et **interopérabilité** avec le serveur.
 *
 * C'est le test qui rend ADR-0008 vrai en pratique. Tant que seul le serveur
 * savait déchiffrer, « aucune clé maître serveur » tenait par la forme du
 * schéma ; ici, l'appareil déchiffre réellement ce que le serveur a scellé, et
 * inversement.
 *
 * Deux implémentations qui divergent d'un octet dans les données authentifiées
 * rendent la donnée illisible **pour toujours** — il n'y a pas de réparation
 * après coup. D'où ce fichier.
 */

import { webcrypto } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  decryptField,
  deriveKek,
  encryptField,
  randomDek,
  randomSalt,
  secretEquals,
  type Binding,
} from './crypto';
import {
  CryptoError,
  PBKDF2_ITERATIONS,
  decryptFieldWeb,
  deriveKekWeb,
  encryptFieldWeb,
  platformCrypto,
  randomDekWeb,
  type WebCryptoLike,
} from './crypto-web';

/** WebCrypto de Node : la même API que celle du navigateur et de l'appareil. */
const web = webcrypto as unknown as WebCryptoLike;

const BINDING: Binding = {
  actorId: '11111111-2222-4333-8444-555555555555',
  entity: 'identity.connection',
  field: 'access_token',
  rowId: '66666666-7777-4888-8999-aaaaaaaaaaaa',
};

const SECRET = 'jeton-SYNTHETIQUE-du-fournisseur';

describe('Interopérabilité — le serveur scelle, l’appareil ouvre', () => {
  it('déchiffre côté appareil ce que le serveur a chiffré', async () => {
    const dek = randomDek();
    const sealed = encryptField(SECRET, { version: 1, key: dek }, BINDING);
    const lu = await decryptFieldWeb(sealed, new Map([[1, new Uint8Array(dek)]]), BINDING, web);
    expect(lu).toBe(SECRET);
  });

  it('déchiffre côté serveur ce que l’appareil a chiffré', async () => {
    const dek = randomDekWeb(web);
    const sealed = await encryptFieldWeb(SECRET, { version: 1, key: dek }, BINDING, web);
    expect(decryptField(sealed, new Map([[1, Buffer.from(dek)]]), BINDING)).toBe(SECRET);
  });

  it('produit des enveloppes de forme identique', async () => {
    // Même version, même algorithme, mêmes tailles de nonce et de tag. Une
    // divergence ici passerait inaperçue jusqu'au jour d'une bascule.
    const dek = randomDek();
    const serveur = encryptField(SECRET, { version: 3, key: dek }, BINDING);
    const appareil = await encryptFieldWeb(
      SECRET,
      { version: 3, key: new Uint8Array(dek) },
      BINDING,
      web,
    );

    expect(Object.keys(appareil).sort()).toEqual(Object.keys(serveur).sort());
    expect(appareil.v).toBe(serveur.v);
    expect(appareil.alg).toBe(serveur.alg);
    expect(appareil.kv).toBe(serveur.kv);
    expect(Buffer.from(appareil.iv, 'base64')).toHaveLength(12);
    expect(Buffer.from(appareil.tag, 'base64')).toHaveLength(16);
  });
});

describe('Liaison au contexte — identique des deux côtés', () => {
  it('refuse côté appareil une valeur scellée pour un autre utilisateur', async () => {
    const dek = randomDek();
    const sealed = encryptField(SECRET, { version: 1, key: dek }, BINDING);
    const autre: Binding = { ...BINDING, actorId: '99999999-9999-4999-8999-999999999999' };
    await expect(
      decryptFieldWeb(sealed, new Map([[1, new Uint8Array(dek)]]), autre, web),
    ).rejects.toThrow(CryptoError);
  });

  it('refuse côté serveur une valeur scellée pour un autre champ', async () => {
    const dek = randomDekWeb(web);
    const sealed = await encryptFieldWeb(SECRET, { version: 1, key: dek }, BINDING, web);
    expect(() =>
      decryptField(sealed, new Map([[1, Buffer.from(dek)]]), {
        ...BINDING,
        field: 'refresh_token',
      }),
    ).toThrow(CryptoError);
  });
});

describe('Altération — détectée côté appareil aussi', () => {
  it('refuse un cryptogramme modifié', async () => {
    const dek = randomDekWeb(web);
    const sealed = await encryptFieldWeb(SECRET, { version: 1, key: dek }, BINDING, web);
    const bytes = Buffer.from(sealed.ct, 'base64');
    bytes[0] = (bytes[0] ?? 0) ^ 0x01;
    await expect(
      decryptFieldWeb(
        { ...sealed, ct: bytes.toString('base64') },
        new Map([[1, dek]]),
        BINDING,
        web,
      ),
    ).rejects.toThrow(CryptoError);
  });

  it('refuse une version de clé absente du trousseau', async () => {
    const dek = randomDekWeb(web);
    const sealed = await encryptFieldWeb(SECRET, { version: 1, key: dek }, BINDING, web);
    await expect(decryptFieldWeb(sealed, new Map([[2, dek]]), BINDING, web)).rejects.toThrow(
      /absente du trousseau/,
    );
  });

  it('refuse un algorithme substitué', async () => {
    const dek = randomDekWeb(web);
    const sealed = await encryptFieldWeb(SECRET, { version: 1, key: dek }, BINDING, web);
    await expect(
      decryptFieldWeb(
        { ...sealed, alg: 'AES-128-CBC' } as unknown as typeof sealed,
        new Map([[1, dek]]),
        BINDING,
        web,
      ),
    ).rejects.toThrow(/non supporté/);
  });
});

describe('Dérivation de clé — PBKDF2 côté appareil', () => {
  /** Itérations réduites : ces tests éprouvent la logique, pas le coût. */
  const RAPIDE = 1000;

  it('dérive une clé de 256 bits', async () => {
    const kek = await deriveKekWeb('codes-de-recuperation', randomSalt(), RAPIDE, web);
    expect(kek).toHaveLength(32);
  });

  it('donne une clé différente pour un sel différent', async () => {
    const a = await deriveKekWeb('meme-secret', randomSalt(), RAPIDE, web);
    const b = await deriveKekWeb('meme-secret', randomSalt(), RAPIDE, web);
    expect(secretEquals(Buffer.from(a), Buffer.from(b))).toBe(false);
  });

  it('refuse un secret vide', async () => {
    await expect(deriveKekWeb('', randomSalt(), RAPIDE, web)).rejects.toThrow(/vide/);
  });

  it('ne donne PAS la même clé que scrypt, et c’est attendu', async () => {
    // PBKDF2 et scrypt sont deux fonctions différentes. Le champ `kdf` stocké
    // avec chaque clé dit laquelle a servi ; sans lui, une KEK dérivée sur
    // l'appareil serait irrécupérable côté serveur, et réciproquement.
    const salt = randomSalt();
    const web_ = await deriveKekWeb('meme-secret', salt, RAPIDE, web);
    const node = deriveKek('meme-secret', salt, { N: 1024, r: 8, p: 1 });
    expect(secretEquals(Buffer.from(web_), node)).toBe(false);
  });

  it('choisit un nombre d’itérations défendable par défaut', () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600_000);
  });
});

describe('Absence de WebCrypto — échouer bruyamment', () => {
  it('refuse de fonctionner plutôt que de se rabattre', () => {
    // `SEC-31` interdit `Math.random`. Un repli silencieux reviendrait à
    // l'autoriser, et personne ne s'en apercevrait avant longtemps.
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      expect(() => platformCrypto()).toThrow(/WebCrypto indisponible/);
    } finally {
      if (original) Object.defineProperty(globalThis, 'crypto', original);
    }
  });

  it('dit explicitement qu’aucun repli n’est tenté', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });
    try {
      expect(() => platformCrypto()).toThrow(/Aucun repli/);
    } finally {
      if (original) Object.defineProperty(globalThis, 'crypto', original);
    }
  });
});

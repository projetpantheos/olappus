/**
 * Chiffrement applicatif L3 — `SEC-31`, preuves attendues.
 *
 * Ces tests sont écrits comme des **contrôles négatifs** : chacun vérifie que
 * le système refuse quelque chose. Un chiffrement qui n'a jamais rien rejeté
 * n'a jamais été mis à l'épreuve.
 */

import { describe, expect, it } from 'vitest';

import {
  ALGORITHM,
  CryptoError,
  DEFAULT_KDF_PARAMS,
  ENVELOPE_VERSION,
  bindingString,
  decryptField,
  deriveKek,
  encryptField,
  isCiphertext,
  randomDek,
  randomSalt,
  secretEquals,
  unwrapDek,
  wrapDek,
  type Binding,
  type Ciphertext,
} from './crypto';

/** Paramètres allégés : ces tests éprouvent la logique, pas le coût du KDF. */
const FAST = { N: 1024, r: 8, p: 1 } as const;

const BINDING: Binding = {
  actorId: '11111111-1111-4111-8111-111111111111',
  entity: 'core.action',
  field: 'prepared_payload',
  rowId: '22222222-2222-4222-8222-222222222222',
};

const PAYLOAD = JSON.stringify({
  recipient_ref: '33333333-3333-4333-8333-333333333333',
  subject: 'Demande de remboursement',
});

function keyring(...keys: { version: number; key: Buffer }[]): Map<number, Buffer> {
  return new Map(keys.map((k) => [k.version, k.key]));
}

describe('Enveloppe chiffrée — ce qu’une valeur porte avec elle', () => {
  it('chiffre et déchiffre une valeur de champ', () => {
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    expect(decryptField(sealed, keyring(key), BINDING)).toBe(PAYLOAD);
  });

  it('ne laisse aucune trace du clair dans l’enveloppe', () => {
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    expect(JSON.stringify(sealed)).not.toContain('remboursement');
    expect(JSON.stringify(sealed)).not.toContain('recipient_ref');
  });

  it('porte sa version de clé, son algorithme et son nonce', () => {
    // Sans ces trois éléments, aucune rotation n'est possible : voir SEC-31.
    const sealed = encryptField(PAYLOAD, { version: 7, key: randomDek() }, BINDING);
    expect(sealed.v).toBe(ENVELOPE_VERSION);
    expect(sealed.alg).toBe(ALGORITHM);
    expect(sealed.kv).toBe(7);
    expect(sealed.iv).not.toBe('');
  });

  it('produit un nonce différent à chaque chiffrement', () => {
    // Réutiliser un nonce en GCM est une faute catastrophique : deux messages
    // sous le même couple (clé, nonce) laissent retrouver leur XOR.
    const key = { version: 1, key: randomDek() };
    const nonces = new Set(
      Array.from({ length: 50 }, () => encryptField(PAYLOAD, key, BINDING).iv),
    );
    expect(nonces.size).toBe(50);
  });
});

describe('Altération — une valeur modifiée est rejetée, pas déchiffrée', () => {
  it('rejette un cryptogramme modifié', () => {
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    const bytes = Buffer.from(sealed.ct, 'base64');
    bytes[0] = (bytes[0] ?? 0) ^ 0x01;
    const tampered: Ciphertext = { ...sealed, ct: bytes.toString('base64') };
    expect(() => decryptField(tampered, keyring(key), BINDING)).toThrow(CryptoError);
  });

  it('rejette un tag d’authentification modifié', () => {
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    const bytes = Buffer.from(sealed.tag, 'base64');
    bytes[0] = (bytes[0] ?? 0) ^ 0x01;
    expect(() =>
      decryptField({ ...sealed, tag: bytes.toString('base64') }, keyring(key), BINDING),
    ).toThrow(CryptoError);
  });

  it('rejette un nonce modifié', () => {
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    const bytes = Buffer.from(sealed.iv, 'base64');
    bytes[0] = (bytes[0] ?? 0) ^ 0x01;
    expect(() =>
      decryptField({ ...sealed, iv: bytes.toString('base64') }, keyring(key), BINDING),
    ).toThrow(CryptoError);
  });

  it('refuse une version d’enveloppe inconnue plutôt que de deviner', () => {
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    expect(() => decryptField({ ...sealed, v: 99 }, keyring(key), BINDING)).toThrow(/inconnue/);
  });

  it('refuse un algorithme substitué', () => {
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    const downgraded = { ...sealed, alg: 'AES-128-CBC' } as unknown as Ciphertext;
    expect(() => decryptField(downgraded, keyring(key), BINDING)).toThrow(/non supporté/);
  });
});

describe('Liaison au contexte — un cryptogramme déplacé ne se lit pas', () => {
  it('refuse une valeur déplacée vers un autre utilisateur', () => {
    // Un attaquant ayant l'écriture en base ne lit rien, mais il pourrait faire
    // lire à la victime la valeur d'un autre. La liaison l'en empêche.
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    const autre: Binding = { ...BINDING, actorId: '44444444-4444-4444-8444-444444444444' };
    expect(() => decryptField(sealed, keyring(key), autre)).toThrow(CryptoError);
  });

  it('refuse une valeur déplacée vers un autre champ', () => {
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    expect(() => decryptField(sealed, keyring(key), { ...BINDING, field: 'notes' })).toThrow(
      CryptoError,
    );
  });

  it('refuse une valeur déplacée vers une autre ligne', () => {
    const key = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, key, BINDING);
    expect(() => decryptField(sealed, keyring(key), { ...BINDING, rowId: 'autre' })).toThrow(
      CryptoError,
    );
  });

  it('lie l’enveloppe à un contexte lisible et stable', () => {
    expect(bindingString(BINDING)).toContain('core.action:prepared_payload');
  });
});

describe('Hiérarchie de clés — aucune clé maître ne déchiffre l’utilisateur', () => {
  const KEK_BINDING: Binding = {
    actorId: BINDING.actorId,
    entity: 'identity.user_key',
    field: 'wrapped_dek',
    rowId: BINDING.actorId,
  };

  it('enveloppe puis retrouve la DEK avec le bon secret', () => {
    const salt = randomSalt();
    const kek = deriveKek('mots-de-recuperation-de-lutilisateur', salt, FAST);
    const dek = randomDek();
    const wrapped = wrapDek(dek, kek, 1, KEK_BINDING);
    expect(secretEquals(unwrapDek(wrapped, kek, KEK_BINDING), dek)).toBe(true);
  });

  it('n’ouvre pas la DEK avec un autre secret — un compte récupéré sans recovery codes n’accède à rien', () => {
    // ADR-0008 : les données L3 sont définitivement perdues. Ce test est la
    // preuve que la promesse tient, et non une intention documentaire.
    const salt = randomSalt();
    const kek = deriveKek('secret-original', salt, FAST);
    const wrapped = wrapDek(randomDek(), kek, 1, KEK_BINDING);
    const autreKek = deriveKek('mot-de-passe-reinitialise', salt, FAST);
    expect(() => unwrapDek(wrapped, autreKek, KEK_BINDING)).toThrow(CryptoError);
  });

  it('produit une KEK différente pour un sel différent', () => {
    const a = deriveKek('meme-secret', randomSalt(), FAST);
    const b = deriveKek('meme-secret', randomSalt(), FAST);
    expect(secretEquals(a, b)).toBe(false);
  });

  it('dérive une clé de 256 bits avec les paramètres par défaut', () => {
    expect(deriveKek('secret', randomSalt(), DEFAULT_KDF_PARAMS)).toHaveLength(32);
  });

  it('refuse un secret vide', () => {
    expect(() => deriveKek('', randomSalt(), FAST)).toThrow(CryptoError);
  });
});

describe('Rotation — CREATE NEW → TEST → SWITCH → REVOKE OLD', () => {
  it('lit encore les valeurs de l’ancienne clé pendant la transition', () => {
    // Une rotation qui exige la réécriture atomique de toute la base n'est pas
    // une rotation, c'est une migration à risque (SEC-31).
    const ancienne = { version: 1, key: randomDek() };
    const nouvelle = { version: 2, key: randomDek() };
    const ancien = encryptField('valeur écrite hier', ancienne, BINDING);
    const nouveau = encryptField('valeur écrite aujourd’hui', nouvelle, BINDING);

    const pendant = keyring(ancienne, nouvelle);
    expect(decryptField(ancien, pendant, BINDING)).toBe('valeur écrite hier');
    expect(decryptField(nouveau, pendant, BINDING)).toBe('valeur écrite aujourd’hui');
  });

  it('rend l’ancienne valeur illisible une fois l’ancienne clé révoquée', () => {
    const ancienne = { version: 1, key: randomDek() };
    const nouvelle = { version: 2, key: randomDek() };
    const ancien = encryptField('valeur écrite hier', ancienne, BINDING);
    expect(() => decryptField(ancien, keyring(nouvelle), BINDING)).toThrow(/absente du trousseau/);
  });

  it('n’essaie pas les autres clés du trousseau « au cas où »', () => {
    // Essayer toutes les clés transformerait une révocation en suggestion.
    const ancienne = { version: 1, key: randomDek() };
    const sealed = encryptField(PAYLOAD, ancienne, BINDING);
    const trousseau = keyring({ version: 2, key: ancienne.key });
    expect(() => decryptField(sealed, trousseau, BINDING)).toThrow(/absente du trousseau/);
  });
});

describe('Garde de forme — miroir de la contrainte en base', () => {
  it('reconnaît une enveloppe valide', () => {
    expect(isCiphertext(encryptField(PAYLOAD, { version: 1, key: randomDek() }, BINDING))).toBe(
      true,
    );
  });

  it('refuse une valeur en clair', () => {
    expect(isCiphertext({ recipient_ref: 'a@b.c', subject: 'Réclamation' })).toBe(false);
    expect(isCiphertext('texte en clair')).toBe(false);
    expect(isCiphertext(null)).toBe(false);
  });

  it('refuse une enveloppe incomplète', () => {
    const sealed = encryptField(PAYLOAD, { version: 1, key: randomDek() }, BINDING);
    const { tag: _tag, ...sansTag } = sealed;
    expect(isCiphertext(sansTag)).toBe(false);
  });

  it('refuse un nonce de mauvaise taille', () => {
    const sealed = encryptField(PAYLOAD, { version: 1, key: randomDek() }, BINDING);
    expect(isCiphertext({ ...sealed, iv: Buffer.alloc(8).toString('base64') })).toBe(false);
  });
});

import { bindingString, isCiphertext } from '@olappus/core';
import { AESEncryptionKey } from 'expo-crypto';

import { decryptFieldNative, deriveKekNative, encryptFieldNative, randomDekNative } from './native';

/**
 * Chiffrement sur appareil — ADR-0019.
 *
 * ## Ce que cette suite peut éprouver, et ce qu'elle ne peut pas
 *
 * Le module AES d'`expo-crypto` s'adosse aux primitives du système. Sous jest,
 * il est **neutralisé** : la couche native n'existe pas dans l'environnement de
 * test. Les tests qui en dépendent sont donc **ignorés, et non silencieusement
 * verts** — un test qui se saute lui-même en affichant du vert est plus
 * dangereux qu'un test absent.
 *
 * Ce qui reste éprouvable sans elle est éprouvé : la dérivation de clé, qui
 * vient de `@noble/hashes` et tourne partout, et la cohérence de la liaison au
 * contexte avec les deux autres implémentations.
 *
 * **Le chemin iOS et Android n'est donc vérifié par aucun automate à ce jour.**
 * Il demande une exécution sur appareil, et c'est un livrable de G6b. Ce
 * commentaire est là pour que personne ne croie le contraire en voyant la
 * suite passer.
 */

/** Le module natif répond-il dans cet environnement ? */
const aesDisponible = typeof (AESEncryptionKey as { import?: unknown }).import === 'function';

const BINDING = {
  actorId: '11111111-2222-4333-8444-555555555555',
  entity: 'identity.connection',
  field: 'access_token',
  rowId: '66666666-7777-4888-8999-aaaaaaaaaaaa',
};

describe('Dérivation de clé sur appareil — éprouvable partout', () => {
  it('dérive une clé de 256 bits', async () => {
    const kek = await deriveKekNative('codes-de-recuperation', new Uint8Array(16).fill(3), 1000);
    expect(kek).toHaveLength(32);
  });

  it('donne une clé différente pour un sel différent', async () => {
    const a = await deriveKekNative('meme-secret', new Uint8Array(16).fill(1), 1000);
    const b = await deriveKekNative('meme-secret', new Uint8Array(16).fill(2), 1000);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it('donne la même clé pour le même sel et le même secret', async () => {
    // Sans cette propriété, un utilisateur ne rouvrirait jamais ses données.
    const sel = new Uint8Array(16).fill(9);
    const a = await deriveKekNative('secret', sel, 1000);
    const b = await deriveKekNative('secret', sel, 1000);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it('refuse un secret vide', async () => {
    await expect(deriveKekNative('', new Uint8Array(16), 1000)).rejects.toThrow(/vide/);
  });
});

describe('Liaison au contexte — la même chaîne que les deux autres implémentations', () => {
  it('reprend la liaison partagée, sans la redéfinir', () => {
    // Une divergence d'un seul octet ici rendrait illisible, pour toujours, ce
    // que l'autre implémentation a scellé. D'où le module commun.
    expect(bindingString(BINDING)).toContain('identity.connection:access_token');
    expect(bindingString(BINDING)).toContain(BINDING.actorId);
  });
});

// Ignoré et annoncé, jamais vert à tort : voir l'en-tête de ce fichier.
const decrireSiDisponible = aesDisponible ? describe : describe.skip;

decrireSiDisponible('Chiffrement sur appareil — exige le module natif', () => {
  it('produit une enveloppe conforme au format partagé', async () => {
    const dek = randomDekNative();
    const sealed = await encryptFieldNative('jeton-SYNTHETIQUE', { version: 1, key: dek }, BINDING);
    expect(isCiphertext(sealed)).toBe(true);
  });

  it('relit ce qu’il a scellé', async () => {
    const dek = randomDekNative();
    const sealed = await encryptFieldNative('jeton-SYNTHETIQUE', { version: 1, key: dek }, BINDING);
    expect(await decryptFieldNative(sealed, new Map([[1, dek]]), BINDING)).toBe(
      'jeton-SYNTHETIQUE',
    );
  });

  it('refuse une valeur scellée pour un autre contexte', async () => {
    const dek = randomDekNative();
    const sealed = await encryptFieldNative('jeton-SYNTHETIQUE', { version: 1, key: dek }, BINDING);
    await expect(
      decryptFieldNative(sealed, new Map([[1, dek]]), { ...BINDING, field: 'refresh_token' }),
    ).rejects.toThrow();
  });
});

describe('Ce que cette suite ne prouve pas', () => {
  it('annonce que le chemin appareil n’est pas couvert ici', () => {
    // Ce test ne vérifie rien du chiffrement : il existe pour que l'absence de
    // couverture soit visible dans le rapport de tests, et non enfouie dans un
    // commentaire que personne ne lit.
    if (!aesDisponible) {
      expect(aesDisponible).toBe(false);
      return;
    }
    expect(aesDisponible).toBe(true);
  });
});

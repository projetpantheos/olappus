/**
 * Coffre d'appareil — `SEC-31`, `SEC-35`.
 *
 * Le magasin est injecté, donc la politique s'éprouve sans appareil. Ce qui
 * compte ici n'est pas qu'on sache ranger une clé : c'est qu'on refuse d'y
 * ranger le secret de récupération, et qu'une session expirée soit **purgée**
 * plutôt que simplement refusée.
 */

import { describe, expect, it } from 'vitest';

import {
  UNLOCK_TTL_MS,
  VAULT_KEYS,
  VaultError,
  lock,
  readUnlockedKey,
  remainingUnlockMs,
  storeUnlockedKey,
  type SecureStore,
} from './vault';

/** Magasin en mémoire, qui expose son contenu — c'est ce qu'on veut inspecter. */
function memoryStore(): SecureStore & { readonly contenu: Map<string, string> } {
  const contenu = new Map<string, string>();
  return {
    contenu,
    get: (key) => Promise.resolve(contenu.get(key) ?? null),
    set: (key, value) => {
      contenu.set(key, value);
      return Promise.resolve();
    },
    remove: (key) => {
      contenu.delete(key);
      return Promise.resolve();
    },
  };
}

const USER = '11111111-2222-4333-8444-555555555555';
const T0 = Date.parse('2026-09-11T10:00:00Z');
const CLE = new Uint8Array(32).fill(7);

describe('Déverrouillage — la clé survit à la fermeture de l’application', () => {
  it('rend la clé déposée', async () => {
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    const lue = await readUnlockedKey(store, USER, T0 + 1000);
    expect(lue?.version).toBe(1);
    expect([...(lue?.key ?? [])]).toEqual([...CLE]);
  });

  it('ne rend rien quand rien n’a été déposé', async () => {
    expect(await readUnlockedKey(memoryStore(), USER, T0)).toBeNull();
  });

  it('sépare les utilisateurs', async () => {
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    expect(await readUnlockedKey(store, 'un-autre-utilisateur', T0)).toBeNull();
  });

  it('refuse une clé de mauvaise taille', async () => {
    await expect(
      storeUnlockedKey(memoryStore(), USER, { version: 1, key: new Uint8Array(16) }, T0),
    ).rejects.toThrow(VaultError);
  });
});

describe('Expiration — une clé refusée est une clé effacée', () => {
  it('refuse une session expirée', async () => {
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    expect(await readUnlockedKey(store, USER, T0 + UNLOCK_TTL_MS + 1)).toBeNull();
  });

  it('purge le coffre à l’expiration, au lieu de se contenter de refuser', async () => {
    // Une clé qu'on refuse d'utiliser mais qu'on laisse sur l'appareil reste
    // une clé sur l'appareil.
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    await readUnlockedKey(store, USER, T0 + UNLOCK_TTL_MS + 1);
    expect(store.contenu.size).toBe(0);
  });

  it('accepte jusqu’à la dernière seconde', async () => {
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    expect(await readUnlockedKey(store, USER, T0 + UNLOCK_TTL_MS)).not.toBeNull();
  });

  it('purge un état partiel plutôt que de deviner', async () => {
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    store.contenu.delete(VAULT_KEYS.unlockedAt(USER));
    expect(await readUnlockedKey(store, USER, T0)).toBeNull();
    expect(store.contenu.size).toBe(0);
  });

  it('purge une horodate corrompue', async () => {
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    store.contenu.set(VAULT_KEYS.unlockedAt(USER), 'jamais');
    expect(await readUnlockedKey(store, USER, T0)).toBeNull();
    expect(store.contenu.size).toBe(0);
  });

  it('dit le temps restant, pour qu’on puisse le montrer', async () => {
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    expect(await remainingUnlockMs(store, USER, T0)).toBe(UNLOCK_TTL_MS);
    expect(await remainingUnlockMs(store, USER, T0 + UNLOCK_TTL_MS + 5000)).toBe(0);
  });
});

describe('Verrouillage — la clé quitte l’appareil', () => {
  it('efface tout', async () => {
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    await lock(store, USER);
    expect(store.contenu.size).toBe(0);
    expect(await readUnlockedKey(store, USER, T0)).toBeNull();
  });

  it('ne laisse aucune trace de la clé dans le magasin', async () => {
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    const empreinte = JSON.stringify([...store.contenu.entries()]);
    await lock(store, USER);
    expect(JSON.stringify([...store.contenu.entries()])).not.toBe(empreinte);
    expect(JSON.stringify([...store.contenu.entries()])).toBe('[]');
  });
});

describe('Ce que le coffre refuse de contenir', () => {
  it('ne prévoit aucune clé pour le secret de récupération', () => {
    // Le coffre garde un secret de **session** : révocable, remplaçable, borné
    // à cet appareil. Le secret de récupération, lui, ouvre tout et pour
    // toujours — un appareil volé ne doit pas le livrer.
    const noms = Object.keys(VAULT_KEYS);
    expect(noms).toEqual(['dataKey', 'dataKeyVersion', 'unlockedAt']);
    for (const nom of noms) {
      expect(nom).not.toMatch(/recovery|secret|passphrase|mnemonic|seed/i);
    }
  });

  it('nomme ses entrées sans y mettre de mot sensible', async () => {
    // Un nom d'entrée se retrouve dans les outils de diagnostic, là où la
    // valeur ne va pas.
    const store = memoryStore();
    await storeUnlockedKey(store, USER, { version: 1, key: CLE }, T0);
    for (const cle of store.contenu.keys()) {
      expect(cle).not.toMatch(/recovery|secret|password|passphrase|mnemonic|seed/i);
      expect(cle.startsWith('olappus.v1.')).toBe(true);
    }
  });

  it('fixe une expiration défendable', () => {
    // Assez long pour une journée sans ressaisie, assez court pour qu'un
    // appareil oublié ne reste pas ouvert indéfiniment.
    expect(UNLOCK_TTL_MS).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    expect(UNLOCK_TTL_MS).toBeGreaterThanOrEqual(60 * 60 * 1000);
  });
});

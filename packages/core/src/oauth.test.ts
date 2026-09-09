/**
 * Flux OAuth — G6a, conditions de sortie de `RUN-42`.
 *
 * Un contrôle négatif par mode d'échec de `docs/15`. Le flux nominal ne prouve
 * presque rien : ce qui compte est que chaque chemin tordu soit **refusé**.
 *
 * Aucun compte externe, aucune donnée réelle. Ces propriétés sont celles du
 * mécanisme, et c'est pourquoi elles se démontrent ici.
 */

import { createHash, randomBytes } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  ALLOWED_SCOPES,
  AuthorizationStore,
  CONNECTION_STATUSES,
  OAuthError,
  STATE_TTL_MS,
  VERIFIER_MAX,
  VERIFIER_MIN,
  assertScopesAllowed,
  assertTransition,
  canTransition,
  challengeFor,
  consumeCallback,
  createAuthorizationRequest,
  createPkcePair,
  isUsable,
  verifyPkce,
  type ConnectionStatus,
  type OAuthCrypto,
} from './oauth';

/** Adaptateur Node. Côté appareil, WebCrypto fournira les mêmes deux fonctions. */
const nodeCrypto: OAuthCrypto = {
  randomBytes: (n) => new Uint8Array(randomBytes(n)),
  sha256: (data) => Promise.resolve(new Uint8Array(createHash('sha256').update(data).digest())),
};

const T0 = Date.parse('2026-09-09T10:00:00Z');

const requete = (now = T0) =>
  createAuthorizationRequest(nodeCrypto, {
    provider: 'google-synthetique',
    authorizeEndpoint: 'https://fournisseur.synthetique.test/authorize',
    clientId: 'client-synthetique',
    redirectUri: 'https://olappus.test/callback',
    scopes: ['metadata.read'],
    now,
  });

describe('PKCE — le vérificateur ne se devine pas et ne se contourne pas', () => {
  it('produit un vérificateur conforme à RFC 7636', async () => {
    const { verifier, method } = await createPkcePair(nodeCrypto);
    expect(verifier.length).toBeGreaterThanOrEqual(VERIFIER_MIN);
    expect(verifier.length).toBeLessThanOrEqual(VERIFIER_MAX);
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    expect(method).toBe('S256');
  });

  it('refuse une longueur hors des bornes', async () => {
    await expect(createPkcePair(nodeCrypto, 10)).rejects.toThrow(/hors des bornes/);
    await expect(createPkcePair(nodeCrypto, 200)).rejects.toThrow(/hors des bornes/);
  });

  it('ne produit jamais deux fois le même vérificateur', async () => {
    const vus = new Set<string>();
    for (let i = 0; i < 50; i++) vus.add((await createPkcePair(nodeCrypto)).verifier);
    expect(vus.size).toBe(50);
  });

  it('valide le bon vérificateur', async () => {
    const { verifier, challenge } = await createPkcePair(nodeCrypto);
    expect(await verifyPkce(nodeCrypto, verifier, challenge)).toBe(true);
  });

  it('refuse un vérificateur qui n’est pas celui de la requête', async () => {
    // Le cœur de PKCE : un code d'autorisation intercepté ne sert à rien sans
    // le vérificateur, qui n'a jamais transité.
    const { challenge } = await createPkcePair(nodeCrypto);
    const autre = await createPkcePair(nodeCrypto);
    expect(await verifyPkce(nodeCrypto, autre.verifier, challenge)).toBe(false);
  });

  it('refuse un vérificateur tronqué', async () => {
    const { verifier, challenge } = await createPkcePair(nodeCrypto);
    expect(await verifyPkce(nodeCrypto, verifier.slice(0, 20), challenge)).toBe(false);
  });

  it('n’expose pas le vérificateur dans l’URL d’autorisation', async () => {
    // Si le vérificateur voyageait, PKCE ne protégerait plus de rien.
    const { url, pending } = await requete();
    expect(url).not.toContain(pending.verifier);
    expect(url).toContain(`code_challenge=${encodeURIComponent(pending.challenge)}`);
    expect(url).toContain('code_challenge_method=S256');
  });

  it('lie le défi au vérificateur par SHA-256, pas par « plain »', async () => {
    const { verifier, challenge } = await createPkcePair(nodeCrypto);
    expect(challenge).not.toBe(verifier);
    expect(challenge).toBe(await challengeFor(nodeCrypto, verifier));
  });
});

describe('Scopes — deny by default, décision R4 rendue exécutable', () => {
  it('accepte exactement les scopes déclarés', () => {
    expect(() => {
      assertScopesAllowed('google-synthetique', ['metadata.read']);
    }).not.toThrow();
  });

  it('refuse un scope plus large que ce qui est déclaré', () => {
    // `docs/15` : jamais le corps complet ni les pièces jointes par défaut.
    // Un scope large obtenu une fois se réduit mal ensuite.
    expect(() => {
      assertScopesAllowed('google-synthetique', ['metadata.read', 'mail.readall']);
    }).toThrow(/non autorisés/);
  });

  it('refuse un fournisseur non déclaré', () => {
    expect(() => {
      assertScopesAllowed('fournisseur-inconnu', ['metadata.read']);
    }).toThrow(/non déclaré/);
  });

  it('refuse une demande sans aucun scope', () => {
    expect(() => {
      assertScopesAllowed('google-synthetique', []);
    }).toThrow(/Aucun scope/);
  });

  it('empêche de construire une requête au-delà des scopes autorisés', async () => {
    // Le contrôle porte sur la construction de l'URL, pas sur la discipline de
    // celui qui l'écrit.
    await expect(
      createAuthorizationRequest(nodeCrypto, {
        provider: 'google-synthetique',
        authorizeEndpoint: 'https://fournisseur.synthetique.test/authorize',
        clientId: 'c',
        redirectUri: 'https://olappus.test/callback',
        scopes: ['mail.readall'],
        now: T0,
      }),
    ).rejects.toThrow(/non autorisés/);
  });

  it('ne déclare aucun scope donnant accès au corps des messages', () => {
    for (const [fournisseur, scopes] of Object.entries(ALLOWED_SCOPES)) {
      for (const scope of scopes) {
        expect(scope, `${fournisseur} : ${scope}`).not.toMatch(
          /full|readall|body|attachment|write/i,
        );
      }
    }
  });
});

describe('`state` — un retour forgé ou rejoué est refusé', () => {
  it('accepte un retour légitime, une fois', async () => {
    const store = new AuthorizationStore();
    const { pending } = await requete();
    store.put(pending);
    const consommee = consumeCallback(store, { state: pending.state, code: 'code-1' }, T0 + 1000);
    expect(consommee.verifier).toBe(pending.verifier);
  });

  it('refuse le rejeu du même `state`', async () => {
    // C'est la raison d'être de `state`, et la raison pour laquelle le registre
    // est à usage unique.
    const store = new AuthorizationStore();
    const { pending } = await requete();
    store.put(pending);
    consumeCallback(store, { state: pending.state, code: 'code-1' }, T0 + 1000);
    expect(() =>
      consumeCallback(store, { state: pending.state, code: 'code-1' }, T0 + 2000),
    ).toThrow(/inconnu ou déjà utilisé/);
  });

  it('refuse un retour sans `state`', () => {
    expect(() => consumeCallback(new AuthorizationStore(), { code: 'code-1' }, T0)).toThrow(
      /sans `state`/,
    );
  });

  it('refuse un `state` inventé', () => {
    expect(() =>
      consumeCallback(new AuthorizationStore(), { state: 'invente', code: 'code-1' }, T0),
    ).toThrow(/inconnu ou déjà utilisé/);
  });

  it('ne distingue pas un `state` inconnu d’un `state` déjà consommé', async () => {
    // Distinguer les deux renseignerait un attaquant sur ce qui existe.
    const store = new AuthorizationStore();
    const { pending } = await requete();
    store.put(pending);
    consumeCallback(store, { state: pending.state, code: 'c' }, T0 + 1);

    const rejoue = (() => {
      try {
        consumeCallback(store, { state: pending.state, code: 'c' }, T0 + 2);
      } catch (e) {
        return (e as OAuthError).code;
      }
      return 'aucune erreur';
    })();
    const inconnu = (() => {
      try {
        consumeCallback(store, { state: 'jamais-vu', code: 'c' }, T0 + 2);
      } catch (e) {
        return (e as OAuthError).code;
      }
      return 'aucune erreur';
    })();

    expect(rejoue).toBe(inconnu);
  });

  it('refuse un retour sans code d’autorisation', async () => {
    const store = new AuthorizationStore();
    const { pending } = await requete();
    store.put(pending);
    expect(() => consumeCallback(store, { state: pending.state }, T0)).toThrow(/sans code/);
  });

  it('propage un refus du fournisseur au lieu de l’ignorer', () => {
    expect(() => consumeCallback(new AuthorizationStore(), { error: 'access_denied' }, T0)).toThrow(
      /a refusé/,
    );
  });

  it('refuse une autorisation expirée', async () => {
    const store = new AuthorizationStore();
    const { pending } = await requete();
    store.put(pending);
    expect(() =>
      consumeCallback(store, { state: pending.state, code: 'c' }, T0 + STATE_TTL_MS + 1),
    ).toThrow(/expirée/);
  });

  it('purge les autorisations périmées', async () => {
    const store = new AuthorizationStore();
    store.put((await requete(T0)).pending);
    store.put((await requete(T0)).pending);
    expect(store.size).toBe(2);
    expect(store.purgeExpired(T0 + STATE_TTL_MS + 1)).toBe(2);
    expect(store.size).toBe(0);
  });

  it('produit un `state` imprévisible', async () => {
    const vus = new Set<string>();
    for (let i = 0; i < 50; i++) vus.add((await requete()).pending.state);
    expect(vus.size).toBe(50);
  });
});

describe('Machine à états — un consentement retiré ne se rétablit pas', () => {
  it('suit le chemin nominal', () => {
    expect(canTransition('DISCONNECTED', 'AUTHORIZING')).toBe(true);
    expect(canTransition('AUTHORIZING', 'CONNECTED')).toBe(true);
  });

  it('refuse de passer connecté sans autorisation', () => {
    expect(() => {
      assertTransition('DISCONNECTED', 'CONNECTED');
    }).toThrow(/interdite/);
  });

  it('refuse de rétablir une connexion révoquée sans repasser par l’autorisation', () => {
    // Un consentement retiré côté fournisseur ne se rattrape pas côté serveur.
    expect(canTransition('REVOKED', 'CONNECTED')).toBe(false);
    expect(canTransition('REVOKED', 'AUTHORIZING')).toBe(false);
    expect(canTransition('REVOKED', 'DISCONNECTED')).toBe(true);
  });

  it('exige une nouvelle autorisation après expiration', () => {
    expect(canTransition('EXPIRED', 'CONNECTED')).toBe(false);
    expect(canTransition('EXPIRED', 'AUTHORIZING')).toBe(true);
  });

  it('permet la déconnexion depuis tout état', () => {
    // La déconnexion déclenche la purge : elle ne doit jamais être bloquée.
    for (const statut of CONNECTION_STATUSES) {
      if (statut === 'DISCONNECTED') continue;
      expect(canTransition(statut, 'DISCONNECTED'), statut).toBe(true);
    }
  });
});

describe('Utilisabilité — une connexion inerte le reste', () => {
  const dans1h = T0 + 3_600_000;

  it('n’est utilisable que connectée et non expirée', () => {
    expect(isUsable('CONNECTED', dans1h, T0)).toBe(true);
    expect(isUsable('CONNECTED', T0 - 1, T0)).toBe(false);
  });

  it('n’est jamais utilisable dans les autres états', () => {
    const inertes: ConnectionStatus[] = ['DISCONNECTED', 'AUTHORIZING', 'EXPIRED', 'REVOKED'];
    for (const statut of inertes) {
      expect(isUsable(statut, dans1h, T0), statut).toBe(false);
    }
  });
});

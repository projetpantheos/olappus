/**
 * Le scanner de secrets, mis à l'épreuve — `SEC-23`, `SEC-34`.
 *
 * Ce contrôle existait depuis G1 et n'avait jamais été testé. Le 2026-09-09, en
 * cherchant où ranger un identifiant PISTE, on a constaté qu'il ne détectait
 * **pas** `client_secret` : le souligné est un caractère de mot, il n'y avait
 * donc aucune limite entre « client_ » et « secret ».
 *
 * Un scanner que personne n'a mis à l'épreuve est un scanner que personne ne
 * devrait croire.
 *
 * Les lignes de test sont **assemblées**, jamais écrites en clair : sinon ce
 * fichier déclencherait le scanner qu'il vérifie. Le contourner par une
 * dérogation aurait été plus court et aurait affaibli le contrôle.
 * Toutes les valeurs sont synthétiques.
 */

import { describe, expect, it } from 'vitest';

// @ts-expect-error — outillage en JavaScript pur, sans déclarations de types.
import { detect } from '../../../tooling/secret-scan-rules.mjs';

const detecte = (ligne: string): string[] => detect(ligne) as string[];

/** `cle = "valeur"` — forme d'un fichier de configuration ou de code. */
const affectation = (cle: string, valeur: string): string => `${cle} = ${'"'}${valeur}${'"'}`;

/** `CLE=valeur` — forme d'un fichier d'environnement ou d'une commande shell. */
const variable = (cle: string, valeur: string): string => `${cle}=${valeur}`;

const VALEUR = 'aG9ycy1zZXJ2aWNlLXN5bnRoZXRpcXVl';
const UUID = '11111111-2222-4333-8444-555555555555';

describe('Scan de secrets — ce qu’il doit voir', () => {
  it('reconnaît un client_secret OAuth, malgré le souligné', () => {
    // Le défaut du 2026-09-09, et précisément la forme utilisée par PISTE.
    expect(detecte(affectation(`client${'_'}secret`, VALEUR))).not.toEqual([]);
    expect(detecte(variable(`CLIENT${'_'}SECRET`, VALEUR))).not.toEqual([]);
  });

  it('reconnaît un client_id OAuth, guillemets ou non', () => {
    expect(detecte(affectation(`client${'_'}id`, UUID))).not.toEqual([]);
    expect(detecte(variable(`PISTE${'_'}CLIENT${'_'}ID`, UUID))).not.toEqual([]);
  });

  it('reconnaît les affectations de secret classiques', () => {
    expect(detecte(affectation(`api${'_'}key`, 'abcdefghijklmnop'))).not.toEqual([]);
    expect(detecte(affectation('password', 'X7wq2Lm9Rt4Zb1Kd'))).not.toEqual([]);
    expect(detecte(affectation(`refresh${'_'}token`, 'abcdefghijklmnop'))).not.toEqual([]);
  });

  it('reconnaît les formes de jetons connues', () => {
    expect(detecte(`${'-'.repeat(5)}BEGIN RSA PRIVATE KEY${'-'.repeat(5)}`)).not.toEqual([]);
    // Assemblée en deux morceaux : écrite d'un trait, cette URL déclencherait
    // le scanner sur ce fichier même.
    const url = ['postgres://utilisateur', 'motdepasse@serveur.test/base'].join(':');
    expect(detecte(url)).not.toEqual([]);
  });
});

describe('Scan de secrets — ce qu’il ne doit pas signaler', () => {
  it('laisse passer un gabarit', () => {
    expect(detecte(affectation(`client${'_'}secret`, 'VOTRE_CLIENT_SECRET'))).toEqual([]);
    expect(detecte(affectation(`api${'_'}key`, '<a-remplir>'))).toEqual([]);
  });

  it('laisse passer une référence à l’environnement', () => {
    // Un pointeur vers une valeur tenue ailleurs n'est pas une valeur.
    expect(detecte(`client${'_'}secret: process.env.PISTE_CLIENT_SECRET`)).toEqual([]);
    expect(detecte(`api${'_'}key = \${PISTE_API_KEY}`)).toEqual([]);
  });

  it('laisse passer un gabarit d’environnement vide', () => {
    // `.env.example` ne porte que des noms. C'est ce qui le rend versionnable.
    expect(detecte(variable(`PISTE${'_'}CLIENT${'_'}SECRET`, ''))).toEqual([]);
    expect(detecte(variable(`GOOGLE${'_'}OAUTH${'_'}CLIENT${'_'}SECRET`, ''))).toEqual([]);
  });

  it('laisse passer une prose qui parle de secrets', () => {
    expect(detecte('Le client_secret ne doit jamais être versionné.')).toEqual([]);
    expect(detecte('// Toute compromission est notifiée à la DILA et à l’AIFE.')).toEqual([]);
  });
});

describe('Scan de secrets — ce qu’il ne prétend pas faire', () => {
  it('ne détecte pas une valeur nue, sans nom de clé', () => {
    // Limite assumée : un identifiant seul sur sa ligne est indiscernable d'un
    // identifiant de test. La détecter noierait le rapport de faux positifs.
    // Ce test empêche de croire le scanner plus capable qu'il ne l'est — il ne
    // remplace pas une revue, et il n'attrape pas une clé collée hors du dépôt.
    expect(detecte(UUID)).toEqual([]);
  });
});

describe('Scan de secrets — la convention du dépôt', () => {
  it('reconnaît le marqueur synthétique des fixtures', () => {
    // `packages/test-fixtures` marque déjà toute fixture par SYNTHETIC. Le
    // scanner connaît cette convention, sinon chaque test de sécurité
    // exigerait une dérogation.
    expect(detecte(affectation(`client${'_'}id`, 'client-SYNTHETIQUE-0001'))).toEqual([]);
    expect(detecte(affectation(`api${'_'}key`, 'cle-SYNTHETIC-abcdefgh'))).toEqual([]);
  });

  it('n’étend pas cette tolérance à une valeur non marquée', () => {
    expect(detecte(affectation(`client${'_'}id`, 'client-de-production-0001'))).not.toEqual([]);
  });
});

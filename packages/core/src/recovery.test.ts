/**
 * Secret de récupération — `SEC-31`, ADR-0008.
 *
 * Le chiffrement L3 est prouvé depuis le 2026-09-09 ; ce qui manquait était le
 * **moment produit** qui remet la clé à l'utilisateur et lui dit ce qu'il
 * risque. Sans lui, la perte de données promise par ADR-0008 arriverait à
 * quelqu'un qui n'a jamais été prévenu.
 */

import { randomBytes } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  RECOVERY_GROUPS,
  RECOVERY_GROUP_SIZE,
  RECOVERY_LENGTH,
  canCollectSensitiveData,
  checkRecoverySecret,
  formatRecoverySecret,
  generateRecoverySecret,
  missingBeforeCollection,
  normalizeRecoveryInput,
  recoveryOutcome,
} from './recovery';

const random = (n: number): Uint8Array => new Uint8Array(randomBytes(n));

const canonical = (secret: string): string => normalizeRecoveryInput(secret);

describe('Génération — un secret qu’on peut recopier à la main', () => {
  it('produit huit groupes de cinq caractères', () => {
    const secret = generateRecoverySecret(random);
    const groups = secret.split('-');
    expect(groups).toHaveLength(RECOVERY_GROUPS);
    for (const group of groups) expect(group).toHaveLength(RECOVERY_GROUP_SIZE);
  });

  it('n’emploie jamais les caractères ambigus I, L, O et U', () => {
    // Ils se confondent avec 1, 0 et V sur un papier recopié six mois plus tard.
    for (let i = 0; i < 200; i++) {
      expect(generateRecoverySecret(random)).not.toMatch(/[ILOU]/);
    }
  });

  it('ne produit jamais deux fois le même secret', () => {
    const vus = new Set<string>();
    for (let i = 0; i < 300; i++) vus.add(generateRecoverySecret(random));
    expect(vus.size).toBe(300);
  });

  it('porte assez d’entropie pour protéger des données irrécupérables', () => {
    // 39 caractères utiles dans un alphabet de 32 : 195 bits.
    expect((RECOVERY_LENGTH - 1) * 5).toBeGreaterThanOrEqual(128);
  });

  it('distribue les caractères sans biais visible', () => {
    // Le modulo replierait les octets hauts et sur-représenterait le début de
    // l'alphabet. Le biais serait faible — sur ce secret-là, faible ne suffit pas.
    const compte = new Map<string, number>();
    for (let i = 0; i < 500; i++) {
      for (const c of canonical(generateRecoverySecret(random))) {
        compte.set(c, (compte.get(c) ?? 0) + 1);
      }
    }
    const valeurs = [...compte.values()];
    const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
    for (const v of valeurs) expect(Math.abs(v - moyenne) / moyenne).toBeLessThan(0.25);
  });
});

describe('Saisie — une faute de recopie n’est pas une perte de données', () => {
  it('accepte le secret tel qu’il a été présenté', () => {
    const secret = generateRecoverySecret(random);
    expect(checkRecoverySecret(secret).ok).toBe(true);
  });

  it('accepte une saisie sans tirets, en minuscules, avec des espaces', () => {
    const secret = generateRecoverySecret(random);
    const malmene = ` ${secret.replace(/-/g, ' ').toLowerCase()} `;
    const verifie = checkRecoverySecret(malmene);
    expect(verifie.ok).toBe(true);
    expect(verifie.ok && verifie.canonical).toBe(canonical(secret));
  });

  it('corrige les confusions de lecture I, L, O et U', () => {
    // Quelqu'un qui recopie « 1 » en « I » ne doit pas perdre ses données.
    const secret = generateRecoverySecret(random);
    const recopie = canonical(secret).replace(/1/g, 'I').replace(/0/g, 'O');
    expect(checkRecoverySecret(recopie).ok).toBe(true);
  });

  it('détecte un caractère faux', () => {
    const secret = canonical(generateRecoverySecret(random));
    const faux = (secret[0] === '2' ? '3' : '2') + secret.slice(1);
    const verifie = checkRecoverySecret(faux);
    expect(verifie.ok).toBe(false);
    expect(verifie.ok === false && verifie.reason).toBe('checksum');
  });

  it('détecte une transposition de deux caractères', () => {
    // L'erreur de recopie la plus fréquente après la confusion de caractères.
    // Une somme non pondérée ne la verrait pas.
    let detectees = 0;
    let essais = 0;
    for (let i = 0; i < 200; i++) {
      const secret = canonical(generateRecoverySecret(random));
      const a = secret[3] as string;
      const b = secret[4] as string;
      if (a === b) continue;
      essais += 1;
      const transpose = secret.slice(0, 3) + b + a + secret.slice(5);
      if (!checkRecoverySecret(transpose).ok) detectees += 1;
    }
    expect(detectees).toBe(essais);
  });

  it('détecte une longueur fausse', () => {
    const secret = generateRecoverySecret(random);
    const verifie = checkRecoverySecret(secret.slice(0, 20));
    expect(verifie.ok === false && verifie.reason).toBe('length');
  });

  it('refuse une saisie vide', () => {
    expect(checkRecoverySecret('').ok).toBe(false);
  });

  it('remet en forme lisible une saisie canonique', () => {
    const secret = generateRecoverySecret(random);
    expect(formatRecoverySecret(canonical(secret))).toBe(secret);
  });
});

describe('L’ordre imposé par SEC-31 — informer AVANT de collecter', () => {
  it('refuse toute collecte tant qu’aucun secret n’existe', () => {
    expect(canCollectSensitiveData({ generated_at: null, acknowledged_at: null })).toBe(false);
  });

  it('refuse la collecte si le secret a été affiché mais pas confirmé', () => {
    // « L'écran a été vu » n'est pas « la personne a mis son secret en
    // sécurité ». Toute la valeur du contrôle tient dans cette nuance.
    expect(
      canCollectSensitiveData({ generated_at: '2026-09-11T10:00:00Z', acknowledged_at: null }),
    ).toBe(false);
  });

  it('autorise la collecte une fois le secret créé et confirmé', () => {
    expect(
      canCollectSensitiveData({
        generated_at: '2026-09-11T10:00:00Z',
        acknowledged_at: '2026-09-11T10:02:00Z',
      }),
    ).toBe(true);
  });

  it('énonce ce qui manque en langage compréhensible', () => {
    const manquant = missingBeforeCollection({ generated_at: null, acknowledged_at: null });
    expect(manquant).toHaveLength(2);
    for (const phrase of manquant) {
      expect(phrase).not.toMatch(/null|undefined|error|[A-Z]{3,}_/);
      expect(phrase.length).toBeGreaterThan(20);
    }
  });

  it('ne dit plus rien quand tout est en ordre', () => {
    expect(
      missingBeforeCollection({
        generated_at: '2026-09-11T10:00:00Z',
        acknowledged_at: '2026-09-11T10:02:00Z',
      }),
    ).toEqual([]);
  });
});

describe('Récupération — le compte et les données ne reviennent pas ensemble', () => {
  it('rend compte et données à qui détient son secret', () => {
    const issue = recoveryOutcome(true);
    expect(issue.account_recovered).toBe(true);
    expect(issue.data_recovered).toBe(true);
  });

  it('rend le compte, jamais les données, sans le secret', () => {
    // ADR-0008 : aucun escrow, aucune récupération de service. C'est le test
    // qui empêche qu'on « ajoute juste une petite porte de secours » un jour.
    const issue = recoveryOutcome(false);
    expect(issue.account_recovered).toBe(true);
    expect(issue.data_recovered).toBe(false);
  });

  it('le dit sans laisser espérer un recours', () => {
    const message = recoveryOutcome(false).message;
    expect(message).toMatch(/personne ne peut les déchiffrer/);
    expect(message).toMatch(/nous non plus/);
    expect(message).not.toMatch(/support|assistance|contactez|peut-être|essayer de/i);
  });

  it('explique pourquoi, au lieu de s’excuser', () => {
    // La perte n'est pas une défaillance : c'est la contrepartie de la
    // protection. Le dire change ce que la personne comprend du produit.
    expect(recoveryOutcome(false).message).toMatch(/empêche quiconque d’y accéder sans vous/);
  });
});

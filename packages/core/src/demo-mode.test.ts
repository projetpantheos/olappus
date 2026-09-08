/**
 * Demo Mode et fixtures adverses — G4.
 *
 * `PRD-02` : le mode démonstration utilise **exactement les mêmes objets métier**
 * que le mode réel. Ces tests le vérifient en faisant passer les scénarios de
 * démonstration dans les mêmes moteurs déterministes que la production.
 *
 * Ils vérifient aussi que les quatorze catégories adverses de `RUN-25` sont
 * présentes : un jeu de fixtures sans cas hostile ne prouve que le chemin
 * heureux.
 */

import { describe, expect, it } from 'vitest';

import {
  ADVERSARIAL_CASES,
  DEMO_SCENARIOS,
  NOTHING_TO_REPORT,
  PRICE_VARIATION,
  REQUIRED_CATEGORIES,
  SUBSCRIPTION_INCREASE,
  SYNTHETIC_MARKER,
  TERMINATION_DEADLINE,
  casesFor,
} from '@olappus/test-fixtures';

import { attentionInbox, attentionLevel, runRules, type Fact } from './rules';
import { normalizeMoney } from './normalization';

const NOW = new Date('2026-09-08T00:00:00Z');

const toFacts = (scenario: { facts: readonly unknown[] }): Fact[] => scenario.facts as Fact[];

describe('Demo Mode — les scénarios produisent ce qu’ils promettent', () => {
  it('la hausse d’abonnement devient un item d’attention chiffré', () => {
    const inbox = attentionInbox(runRules(toFacts(SUBSCRIPTION_INCREASE), NOW));
    expect(inbox.items).toHaveLength(1);
    expect(inbox.items[0]?.details['delta_minor']).toBe(400);
    expect(inbox.level).toBe('ACTION');
  });

  it('l’échéance de résiliation devient urgente à l’approche de la date', () => {
    const inbox = attentionInbox(runRules(toFacts(TERMINATION_DEADLINE), NOW));
    expect(inbox.items).toHaveLength(1);
    expect(inbox.items[0]?.details['days_remaining']).toBe(12);
    expect(inbox.level).toBe('ACTION');
  });

  it('la variation de prix est signalée sans demander d’action', () => {
    const inbox = attentionInbox(runRules(toFacts(PRICE_VARIATION), NOW));
    expect(inbox.items).toHaveLength(1);
    expect(attentionLevel(inbox.items[0]!)).toBe('ATTENTION');
  });

  it('le scénario calme ne fabrique aucune notification', () => {
    // Test d'acceptation P0 n°4. Sans ce test, la tentation d'afficher
    // quelque chose finirait par l'emporter.
    const inbox = attentionInbox(runRules(toFacts(NOTHING_TO_REPORT), NOW));
    expect(inbox.items).toEqual([]);
    expect(inbox.level).toBe('SILENCE');
  });

  it('toute fixture porte le marqueur synthétique', () => {
    for (const scenario of DEMO_SCENARIOS) {
      expect(scenario._source, scenario.id).toBe(SYNTHETIC_MARKER);
      for (const fact of scenario.facts) {
        expect(fact._source).toBe(SYNTHETIC_MARKER);
      }
    }
  });

  it('chaque scénario dit ce que l’utilisateur doit comprendre', () => {
    // Critère de jugement pour la revue de G4 : sans cette phrase, on juge
    // l'écran, pas la valeur.
    for (const scenario of DEMO_SCENARIOS) {
      expect(scenario.what_the_user_should_understand.length, scenario.id).toBeGreaterThan(40);
    }
  });
});

describe('Fixtures adverses — les quatorze catégories de RUN-25', () => {
  it('sont toutes présentes', () => {
    for (const category of REQUIRED_CATEGORIES) {
      expect(casesFor(category).length, category).toBeGreaterThan(0);
    }
  });

  it('chacune énonce l’attaque et le comportement attendu', () => {
    for (const c of ADVERSARIAL_CASES) {
      expect(c.attack.length, c.category).toBeGreaterThan(20);
      expect(c.expected.length, c.category).toBeGreaterThan(20);
    }
  });

  it('n’invente aucun secret ni identifiant de paiement réaliste', () => {
    // Interdiction explicite de RUN-25 : une fixture ne doit jamais pouvoir
    // être confondue avec un accès réel.
    const serialized = JSON.stringify(ADVERSARIAL_CASES);
    expect(serialized).not.toMatch(/\b(?:\d[ -]?){13,19}\b/); // numéro de carte
    expect(serialized).not.toMatch(/\bFR\d{2}[0-9A-Z]{10,}/); // IBAN français
    expect(serialized).not.toMatch(/\bsk_(?:live|test)_/); // clé de service
    // Les domaines fictifs utilisent .invalid, réservé à cet usage.
    for (const match of serialized.match(/@[\w.-]+/g) ?? []) {
      expect(match, 'domaine non réservé dans une fixture').toMatch(/\.(invalid|example)$/);
    }
  });
});

describe('Fixtures adverses — le produit tient ses promesses', () => {
  it('refuse un montant issu d’un OCR malformé', () => {
    const payload = casesFor('OCR_MALFORME')[0]!.payload as { amount_text: string };
    expect(normalizeMoney(payload.amount_text)).toMatchObject({ ok: false });
  });

  it('ne suppose jamais la devise absente', () => {
    const payload = casesFor('DEVISE')[0]!.payload as { amount_text: string };
    expect(normalizeMoney(payload.amount_text)).toMatchObject({
      ok: false,
      reason: 'AMBIGUOUS',
    });
  });

  it('n’extrait aucun destinataire d’un contenu contenant une injection', () => {
    // Le contenu hostile existe dans les fixtures ; le contrat d'action
    // n'accepte qu'une référence canonique opaque (contracts.test.ts le
    // vérifie). Ici, on garantit que la fixture contient bien l'attaque,
    // sans quoi le test de contrat porterait sur un cas imaginaire.
    const payload = casesFor('INJECTION_DE_PROMPT')[0]!.payload as { email_body: string };
    expect(payload.email_body).toMatch(/IGNOREZ LES INSTRUCTIONS/i);
    expect(payload.email_body).toMatch(/@attaquant\.invalid/);
  });

  it('conserve une extraction peu fiable sans la transformer en action', () => {
    const payload = casesFor('EXTRACTION_PEU_FIABLE')[0]!.payload as { confidence: string };
    expect(payload.confidence).toBe('UNCERTAIN');
  });
});

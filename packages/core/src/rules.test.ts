import { describe, expect, it } from 'vitest';

import {
  attentionInbox,
  attentionLevel,
  priority,
  runRules,
  type Detection,
  type Fact,
} from './rules';

const NOW = new Date('2026-09-08T00:00:00Z');

const fact = (f: Partial<Fact> & Pick<Fact, 'fact_id' | 'attribute' | 'observed_at'>): Fact => ({
  subject: 'sujet-fictif',
  confidence: 'CONFIRMED',
  evidence_ref: `ev-${f.fact_id}`,
  ...f,
});

const subscription = (amount: number, date: string, id: string, confidence?: Fact['confidence']) =>
  fact({
    fact_id: id,
    attribute: 'subscription.monthly_amount',
    amount_minor: amount,
    currency: 'EUR',
    observed_at: date,
    ...(confidence ? { confidence } : {}),
  });

describe('Règle — hausse d’abonnement', () => {
  it('détecte une hausse entre deux relevés successifs', () => {
    const detections = runRules(
      [
        subscription(2990, '2026-07-05T00:00:00Z', 'a'),
        subscription(3390, '2026-08-05T00:00:00Z', 'b'),
      ],
      NOW,
    );
    expect(detections).toHaveLength(1);
    expect(detections[0]?.reason_code).toBe('SUBSCRIPTION_AMOUNT_INCREASED');
    expect(detections[0]?.details['delta_minor']).toBe(400);
  });

  it('ne détecte rien sur un montant stable — le silence est un comportement', () => {
    const detections = runRules(
      [
        subscription(2990, '2026-07-05T00:00:00Z', 'a'),
        subscription(2990, '2026-08-05T00:00:00Z', 'b'),
      ],
      NOW,
    );
    expect(detections).toEqual([]);
  });

  it('ne signale pas une baisse comme une hausse', () => {
    const detections = runRules(
      [
        subscription(3390, '2026-07-05T00:00:00Z', 'a'),
        subscription(2990, '2026-08-05T00:00:00Z', 'b'),
      ],
      NOW,
    );
    expect(detections).toEqual([]);
  });

  it('refuse de comparer deux devises différentes', () => {
    // Comparer 29,90 € à 33,90 $ produirait un écart imaginaire.
    const detections = runRules(
      [
        { ...subscription(2990, '2026-07-05T00:00:00Z', 'a'), currency: 'EUR' },
        { ...subscription(3390, '2026-08-05T00:00:00Z', 'b'), currency: 'USD' },
      ],
      NOW,
    );
    expect(detections).toEqual([]);
  });

  it('ne conclut pas sur un seul relevé', () => {
    expect(runRules([subscription(2990, '2026-08-05T00:00:00Z', 'a')], NOW)).toEqual([]);
  });
});

describe('Règle — fenêtre de résiliation', () => {
  const deadline = (end: string, confidence: Fact['confidence'] = 'HIGH_CONFIDENCE'): Fact =>
    fact({
      fact_id: 'ech',
      subject: 'contrat-fictif',
      attribute: 'contract.termination_window_end',
      observed_at: '2026-08-20T00:00:00Z',
      valid_until: end,
      confidence,
    });

  it('détecte une échéance dans l’horizon', () => {
    const detections = runRules([deadline('2026-09-20T00:00:00Z')], NOW);
    expect(detections[0]?.reason_code).toBe('TERMINATION_WINDOW_CLOSING');
    expect(detections[0]?.details['days_remaining']).toBe(12);
  });

  it('ignore une échéance déjà passée', () => {
    // Une échéance passée n'est plus une échéance : la signaler serait inutile
    // et anxiogène.
    expect(runRules([deadline('2026-09-01T00:00:00Z')], NOW)).toEqual([]);
  });

  it('ignore une échéance trop lointaine', () => {
    expect(runRules([deadline('2027-01-01T00:00:00Z')], NOW)).toEqual([]);
  });

  it('devient URGENT à sept jours ou moins', () => {
    const proche = runRules([deadline('2026-09-13T00:00:00Z')], NOW)[0]!;
    const lointaine = runRules([deadline('2026-09-25T00:00:00Z')], NOW)[0]!;
    expect(attentionLevel(proche)).toBe('URGENT');
    expect(attentionLevel(lointaine)).toBe('ACTION');
  });
});

describe('Règle — variation de prix', () => {
  const price = (amount: number, date: string, id: string): Fact =>
    fact({
      fact_id: id,
      subject: 'produit-fictif',
      attribute: 'product.unit_price',
      amount_minor: amount,
      currency: 'EUR',
      observed_at: date,
    });

  it('détecte une variation au-delà du seuil', () => {
    const d = runRules(
      [price(1250, '2026-07-01T00:00:00Z', 'a'), price(1890, '2026-08-28T00:00:00Z', 'b')],
      NOW,
    );
    expect(d[0]?.reason_code).toBe('PRICE_VARIATION_UNUSUAL');
    expect(d[0]?.details['variation_percent']).toBeCloseTo(51.2, 1);
  });

  it('ignore une variation sous le seuil', () => {
    const d = runRules(
      [price(1250, '2026-07-01T00:00:00Z', 'a'), price(1300, '2026-08-28T00:00:00Z', 'b')],
      NOW,
    );
    expect(d).toEqual([]);
  });

  it('détecte aussi une baisse inhabituelle', () => {
    // Une baisse forte est une information utile : elle peut signaler une
    // erreur de facturation antérieure.
    const d = runRules(
      [price(1890, '2026-07-01T00:00:00Z', 'a'), price(1250, '2026-08-28T00:00:00Z', 'b')],
      NOW,
    );
    expect(d).toHaveLength(1);
  });
});

describe('Explicabilité — toute détection est justifiable', () => {
  it('porte toujours une règle, sa version et des preuves', () => {
    const detections = runRules(
      [
        subscription(2990, '2026-07-05T00:00:00Z', 'a'),
        subscription(3390, '2026-08-05T00:00:00Z', 'b'),
      ],
      NOW,
    );
    for (const d of detections) {
      expect(d.rule_id.length).toBeGreaterThan(0);
      expect(d.rule_version).toMatch(/^\d+\.\d+\.\d+$/);
      // Sans preuve, pas de détection : le PROOF de PRD-14 serait vide.
      expect(d.evidence_refs.length).toBeGreaterThan(0);
    }
  });

  it('adopte la confiance du fait le moins sûr', () => {
    const d = runRules(
      [
        subscription(2990, '2026-07-05T00:00:00Z', 'a', 'CONFIRMED'),
        subscription(3390, '2026-08-05T00:00:00Z', 'b', 'PROBABLE'),
      ],
      NOW,
    )[0]!;
    expect(d.confidence).toBe('PROBABLE');
  });
});

describe('Seuil de confiance — une incertitude ne demande jamais d’action', () => {
  it('rétrograde une détection incertaine en INFO', () => {
    const d = runRules(
      [
        subscription(2990, '2026-07-05T00:00:00Z', 'a', 'UNCERTAIN'),
        subscription(3390, '2026-08-05T00:00:00Z', 'b', 'UNCERTAIN'),
      ],
      NOW,
    )[0]!;
    // Sans cette garde, une extraction douteuse ferait envoyer une réclamation.
    expect(attentionLevel(d)).toBe('INFO');
  });

  it('rétrograde même une échéance proche si la confiance est faible', () => {
    const d = runRules(
      [
        fact({
          fact_id: 'ech',
          attribute: 'contract.termination_window_end',
          observed_at: '2026-08-20T00:00:00Z',
          valid_until: '2026-09-10T00:00:00Z',
          confidence: 'UNCERTAIN',
        }),
      ],
      NOW,
    )[0]!;
    expect(attentionLevel(d)).toBe('INFO');
  });
});

describe('Hélios — projection en inbox d’attention', () => {
  it('reste silencieux quand rien n’est détecté', () => {
    const inbox = attentionInbox([]);
    expect(inbox.items).toEqual([]);
    expect(inbox.level).toBe('SILENCE');
  });

  it('trie par priorité décroissante', () => {
    const detections = runRules(
      [
        subscription(2990, '2026-07-05T00:00:00Z', 'a'),
        subscription(3390, '2026-08-05T00:00:00Z', 'b'),
        fact({
          fact_id: 'ech',
          subject: 'contrat-fictif',
          attribute: 'contract.termination_window_end',
          observed_at: '2026-08-20T00:00:00Z',
          valid_until: '2026-09-11T00:00:00Z',
        }),
      ],
      NOW,
    );
    const inbox = attentionInbox(detections);
    expect(inbox.level).toBe('URGENT');
    expect(inbox.items[0]?.reason_code).toBe('TERMINATION_WINDOW_CLOSING');
  });

  it('classe une hausse plus haut quand son impact est plus fort', () => {
    const petite: Detection = {
      rule_id: 'r',
      rule_version: '1.0.0',
      reason_code: 'SUBSCRIPTION_AMOUNT_INCREASED',
      subject: 's1',
      evidence_refs: ['e'],
      confidence: 'CONFIRMED',
      details: { delta_minor: 100 },
    };
    const grosse: Detection = { ...petite, subject: 's2', details: { delta_minor: 1500 } };
    expect(priority(grosse)).toBeGreaterThan(priority(petite));
  });
});

describe('Déterminisme', () => {
  it('rend exactement le même résultat pour la même entrée', () => {
    const facts = [
      subscription(2990, '2026-07-05T00:00:00Z', 'a'),
      subscription(3390, '2026-08-05T00:00:00Z', 'b'),
    ];
    expect(runRules(facts, NOW)).toEqual(runRules(facts, NOW));
  });

  it('ne dépend pas de l’ordre des faits en entrée', () => {
    const a = subscription(2990, '2026-07-05T00:00:00Z', 'a');
    const b = subscription(3390, '2026-08-05T00:00:00Z', 'b');
    expect(runRules([a, b], NOW)).toEqual(runRules([b, a], NOW));
  });
});

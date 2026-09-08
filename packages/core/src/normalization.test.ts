import { describe, expect, it } from 'vitest';

import {
  canonicalizeMerchantName,
  derive,
  missing,
  normalizeDate,
  normalizeMoney,
  present,
} from './normalization.js';

describe('Montants — forme canonique', () => {
  it('convertit un montant français en unité mineure entière', () => {
    const r = normalizeMoney('12,99 €');
    expect(r).toMatchObject({ ok: true, value: { amount_minor: 1299, currency: 'EUR', scale: 2 } });
  });

  it('accepte les séparateurs de milliers sans les confondre avec des décimales', () => {
    expect(normalizeMoney('1.234,56 €')).toMatchObject({
      ok: true,
      value: { amount_minor: 123456 },
    });
    expect(normalizeMoney('1,234.56 USD')).toMatchObject({
      ok: true,
      value: { amount_minor: 123456, currency: 'USD' },
    });
  });

  it('gère les montants négatifs (avoirs, remboursements)', () => {
    expect(normalizeMoney('-45,00 €')).toMatchObject({ ok: true, value: { amount_minor: -4500 } });
  });

  it('ne stocke jamais une chaîne d’affichage comme montant', () => {
    const r = normalizeMoney('12,99 €');
    expect(r.ok && typeof r.value.amount_minor).toBe('number');
    expect(JSON.stringify(r)).not.toContain('12,99');
  });
});

describe('Montants — ce que la normalisation refuse', () => {
  it('refuse un montant ambigu au lieu de choisir une lecture', () => {
    // « 1,234 » vaut 1234 en français et 1.234 en anglais. Deviner ici
    // produirait une erreur d'un facteur 1000 avec l'apparence d'une certitude.
    const r = normalizeMoney('1,234 EUR');
    expect(r).toMatchObject({ ok: false, reason: 'AMBIGUOUS' });
  });

  it('ne suppose jamais la devise', () => {
    expect(normalizeMoney('42,00')).toMatchObject({ ok: false, reason: 'AMBIGUOUS' });
  });

  it('accepte une devise fournie explicitement en indice', () => {
    expect(normalizeMoney('42,00', 'EUR')).toMatchObject({
      ok: true,
      value: { amount_minor: 4200 },
    });
  });

  it('rejette une devise hors périmètre plutôt que d’inventer une échelle', () => {
    expect(normalizeMoney('1000 JPY', 'JPY')).toMatchObject({ ok: false, reason: 'UNSUPPORTED' });
  });

  it('rejette une entrée sans chiffre', () => {
    expect(normalizeMoney('gratuit €')).toMatchObject({ ok: false, reason: 'MALFORMED' });
  });
});

describe('Dates — forme canonique', () => {
  it('accepte une date ISO sans supposition', () => {
    expect(normalizeDate('2026-03-14')).toMatchObject({
      ok: true,
      value: { iso: '2026-03-14' },
      confidence: 'CONFIRMED',
    });
  });

  it('lit une date française non ambiguë avec certitude', () => {
    // 14 ne peut pas être un mois : la lecture jour/mois est la seule possible.
    expect(normalizeDate('14/03/2026')).toMatchObject({
      ok: true,
      value: { iso: '2026-03-14' },
      confidence: 'CONFIRMED',
    });
  });

  it('signale une date ambiguë au lieu de l’affirmer', () => {
    // 01/02/2026 : 1er février ou 2 janvier selon la convention.
    const r = normalizeDate('01/02/2026');
    expect(r).toMatchObject({ ok: true, confidence: 'PROBABLE' });
    expect(r.ok && r.value.assumed_locale).toBe('fr-FR');
    expect(r.ok && r.value.iso).toBe('2026-02-01');
  });

  it('rejette une date inexistante au calendrier', () => {
    expect(normalizeDate('31/02/2026')).toMatchObject({ ok: false, reason: 'OUT_OF_RANGE' });
    expect(normalizeDate('2026-02-30')).toMatchObject({ ok: false, reason: 'OUT_OF_RANGE' });
  });

  it('refuse une locale hors du périmètre juridique P0', () => {
    expect(normalizeDate('01/02/2026', 'en-US')).toMatchObject({
      ok: false,
      reason: 'UNSUPPORTED',
    });
  });

  it('rejette un format non reconnu', () => {
    expect(normalizeDate('le 14 mars')).toMatchObject({ ok: false, reason: 'UNSUPPORTED' });
  });
});

describe('Marchands — canonicalisation', () => {
  it('neutralise casse, accents, ponctuation et suffixes juridiques', () => {
    expect(canonicalizeMerchantName('Éléctricité de France S.A.')).toBe('electricite de france');
    expect(canonicalizeMerchantName('ACME  SARL')).toBe('acme');
  });

  it('rapproche deux écritures du même libellé', () => {
    expect(canonicalizeMerchantName('Free Mobile')).toBe(canonicalizeMerchantName('FREE MOBILE'));
  });

  it('ne rapproche pas deux marchands distincts', () => {
    // La canonicalisation prépare une comparaison, elle ne résout pas une
    // identité : deux noms proches restent deux noms différents.
    expect(canonicalizeMerchantName('Free Mobile')).not.toBe(canonicalizeMerchantName('Free Pro'));
  });
});

describe('Sémantique du vide', () => {
  it('distingue quatre situations que null confondrait', () => {
    const cases = [
      missing('MISSING'),
      missing('UNKNOWN'),
      missing('NOT_APPLICABLE'),
      missing('WITHHELD'),
    ];
    const absences = cases.map((c) => (c.present ? null : c.absence));
    expect(new Set(absences).size).toBe(4);
  });

  it('distingue une valeur présente d’une absence', () => {
    expect(present(0).present).toBe(true);
    expect(missing('MISSING').present).toBe(false);
  });
});

describe('Provenance', () => {
  const provenance = {
    source_id: 'src-1',
    producer_version: 'extractor@1.2.0',
    observed_at: '2026-03-14T10:00:00Z',
  };

  it('attache source, version et date à tout fait dérivé durable', () => {
    const fact = derive(normalizeMoney('12,99 €'), provenance);
    expect(fact).not.toBeNull();
    expect(fact?.provenance.producer_version).toBe('extractor@1.2.0');
    expect(fact?.confidence).toBe('CONFIRMED');
  });

  it('ne produit aucun fait à partir d’une normalisation échouée', () => {
    // Un fait sans valeur normalisée n'a rien à faire dans le domaine :
    // c'est exactement ce que « RAW DATA IS NOT DOMAIN DATA » interdit.
    expect(derive(normalizeMoney('1,234 EUR'), provenance)).toBeNull();
  });

  it('transporte la confiance dégradée d’une lecture supposée', () => {
    const fact = derive(normalizeDate('01/02/2026'), provenance);
    expect(fact?.confidence).toBe('PROBABLE');
  });
});

describe('Montants — espacement issu d’une extraction abîmée', () => {
  it('refuse un montant aux chiffres disloqués', () => {
    // Cas adverse OCR_MALFORME de RUN-25. Sans cette garde, « 1 2,9 9 € »
    // devenait 12,99 € : une valeur fausse portant l'apparence d'une certitude.
    expect(normalizeMoney('1 2,9 9 €')).toMatchObject({ ok: false, reason: 'MALFORMED' });
  });

  it('accepte un séparateur de milliers correctement groupé', () => {
    expect(normalizeMoney('1 234,56 €')).toMatchObject({
      ok: true,
      value: { amount_minor: 123456 },
    });
  });

  it('refuse un groupement de milliers incohérent', () => {
    expect(normalizeMoney('1 23 456,00 €')).toMatchObject({ ok: false, reason: 'MALFORMED' });
  });
});

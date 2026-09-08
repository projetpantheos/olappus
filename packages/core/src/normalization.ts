/**
 * Normalisation canonique — DAT-10.
 *
 * Principe directeur : **une valeur ambiguë n'est jamais devinée.** La fonction
 * refuse et dit pourquoi. Deviner produirait une donnée fausse portant l'apparence
 * d'une donnée sûre, ce que `PRD-14` interdit explicitement (Journey E) :
 * ne jamais transformer une probabilité faible en affirmation.
 *
 * Ce module est déterministe et sans effet de bord : aucun appel réseau,
 * aucune IA. C'est la couche qui doit rendre l'IA inutile dans la majorité
 * des cas (`docs/08_KNOWLEDGE_ENGINE`).
 */

// =============================================================================
// Résultat explicite
// =============================================================================

/** Une normalisation réussit, ou échoue avec un motif exploitable. */
export type Normalized<T> =
  | { readonly ok: true; readonly value: T; readonly confidence: Confidence }
  | { readonly ok: false; readonly reason: NormalizationFailure; readonly detail: string };

export type NormalizationFailure =
  | 'AMBIGUOUS' // plusieurs lectures possibles, aucune ne prime
  | 'UNSUPPORTED' // format hors du périmètre déclaré
  | 'MALFORMED' // entrée inexploitable
  | 'OUT_OF_RANGE';

export const CONFIDENCE = [
  'CONFIRMED',
  'HIGH_CONFIDENCE',
  'PROBABLE',
  'UNCERTAIN',
  'INSUFFICIENT_DATA',
] as const;

export type Confidence = (typeof CONFIDENCE)[number];

// =============================================================================
// Sémantique du vide — DAT-10 « Null semantics »
// =============================================================================

/**
 * Ne pas confondre quatre situations distinctes. Les écraser en `null` fait
 * perdre l'information la plus utile : savoir *pourquoi* la valeur manque.
 */
export type Absence = 'MISSING' | 'UNKNOWN' | 'NOT_APPLICABLE' | 'WITHHELD';

export type Maybe<T> =
  | { readonly present: true; readonly value: T }
  | {
      readonly present: false;
      readonly absence: Absence;
    };

export const missing = (absence: Absence): Maybe<never> => ({ present: false, absence });
export const present = <T>(value: T): Maybe<T> => ({ present: true, value });

// =============================================================================
// Montants — DAT-10 « Money »
// =============================================================================

/**
 * Un montant canonique. `amount_minor` est un entier en plus petite unité :
 * 12,99 € vaut 1299. Aucun flottant, aucune chaîne d'affichage — « 12,99 € »
 * n'est pas un montant, c'est une présentation.
 */
export interface Money {
  readonly amount_minor: number;
  readonly currency: string;
  readonly scale: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  '€': 'EUR',
  $: 'USD',
  '£': 'GBP',
};

/** Devises à deux décimales. Les exceptions (JPY, TND…) sortent du périmètre P0. */
const SCALE_BY_CURRENCY: Record<string, number> = { EUR: 2, USD: 2, GBP: 2 };

/**
 * Normalise un montant écrit par un humain ou extrait d'un document.
 *
 * Refuse plutôt que de deviner :
 * - « 1,234 » est ambigu (1234 en français, 1.234 en anglais) ;
 * - une devise absente n'est jamais supposée.
 */
export function normalizeMoney(input: string, currencyHint?: string): Normalized<Money> {
  const raw = input.trim();
  if (raw === '') {
    return { ok: false, reason: 'MALFORMED', detail: 'Chaîne vide.' };
  }

  let currency = currencyHint?.toUpperCase();
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (raw.includes(symbol)) currency = code;
  }
  const isoMatch = /\b(EUR|USD|GBP)\b/i.exec(raw);
  if (isoMatch) currency = isoMatch[1]!.toUpperCase();

  if (!currency) {
    return {
      ok: false,
      reason: 'AMBIGUOUS',
      detail: 'Devise absente : elle n’est jamais supposée, même en France.',
    };
  }
  const scale = SCALE_BY_CURRENCY[currency];
  if (scale === undefined) {
    return {
      ok: false,
      reason: 'UNSUPPORTED',
      detail: `Devise « ${currency} » hors périmètre P0.`,
    };
  }

  // Partie numérique, espaces conservés : ce sont eux qui trahissent un OCR
  // abîmé. Les retirer d'emblée transformerait « 1 2,9 9 » en « 12,99 » —
  // une valeur fausse portant l'apparence d'une certitude.
  const numericPart = raw.replace(/[^\d.,\s-]/g, '').trim();

  if (/[\s\u00A0\u202F]/.test(numericPart)) {
    // Un espace n'est légitime qu'en séparateur de milliers, par groupes de
    // trois chiffres. Toute autre disposition est une lecture douteuse.
    const wellGrouped = /^-?\d{1,3}(?:[\s\u00A0\u202F]\d{3})+(?:[.,]\d{1,2})?$/.test(numericPart);
    if (!wellGrouped) {
      return {
        ok: false,
        reason: 'MALFORMED',
        detail: `« ${raw} » comporte un espacement incohérent : lecture douteuse, probablement issue d’une extraction abîmée.`,
      };
    }
  }

  const digits = numericPart.replace(/[^\d.,-]/g, '');
  if (digits === '' || !/\d/.test(digits)) {
    return { ok: false, reason: 'MALFORMED', detail: 'Aucun chiffre exploitable.' };
  }

  const negative = digits.startsWith('-');
  const body = digits.replace(/-/g, '');

  const commas = (body.match(/,/g) ?? []).length;
  const dots = (body.match(/\./g) ?? []).length;

  let decimalSeparator: '.' | ',' | null = null;

  if (commas > 0 && dots > 0) {
    // Le dernier séparateur rencontré est le décimal : « 1.234,56 » ou « 1,234.56 ».
    decimalSeparator = body.lastIndexOf(',') > body.lastIndexOf('.') ? ',' : '.';
  } else if (commas === 1 || dots === 1) {
    const separator = commas === 1 ? ',' : '.';
    const after = body.length - body.lastIndexOf(separator) - 1;
    if (after === 3) {
      // « 1,234 » : séparateur de milliers en anglais, décimal en français.
      // Les deux lectures sont plausibles et donnent 1234 ou 1.234.
      return {
        ok: false,
        reason: 'AMBIGUOUS',
        detail: `« ${raw} » se lit 1234 ou 1.234 selon la locale : aucune lecture ne prime.`,
      };
    }
    decimalSeparator = separator;
  } else if (commas > 1 || dots > 1) {
    decimalSeparator = null; // séparateurs de milliers répétés uniquement
  }

  const cleaned =
    decimalSeparator === null
      ? body.replace(/[.,]/g, '')
      : body
          .replace(new RegExp(`\\${decimalSeparator === ',' ? '.' : ','}`, 'g'), '')
          .replace(decimalSeparator, '.');

  const numeric = Number(cleaned);
  if (!Number.isFinite(numeric)) {
    return { ok: false, reason: 'MALFORMED', detail: `« ${raw} » n’est pas un nombre.` };
  }

  const minor = Math.round(numeric * 10 ** scale);
  if (!Number.isSafeInteger(minor)) {
    return { ok: false, reason: 'OUT_OF_RANGE', detail: 'Montant hors des entiers sûrs.' };
  }

  return {
    ok: true,
    value: { amount_minor: negative ? -minor : minor, currency, scale },
    confidence: 'CONFIRMED',
  };
}

// =============================================================================
// Dates — DAT-10 « Date/time »
// =============================================================================

/** Date calendaire sans heure significative, avec le contexte qui l'a produite. */
export interface LocalDate {
  readonly iso: string; // AAAA-MM-JJ
  readonly assumed_locale?: string;
}

/**
 * Normalise une date écrite.
 *
 * `01/02/2026` est irréductiblement ambigu entre les conventions. Le périmètre
 * P0 étant la France (ADR-0007), la lecture jour/mois est appliquée — mais la
 * confiance retombe à PROBABLE et la locale supposée est conservée, pour que
 * l'affichage puisse le signaler au lieu de l'affirmer.
 */
export function normalizeDate(input: string, locale = 'fr-FR'): Normalized<LocalDate> {
  const raw = input.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) {
    const [, y, m, d] = iso;
    return buildDate(Number(y), Number(m), Number(d), 'CONFIRMED');
  }

  const slashed = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(raw);
  if (slashed) {
    const first = Number(slashed[1]);
    const second = Number(slashed[2]);
    const year = Number(slashed[3]);

    if (locale !== 'fr-FR') {
      return {
        ok: false,
        reason: 'UNSUPPORTED',
        detail: `Locale « ${locale} » hors périmètre P0 (ADR-0007 : France).`,
      };
    }

    // Si les deux nombres peuvent être un mois, la lecture reste supposée.
    const ambiguous = first <= 12 && second <= 12 && first !== second;
    return buildDate(year, second, first, ambiguous ? 'PROBABLE' : 'CONFIRMED', locale);
  }

  return { ok: false, reason: 'UNSUPPORTED', detail: `Format de date non reconnu : « ${raw} ».` };
}

function buildDate(
  year: number,
  month: number,
  day: number,
  confidence: Confidence,
  assumedLocale?: string,
): Normalized<LocalDate> {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { ok: false, reason: 'OUT_OF_RANGE', detail: 'Jour ou mois hors bornes.' };
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { ok: false, reason: 'OUT_OF_RANGE', detail: 'Date inexistante au calendrier.' };
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const value: LocalDate =
    assumedLocale === undefined
      ? { iso: `${year}-${pad(month)}-${pad(day)}` }
      : { iso: `${year}-${pad(month)}-${pad(day)}`, assumed_locale: assumedLocale };
  return { ok: true, value, confidence };
}

// =============================================================================
// Marchands — DAT-10 « Merchant »
// =============================================================================

/**
 * Forme canonique d'un libellé de marchand : casse, accents, ponctuation et
 * suffixes juridiques neutralisés.
 *
 * **Cette fonction ne résout pas une identité.** Elle prépare une comparaison.
 * `DAT-10` impose un ordre strict : identifiant externe exact, puis chaîne
 * normalisée, puis correspondance probabiliste, puis revue humaine si critique.
 * Aucun rapprochement probabiliste n'est fait ici.
 */
export function canonicalizeMerchantName(input: string): string {
  return (
    input
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      // Les points sont retirés avant tout le reste : « S.A. » doit devenir
      // « sa » pour être reconnu comme suffixe juridique. Retirer la ponctuation
      // d'abord le transformerait en « s a », que plus aucune règle ne capte.
      .replace(/\./g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\b(sa|sas|sarl|sasu|eurl|inc|ltd|gmbh|bv)\b/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
  );
}

// =============================================================================
// Provenance — DAT-10 « Provenance »
// =============================================================================

/**
 * Tout fait dérivé durable conserve sa source, la version de la règle ou de
 * l'extracteur qui l'a produit, et la date d'observation. Sans cela, aucune
 * explication n'est reproductible et aucune correction n'est traçable.
 */
export interface Provenance {
  readonly source_id: string;
  readonly producer_version: string;
  readonly observed_at: string;
}

export interface DerivedFact<T> {
  readonly value: T;
  readonly confidence: Confidence;
  readonly provenance: Provenance;
}

export function derive<T>(
  normalized: Normalized<T>,
  provenance: Provenance,
): DerivedFact<T> | null {
  if (!normalized.ok) return null;
  return { value: normalized.value, confidence: normalized.confidence, provenance };
}

/**
 * Moteur de règles déterministe et priorisation — G4.
 *
 * `AI-11` impose l'ordre : DETERMINISTIC → RULE ENGINE → KNOWLEDGE → AI si
 * nécessaire. Ce module est le premier maillon, et l'objectif de `docs/08` est
 * qu'il rende les suivants inutiles dans la majorité des cas.
 *
 * Trois propriétés non négociables :
 * 1. **Déterministe** — aucun aléa, aucune horloge implicite, aucun appel réseau.
 *    La même entrée donne toujours la même sortie, donc la même explication.
 * 2. **Explicable** — toute détection porte un code de raison et les preuves
 *    utilisées. Sans cela, le WHY et le PROOF de `PRD-14` sont invérifiables.
 * 3. **Silencieuse par défaut** — `PRD-01` : si rien d'important n'est détecté,
 *    Olappus ne dit rien. Le silence est un comportement, pas un échec.
 */

import type { Confidence } from './normalization';

export type AttentionLevel = 'SILENCE' | 'INFO' | 'ATTENTION' | 'ACTION' | 'URGENT';

export type ReasonCode =
  'SUBSCRIPTION_AMOUNT_INCREASED' | 'TERMINATION_WINDOW_CLOSING' | 'PRICE_VARIATION_UNUSUAL';

/** Fait normalisé consommé par les règles. Volontairement minimal. */
export interface Fact {
  readonly fact_id: string;
  readonly subject: string;
  readonly attribute: string;
  readonly amount_minor?: number | undefined;
  readonly currency?: string | undefined;
  readonly observed_at: string;
  readonly valid_until?: string | undefined;
  readonly confidence: Confidence;
  readonly evidence_ref: string;
}

export interface Detection {
  readonly rule_id: string;
  readonly rule_version: string;
  readonly reason_code: ReasonCode;
  readonly subject: string;
  /** Preuves ayant servi à la détection. Jamais vide : sans preuve, pas de détection. */
  readonly evidence_refs: readonly string[];
  readonly confidence: Confidence;
  /** Éléments chiffrés du WHY, destinés à l'affichage. */
  readonly details: Readonly<Record<string, number | string>>;
}

export interface Rule {
  readonly id: string;
  readonly version: string;
  /** L'horloge est injectée : une règle qui lit l'heure elle-même n'est pas testable. */
  readonly evaluate: (facts: readonly Fact[], now: Date) => Detection[];
}

const CONFIDENCE_RANK: Record<Confidence, number> = {
  CONFIRMED: 4,
  HIGH_CONFIDENCE: 3,
  PROBABLE: 2,
  UNCERTAIN: 1,
  INSUFFICIENT_DATA: 0,
};

/** Rang de confiance. Fonction plutot qu acces indexe : sous noUncheckedIndexedAccess,
 * un acces Record rend T | undefined, et masquer cela par un ! effacerait le cas reel
 * d une valeur hors vocabulaire. */
function rank(c: Confidence): number {
  return CONFIDENCE_RANK[c] ?? 0;
}

/** Confiance d'une détection : celle du fait le moins sûr qui la soutient. */
function weakestConfidence(facts: readonly Fact[]): Confidence {
  return facts.reduce<Confidence>(
    (worst, f) => (rank(f.confidence) < rank(worst) ? f.confidence : worst),
    'CONFIRMED',
  );
}

const byDate = (a: Fact, b: Fact) => a.observed_at.localeCompare(b.observed_at);

// =============================================================================
// Règles
// =============================================================================

/** Hausse d'un montant d'abonnement entre deux relevés successifs. */
export const subscriptionIncreaseRule: Rule = {
  id: 'subscription.amount_increase',
  version: '1.0.0',
  evaluate(facts) {
    const detections: Detection[] = [];
    const bySubject = new Map<string, Fact[]>();

    for (const f of facts) {
      if (f.attribute !== 'subscription.monthly_amount') continue;
      if (f.amount_minor === undefined) continue;
      const list = bySubject.get(f.subject) ?? [];
      list.push(f);
      bySubject.set(f.subject, list);
    }

    for (const [subject, list] of bySubject) {
      if (list.length < 2) continue;
      const sorted = [...list].sort(byDate);
      const previous = sorted[sorted.length - 2]!;
      const latest = sorted[sorted.length - 1]!;

      // Comparer des devises différentes produirait un écart imaginaire.
      if (previous.currency !== latest.currency) continue;

      const delta = latest.amount_minor! - previous.amount_minor!;
      if (delta <= 0) continue;

      detections.push({
        rule_id: 'subscription.amount_increase',
        rule_version: '1.0.0',
        reason_code: 'SUBSCRIPTION_AMOUNT_INCREASED',
        subject,
        evidence_refs: [previous.evidence_ref, latest.evidence_ref],
        confidence: weakestConfidence([previous, latest]),
        details: {
          previous_amount_minor: previous.amount_minor!,
          new_amount_minor: latest.amount_minor!,
          delta_minor: delta,
          currency: latest.currency ?? '',
          since: latest.observed_at,
        },
      });
    }

    return detections;
  },
};

/** Fenêtre de résiliation se refermant dans les 30 jours. */
export const terminationWindowRule: Rule = {
  id: 'contract.termination_window',
  version: '1.0.0',
  evaluate(facts, now) {
    const detections: Detection[] = [];
    const HORIZON_DAYS = 30;

    for (const f of facts) {
      if (f.attribute !== 'contract.termination_window_end') continue;
      if (!f.valid_until) continue;

      const end = new Date(f.valid_until);
      const days = Math.floor((end.getTime() - now.getTime()) / 86_400_000);

      // Une échéance passée n'est pas une échéance : elle ne produit rien.
      if (days < 0 || days > HORIZON_DAYS) continue;

      detections.push({
        rule_id: 'contract.termination_window',
        rule_version: '1.0.0',
        reason_code: 'TERMINATION_WINDOW_CLOSING',
        subject: f.subject,
        evidence_refs: [f.evidence_ref],
        confidence: f.confidence,
        details: { days_remaining: days, window_end: f.valid_until },
      });
    }

    return detections;
  },
};

/** Variation de prix supérieure à un seuil, entre deux relevés. */
export const priceVariationRule: Rule = {
  id: 'product.price_variation',
  version: '1.0.0',
  evaluate(facts) {
    const detections: Detection[] = [];
    const THRESHOLD_PERCENT = 15;
    const bySubject = new Map<string, Fact[]>();

    for (const f of facts) {
      if (f.attribute !== 'product.unit_price') continue;
      if (f.amount_minor === undefined) continue;
      const list = bySubject.get(f.subject) ?? [];
      list.push(f);
      bySubject.set(f.subject, list);
    }

    for (const [subject, list] of bySubject) {
      if (list.length < 2) continue;
      const sorted = [...list].sort(byDate);
      const previous = sorted[sorted.length - 2]!;
      const latest = sorted[sorted.length - 1]!;
      if (previous.currency !== latest.currency) continue;
      if (previous.amount_minor === 0) continue;

      const variation =
        ((latest.amount_minor! - previous.amount_minor!) / previous.amount_minor!) * 100;
      if (Math.abs(variation) < THRESHOLD_PERCENT) continue;

      detections.push({
        rule_id: 'product.price_variation',
        rule_version: '1.0.0',
        reason_code: 'PRICE_VARIATION_UNUSUAL',
        subject,
        evidence_refs: [previous.evidence_ref, latest.evidence_ref],
        confidence: weakestConfidence([previous, latest]),
        details: {
          variation_percent: Math.round(variation * 10) / 10,
          threshold_percent: THRESHOLD_PERCENT,
          previous_amount_minor: previous.amount_minor!,
          new_amount_minor: latest.amount_minor!,
        },
      });
    }

    return detections;
  },
};

export const DEFAULT_RULES: readonly Rule[] = [
  subscriptionIncreaseRule,
  terminationWindowRule,
  priceVariationRule,
];

/** Applique toutes les règles. Aucune détection est un résultat valide. */
export function runRules(
  facts: readonly Fact[],
  now: Date,
  rules: readonly Rule[] = DEFAULT_RULES,
): Detection[] {
  return rules.flatMap((rule) => rule.evaluate(facts, now));
}

// =============================================================================
// Niveau d'attention
// =============================================================================

/**
 * Traduit une détection en niveau d'attention (`PRD-01`).
 *
 * Le seuil de confiance est la garde la plus importante du produit : une
 * détection incertaine ne demande jamais d'action. Elle informe, au mieux.
 * `PRD-14` Journey E l'exige — ne jamais transformer une probabilité faible en
 * affirmation.
 */
export function attentionLevel(detection: Detection): AttentionLevel {
  if (rank(detection.confidence) <= rank('UNCERTAIN')) {
    return 'INFO';
  }

  switch (detection.reason_code) {
    case 'TERMINATION_WINDOW_CLOSING': {
      const days = Number(detection.details['days_remaining'] ?? 999);
      // Une fenêtre qui se referme est le seul cas réellement irréversible :
      // passé la date, le droit est perdu.
      return days <= 7 ? 'URGENT' : 'ACTION';
    }
    case 'SUBSCRIPTION_AMOUNT_INCREASED':
      return 'ACTION';
    case 'PRICE_VARIATION_UNUSUAL':
      return 'ATTENTION';
    default:
      return 'INFO';
  }
}

/**
 * Priorité, combinant les facteurs de `PRD-01` : impact, urgence, confiance.
 * Réversibilité, effort, préférences et contexte viendront avec les modules.
 */
export function priority(detection: Detection): number {
  const level = attentionLevel(detection);
  const levelWeight: Record<AttentionLevel, number> = {
    URGENT: 100,
    ACTION: 70,
    ATTENTION: 40,
    INFO: 10,
    SILENCE: 0,
  };

  const impact =
    detection.reason_code === 'SUBSCRIPTION_AMOUNT_INCREASED'
      ? Math.min(Number(detection.details['delta_minor'] ?? 0) / 100, 20)
      : 0;

  return (levelWeight[level] ?? 0) + rank(detection.confidence) + Math.round(impact);
}

/** Projection Hélios : détections triées, et le silence quand il n'y a rien. */
export function attentionInbox(detections: readonly Detection[]): {
  readonly items: readonly Detection[];
  readonly level: AttentionLevel;
} {
  const visible = detections.filter((d) => attentionLevel(d) !== 'SILENCE');
  const items = [...visible].sort((a, b) => priority(b) - priority(a));
  const level = items[0] ? attentionLevel(items[0]) : 'SILENCE';
  return { items, level };
}

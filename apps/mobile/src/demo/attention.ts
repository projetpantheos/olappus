/**
 * Demo Mode — projection des scénarios synthétiques en items d'attention.
 *
 * `PRD-02` : le mode démonstration utilise **exactement les mêmes objets métier**
 * que le mode réel. Cette couche ne fabrique donc rien : elle fait passer les
 * fixtures dans les moteurs déterministes du Core, comme le fera un connecteur.
 *
 * Aucun appel réseau, aucune IA — condition de sortie de G4.
 */

import {
  attentionInbox,
  attentionLevel,
  runRules,
  type AttentionLevel,
  type Detection,
  type Fact,
} from '@olappus/core';
import { DEMO_SCENARIOS, type DemoScenario } from '@olappus/test-fixtures';

export interface AttentionItem {
  readonly id: string;
  readonly title: string;
  readonly level: AttentionLevel;
  readonly detection: Detection;
  readonly scenario: DemoScenario;
}

/** Formate un montant en unité mineure. Jamais de chaîne d'affichage stockée. */
export function formatAmount(amountMinor: number, currency = 'EUR'): string {
  const major = amountMinor / 100;
  const symbol = currency === 'EUR' ? ' €' : ` ${currency}`;
  return `${major.toFixed(2).replace('.', ',')}${symbol}`;
}

/**
 * Construit l'inbox d'attention à partir des scénarios de démonstration.
 *
 * L'horloge est un paramètre : sans cela, l'écran ne serait pas testable et son
 * contenu changerait au fil du temps sans qu'on puisse l'expliquer.
 */
export function demoAttentionItems(now: Date): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const scenario of DEMO_SCENARIOS) {
    const detections = runRules(scenario.facts as unknown as Fact[], now);
    const inbox = attentionInbox(detections);

    for (const detection of inbox.items) {
      items.push({
        id: `${scenario.id}:${detection.rule_id}`,
        title: scenario.title,
        level: attentionLevel(detection),
        detection,
        scenario,
      });
    }
  }

  return items;
}

/** Retrouve un item par son identifiant, pour l'écran de détail. */
export function findAttentionItem(now: Date, id: string): AttentionItem | undefined {
  return demoAttentionItems(now).find((item) => item.id === id);
}

/**
 * Explication chiffrée du WHY, en langage courant.
 *
 * Elle n'ajoute aucune interprétation : elle met en phrase les valeurs que la
 * règle a produites. Toute affirmation supplémentaire serait invérifiable.
 */
export function explain(detection: Detection): string {
  const d = detection.details;

  switch (detection.reason_code) {
    case 'SUBSCRIPTION_AMOUNT_INCREASED': {
      const previous = Number(d['previous_amount_minor'] ?? 0);
      const next = Number(d['new_amount_minor'] ?? 0);
      const delta = Number(d['delta_minor'] ?? 0);
      return `Le montant mensuel est passé de ${formatAmount(previous)} à ${formatAmount(next)}, soit ${formatAmount(delta)} de plus.`;
    }
    case 'TERMINATION_WINDOW_CLOSING': {
      const days = Number(d['days_remaining'] ?? 0);
      return `La période pendant laquelle vous pouvez résilier se referme dans ${days} jours.`;
    }
    case 'PRICE_VARIATION_UNUSUAL': {
      const variation = Number(d['variation_percent'] ?? 0);
      const threshold = Number(d['threshold_percent'] ?? 0);
      const direction = variation > 0 ? 'augmenté' : 'baissé';
      return `Le prix a ${direction} de ${Math.abs(variation)} %, au-delà du seuil habituel de ${threshold} %.`;
    }
    default:
      return 'Aucune explication disponible pour cette détection.';
  }
}

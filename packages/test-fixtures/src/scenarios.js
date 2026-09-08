/**
 * Scénarios de démonstration — Demo Mode (G4).
 *
 * `PRD-02` impose que le mode démonstration utilise **exactement les mêmes
 * objets métier** que le mode réel. Ces scénarios ne sont donc pas des maquettes :
 * ce sont des faits normalisés qui traversent les mêmes moteurs déterministes.
 *
 * Trois situations, choisies parce qu'elles couvrent les trois moteurs du P0 et
 * qu'aucune n'exige de connecteur ni d'IA :
 *   1. hausse d'abonnement          (Hadès)
 *   2. échéance de résiliation      (Thémis)
 *   3. variation de prix inhabituelle (Argos)
 */
import { SYNTHETIC_MARKER } from './index.js';
const fact = (f) => ({
  ...f,
  _source: SYNTHETIC_MARKER,
});
/** Marchand fictif, sans ressemblance avec une entreprise réelle. */
const MERCHANT = 'fournisseur-fictif-a';
export const SUBSCRIPTION_INCREASE = {
  id: 'demo-hausse-abonnement',
  title: 'Votre abonnement a augmenté de 4 € par mois',
  what_the_user_should_understand:
    'Le prix a changé, de combien, depuis quand, et ce qu’il peut faire — sans avoir à comparer lui-même ses factures.',
  facts: [
    fact({
      fact_id: 'f-abo-1',
      subject: MERCHANT,
      attribute: 'subscription.monthly_amount',
      amount_minor: 2990,
      currency: 'EUR',
      observed_at: '2026-06-05T00:00:00Z',
      confidence: 'CONFIRMED',
      evidence_ref: 'ev-facture-juin',
    }),
    fact({
      fact_id: 'f-abo-2',
      subject: MERCHANT,
      attribute: 'subscription.monthly_amount',
      amount_minor: 2990,
      currency: 'EUR',
      observed_at: '2026-07-05T00:00:00Z',
      confidence: 'CONFIRMED',
      evidence_ref: 'ev-facture-juillet',
    }),
    fact({
      fact_id: 'f-abo-3',
      subject: MERCHANT,
      attribute: 'subscription.monthly_amount',
      amount_minor: 3390,
      currency: 'EUR',
      observed_at: '2026-08-05T00:00:00Z',
      confidence: 'CONFIRMED',
      evidence_ref: 'ev-facture-aout',
    }),
  ],
  _source: SYNTHETIC_MARKER,
};
export const TERMINATION_DEADLINE = {
  id: 'demo-echeance-resiliation',
  title: 'Il vous reste 12 jours pour résilier sans reconduction',
  what_the_user_should_understand:
    'Une fenêtre se referme, à quelle date exactement, et sur quel document repose cette date.',
  facts: [
    fact({
      fact_id: 'f-ech-1',
      subject: 'contrat-fictif-b',
      attribute: 'contract.termination_window_end',
      observed_at: '2026-08-20T00:00:00Z',
      valid_until: '2026-09-20T00:00:00Z',
      confidence: 'HIGH_CONFIDENCE',
      evidence_ref: 'ev-contrat-b',
    }),
  ],
  _source: SYNTHETIC_MARKER,
};
export const PRICE_VARIATION = {
  id: 'demo-variation-prix',
  title: 'Un prix a varié davantage que d’habitude',
  what_the_user_should_understand:
    'Ce qui a changé, par rapport à quoi, et pourquoi Olappus le juge inhabituel — pas seulement qu’il a changé.',
  facts: [
    fact({
      fact_id: 'f-prix-1',
      subject: 'produit-fictif-c',
      attribute: 'product.unit_price',
      amount_minor: 1250,
      currency: 'EUR',
      observed_at: '2026-07-01T00:00:00Z',
      confidence: 'CONFIRMED',
      evidence_ref: 'ev-ticket-juillet',
    }),
    fact({
      fact_id: 'f-prix-2',
      subject: 'produit-fictif-c',
      attribute: 'product.unit_price',
      amount_minor: 1890,
      currency: 'EUR',
      observed_at: '2026-08-28T00:00:00Z',
      confidence: 'PROBABLE',
      evidence_ref: 'ev-ticket-aout',
    }),
  ],
  _source: SYNTHETIC_MARKER,
};
/**
 * Quatrième scénario, délibérément silencieux.
 *
 * `PRD-01` : « Si rien d'important n'est détecté, Olappus reste silencieux. »
 * Le silence est un comportement produit, il doit donc être démontrable —
 * et testé, sans quoi la tentation d'afficher quelque chose l'emportera.
 */
export const NOTHING_TO_REPORT = {
  id: 'demo-rien-a-signaler',
  title: 'Rien à signaler',
  what_the_user_should_understand:
    'Qu’Olappus a bien regardé, et qu’il n’a rien trouvé qui mérite son attention.',
  facts: [
    fact({
      fact_id: 'f-calme-1',
      subject: MERCHANT,
      attribute: 'subscription.monthly_amount',
      amount_minor: 2990,
      currency: 'EUR',
      observed_at: '2026-08-05T00:00:00Z',
      confidence: 'CONFIRMED',
      evidence_ref: 'ev-facture-aout-stable',
    }),
  ],
  _source: SYNTHETIC_MARKER,
};
export const DEMO_SCENARIOS = [
  SUBSCRIPTION_INCREASE,
  TERMINATION_DEADLINE,
  PRICE_VARIATION,
  NOTHING_TO_REPORT,
];
//# sourceMappingURL=scenarios.js.map

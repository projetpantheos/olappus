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
export type Confidence =
  'CONFIRMED' | 'HIGH_CONFIDENCE' | 'PROBABLE' | 'UNCERTAIN' | 'INSUFFICIENT_DATA';
/** Fait normalisé, tel qu'il sortirait du pipeline de normalisation. */
export interface SyntheticFact {
  readonly fact_id: string;
  readonly subject: string;
  readonly attribute: string;
  readonly amount_minor?: number;
  readonly currency?: string;
  readonly observed_at: string;
  readonly valid_until?: string;
  readonly confidence: Confidence;
  readonly evidence_ref: string;
  readonly _source: typeof SYNTHETIC_MARKER;
}
export interface DemoScenario {
  readonly id: string;
  readonly title: string;
  /** Ce que l'utilisateur doit comprendre. Sert de critère de jugement en G4. */
  readonly what_the_user_should_understand: string;
  readonly facts: readonly SyntheticFact[];
  readonly _source: typeof SYNTHETIC_MARKER;
}
export declare const SUBSCRIPTION_INCREASE: DemoScenario;
export declare const TERMINATION_DEADLINE: DemoScenario;
export declare const PRICE_VARIATION: DemoScenario;
/**
 * Quatrième scénario, délibérément silencieux.
 *
 * `PRD-01` : « Si rien d'important n'est détecté, Olappus reste silencieux. »
 * Le silence est un comportement produit, il doit donc être démontrable —
 * et testé, sans quoi la tentation d'afficher quelque chose l'emportera.
 */
export declare const NOTHING_TO_REPORT: DemoScenario;
export declare const DEMO_SCENARIOS: readonly DemoScenario[];
//# sourceMappingURL=scenarios.d.ts.map

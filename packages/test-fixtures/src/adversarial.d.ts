/**
 * Fixtures adverses — `RUN-25_SYNTHETIC_DATA_STRATEGY`.
 *
 * Les quatorze cas que la stratégie de données synthétiques exige. Ils ne
 * décrivent pas des bugs hypothétiques : chacun correspond à une manière connue
 * de faire dire au produit quelque chose de faux, ou de lui faire agir contre
 * l'utilisateur.
 *
 * Règle absolue de `RUN-25` : **ne jamais inventer de secret tiers réaliste**,
 * d'identifiant de paiement ni de justificatif pouvant être confondu avec un
 * accès réel. Toutes les valeurs ci-dessous sont manifestement fictives, et les
 * domaines utilisent `.invalid`, réservé par convention à cet usage.
 */
import { SYNTHETIC_MARKER } from './index.js';
export type AdversarialCategory =
  | 'OCR_MALFORME'
  | 'DATE_AMBIGUE'
  | 'DEVISE'
  | 'MARCHAND_DUPLIQUE'
  | 'PRODUIT_DUPLIQUE'
  | 'SOURCES_CONTRADICTOIRES'
  | 'REGLE_EXPIREE'
  | 'JURIDICTION_INCOHERENTE'
  | 'EXTRACTION_PEU_FIABLE'
  | 'INJECTION_DE_PROMPT'
  | 'CONTRIBUTION_EMPOISONNEE'
  | 'TENTATIVE_DE_COLLUSION'
  | 'DONNEE_A_FILTRER_AVANT_IA'
  | 'RESURRECTION_APRES_SUPPRESSION';
export interface AdversarialCase {
  readonly category: AdversarialCategory;
  /** Ce que le cas tente d'obtenir du produit. */
  readonly attack: string;
  /** Le comportement attendu, formulé comme une exigence testable. */
  readonly expected: string;
  /** La charge, telle qu'elle se présenterait. */
  readonly payload: unknown;
  readonly _source: typeof SYNTHETIC_MARKER;
}
export declare const ADVERSARIAL_CASES: readonly AdversarialCase[];
/** Les quatorze catégories exigées par RUN-25, dans l'ordre du document. */
export declare const REQUIRED_CATEGORIES: readonly AdversarialCategory[];
export declare function casesFor(category: AdversarialCategory): AdversarialCase[];
//# sourceMappingURL=adversarial.d.ts.map

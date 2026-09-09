/**
 * État de la couche de connaissance, tel qu'affiché à l'utilisateur.
 *
 * `PRD-14` Journey J : source → fait → preuve → confiance → statut →
 * contradiction éventuelle → résolution.
 *
 * En G5, la chaîne s'arrête à la première étape, et c'est le comportement
 * attendu : aucune source n'est approuvée, donc aucune connaissance juridique
 * n'existe, donc Thémis ne peut produire aucune affirmation. L'écran le **dit**
 * au lieu de se taire — un produit qui protège doit expliquer ce qu'il ne sait
 * pas encore.
 *
 * Ces valeurs reflètent `governance/source_registry.yaml`. Un test vérifie
 * qu'elles n'en divergent pas : deux vérités sur le même sujet en produisent
 * toujours une fausse.
 */

export interface KnowledgeSourceState {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  /** Ce qui manque, en langage compréhensible. Jamais un code d'erreur. */
  readonly blocking: readonly string[];
}

export const KNOWLEDGE_SOURCES: readonly KnowledgeSourceState[] = [
  {
    id: 'legifrance',
    name: 'Légifrance',
    status: 'REVIEW_REQUIRED',
    blocking: [
      'Licence non vérifiée à la source primaire.',
      'Conditions d’usage et limites non lues.',
      'Aucun accès créé.',
    ],
  },
  {
    id: 'rappelconso',
    name: 'RappelConso',
    status: 'REVIEW_REQUIRED',
    blocking: [
      'Licence non vérifiée à la source primaire.',
      'Hors du périmètre actuel : aucune fonctionnalité ne l’utilise.',
    ],
  },
];

/** Statuts ouvrant l'ingestion. Miroir de `ingestible_statuses` du registre. */
export const INGESTIBLE_STATUSES: readonly string[] = ['APPROVED', 'APPROVED_WITH_CONDITIONS'];

export function isIngestible(source: KnowledgeSourceState): boolean {
  return INGESTIBLE_STATUSES.includes(source.status);
}

/**
 * Ce qu'Olappus peut affirmer aujourd'hui en matière juridique.
 *
 * `ADR-0003` et `ADR-0007` : hors périmètre, règle expirée ou source non
 * vérifiée ⇒ `INSUFFICIENT_DATA`. Jamais une approximation.
 */
export function legalKnowledgeAvailable(): boolean {
  return KNOWLEDGE_SOURCES.some(isIngestible);
}

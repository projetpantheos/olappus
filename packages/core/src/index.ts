/**
 * @olappus/core
 *
 * Le Core possède l'état métier de référence, l'autorisation, les contrats,
 * la gouvernance d'accès, les événements et les invariants.
 *
 * Périmètre par gate :
 * - G1 (ici) : le paquet existe, il est typé strictement et testé. Rien de plus.
 * - G3        : enveloppes Command/Event (ADR-0006), Case/Action/Outcome,
 *               validation runtime, audit, résolution des capacités (ARC-41).
 *
 * Règle : aucun module ne dépend directement d'un autre module.
 * Un module passe toujours par les contrats du Core.
 */

/** Version des contrats exposés par le Core. Incrémentée par ADR. */
export const CORE_CONTRACT_VERSION = 1 as const;

/**
 * Schémas de la base, fixés par ADR-0005.
 * Exposés ici pour que toute migration et toute politique d'accès
 * s'y réfèrent au lieu de réinventer une convention.
 */
export const DB_SCHEMAS = [
  'identity',
  'core',
  'source',
  'extraction',
  'domain',
  'knowledge',
  'audit',
] as const;

export type DbSchema = (typeof DB_SCHEMAS)[number];

// =============================================================================
// API publique du Core
// =============================================================================
// Ce qui est exporté ici est un contrat : les modules et l'application s'y
// lient. Ce qui n'y figure pas reste interne et peut changer librement.
// Les validateurs de gouvernance (registre, manifestes) ne sont pas exposés :
// ils servent la CI, pas le produit.

export * from './contracts';
export * from './normalization';
export * from './rules';
export * from './capability';
export * from './logging';
export * from './oauth';

// './crypto' n'est PAS réexporté ici, délibérément. Il dépend de `node:crypto`
// et se retrouverait dans le bundle client, qui ne peut pas l’exécuter — du
// code de chiffrement inerte est pire que pas de code de chiffrement : il
// invite à l’appeler et à échouer en silence. Il s’importe explicitement par
// '@olappus/core/crypto', côté serveur et outillage.
//
// L’implémentation client (WebCrypto / expo-crypto) reste à écrire : c’est
// elle qui rendra ADR-0008 vrai en pratique, puisque la DEK ne doit jamais
// atteindre le serveur. Livrable de G6.

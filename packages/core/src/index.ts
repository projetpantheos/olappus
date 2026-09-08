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

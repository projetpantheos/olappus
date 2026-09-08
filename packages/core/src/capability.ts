/**
 * Moteur de résolution des capacités — ARC-41.
 *
 * Une seule fonction pure décide de l'état affiché pour une capacité, à partir
 * d'un contexte explicite. Sans elle, chaque écran réinvente la règle et les
 * réponses divergent.
 *
 * **Ce moteur n'autorise rien.** Il calcule ce que l'interface doit montrer.
 * L'autorisation réelle est faite par le Core à l'exécution de la Command et
 * par RLS en base — un moteur de capacités qui servirait de contrôle d'accès
 * serait un contrôle côté client, c'est-à-dire aucun contrôle.
 */

import { PERMISSION_LEVELS } from './contracts';

export const CAPABILITY_STATES = ['AVAILABLE', 'PARTIAL', 'BLOCKED', 'UNKNOWN'] as const;
export type CapabilityState = (typeof CAPABILITY_STATES)[number];

/** Codes de raison stables : affichables, traduisibles, testables. */
export const CAPABILITY_REASONS = [
  'OK',
  'UNKNOWN_INPUT',
  'SAFE_MODE',
  'FEATURE_DISABLED',
  'PERMISSION_MISSING',
  'PERMISSION_INSUFFICIENT',
  'PERMISSION_EXPIRED',
  'CONNECTOR_DISCONNECTED',
  'CONNECTOR_ERROR',
  'OFFLINE',
  'DEGRADED',
] as const;
export type CapabilityReason = (typeof CAPABILITY_REASONS)[number];

export type NetworkState = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';
export type ConnectorState = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNKNOWN';
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

/** Rang des niveaux de permission : un niveau supérieur couvre les inférieurs. */
const LEVEL_RANK: Record<PermissionLevel, number> = {
  READ: 0,
  SUGGEST: 1,
  PREPARE: 2,
  EXECUTE_WITH_CONFIRMATION: 3,
  AUTO_EXECUTE: 4,
};

export interface CapabilityRequirements {
  /** Niveau de permission minimal exigé. */
  readonly permission_level: PermissionLevel;
  /** La capacité exige-t-elle le réseau ? */
  readonly requires_network: boolean;
  /** La capacité exige-t-elle un connecteur actif ? */
  readonly requires_connector: boolean;
  /**
   * La capacité reste-t-elle partiellement utile sans réseau ni connecteur ?
   * Exemple : consulter des Cases déjà normalisés.
   */
  readonly degrades_gracefully: boolean;
}

export interface CapabilityContext {
  readonly safe_mode: { readonly active: boolean; readonly blocks_execution: boolean };
  readonly feature_enabled: boolean | 'UNKNOWN';
  readonly permission: {
    readonly level: PermissionLevel;
    readonly expired: boolean;
    readonly revoked: boolean;
  } | null;
  readonly connector: ConnectorState;
  readonly network: NetworkState;
}

export interface CapabilityResolution {
  readonly state: CapabilityState;
  readonly reason: CapabilityReason;
}

const resolution = (state: CapabilityState, reason: CapabilityReason): CapabilityResolution => ({
  state,
  reason,
});

/**
 * Résout l'état d'une capacité.
 *
 * L'ordre des règles est la partie importante : il va du plus structurel au
 * plus conjoncturel, et une cause de sécurité prime toujours sur une cause de
 * disponibilité. Autrement, l'utilisateur corrigerait le mauvais problème —
 * il se reconnecterait alors que sa permission est révoquée.
 */
export function resolveCapability(
  requirements: CapabilityRequirements,
  context: CapabilityContext,
): CapabilityResolution {
  // 1. Ignorance réelle. Annoncer AVAILABLE puis échouer, ou BLOCKED à tort,
  //    sont deux mensonges. UNKNOWN n'est pas une valeur de repli commode.
  if (context.feature_enabled === 'UNKNOWN') {
    return resolution('UNKNOWN', 'UNKNOWN_INPUT');
  }
  if (requirements.requires_connector && context.connector === 'UNKNOWN') {
    return resolution('UNKNOWN', 'UNKNOWN_INPUT');
  }
  if (requirements.requires_network && context.network === 'UNKNOWN') {
    return resolution('UNKNOWN', 'UNKNOWN_INPUT');
  }

  // 2. Safe Mode : décision de sécurité globale, elle prime sur tout.
  const needsExecution =
    LEVEL_RANK[requirements.permission_level] >= LEVEL_RANK.EXECUTE_WITH_CONFIRMATION;
  if (context.safe_mode.active && context.safe_mode.blocks_execution && needsExecution) {
    return resolution('BLOCKED', 'SAFE_MODE');
  }

  // 3. La capacité n'existe pas dans cette version.
  if (!context.feature_enabled) {
    return resolution('BLOCKED', 'FEATURE_DISABLED');
  }

  // 4. Permission — avant toute cause de disponibilité.
  if (context.permission === null) {
    return resolution('BLOCKED', 'PERMISSION_MISSING');
  }
  if (context.permission.revoked) {
    return resolution('BLOCKED', 'PERMISSION_MISSING');
  }
  if (context.permission.expired) {
    return resolution('BLOCKED', 'PERMISSION_EXPIRED');
  }
  if (LEVEL_RANK[context.permission.level] < LEVEL_RANK[requirements.permission_level]) {
    return resolution('BLOCKED', 'PERMISSION_INSUFFICIENT');
  }

  // 5. Entitlement — hors P0 (OPEN-05). L'emplacement de lecture est ici.

  // 6. Connecteur.
  if (requirements.requires_connector) {
    if (context.connector === 'DISCONNECTED') {
      return requirements.degrades_gracefully
        ? resolution('PARTIAL', 'CONNECTOR_DISCONNECTED')
        : resolution('BLOCKED', 'CONNECTOR_DISCONNECTED');
    }
    if (context.connector === 'ERROR') {
      return requirements.degrades_gracefully
        ? resolution('PARTIAL', 'CONNECTOR_ERROR')
        : resolution('BLOCKED', 'CONNECTOR_ERROR');
    }
  }

  // 7. Réseau. PRD-14 Journey F : ne jamais présenter comme exécutable une
  //    action qui ne l'est pas hors ligne.
  if (requirements.requires_network) {
    if (context.network === 'OFFLINE') {
      return requirements.degrades_gracefully
        ? resolution('PARTIAL', 'OFFLINE')
        : resolution('BLOCKED', 'OFFLINE');
    }
    if (context.network === 'DEGRADED') {
      return resolution('PARTIAL', 'DEGRADED');
    }
  }

  return resolution('AVAILABLE', 'OK');
}

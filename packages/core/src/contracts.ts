/**
 * Contrats Commands / Queries / Events — ARC-17, enveloppe figée par ADR-0006.
 *
 * `ARC-17` exige que les contrats existent **à la fois** comme types TypeScript
 * et comme schémas de validation runtime : un type n'existe qu'à la compilation,
 * et une charge venue du réseau, d'un connecteur ou d'un outbox hors ligne n'est
 * pas typée. Ce module porte les deux, dérivés d'une seule source.
 *
 * Trois règles gouvernent tout ce fichier :
 * 1. Les Events sont **immuables** : une correction crée un nouvel Event.
 * 2. Toute Command à effet de bord est **idempotente par `command_id`** (ARC-42).
 * 3. Un contrat ne se modifie pas : on ajoute une v2 et on retire la v1 après
 *    migration (`ADD → MIGRATE → VERIFY → SWITCH → REMOVE`).
 */

import { z } from 'zod';

// Tous les objets de ce module sont stricts : une propriete inattendue est
// rejetee, jamais silencieusement ignoree. Un schema permissif laisserait une
// charge hostile glisser un champ dans le domaine.

// =============================================================================
// Primitives
// =============================================================================

/** Identifiant opaque. `DAT-08` interdit tout identifiant porteur de sens. */
const opaqueId = z.uuid();

/** Horodatage ISO-8601 avec fuseau explicite (DAT-10). */
const timestamp = z.iso.datetime({ offset: true });

const schemaVersion = z.number().int().positive();

export const CONFIDENCE_LEVELS = [
  'CONFIRMED',
  'HIGH_CONFIDENCE',
  'PROBABLE',
  'UNCERTAIN',
  'INSUFFICIENT_DATA',
] as const;

export const CASE_STATUSES = [
  'DETECTED',
  'TRIAGED',
  'EVIDENCE_READY',
  'ACTION_PROPOSED',
  'WAITING_CONFIRMATION',
  'EXECUTING',
  'WAITING_EXTERNAL',
  'RESOLVED',
  'DISMISSED',
  'EXPIRED',
] as const;

export const PERMISSION_LEVELS = [
  'READ',
  'SUGGEST',
  'PREPARE',
  'EXECUTE_WITH_CONFIRMATION',
  'AUTO_EXECUTE',
] as const;

// =============================================================================
// Enveloppes — ADR-0006
// =============================================================================

export const commandEnvelope = z.strictObject({
  command_id: opaqueId,
  actor_id: opaqueId,
  device_id: opaqueId,
  correlation_id: opaqueId,
  created_at: timestamp,
  schema_version: schemaVersion,
});

export const eventEnvelope = z.strictObject({
  event_id: opaqueId,
  aggregate_id: opaqueId,
  event_type: z.string().min(1),
  occurred_at: timestamp,
  schema_version: schemaVersion,
  causation_id: opaqueId,
  correlation_id: opaqueId,
  actor_id: opaqueId,
});

export type CommandEnvelope = z.infer<typeof commandEnvelope>;
export type EventEnvelope = z.infer<typeof eventEnvelope>;

// =============================================================================
// Commands — ARC-17
// =============================================================================

/**
 * Une Command à effet de bord est marquée `side_effecting`. Le marquage n'est
 * pas décoratif : `ARC-42` impose que ces commandes soient enregistrées avant
 * exécution, et rejouées sans double effet.
 */
export interface CommandDefinition<S extends z.ZodType> {
  readonly name: string;
  readonly version: number;
  readonly side_effecting: boolean;
  readonly payload: S;
}

const define = <S extends z.ZodType>(
  name: string,
  version: number,
  side_effecting: boolean,
  payload: S,
): CommandDefinition<S> => ({ name, version, side_effecting, payload });

export const COMMANDS = {
  CreateCaseCommandV1: define(
    'CreateCaseCommandV1',
    1,
    true,
    z.strictObject({
      module_id: z.string().min(1),
      type: z.string().min(1),
      confidence: z.enum(CONFIDENCE_LEVELS),
    }),
  ),

  PrepareActionCommandV1: define(
    'PrepareActionCommandV1',
    1,
    true,
    z.strictObject({
      case_id: opaqueId,
      action_type: z.string().min(1),
      // La portée d'une action externe ne provient jamais de contenu non fiable
      // (invariant untrusted_content_cannot_parameterize_external_actions).
      // `recipient_ref` est une référence au référentiel canonique, jamais une
      // adresse libre extraite d'un document.
      recipient_ref: opaqueId.nullable(),
      scope: z.record(z.string(), z.unknown()),
    }),
  ),

  ConfirmActionCommandV1: define(
    'ConfirmActionCommandV1',
    1,
    true,
    z.strictObject({ action_id: opaqueId, confirmed: z.literal(true) }),
  ),

  DismissCaseCommandV1: define(
    'DismissCaseCommandV1',
    1,
    true,
    z.strictObject({ case_id: opaqueId }),
  ),

  SnoozeCaseCommandV1: define(
    'SnoozeCaseCommandV1',
    1,
    true,
    z.strictObject({ case_id: opaqueId, until: timestamp }),
  ),

  ResolveCaseCommandV1: define(
    'ResolveCaseCommandV1',
    1,
    true,
    z.strictObject({ case_id: opaqueId, outcome: z.string().min(1) }),
  ),

  UpdatePermissionCommandV1: define(
    'UpdatePermissionCommandV1',
    1,
    true,
    z.strictObject({
      permission_id: opaqueId,
      level: z.enum(PERMISSION_LEVELS),
      expires_at: timestamp.nullable(),
    }),
  ),

  DisconnectConnectorCommandV1: define(
    'DisconnectConnectorCommandV1',
    1,
    true,
    z.strictObject({
      connector_id: z.string().min(1),
      // DISCONNECT ≠ DELETE (SEC-33) : le choix est explicite, jamais déduit.
      delete_derived_data: z.boolean(),
    }),
  ),

  DeleteDataCommandV1: define(
    'DeleteDataCommandV1',
    1,
    true,
    z.strictObject({
      scope: z.enum(['ACCOUNT', 'CONNECTOR', 'CATEGORY']),
      target: z.string().min(1),
    }),
  ),
} as const;

export type CommandName = keyof typeof COMMANDS;

// =============================================================================
// Events — ARC-17
// =============================================================================

export const EVENTS = {
  'CaseCreated.v1': z.strictObject({
    case_id: opaqueId,
    module_id: z.string().min(1),
    type: z.string().min(1),
    status: z.enum(CASE_STATUSES),
    confidence: z.enum(CONFIDENCE_LEVELS),
  }),

  'ActionPrepared.v1': z.strictObject({
    action_id: opaqueId,
    case_id: opaqueId,
    action_type: z.string().min(1),
    risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  }),

  'SubscriptionDetected.v1': z.strictObject({
    subscription_id: opaqueId,
    merchant_id: opaqueId,
    confidence: z.enum(CONFIDENCE_LEVELS),
  }),
} as const;

export type EventType = keyof typeof EVENTS;

// =============================================================================
// Validation
// =============================================================================

export type ContractResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly string[] };

const fail = (error: z.ZodError): ContractResult<never> => ({
  ok: false,
  issues: error.issues.map((i) => `${i.path.join('.') || '(racine)'} : ${i.message}`),
});

/**
 * Valide une Command complète : enveloppe **et** charge utile.
 *
 * `strict()` rejette tout champ inattendu. C'est délibéré : une charge venue
 * d'un client obsolète ou d'un contenu non fiable ne doit pas pouvoir glisser
 * de propriété supplémentaire dans le domaine.
 */
export function parseCommand<N extends CommandName>(
  name: N,
  input: unknown,
): ContractResult<CommandEnvelope & { payload: z.infer<(typeof COMMANDS)[N]['payload']> }> {
  const definition = COMMANDS[name];
  const schema = commandEnvelope.extend({ payload: definition.payload }).strict();

  const result = schema.safeParse(input);
  if (!result.success) return fail(result.error);

  if (result.data.schema_version !== definition.version) {
    return {
      ok: false,
      issues: [
        `schema_version : ${String(result.data.schema_version)} reçu, ${String(definition.version)} attendu pour ${name}.`,
      ],
    };
  }

  return {
    ok: true,
    value: result.data as CommandEnvelope & {
      payload: z.infer<(typeof COMMANDS)[N]['payload']>;
    },
  };
}

/** Valide un Event complet. Mêmes règles que pour les Commands. */
export function parseEvent<T extends EventType>(
  type: T,
  input: unknown,
): ContractResult<EventEnvelope & { payload: z.infer<(typeof EVENTS)[T]> }> {
  const schema = eventEnvelope.extend({ payload: EVENTS[type] }).strict();
  const result = schema.safeParse(input);
  if (!result.success) return fail(result.error);

  if (result.data.event_type !== type) {
    return {
      ok: false,
      issues: [`event_type : « ${result.data.event_type} » reçu, « ${type} » attendu.`],
    };
  }

  return {
    ok: true,
    value: result.data as EventEnvelope & { payload: z.infer<(typeof EVENTS)[T]> },
  };
}

/** Une Command à effet de bord doit être enregistrée avant exécution (ARC-42). */
export function isSideEffecting(name: CommandName): boolean {
  return COMMANDS[name].side_effecting;
}

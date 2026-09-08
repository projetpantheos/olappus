/**
 * Validation du Data Registry (`governance/data_registry.yaml`).
 *
 * Le registre est une source de gouvernance, pas une documentation : s'il est
 * incohérent, les politiques d'accès, la rétention, l'export, la suppression et
 * les contrôles IA qui en dérivent le seront aussi. Ces règles échouent donc
 * en CI.
 *
 * Chaque champ doit porter les onze attributs exigés par RUN-30 :
 * owner (porté par l'entité), classification, purpose, source, normalized_form,
 * retention, export, delete, ai_policy, rls_scope, provenance.
 */

export const DB_SCHEMAS_ALLOWED = [
  'identity',
  'core',
  'source',
  'extraction',
  'domain',
  'knowledge',
  'audit',
] as const;

export const AI_POLICIES = [
  'AI_FORBIDDEN',
  'AI_MINIMIZED_ONLY',
  'AI_LOCAL_ONLY',
  'AI_ALLOWED',
] as const;

export const CLASSIFICATIONS = ['L0_RAW_QUARANTINE', 'L1', 'L2', 'L3', 'L4', 'PUBLIC'] as const;

/** Politique IA maximale tolérée par classification. Ordre du plus strict au plus permissif. */
const AI_STRICTNESS: Record<string, number> = {
  AI_FORBIDDEN: 0,
  AI_LOCAL_ONLY: 1,
  AI_MINIMIZED_ONLY: 2,
  AI_ALLOWED: 3,
};

const MAX_AI_BY_CLASSIFICATION: Record<string, string> = {
  L0_RAW_QUARANTINE: 'AI_FORBIDDEN',
  L1: 'AI_FORBIDDEN',
  L2: 'AI_ALLOWED',
  L3: 'AI_MINIMIZED_ONLY',
  L4: 'AI_FORBIDDEN',
  PUBLIC: 'AI_ALLOWED',
};

const REQUIRED_FIELD_KEYS = [
  'name',
  'classification',
  'purpose',
  'source',
  'normalized_form',
  'retention',
  'export',
  'delete',
  'ai_policy',
  'provenance',
  'rls_scope',
] as const;

export interface RegistryField {
  readonly name: string;
  readonly classification: string;
  readonly ai_policy: string;
  readonly retention: string;
  readonly export: boolean | string;
  readonly [key: string]: unknown;
}

export interface RegistryEntity {
  readonly id: string;
  readonly schema: string;
  readonly owner: string;
  readonly access: string;
  readonly status: string;
  readonly fields: readonly RegistryField[];
  readonly [key: string]: unknown;
}

export interface Registry {
  readonly version: number;
  readonly access_patterns: Record<string, unknown>;
  readonly retention_vocabulary: Record<string, unknown>;
  readonly entities: readonly RegistryEntity[];
  readonly unspecified_entities?: readonly { id: string; gate: string }[];
}

export interface RegistryIssue {
  readonly where: string;
  readonly rule: string;
  readonly message: string;
}

/**
 * Applique les règles de cohérence du registre.
 * Retourne la liste des violations ; vide = registre conforme.
 */
export function validateRegistry(registry: Registry): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const seenEntities = new Set<string>();

  for (const entity of registry.entities) {
    const where = entity.id;

    if (seenEntities.has(entity.id)) {
      issues.push({ where, rule: 'unique-entity', message: 'Entité déclarée deux fois.' });
    }
    seenEntities.add(entity.id);

    if (!(DB_SCHEMAS_ALLOWED as readonly string[]).includes(entity.schema)) {
      issues.push({
        where,
        rule: 'schema-allowed',
        message: `Schéma « ${entity.schema} » hors des schémas fixés par ADR-0005.`,
      });
    }

    if (!Object.prototype.hasOwnProperty.call(registry.access_patterns, entity.access)) {
      issues.push({
        where,
        rule: 'access-pattern-declared',
        message: `Mode d'accès « ${entity.access} » non déclaré dans access_patterns.`,
      });
    }

    const seenFields = new Set<string>();

    for (const field of entity.fields) {
      const fieldWhere = `${entity.id}.${field.name}`;

      for (const key of REQUIRED_FIELD_KEYS) {
        if (field[key] === undefined || field[key] === null || field[key] === '') {
          issues.push({
            where: fieldWhere,
            rule: 'required-attributes',
            message: `Attribut « ${key} » manquant (RUN-30 en exige onze).`,
          });
        }
      }

      if (seenFields.has(field.name)) {
        issues.push({
          where: fieldWhere,
          rule: 'unique-field',
          message: 'Champ déclaré deux fois.',
        });
      }
      seenFields.add(field.name);

      if (!(CLASSIFICATIONS as readonly string[]).includes(field.classification)) {
        issues.push({
          where: fieldWhere,
          rule: 'classification-vocabulary',
          message: `Classification « ${field.classification} » hors vocabulaire.`,
        });
        continue;
      }

      if (!(AI_POLICIES as readonly string[]).includes(field.ai_policy)) {
        issues.push({
          where: fieldWhere,
          rule: 'ai-policy-vocabulary',
          message: `Politique IA « ${field.ai_policy} » hors vocabulaire.`,
        });
        continue;
      }

      // Invariant : la politique IA d'un champ ne peut pas être plus permissive
      // que ce que sa classification autorise (MINIMIZE BEFORE AI).
      const max = MAX_AI_BY_CLASSIFICATION[field.classification];
      const maxLevel = max === undefined ? 0 : (AI_STRICTNESS[max] ?? 0);
      const level = AI_STRICTNESS[field.ai_policy] ?? 0;
      if (level > maxLevel) {
        issues.push({
          where: fieldWhere,
          rule: 'ai-policy-vs-classification',
          message: `${field.ai_policy} est plus permissif que ${max} autorisé pour ${field.classification}.`,
        });
      }

      // Invariant : un secret ne sort jamais dans un export utilisateur (DAT-11).
      if (field.classification === 'L4' && field.export !== false) {
        issues.push({
          where: fieldWhere,
          rule: 'no-secret-export',
          message: 'Un champ L4 ne peut pas être exporté (DAT-11).',
        });
      }

      // La rétention doit appartenir au vocabulaire déclaré.
      if (!Object.prototype.hasOwnProperty.call(registry.retention_vocabulary, field.retention)) {
        issues.push({
          where: fieldWhere,
          rule: 'retention-vocabulary',
          message: `Rétention « ${field.retention} » hors vocabulaire déclaré.`,
        });
      }
    }
  }

  return issues;
}

/**
 * Champs dont la rétention reste à chiffrer.
 * Bloquant pour la sortie de G2 : « court » n'est pas une durée testable.
 */
export function openRetentions(registry: Registry): string[] {
  const open: string[] = [];
  for (const entity of registry.entities) {
    for (const field of entity.fields) {
      if (field.retention === 'OPEN') open.push(`${entity.id}.${field.name}`);
    }
  }
  return open;
}

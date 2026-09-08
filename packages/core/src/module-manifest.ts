/**
 * Manifeste de module — ARC-19.
 *
 * Un module ne se branche pas au Core par convention : il déclare ce qu'il
 * consomme, ce qu'il produit, ce qu'il touche et ce qu'il risque. Le manifeste
 * est ce contrat, et il est validé, pas relu.
 *
 * `ARC-19` fixe la forme. Ce module y ajoute les règles de cohérence que le
 * schéma JSON ne peut pas exprimer — celles qui font la différence entre un
 * document bien formé et un module réellement sûr.
 */

import { z } from 'zod';

export const MODULE_STATUSES = [
  'INTERNAL',
  'ALPHA',
  'BETA',
  'ACTIVE',
  'SUSPENDED',
  'RETIRED',
] as const;

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const AI_POLICIES = [
  'AI_ALLOWED',
  'AI_MINIMIZED_ONLY',
  'AI_LOCAL_ONLY',
  'AI_FORBIDDEN',
] as const;

/** Forme imposée par `ARC-19_MODULE_MANIFEST_SCHEMA.json`. */
export const moduleManifestSchema = z.strictObject({
  id: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'version sémantique attendue'),
  status: z.enum(MODULE_STATUSES),
  risk_level: z.enum(RISK_LEVELS),
  permissions: z.array(z.string().min(1)),
  commands: z.array(z.string().min(1)),
  queries: z.array(z.string().min(1)),
  events: z.strictObject({
    consumed: z.array(z.string()),
    produced: z.array(z.string()),
  }),
  data_access: z.array(z.string()),
  knowledge_dependencies: z.array(z.string()).default([]),
  rule_dependencies: z.array(z.string()).default([]),
  ai_policy: z.enum(AI_POLICIES),
  external_actions: z.array(z.string()).default([]),
  retention_policy: z.string().min(1),
});

export type ModuleManifest = z.infer<typeof moduleManifestSchema>;

export interface ManifestIssue {
  readonly rule: string;
  readonly message: string;
}

/**
 * Règles de cohérence au-delà de la forme.
 *
 * Chacune correspond à une manière connue de rendre un module dangereux tout
 * en restant conforme au schéma JSON.
 */
export function checkManifestConsistency(manifest: ModuleManifest): ManifestIssue[] {
  const issues: ManifestIssue[] = [];

  // Une action externe est le seul effet irréversible du produit. Un module qui
  // en déclare une ne peut pas se présenter comme à faible risque.
  if (manifest.external_actions.length > 0 && manifest.risk_level === 'LOW') {
    issues.push({
      rule: 'external-actions-imply-risk',
      message:
        'Un module déclarant des actions externes ne peut pas être de risque LOW : elles sont irréversibles.',
    });
  }

  // `ARC-03` : un module ne dépend jamais directement d'un autre module.
  // Consommer un Event passe par le Core, mais nommer un module dans ses accès
  // de données est une dépendance directe déguisée.
  for (const access of manifest.data_access) {
    if (access.startsWith('module:')) {
      issues.push({
        rule: 'no-direct-module-access',
        message: `Accès direct à un autre module interdit : « ${access} ». Passer par les contrats du Core.`,
      });
    }
  }

  // Un module qui ne touche aucune donnée n'a pas besoin d'une politique IA
  // permissive : la politique la plus large jamais utile est celle de la donnée
  // la plus sensible qu'il manipule. Faute de registre chargé ici, on refuse le
  // cas le plus visible : AI_ALLOWED sans aucun accès de données déclaré.
  if (manifest.ai_policy === 'AI_ALLOWED' && manifest.data_access.length === 0) {
    issues.push({
      rule: 'ai-policy-without-data',
      message:
        'AI_ALLOWED déclaré sans aucun accès de données : politique plus large que nécessaire.',
    });
  }

  // Un module actif sans permission déclarée ne peut rien faire de légitime,
  // ou bien il en fait sans le déclarer. Les deux sont des défauts.
  if (manifest.status === 'ACTIVE' && manifest.permissions.length === 0) {
    issues.push({
      rule: 'active-module-needs-permissions',
      message: 'Un module ACTIVE doit déclarer au moins une permission.',
    });
  }

  // Les Events produits sont versionnés : ils sont immuables (ADR-0006), donc
  // un consommateur doit pouvoir se lier à une version précise.
  for (const event of manifest.events.produced) {
    if (!/\.v\d+$/.test(event)) {
      issues.push({
        rule: 'produced-events-versioned',
        message: `Event produit non versionné : « ${event} ».`,
      });
    }
  }

  return issues;
}

export type ManifestResult =
  | { readonly ok: true; readonly manifest: ModuleManifest }
  | { readonly ok: false; readonly issues: readonly ManifestIssue[] };

/** Valide forme puis cohérence. Les deux doivent passer. */
export function validateModuleManifest(input: unknown): ManifestResult {
  const parsed = moduleManifestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({
        rule: 'schema',
        message: `${i.path.join('.') || '(racine)'} : ${i.message}`,
      })),
    };
  }

  const issues = checkManifestConsistency(parsed.data);
  if (issues.length > 0) return { ok: false, issues };

  return { ok: true, manifest: parsed.data };
}

import { describe, expect, it } from 'vitest';

import {
  checkManifestConsistency,
  validateModuleManifest,
  type ModuleManifest,
} from './module-manifest';

/** Manifeste conforme, inspiré de l'exemple Hermès d'ARC-20. */
const hermes: ModuleManifest = {
  id: 'hermes',
  version: '0.1.0',
  status: 'INTERNAL',
  risk_level: 'HIGH',
  permissions: ['email.read.minimal', 'document.extract', 'case.create'],
  commands: ['CreateCaseCommandV1'],
  queries: ['ListConnectorStatus'],
  events: { consumed: [], produced: ['CaseCreated.v1'] },
  data_access: ['source.raw_quarantine', 'extraction.record', 'domain.merchant'],
  knowledge_dependencies: [],
  rule_dependencies: [],
  ai_policy: 'AI_MINIMIZED_ONLY',
  external_actions: [],
  retention_policy: 'days_7',
};

describe('Manifeste — forme (ARC-19)', () => {
  it('accepte un manifeste conforme', () => {
    expect(validateModuleManifest(hermes).ok).toBe(true);
  });

  it('rejette un champ obligatoire manquant', () => {
    const { ai_policy: _ignored, ...incomplete } = hermes;
    const r = validateModuleManifest(incomplete);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.issues.some((i) => i.message.includes('ai_policy'))).toBe(true);
  });

  it('rejette un champ inattendu', () => {
    // Un manifeste est un contrat : ce qui n'y est pas déclaré n'existe pas.
    const r = validateModuleManifest({ ...hermes, bypass_core: true });
    expect(r.ok).toBe(false);
  });

  it('exige une version sémantique', () => {
    expect(validateModuleManifest({ ...hermes, version: 'v1' }).ok).toBe(false);
  });

  it('rejette une politique IA hors vocabulaire', () => {
    expect(validateModuleManifest({ ...hermes, ai_policy: 'AI_SOMETIMES' }).ok).toBe(false);
  });
});

describe('Manifeste — cohérence au-delà de la forme', () => {
  it('refuse un module à actions externes déclaré à faible risque', () => {
    // Conforme au schéma JSON, et pourtant dangereux : une action externe est
    // irréversible.
    const issues = checkManifestConsistency({
      ...hermes,
      risk_level: 'LOW',
      external_actions: ['send_claim_email'],
    });
    expect(issues.map((i) => i.rule)).toContain('external-actions-imply-risk');
  });

  it('refuse un accès direct à un autre module', () => {
    const issues = checkManifestConsistency({
      ...hermes,
      data_access: [...hermes.data_access, 'module:hades'],
    });
    expect(issues.map((i) => i.rule)).toContain('no-direct-module-access');
  });

  it('refuse une politique IA plus large que nécessaire', () => {
    const issues = checkManifestConsistency({
      ...hermes,
      ai_policy: 'AI_ALLOWED',
      data_access: [],
    });
    expect(issues.map((i) => i.rule)).toContain('ai-policy-without-data');
  });

  it('refuse un module actif sans permission', () => {
    const issues = checkManifestConsistency({ ...hermes, status: 'ACTIVE', permissions: [] });
    expect(issues.map((i) => i.rule)).toContain('active-module-needs-permissions');
  });

  it('exige que les Events produits soient versionnés', () => {
    // Les Events sont immuables : un consommateur doit pouvoir se lier à une
    // version précise.
    const issues = checkManifestConsistency({
      ...hermes,
      events: { consumed: [], produced: ['CaseCreated'] },
    });
    expect(issues.map((i) => i.rule)).toContain('produced-events-versioned');
  });

  it('ne signale rien sur un manifeste sain', () => {
    expect(checkManifestConsistency(hermes)).toEqual([]);
  });
});

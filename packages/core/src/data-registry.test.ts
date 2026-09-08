import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import { openRetentions, validateRegistry, type Registry } from './data-registry';

const REGISTRY_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'governance',
  'data_registry.yaml',
);

const registry = parse(readFileSync(REGISTRY_PATH, 'utf8')) as Registry;

describe('Data Registry — cohérence', () => {
  it('est conforme à toutes les règles de gouvernance', () => {
    const issues = validateRegistry(registry);
    expect(issues).toEqual([]);
  });

  it('ne déclare que des schémas fixés par ADR-0005', () => {
    const schemas = new Set(registry.entities.map((e) => e.schema));
    expect([...schemas].sort()).toEqual(
      ['audit', 'core', 'domain', 'extraction', 'identity', 'knowledge', 'source'].filter((s) =>
        schemas.has(s),
      ),
    );
  });
});

describe('Data Registry — invariants de confidentialité', () => {
  it('interdit toute exposition IA des données brutes en quarantaine', () => {
    for (const entity of registry.entities) {
      for (const field of entity.fields) {
        if (field.classification === 'L0_RAW_QUARANTINE') {
          expect(field.ai_policy, `${entity.id}.${field.name}`).toBe('AI_FORBIDDEN');
        }
      }
    }
  });

  it("n'expose aucun secret dans l'export utilisateur", () => {
    for (const entity of registry.entities) {
      for (const field of entity.fields) {
        if (field.classification === 'L4') {
          expect(field.export, `${entity.id}.${field.name}`).toBe(false);
        }
      }
    }
  });

  it("interdit le stockage durable d'une identité de tiers", () => {
    const control = registry.entities.find((e) => e.id === 'control.third_party_identity');
    expect(control, 'entrée de contrôle absente du registre').toBeDefined();
    const field = control?.fields.find((f) => f.name === 'third_party_identity');
    expect(field?.retention).toBe('not_retained');
    expect(field?.ai_policy).toBe('AI_FORBIDDEN');
    expect(field?.export).toBe(false);
  });

  it('conserve la provenance de tout fait dérivé durable', () => {
    for (const entity of registry.entities) {
      for (const field of entity.fields) {
        if (field['source'] === 'derived' && field.retention !== 'not_retained') {
          expect(field['provenance'], `${entity.id}.${field.name}`).toBe(true);
        }
      }
    }
  });
});

describe('Data Registry — dette déclarée', () => {
  it('ne laisse aucune rétention non chiffrée', () => {
    // Les neuf rétentions OPEN de la première version du registre ont été
    // chiffrées par ADR-0015. Ce test interdit désormais toute réapparition :
    // « court » ou « nécessaire » ne sont pas des durées testables.
    expect(openRetentions(registry)).toEqual([]);
  });

  it('déclare une gate pour chaque entité aux champs non spécifiés', () => {
    for (const entity of registry.unspecified_entities ?? []) {
      expect(entity.gate, entity.id).toMatch(/^(G\d|P1)$/);
    }
  });
});

describe('Data Registry — le validateur détecte réellement les violations', () => {
  it('rejette une politique IA plus permissive que la classification', () => {
    const broken: Registry = {
      ...registry,
      entities: [
        {
          id: 'core.test',
          schema: 'core',
          owner: 'Core',
          access: 'owner_only',
          status: 'SPECIFIED',
          fields: [
            {
              name: 'secret_leak',
              classification: 'L4',
              purpose: 'test',
              source: 'system',
              normalized_form: 'opaque_blob',
              retention: 'account_lifetime',
              export: false,
              delete: 'cascade',
              ai_policy: 'AI_ALLOWED',
              provenance: false,
              rls_scope: 'service_only',
            },
          ],
        },
      ],
    };
    const issues = validateRegistry(broken);
    expect(issues.map((i) => i.rule)).toContain('ai-policy-vs-classification');
  });

  it("rejette l'export d'un secret", () => {
    const broken: Registry = {
      ...registry,
      entities: [
        {
          id: 'core.test',
          schema: 'core',
          owner: 'Core',
          access: 'owner_only',
          status: 'SPECIFIED',
          fields: [
            {
              name: 'exported_secret',
              classification: 'L4',
              purpose: 'test',
              source: 'system',
              normalized_form: 'opaque_blob',
              retention: 'account_lifetime',
              export: true,
              delete: 'cascade',
              ai_policy: 'AI_FORBIDDEN',
              provenance: false,
              rls_scope: 'service_only',
            },
          ],
        },
      ],
    };
    const issues = validateRegistry(broken);
    expect(issues.map((i) => i.rule)).toContain('no-secret-export');
  });

  it('rejette un schéma hors ADR-0005', () => {
    const broken: Registry = {
      ...registry,
      entities: [
        {
          id: 'public.test',
          schema: 'public',
          owner: 'Core',
          access: 'owner_only',
          status: 'SPECIFIED',
          fields: [],
        },
      ],
    };
    const issues = validateRegistry(broken);
    expect(issues.map((i) => i.rule)).toContain('schema-allowed');
  });
});

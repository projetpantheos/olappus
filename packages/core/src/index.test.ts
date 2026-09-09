import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { CORE_CONTRACT_VERSION, DB_SCHEMAS } from './index';

describe('@olappus/core', () => {
  it('expose une version de contrat', () => {
    expect(CORE_CONTRACT_VERSION).toBe(1);
  });

  it('déclare exactement les schémas fixés par ADR-0005', () => {
    expect([...DB_SCHEMAS]).toEqual([
      'identity',
      'core',
      'source',
      'extraction',
      'domain',
      'knowledge',
      'audit',
    ]);
  });
});

describe('API publique — ce que le bundle client embarquera', () => {
  /**
   * Suit les réexports du barillet et rend leurs imports.
   * Volontairement simple : il ne s'agit pas de résoudre TypeScript, mais de
   * voir ce que Metro suivra depuis `@olappus/core`.
   */
  function importsOf(file: string, seen = new Set<string>()): string[] {
    if (seen.has(file)) return [];
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    const specifiers = [...source.matchAll(/from '([^']+)'/g)].map((m) => m[1] ?? '');
    const found: string[] = [];
    for (const specifier of specifiers) {
      if (specifier.startsWith('.')) {
        const resolved = join(dirname(file), `${specifier}.ts`);
        if (existsSync(resolved)) found.push(...importsOf(resolved, seen));
      } else {
        found.push(specifier);
      }
    }
    return found;
  }

  it('n’embarque aucun module réservé à Node', () => {
    // Un module Node dans le bundle client ne plante pas toujours : il se tait,
    // et le chiffrement échoue en silence. C'est le défaut trouvé le 2026-09-09
    // en construisant le bundle réel — les 280 tests étaient verts.
    const builtins = importsOf(join(dirname(fileURLToPath(import.meta.url)), 'index.ts')).filter(
      (specifier) => specifier.startsWith('node:'),
    );
    expect(builtins, 'l’application mobile consomme ce barillet').toEqual([]);
  });
});

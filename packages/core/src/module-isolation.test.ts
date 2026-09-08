/**
 * Lint d'architecture — invariant `no_direct_module_to_module_dependencies`.
 *
 * Aucun module n'existe encore : le lint passerait donc trivialement sur le
 * dépôt réel, sans rien prouver. Ces tests le confrontent à une arborescence
 * fabriquée contenant de vraies violations — un lint qui n'a jamais dit non
 * n'est pas un contrôle, c'est une décoration.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findViolations, listModules } from '../../../tooling/module-isolation.mjs';

let root = '';

/** Fabrique un module avec un fichier source. */
function makeModule(name: string, filename: string, content: string): void {
  const dir = join(root, 'packages', 'modules', name, 'src');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), content, 'utf8');
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'olappus-isolation-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('Lint d’isolation — ce qu’il accepte', () => {
  it('accepte un module qui ne dépend que du Core', () => {
    makeModule('hades', 'index.ts', `import { parseCommand } from '@olappus/core';\n`);
    makeModule('argos', 'index.ts', `import type { Money } from '@olappus/core';\n`);
    expect(findViolations(root)).toEqual([]);
  });

  it('accepte une arborescence sans aucun module', () => {
    expect(listModules(root)).toEqual([]);
    expect(findViolations(root)).toEqual([]);
  });

  it('n’est pas trompé par un nom de module apparaissant dans un commentaire', () => {
    makeModule(
      'hades',
      'index.ts',
      `// Ce module complete @olappus/argos via le Core.\nexport const x = 1;\n`,
    );
    makeModule('argos', 'index.ts', `export const y = 1;\n`);
    expect(findViolations(root)).toEqual([]);
  });
});

describe('Lint d’isolation — ce qu’il refuse', () => {
  it('détecte un import de paquet entre deux modules', () => {
    makeModule('hades', 'index.ts', `import { detect } from '@olappus/argos';\n`);
    makeModule('argos', 'index.ts', `export const detect = () => null;\n`);

    const violations = findViolations(root);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ from: 'hades', to: 'argos' });
  });

  it('détecte un import par chemin relatif contournant le paquet', () => {
    // La forme la plus tentante quand on est pressé, et la plus facile à
    // laisser passer en revue.
    makeModule('hades', 'index.ts', `import { detect } from '../../modules/argos/src/index.js';\n`);
    makeModule('argos', 'index.ts', `export const detect = () => null;\n`);

    const violations = findViolations(root);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ from: 'hades', to: 'argos' });
  });

  it('détecte un import dynamique et un require', () => {
    makeModule(
      'hades',
      'index.ts',
      `const a = await import('@olappus/argos');\nconst b = require('@olappus/themis');\n`,
    );
    makeModule('argos', 'index.ts', `export const detect = () => null;\n`);
    makeModule('themis', 'index.ts', `export const rule = () => null;\n`);

    const violations = findViolations(root);
    expect(violations.map((v) => v.to).sort()).toEqual(['argos', 'themis']);
  });

  it('signale le fichier et la ligne exacts', () => {
    makeModule(
      'hades',
      'index.ts',
      `export const a = 1;\nimport { detect } from '@olappus/argos';\n`,
    );
    makeModule('argos', 'index.ts', `export const detect = () => null;\n`);

    const violations = findViolations(root);
    expect(violations[0]?.line).toBe(2);
    expect(violations[0]?.file).toContain('modules/hades');
  });
});

#!/usr/bin/env node
/**
 * Lint d'architecture — invariant `no_direct_module_to_module_dependencies`.
 *
 * Contrôle `SEC-23` : « No direct module access → architecture lint ».
 * `ARC-03` : `module A → module B` est interdit, `module A → Core → module B`
 * est la seule voie.
 *
 * La détection est volontairement syntaxique et lisible : elle repère les
 * imports d'un paquet de module vers un autre. Elle ne remplace pas une revue,
 * elle rend le cas évident impossible à commettre sans le voir.
 *
 * Usage :
 *   node tooling/module-isolation.mjs            # vérifie le dépôt
 *   node tooling/module-isolation.mjs <racine>   # vérifie une arborescence donnée
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const MODULES_DIR = join('packages', 'modules');
const SOURCE_EXT = /\.(ts|tsx|mts|js|mjs)$/;

/** Repère `import ... from 'x'`, `import('x')` et `require('x')`. */
const IMPORT_PATTERNS = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function listFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else if (SOURCE_EXT.test(entry)) out.push(full);
  }
  return out;
}

/** Modules présents, déduits de l'arborescence. */
export function listModules(root = '.') {
  try {
    return readdirSync(join(root, MODULES_DIR)).filter((name) =>
      statSync(join(root, MODULES_DIR, name)).isDirectory(),
    );
  } catch {
    return [];
  }
}

/**
 * Retourne les violations trouvées. Liste vide = isolation respectée.
 * Exportée pour être testable : un lint qu'on ne teste pas ne prouve rien.
 */
export function findViolations(root = '.') {
  const modules = listModules(root);
  const violations = [];

  for (const owner of modules) {
    const ownerDir = join(root, MODULES_DIR, owner);
    for (const file of listFiles(ownerDir)) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        for (const pattern of IMPORT_PATTERNS) {
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(lines[i])) !== null) {
            const specifier = match[1];

            for (const other of modules) {
              if (other === owner) continue;
              const byPackage =
                specifier === `@olappus/${other}` || specifier.startsWith(`@olappus/${other}/`);
              const byPath =
                specifier.includes(`modules/${other}/`) || specifier.endsWith(`modules/${other}`);
              if (byPackage || byPath) {
                violations.push({
                  file: relative(root, file).split(sep).join('/'),
                  line: i + 1,
                  from: owner,
                  to: other,
                  specifier,
                });
              }
            }
          }
        }
      }
    }
  }

  return violations;
}

// --- Exécution en ligne de commande ------------------------------------------
const invokedDirectly = process.argv[1]?.endsWith('module-isolation.mjs') ?? false;

if (invokedDirectly) {
  const root = process.argv[2] ?? '.';
  const modules = listModules(root);
  const violations = findViolations(root);

  console.log(
    `Isolation des modules — ${modules.length} module(s) analysé(s)` +
      (modules.length > 0 ? ` : ${modules.join(', ')}` : ' (aucun module à ce stade).'),
  );

  if (violations.length === 0) {
    console.log('✔ Aucune dépendance directe entre modules.');
    process.exit(0);
  }

  console.error(`\n✘ ${violations.length} dépendance(s) interdite(s) :\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.from} → ${v.to}  (« ${v.specifier} »)`);
  }
  console.error(
    '\nUn module ne dépend jamais directement d’un autre (ARC-03).' +
      '\nPasser par les contrats du Core : module A → Core → module B.',
  );
  process.exit(1);
}

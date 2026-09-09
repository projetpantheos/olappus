#!/usr/bin/env node
/**
 * OLAPPUS — scan de secrets
 *
 * Contrôle exigé par SEC-23 (« No production secrets in repo » / evidence: secret scan)
 * et par la gate G1. Sortie non nulle = échec de la gate.
 *
 * Usage :
 *   node tooling/secret-scan.mjs            # scanne les fichiers suivis par git
 *   node tooling/secret-scan.mjs --all      # scanne tout l'arbre (hors ignorés)
 *
 * Ce scanner est volontairement simple et lisible : il détecte des formes de
 * secrets connues, pas des secrets arbitraires. Il ne remplace pas une revue.
 */

import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const MAX_BYTES = 2_000_000;

import { ALLOW, ENV_REFERENCE, PATTERNS, PLACEHOLDER, SKIP_EXT } from './secret-scan-rules.mjs';

const scanAll = process.argv.includes('--all');

function listFiles() {
  const cmd = scanAll
    ? 'git ls-files --cached --others --exclude-standard'
    : 'git ls-files --cached --others --exclude-standard';
  return execSync(cmd, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
}

const findings = [];
const allowances = [];
let scanned = 0;

for (const file of listFiles()) {
  if (SKIP_EXT.test(file)) continue;
  let size;
  try {
    size = statSync(file).size;
  } catch {
    continue;
  }
  if (size > MAX_BYTES) continue;

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  scanned++;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 3000) continue;

    for (const { name, re } of PATTERNS) {
      if (!re.test(line)) continue;
      if (PLACEHOLDER.test(line)) continue;
      if (ENV_REFERENCE.test(line)) continue;

      // La dérogation ne vaut que si un motif a réellement été détecté, et
      // seulement si elle est portée par la ligne précédente. Sans cette
      // double condition, la simple mention du marqueur dans un commentaire
      // suffirait à faire taire le scanner.
      const justification = i > 0 ? ALLOW.exec(lines[i - 1]) : null;
      if (justification) {
        allowances.push({ file, line: i + 1, name, reason: justification[1].trim() });
        continue;
      }

      findings.push({ file, line: i + 1, name, excerpt: line.trim().slice(0, 120) });
    }
  }
}

console.log(`Scan de secrets — ${scanned} fichier(s) analysé(s).`);

if (allowances.length > 0) {
  console.log(`${allowances.length} dérogation(s) explicite(s) :`);
  for (const a of allowances) {
    console.log(`  ${a.file}:${a.line} — ${a.reason}`);
  }
}

if (findings.length === 0) {
  console.log('✔ Aucun secret détecté.');
  process.exit(0);
}

console.error(`\n✘ ${findings.length} détection(s) :\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.name}]`);
  console.error(`     ${f.excerpt}`);
}
console.error('\nUn secret présent dans le dépôt doit être RÉVOQUÉ avant d’être retiré du code.');
process.exit(1);

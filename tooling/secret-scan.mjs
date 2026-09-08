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

/** Motifs de secrets. `name` sert au rapport, `re` au test. */
const PATTERNS = [
  { name: 'Clé privée PEM', re: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'JWT', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'Clé API Google', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Client secret Google (OAuth)', re: /\bGOCSPX-[0-9A-Za-z_-]{20,}\b/ },
  { name: 'Jeton GitHub', re: /\bgh[pousr]_[0-9A-Za-z]{30,}\b/ },
  { name: 'Clé AWS', re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: 'Jeton Slack', re: /\bxox[abprs]-[0-9A-Za-z-]{10,}\b/ },
  { name: 'Jeton Stripe', re: /\b[sr]k_(live|test)_[0-9A-Za-z]{20,}\b/ },
  { name: 'Clé service_role Supabase', re: /\bservice_role\b[^\n]{0,80}\beyJ/ },
  { name: 'URL avec identifiants', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s:@/]+@/ },
  {
    name: 'Affectation de secret en clair',
    re: /\b(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key)\s*[:=]\s*["'][^"'\s]{8,}["']/i,
  },
];

/** Valeurs manifestement fictives : un gabarit n'est pas une fuite. */
const PLACEHOLDER = /(YOUR|EXAMPLE|PLACEHOLDER|CHANGEME|CHANGE_ME|XXXX|<[^>]+>|\.\.\.|TODO|FIXME|REDACTED|A_REMPLIR|VOTRE)/i;

/** Extensions binaires ou non pertinentes. */
const SKIP_EXT = /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|tgz|7z|rar|mp4|mp3|wav|woff2?|ttf|eot|otf|lock)$/i;

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
      findings.push({ file, line: i + 1, name, excerpt: line.trim().slice(0, 120) });
    }
  }
}

console.log(`Scan de secrets — ${scanned} fichier(s) analysé(s).`);

if (findings.length === 0) {
  console.log('✔ Aucun secret détecté.');
  process.exit(0);
}

console.error(`\n✘ ${findings.length} détection(s) :\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.name}]`);
  console.error(`     ${f.excerpt}`);
}
console.error(
  '\nUn secret présent dans le dépôt doit être RÉVOQUÉ avant d’être retiré du code.',
);
process.exit(1);

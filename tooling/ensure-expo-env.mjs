#!/usr/bin/env node
/**
 * Garantit la présence de `apps/mobile/expo-env.d.ts`.
 *
 * Ce fichier apporte les déclarations de types d'Expo (dont le support CSS).
 * Expo le génère au premier `expo start` et le place dans `.gitignore` : il est
 * donc absent d'un clone neuf, ce qui ferait échouer le typecheck en CI pour une
 * raison sans rapport avec le code.
 *
 * On le régénère ici au lieu de le versionner : un fichier généré committé
 * devient faux dès qu'Expo change son contenu entre deux SDK.
 */

import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, '..', 'apps', 'mobile', 'expo-env.d.ts');

const CONTENT = `/// <reference types="expo/types" />

// Généré par tooling/ensure-expo-env.mjs — ne pas éditer, ne pas versionner.
`;

if (existsSync(target)) {
  process.exit(0);
}

writeFileSync(target, CONTENT, 'utf8');
console.log('expo-env.d.ts régénéré.');

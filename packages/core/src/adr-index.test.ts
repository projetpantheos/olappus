/**
 * Intégrité du Decision Ledger.
 *
 * `docs/ADR/INDEX.md` est déclaré source d'autorité du projet. Un ADR absent de
 * l'index est invisible : un agent qui lit l'index — c'est-à-dire tout agent,
 * puisque `README_FIRST` l'y envoie en premier — ne le verra jamais.
 *
 * Ce test existe parce que la dérive s'est produite : ADR-0015 a été écrit, et
 * n'a jamais été indexé. Le contrôle a été ajouté au moment où le défaut a été
 * découvert, pas en prévention théorique.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ADR_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'ADR');

const index = readFileSync(join(ADR_DIR, 'INDEX.md'), 'utf8');

/** Fichiers d'ADR numérotés, hors gabarit et hors index. */
const adrFiles = readdirSync(ADR_DIR)
  .filter((f) => /^\d{4}_.+\.md$/.test(f))
  .filter((f) => !f.startsWith('0000_'));

describe('Decision Ledger — intégrité de l’index', () => {
  it('trouve des ADR à vérifier', () => {
    // Contrôle négatif : un dossier vide rendrait tous les tests suivants
    // trivialement verts.
    expect(adrFiles.length).toBeGreaterThan(10);
  });

  it('indexe chaque ADR du dossier', () => {
    const missing = adrFiles.filter((f) => !index.includes(f));
    expect(missing, 'ADR écrits mais absents de l’index, donc invisibles').toEqual([]);
  });

  it('ne référence aucun ADR inexistant', () => {
    const referenced = [...index.matchAll(/\((\d{4}_[^)]+\.md)\)/g)].map((m) => m[1]!);
    const orphans = referenced.filter((f) => !adrFiles.includes(f));
    expect(orphans, 'liens morts dans l’index').toEqual([]);
  });

  it('numérote les ADR sans trou ni doublon', () => {
    const numbers = adrFiles.map((f) => Number(f.slice(0, 4))).sort((a, b) => a - b);
    expect(new Set(numbers).size, 'numéros dupliqués').toBe(numbers.length);
    for (let i = 0; i < numbers.length; i++) {
      expect(numbers[i], 'trou dans la numérotation').toBe(i + 1);
    }
  });

  it('chaque ADR déclare un statut et une date', () => {
    for (const file of adrFiles) {
      const content = readFileSync(join(ADR_DIR, file), 'utf8');
      expect(content, `${file} sans statut`).toMatch(
        /\*\*Statut\*\*\s*:\s*(ACCEPTED|PROPOSED|SUPERSEDED|REJECTED)/,
      );
      expect(content, `${file} sans date`).toMatch(/\*\*Date\*\*\s*:\s*\d{4}-\d{2}-\d{2}/);
    }
  });
});

/**
 * Dérive entre le Data Registry et la base — gouvernance exécutable.
 *
 * Le registre gouverne la classification, la rétention, l'export, la suppression
 * et les politiques IA. Si une table existe sans y être déclarée, elle échappe
 * à tout cela. Si une entité y est déclarée sans exister, la gouvernance parle
 * dans le vide.
 *
 * Ce test relie les deux. Il est volontairement le seul endroit où cette
 * correspondance est vérifiée.
 *
 * Prérequis : pile Supabase locale démarrée.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from 'pg';
import { parse } from 'yaml';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Registry } from './data-registry.js';

const CONNECTION = {
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: process.env['SUPABASE_LOCAL_DB_PASSWORD'] ?? 'postgres',
  database: 'postgres',
} as const;

const registry = parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      '..',
      'governance',
      'data_registry.yaml',
    ),
    'utf8',
  ),
) as Registry;

/**
 * Entités déclarées au registre mais réalisées ailleurs qu'en table dédiée.
 * Chaque exception doit porter sa justification : sans cela, la liste devient
 * un dépotoir qui vide le contrôle de son sens.
 */
const REALIZED_ELSEWHERE: Record<string, string> = {
  'identity.account':
    'Réalisée par auth.users (Supabase). Dupliquer la table diviserait la vérité.',
  'control.third_party_identity':
    'Entrée de contrôle, pas de stockage : elle matérialise une interdiction.',
};

/**
 * Tables techniques créées par la plateforme ou par l'outillage, hors périmètre
 * de gouvernance métier.
 */
const INFRASTRUCTURE_TABLES = new Set([
  'core.retention_policy',
  'core.retention_run',
  'core.safe_mode',
  'core.command_log',
]);

const available = await (async () => {
  const probe = new Client(CONNECTION);
  try {
    await probe.connect();
    await probe.query('select 1');
    await probe.end();
    return true;
  } catch {
    return false;
  }
})();

let db: Client | undefined;
let tables = new Set<string>();

beforeAll(async () => {
  if (!available) return;
  db = new Client(CONNECTION);
  await db.connect();
  const rows = await db.query<{ full_name: string }>(
    `select table_schema || '.' || table_name as full_name
       from information_schema.tables
      where table_schema in ('identity','core','source','extraction','domain','knowledge','audit')
        and table_type = 'BASE TABLE'`,
  );
  tables = new Set(rows.rows.map((r) => r.full_name));
});

afterAll(async () => {
  if (db) await db.end();
});

describe.skipIf(!available)('Registre ↔ base — aucune dérive', () => {
  it('toute entité déclarée SPECIFIED existe en base, ou est justifiée', () => {
    const missing: string[] = [];
    for (const entity of registry.entities) {
      if (entity.status !== 'SPECIFIED') continue;
      if (REALIZED_ELSEWHERE[entity.id]) continue;
      if (!tables.has(entity.id)) missing.push(entity.id);
    }
    expect(missing, 'entités gouvernées sans table : la gouvernance parle dans le vide').toEqual(
      [],
    );
  });

  it('toute table métier est déclarée au registre', () => {
    const declared = new Set(registry.entities.map((e) => e.id));
    const undeclared = [...tables].filter((t) => !declared.has(t) && !INFRASTRUCTURE_TABLES.has(t));
    expect(
      undeclared,
      'tables échappant à la classification, la rétention et la politique IA',
    ).toEqual([]);
  });

  it('chaque exception porte une justification écrite', () => {
    for (const [id, reason] of Object.entries(REALIZED_ELSEWHERE)) {
      expect(reason.length, id).toBeGreaterThan(30);
    }
  });
});

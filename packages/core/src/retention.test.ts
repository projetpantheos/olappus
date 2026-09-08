/**
 * Rétention exécutable — ADR-0015.
 *
 * Une durée de rétention déclarée dans un fichier YAML ne protège personne :
 * ce qui protège, c'est une purge qui s'exécute. Ces tests vérifient les deux,
 * et surtout que les deux **coïncident** — une politique en base qui divergerait
 * du registre rendrait la gouvernance décorative.
 *
 * Prérequis : pile Supabase locale démarrée.
 */

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from 'pg';
import { parse } from 'yaml';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Registry } from './data-registry';

const CONNECTION = {
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: process.env['SUPABASE_LOCAL_DB_PASSWORD'] ?? 'postgres',
  database: 'postgres',
} as const;

const REGISTRY_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'governance',
  'data_registry.yaml',
);
const registry = parse(readFileSync(REGISTRY_PATH, 'utf8')) as Registry;

const USER = '33333333-3333-4333-8333-333333333333';

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

beforeAll(async () => {
  if (!available) return;
  db = new Client(CONNECTION);
  await db.connect();

  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                             email_confirmed_at, created_at, updated_at)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             'synthetique-retention@example.invalid', '', now(), now(), now())
     on conflict (id) do nothing`,
    [USER],
  );
  await db.query(`insert into core."user" (user_id) values ($1) on conflict do nothing`, [USER]);
});

afterAll(async () => {
  if (db) await db.end();
});

describe.skipIf(!available)('Rétention — la base et le registre disent la même chose', () => {
  it('chaque politique en base correspond au vocabulaire du registre', async () => {
    const rows = await db!.query<{ key: string }>('select key from core.retention_policy');
    const vocabulary = registry.retention_vocabulary;
    expect(rows.rows.length).toBeGreaterThan(0);
    for (const row of rows.rows) {
      expect(
        Object.prototype.hasOwnProperty.call(vocabulary, row.key),
        `« ${row.key} » est en base mais absent du registre`,
      ).toBe(true);
    }
  });

  it('toute durée chiffrée du registre existe en base', async () => {
    const timed = Object.keys(registry.retention_vocabulary).filter((k) =>
      /^(days|months|years)_\d+$/.test(k),
    );
    const rows = await db!.query<{ key: string }>('select key from core.retention_policy');
    const inDb = new Set(rows.rows.map((r) => r.key));
    for (const key of timed) {
      expect(inDb.has(key), `« ${key} » est déclaré au registre mais absent de la base`).toBe(true);
    }
  });

  it('les durées correspondent exactement à ADR-0015', async () => {
    // Comparaison d'intervalle à intervalle, et non via `extract(epoch)` :
    // Postgres y compte 30,4375 jours par mois, ce qui rend toute conversion
    // en jours approximative et le test faux pour de mauvaises raisons.
    const rows = await db!.query<{ key: string; matches: boolean }>(
      `select key,
              case key
                when 'days_7'    then interval_spec = interval '7 days'
                when 'months_24' then interval_spec = interval '24 months'
                else false
              end as matches
         from core.retention_policy`,
    );
    expect(rows.rows.length).toBeGreaterThan(0);
    for (const row of rows.rows) {
      expect(row.matches, `${row.key} ne correspond pas à ADR-0015`).toBe(true);
    }
  });
});

describe.skipIf(!available)('Rétention — la purge s’exécute réellement', () => {
  it('efface la charge brute au-delà de 7 jours et conserve la ligne', async () => {
    const hash = `hash-ancien-${Date.now()}`;
    await db!.query(
      `insert into source.raw_quarantine
         (user_id, connector_id, payload_raw, content_hash, observed_at, created_at)
       values ($1, 'test', '\\x0102'::bytea, $2, now() - interval '10 days',
               now() - interval '10 days')`,
      [USER, hash],
    );

    const purged = await db!.query<{ n: number }>('select source.purge_expired_quarantine() as n');
    expect(Number(purged.rows[0]!.n)).toBeGreaterThanOrEqual(1);

    const after = await db!.query<{ payload_raw: Buffer | null; purged_at: Date | null }>(
      'select payload_raw, purged_at from source.raw_quarantine where content_hash = $1',
      [hash],
    );
    // La ligne subsiste — sans elle, une resynchronisation réingérerait tout.
    expect(after.rows).toHaveLength(1);
    expect(after.rows[0]!.payload_raw).toBeNull();
    expect(after.rows[0]!.purged_at).not.toBeNull();
  });

  it('ne touche pas une charge brute récente', async () => {
    const hash = `hash-recent-${Date.now()}`;
    await db!.query(
      `insert into source.raw_quarantine
         (user_id, connector_id, payload_raw, content_hash, observed_at)
       values ($1, 'test', '\\x0304'::bytea, $2, now())`,
      [USER, hash],
    );

    await db!.query('select source.purge_expired_quarantine()');

    const after = await db!.query<{ payload_raw: Buffer | null }>(
      'select payload_raw from source.raw_quarantine where content_hash = $1',
      [hash],
    );
    expect(after.rows[0]!.payload_raw).not.toBeNull();
  });

  it("supprime les entrées d'audit au-delà de 24 mois et garde les récentes", async () => {
    // Identifiants uniques par execution : la base locale persiste entre les
    // runs, et des identifiants figes feraient s'accumuler les lignes jusqu'a
    // faire echouer le test pour une raison sans rapport avec la purge.
    const oldAction = randomUUID();
    const freshAction = randomUUID();
    await db!.query(
      `insert into audit.action_log (actor_id, action_id, occurred_at)
       values ($1, $2, now() - interval '30 months'), ($1, $3, now())`,
      [USER, oldAction, freshAction],
    );

    const purged = await db!.query<{ n: number }>('select audit.purge_expired_action_log() as n');
    expect(Number(purged.rows[0]!.n)).toBeGreaterThanOrEqual(1);

    const remaining = await db!.query(
      'select action_id from audit.action_log where action_id in ($1, $2)',
      [oldAction, freshAction],
    );
    expect(remaining.rows).toHaveLength(1);
    expect((remaining.rows[0] as { action_id: string }).action_id).toBe(freshAction);
  });
});

describe.skipIf(!available)('Rétention — ordonnancement et supervision', () => {
  it('le point d’entrée unique exécute les deux purges et laisse une trace', async () => {
    const before = await db!.query<{ n: number }>(
      'select count(*)::int as n from core.retention_run',
    );
    await db!.query('select core.run_retention_purges()');
    const after = await db!.query<{ n: number }>(
      'select count(*)::int as n from core.retention_run',
    );
    expect(Number(after.rows[0]!.n)).toBe(Number(before.rows[0]!.n) + 1);
  });

  it('signale une purge en bonne santé après exécution', async () => {
    await db!.query('select core.run_retention_purges()');
    const rows = await db!.query<{ is_healthy: boolean; overdue_quarantine_rows: number }>(
      'select is_healthy, overdue_quarantine_rows from core.retention_health',
    );
    expect(rows.rows[0]!.is_healthy).toBe(true);
    // Après purge, plus aucune charge brute ne doit être en retard.
    expect(Number(rows.rows[0]!.overdue_quarantine_rows)).toBe(0);
  });

  it('rend visible une charge brute en retard tant que la purge n’a pas tourné', async () => {
    // Une purge arrêtée est invisible sans indicateur : les données
    // s'accumulent silencieusement. C'est ce que cette vue empêche.
    const hash = `hash-retard-${randomUUID()}`;
    await db!.query(
      `insert into source.raw_quarantine
         (user_id, connector_id, payload_raw, content_hash, observed_at, created_at)
       values ($1, 'test', '\\x05'::bytea, $2, now() - interval '20 days',
               now() - interval '20 days')`,
      [USER, hash],
    );

    const overdue = await db!.query<{ overdue_quarantine_rows: number }>(
      'select overdue_quarantine_rows from core.retention_health',
    );
    expect(Number(overdue.rows[0]!.overdue_quarantine_rows)).toBeGreaterThanOrEqual(1);

    await db!.query('select core.run_retention_purges()');

    const cleared = await db!.query<{ overdue_quarantine_rows: number }>(
      'select overdue_quarantine_rows from core.retention_health',
    );
    expect(Number(cleared.rows[0]!.overdue_quarantine_rows)).toBe(0);
  });
});

describe.skipIf(!available)('Déduplication de la quarantaine', () => {
  it('refuse deux fois la même charge pour le même connecteur', async () => {
    const hash = `hash-dedup-${Date.now()}`;
    const insert = () =>
      db!.query(
        `insert into source.raw_quarantine
           (user_id, connector_id, content_hash, observed_at)
         values ($1, 'test', $2, now())`,
        [USER, hash],
      );
    await insert();
    await expect(insert()).rejects.toThrow(/duplicate key|unique/i);
  });
});

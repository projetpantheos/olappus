/**
 * Safe Mode et machine à états des actions — SEC-32, PRD-12.
 * Contrôle `SEC-23` « Safe Mode », test d'acceptation P0 n°17.
 *
 * Le point décisif : ces tests attaquent la base **directement**, sans passer
 * par le code applicatif. Un garde qui ne tiendrait que dans le code serait
 * contournable par un chemin oublié — et c'est précisément ce qui arrive en
 * incident, quand on écrit vite.
 *
 * Prérequis : pile Supabase locale démarrée.
 */

import { randomUUID } from 'node:crypto';

import { Client } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const CONNECTION = {
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: process.env['SUPABASE_LOCAL_DB_PASSWORD'] ?? 'postgres',
  database: 'postgres',
} as const;

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
const USER = randomUUID();
let caseId = '';

async function newAction(status = 'PROPOSED'): Promise<string> {
  const rows = await db!.query<{ action_id: string }>(
    `insert into core.action (case_id, user_id, type, risk_level, status, permission_level)
     values ($1, $2, 'claim', 'HIGH', $3, 'EXECUTE_WITH_CONFIRMATION')
     returning action_id`,
    [caseId, USER, status],
  );
  return rows.rows[0]!.action_id;
}

async function setSafeMode(active: boolean): Promise<void> {
  await db!.query(
    `update core.safe_mode
        set active = $1,
            reason = case when $1 then 'test' else null end,
            activated_at = case when $1 then now() else null end
      where id = true`,
    [active],
  );
}

beforeAll(async () => {
  if (!available) return;
  db = new Client(CONNECTION);
  await db.connect();
  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                             email_confirmed_at, created_at, updated_at)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             $2, '', now(), now(), now()) on conflict (id) do nothing`,
    [USER, `synthetique-safe-${USER.slice(0, 8)}@example.invalid`],
  );
  await db.query(`insert into core."user" (user_id) values ($1) on conflict do nothing`, [USER]);
  const c = await db.query<{ case_id: string }>(
    `insert into core."case" (user_id, module_id, type) values ($1, 'themis', 'deadline')
     returning case_id`,
    [USER],
  );
  caseId = c.rows[0]!.case_id;
});

afterEach(async () => {
  if (available) await setSafeMode(false);
});

afterAll(async () => {
  if (db) await db.end();
});

describe.skipIf(!available)('Safe Mode — ce qui est interdit', () => {
  it('empêche une action de démarrer, y compris par accès direct à la base', async () => {
    const actionId = await newAction('WAITING_CONFIRMATION');
    await setSafeMode(true);

    await expect(
      db!.query(
        `update core.action set status = 'EXECUTING', confirmed_at = now(), confirmed_by = $2
          where action_id = $1`,
        [actionId, USER],
      ),
    ).rejects.toThrow(/Safe Mode actif/i);
  });

  it('empêche la création directe d’une action déjà en exécution', async () => {
    await setSafeMode(true);
    await expect(newAction('EXECUTING')).rejects.toThrow(/Safe Mode actif/i);
  });
});

describe.skipIf(!available)('Safe Mode — ce qui reste possible', () => {
  it('laisse lire les Cases existants', async () => {
    await setSafeMode(true);
    const rows = await db!.query('select case_id from core."case" where user_id = $1', [USER]);
    expect(rows.rows.length).toBeGreaterThan(0);
  });

  it('laisse préparer et annuler, seule l’exécution est bloquée', async () => {
    const actionId = await newAction('PROPOSED');
    await setSafeMode(true);
    await db!.query(`update core.action set status = 'PREPARED' where action_id = $1`, [actionId]);
    await db!.query(`update core.action set status = 'CANCELLED' where action_id = $1`, [actionId]);
    const rows = await db!.query<{ status: string }>(
      'select status from core.action where action_id = $1',
      [actionId],
    );
    expect(rows.rows[0]!.status).toBe('CANCELLED');
  });

  it('redevient permissif une fois levé', async () => {
    const actionId = await newAction('WAITING_CONFIRMATION');
    await setSafeMode(true);
    await expect(
      db!.query(`update core.action set status = 'EXECUTING' where action_id = $1`, [actionId]),
    ).rejects.toThrow();
    await setSafeMode(false);
    await db!.query(
      `update core.action set status = 'EXECUTING', confirmed_at = now(), confirmed_by = $2
        where action_id = $1`,
      [actionId, USER],
    );
    const rows = await db!.query<{ status: string }>(
      'select status from core.action where action_id = $1',
      [actionId],
    );
    expect(rows.rows[0]!.status).toBe('EXECUTING');
  });
});

describe.skipIf(!available)('Safe Mode — intégrité de l’état', () => {
  it('refuse une activation sans motif', async () => {
    await expect(
      db!.query(`update core.safe_mode set active = true, reason = null where id = true`),
    ).rejects.toThrow();
  });

  it('ne peut exister qu’en un seul exemplaire', async () => {
    await expect(
      db!.query(`insert into core.safe_mode (id, active) values (false, true)`),
    ).rejects.toThrow();
  });
});

describe.skipIf(!available)('Machine à états des actions — PRD-12', () => {
  it('interdit d’exécuter sans passer par la confirmation', async () => {
    const actionId = await newAction('PROPOSED');
    await expect(
      db!.query(`update core.action set status = 'EXECUTING' where action_id = $1`, [actionId]),
    ).rejects.toThrow(/transition d'action interdite/i);
  });

  it('interdit de rouvrir une action terminée', async () => {
    const actionId = await newAction('PROPOSED');
    await db!.query(`update core.action set status = 'CANCELLED' where action_id = $1`, [actionId]);
    await expect(
      db!.query(`update core.action set status = 'PREPARED' where action_id = $1`, [actionId]),
    ).rejects.toThrow(/transition d'action interdite/i);
  });

  it('exige une confirmation antérieure à l’exécution', async () => {
    // L'ordre confirmation puis exécution est une contrainte, pas une convention.
    const actionId = await newAction('WAITING_CONFIRMATION');
    await expect(
      db!.query(
        `update core.action set status = 'EXECUTING', executed_at = now() where action_id = $1`,
        [actionId],
      ),
    ).rejects.toThrow();
  });

  it('accepte le chemin complet PREPARED → CONFIRMATION → EXECUTING → EXECUTED', async () => {
    const actionId = await newAction('PROPOSED');
    for (const status of ['PREPARED', 'WAITING_CONFIRMATION']) {
      await db!.query(`update core.action set status = $2 where action_id = $1`, [
        actionId,
        status,
      ]);
    }
    await db!.query(
      `update core.action set status = 'EXECUTING', confirmed_at = now(), confirmed_by = $2
        where action_id = $1`,
      [actionId, USER],
    );
    await db!.query(
      `update core.action set status = 'EXECUTED', executed_at = now() where action_id = $1`,
      [actionId],
    );
    const rows = await db!.query<{ status: string }>(
      'select status from core.action where action_id = $1',
      [actionId],
    );
    expect(rows.rows[0]!.status).toBe('EXECUTED');
  });
});

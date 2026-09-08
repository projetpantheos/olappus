/**
 * Suppression vérifiée — SEC-33, contrôle `SEC-23` « Deletion verification »,
 * tests d'acceptation P0 n°11 et n°31.
 *
 * `DAT-07` exige une suppression « contrôlée, auditable et vérifiable ». Ces
 * tests parcourent les emplacements de l'inventaire `SEC-33` applicables au
 * périmètre actuel, et vérifient aussi ce qui doit **survivre** : une
 * suppression qui emporte l'audit ne serait pas conforme, elle serait bavarde.
 *
 * Prérequis : pile Supabase locale démarrée.
 */

import { randomUUID } from 'node:crypto';

import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
let userId = '';
let actionId = '';

/** Crée un utilisateur synthétique doté de données dans chaque schéma concerné. */
async function seedUser(client: Client): Promise<{ userId: string; actionId: string }> {
  const id = randomUUID();
  const action = randomUUID();

  await client.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                             email_confirmed_at, created_at, updated_at)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             $2, '', now(), now(), now())`,
    [id, `synthetique-suppression-${id.slice(0, 8)}@example.invalid`],
  );
  await client.query(`insert into core."user" (user_id) values ($1)`, [id]);
  await client.query(
    `insert into core."case" (user_id, module_id, type) values ($1, 'themis', 'deadline')`,
    [id],
  );
  await client.query(
    `insert into core.permission (user_id, action, resource, level, data_scope)
     values ($1, 'email.read.minimal', 'connector', 'READ', 'minimal')`,
    [id],
  );
  await client.query(
    `insert into identity.device (account_id, public_key_reference) values ($1, 'ref')`,
    [id],
  );
  const source = await client.query<{ source_id: string }>(
    `insert into source.raw_quarantine (user_id, connector_id, payload_raw, content_hash, observed_at)
     values ($1, 'test', '\\x00'::bytea, $2, now()) returning source_id`,
    [id, `hash-${id}`],
  );
  await client.query(
    `insert into extraction.record (source_id, user_id, extractor_version, confidence)
     values ($1, $2, 'extractor@1.0.0', 'PROBABLE')`,
    [source.rows[0]!.source_id, id],
  );
  await client.query(`insert into audit.action_log (actor_id, action_id) values ($1, $2)`, [
    id,
    action,
  ]);

  return { userId: id, actionId: action };
}

beforeAll(async () => {
  if (!available) return;
  db = new Client(CONNECTION);
  await db.connect();
  const seeded = await seedUser(db);
  userId = seeded.userId;
  actionId = seeded.actionId;
});

afterAll(async () => {
  if (db) await db.end();
});

describe.skipIf(!available)('Suppression — état initial', () => {
  it('l’utilisateur possède bien des données dans chaque schéma concerné', async () => {
    // Contrôle négatif : sans données, tous les tests de suppression
    // passeraient sans rien prouver.
    const counts = await db!.query<{ n: number }>(
      `select
         (select count(*) from core."case" where user_id = $1)
       + (select count(*) from core.permission where user_id = $1)
       + (select count(*) from identity.device where account_id = $1)
       + (select count(*) from source.raw_quarantine where user_id = $1)
       + (select count(*) from extraction.record where user_id = $1)
       + (select count(*) from audit.action_log where actor_id = $1) as n`,
      [userId],
    );
    expect(Number(counts.rows[0]!.n)).toBe(6);
  });
});

describe.skipIf(!available)('Suppression — ce qui disparaît', () => {
  it('supprime en cascade les données métier, la quarantaine et les extractions', async () => {
    await db!.query('delete from auth.users where id = $1', [userId]);

    const remaining = await db!.query<{ table_name: string; n: number }>(
      `select 'core.case' as table_name, count(*)::int as n from core."case" where user_id = $1
       union all
       select 'core.permission', count(*)::int from core.permission where user_id = $1
       union all
       select 'core.user', count(*)::int from core."user" where user_id = $1
       union all
       select 'identity.device', count(*)::int from identity.device where account_id = $1
       union all
       select 'source.raw_quarantine', count(*)::int from source.raw_quarantine where user_id = $1
       union all
       select 'extraction.record', count(*)::int from extraction.record where user_id = $1`,
      [userId],
    );

    for (const row of remaining.rows) {
      expect(Number(row.n), `${row.table_name} conserve des lignes`).toBe(0);
    }
  });
});

describe.skipIf(!available)('Suppression — ce qui survit délibérément', () => {
  it("conserve l'entrée d'audit, sans identifiant remontant à la personne", async () => {
    // SEC-33 : l'audit des actions externes est anonymisé, pas supprimé.
    // Le contraire effacerait la preuve de ce qu'Olappus a fait au nom de
    // l'utilisateur — précisément ce qui le protège en cas de litige.
    const rows = await db!.query<{ actor_id: string | null }>(
      'select actor_id from audit.action_log where action_id = $1',
      [actionId],
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]!.actor_id).toBeNull();
  });
});

describe.skipIf(!available)('Suppression — anti-résurrection', () => {
  it('une resynchronisation ne peut pas recréer les données d’un compte supprimé', async () => {
    // Test d'acceptation n°31. La clé étrangère vers core.user fait office de
    // garde : un appareil hors ligne qui rejouerait ses écritures échoue au
    // lieu de ressusciter des données.
    await expect(
      db!.query(
        `insert into core."case" (user_id, module_id, type) values ($1, 'themis', 'deadline')`,
        [userId],
      ),
    ).rejects.toThrow(/foreign key|violates/i);
  });
});

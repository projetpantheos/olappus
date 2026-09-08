/**
 * Idempotence des commandes — ARC-42, contrôle `SEC-23`,
 * test d'acceptation P0 n°16 : « Side-effecting command replay is idempotent ».
 *
 * Enjeu concret : une commande rejouée, c'est un courrier envoyé deux fois au
 * nom de l'utilisateur. Le rejeu n'est pas un cas rare — l'outbox hors ligne
 * retransmet après coupure, sans savoir si la première tentative est passée.
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
const USER = randomUUID();

interface ClaimRow {
  outcome: string;
  status: string;
  result: unknown;
}

async function claim(commandId: string, name = 'CreateCaseCommandV1'): Promise<ClaimRow> {
  const rows = await db!.query<ClaimRow>('select * from core.claim_command($1, $2, $3)', [
    commandId,
    USER,
    name,
  ]);
  return rows.rows[0]!;
}

beforeAll(async () => {
  if (!available) return;
  db = new Client(CONNECTION);
  await db.connect();
  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                             email_confirmed_at, created_at, updated_at)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             $2, '', now(), now(), now())
     on conflict (id) do nothing`,
    [USER, `synthetique-idem-${USER.slice(0, 8)}@example.invalid`],
  );
  await db.query(`insert into core."user" (user_id) values ($1) on conflict do nothing`, [USER]);
});

afterAll(async () => {
  if (db) await db.end();
});

describe.skipIf(!available)('Idempotence — première exécution', () => {
  it('accepte une commande inconnue', async () => {
    const row = await claim(randomUUID());
    expect(row.outcome).toBe('ACCEPTED');
    expect(row.status).toBe('IN_PROGRESS');
  });

  it('deux command_id distincts sont deux intentions distinctes', async () => {
    // L'idempotence protège du rejeu, pas du doublon fonctionnel : deux
    // identifiants différents doivent produire deux effets.
    const a = await claim(randomUUID());
    const b = await claim(randomUUID());
    expect(a.outcome).toBe('ACCEPTED');
    expect(b.outcome).toBe('ACCEPTED');
  });
});

describe.skipIf(!available)('Idempotence — rejeu', () => {
  it('un rejeu ne produit aucun second effet et rend le résultat mémorisé', async () => {
    const commandId = randomUUID();
    expect((await claim(commandId)).outcome).toBe('ACCEPTED');

    await db!.query('select core.complete_command($1, $2, $3)', [
      commandId,
      'COMPLETED',
      JSON.stringify({ case_id: 'abc' }),
    ]);

    const replay = await claim(commandId);
    expect(replay.outcome).toBe('REPLAY');
    expect(replay.status).toBe('COMPLETED');
    // Le résultat rendu est identique à la première réponse : c'est ce qui
    // rend le rejeu transparent pour un client qui a perdu la réponse.
    expect(replay.result).toEqual({ case_id: 'abc' });

    const count = await db!.query<{ n: number }>(
      'select count(*)::int as n from core.command_log where command_id = $1',
      [commandId],
    );
    expect(Number(count.rows[0]!.n)).toBe(1);
  });

  it('un rejeu pendant l’exécution ne relance rien', async () => {
    const commandId = randomUUID();
    await claim(commandId);
    const replay = await claim(commandId);
    expect(replay.outcome).toBe('REPLAY');
    expect(replay.status).toBe('IN_PROGRESS');
  });

  it('une commande échouée n’est pas relancée par un rejeu', async () => {
    // Relancer est une nouvelle décision, donc un nouveau command_id.
    const commandId = randomUUID();
    await claim(commandId);
    await db!.query('select core.complete_command($1, $2, $3)', [
      commandId,
      'FAILED',
      JSON.stringify({ code: 'PROVIDER_TIMEOUT' }),
    ]);

    const replay = await claim(commandId);
    expect(replay.outcome).toBe('REPLAY');
    expect(replay.status).toBe('FAILED');
    expect(replay.result).toEqual({ code: 'PROVIDER_TIMEOUT' });
  });
});

describe.skipIf(!available)('Idempotence — concurrence et intégrité', () => {
  it('deux réservations concurrentes du même identifiant : une seule accepte', async () => {
    // C'est le cas que la vérification applicative « existe-t-il déjà ? »
    // laisse passer : les deux requêtes franchissent la fenêtre.
    const commandId = randomUUID();
    const clients = [new Client(CONNECTION), new Client(CONNECTION)];
    await Promise.all(clients.map((c) => c.connect()));
    try {
      const results = await Promise.all(
        clients.map((c) =>
          c.query<ClaimRow>('select * from core.claim_command($1, $2, $3)', [
            commandId,
            USER,
            'CreateCaseCommandV1',
          ]),
        ),
      );
      const outcomes = results.map((r) => r.rows[0]!.outcome).sort();
      expect(outcomes).toEqual(['ACCEPTED', 'REPLAY']);
    } finally {
      await Promise.all(clients.map((c) => c.end()));
    }
  });

  it('une collision d’identifiant entre deux commandes différentes est bruyante', async () => {
    // Réutiliser un command_id pour une autre commande n'est pas un rejeu :
    // c'est un défaut, et il doit se voir.
    const commandId = randomUUID();
    await claim(commandId, 'CreateCaseCommandV1');
    await expect(claim(commandId, 'DeleteDataCommandV1')).rejects.toThrow(/deja utilise/i);
  });

  it('clôturer deux fois est refusé', async () => {
    // Une double clôture masquerait une double exécution.
    const commandId = randomUUID();
    await claim(commandId);
    await db!.query('select core.complete_command($1, $2, $3)', [commandId, 'COMPLETED', null]);
    await expect(
      db!.query('select core.complete_command($1, $2, $3)', [commandId, 'COMPLETED', null]),
    ).rejects.toThrow(/deja cloturee/i);
  });

  it('le journal disparaît avec le compte', async () => {
    const user = randomUUID();
    await db!.query(
      `insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                               email_confirmed_at, created_at, updated_at)
       values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
               $2, '', now(), now(), now())`,
      [user, `synthetique-idem2-${user.slice(0, 8)}@example.invalid`],
    );
    await db!.query(`insert into core."user" (user_id) values ($1)`, [user]);
    await db!.query('select core.claim_command($1, $2, $3)', [
      randomUUID(),
      user,
      'CreateCaseCommandV1',
    ]);

    await db!.query('delete from auth.users where id = $1', [user]);

    const rows = await db!.query<{ n: number }>(
      'select count(*)::int as n from core.command_log where actor_id = $1',
      [user],
    );
    expect(Number(rows.rows[0]!.n)).toBe(0);
  });
});

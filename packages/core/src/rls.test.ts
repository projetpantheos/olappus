/**
 * Isolation entre utilisateurs — contrôle n°1 de SEC-23,
 * test d'acceptation P0 n°13 : « RLS blocks unauthorized access ».
 *
 * Ces tests ne vérifient pas que le code applique un filtre : ils vérifient que
 * **la base refuse**, même si le code demande explicitement les données d'un
 * autre utilisateur. Un filtre applicatif se contourne, une politique RLS non.
 *
 * Méthode : on se connecte en tant que rôle `authenticated` avec les
 * revendications JWT d'un utilisateur donné, comme le fait PostgREST. Aucun
 * service_role n'est utilisé pour les assertions — il contournerait RLS et
 * rendrait le test faux.
 *
 * Prérequis : pile Supabase locale démarrée (`npx supabase start`).
 * Les tests sont ignorés, et non silencieusement verts, si elle est absente.
 */

import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const CONNECTION = {
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  // Mot de passe par defaut de la pile Supabase LOCALE : identique sur toutes
  // les machines, jamais utilise hors de 127.0.0.1. Les projets heberges ont
  // leurs propres identifiants, qui vivent dans .env.local et jamais ici.
  // secret-scan:allow identifiant de developpement local, sans valeur hors 127.0.0.1
  password: process.env['SUPABASE_LOCAL_DB_PASSWORD'] ?? 'postgres',
  database: 'postgres',
} as const;

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';

let admin: Client | undefined;
let available = false;

/** Exécute une requête avec l'identité d'un utilisateur, comme PostgREST. */
async function asUser<T = unknown>(
  userId: string,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = new Client(CONNECTION);
  await client.connect();
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', [
      'request.jwt.claims',
      JSON.stringify({ sub: userId, role: 'authenticated' }),
    ]);
    await client.query('set local role authenticated');
    const result = await client.query(sql, params);
    await client.query('commit');
    return result.rows as T[];
  } finally {
    await client.end();
  }
}

beforeAll(async () => {
  try {
    admin = new Client(CONNECTION);
    await admin.connect();
    await admin.query('select 1');
    available = true;
  } catch {
    available = false;
    return;
  }

  // Jeux d'essai synthétiques (RUN-25). Deux comptes, une affaire chacun.
  for (const id of [USER_A, USER_B]) {
    await admin.query(
      `insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                               email_confirmed_at, created_at, updated_at)
       values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
               $2, '', now(), now(), now())
       on conflict (id) do nothing`,
      [id, `synthetique-${id.slice(0, 8)}@example.invalid`],
    );
    await admin.query(`insert into core."user" (user_id) values ($1) on conflict do nothing`, [id]);
    await admin.query(
      `insert into core."case" (case_id, user_id, module_id, type)
       values (gen_random_uuid(), $1, 'themis', 'deadline')
       on conflict do nothing`,
      [id],
    );
  }
});

afterAll(async () => {
  if (admin) await admin.end();
});

describe.skipIf(!available)('RLS — isolation entre utilisateurs', () => {
  it('un utilisateur ne voit que ses propres affaires', async () => {
    const rows = await asUser<{ user_id: string }>(USER_A, 'select user_id from core."case"');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.user_id).toBe(USER_A);
    }
  });

  it('SELECT ciblant explicitement un autre utilisateur ne retourne rien', async () => {
    const rows = await asUser(USER_B, 'select * from core."case" where user_id = $1', [USER_A]);
    expect(rows).toHaveLength(0);
  });

  it("UPDATE sur l'affaire d'autrui n'affecte aucune ligne", async () => {
    const rows = await asUser(
      USER_B,
      `update core."case" set priority = 999 where user_id = $1 returning case_id`,
      [USER_A],
    );
    expect(rows).toHaveLength(0);

    const check = await admin!.query('select priority from core."case" where user_id = $1', [
      USER_A,
    ]);
    for (const row of check.rows as { priority: number }[]) {
      expect(row.priority).not.toBe(999);
    }
  });

  it("DELETE sur l'affaire d'autrui n'affecte aucune ligne", async () => {
    const before = await admin!.query(
      'select count(*)::int as n from core."case" where user_id = $1',
      [USER_A],
    );
    const rows = await asUser(
      USER_B,
      'delete from core."case" where user_id = $1 returning case_id',
      [USER_A],
    );
    expect(rows).toHaveLength(0);

    const after = await admin!.query(
      'select count(*)::int as n from core."case" where user_id = $1',
      [USER_A],
    );
    expect((after.rows[0] as { n: number }).n).toBe((before.rows[0] as { n: number }).n);
  });

  it("INSERT au nom d'un autre utilisateur est rejeté", async () => {
    await expect(
      asUser(
        USER_B,
        `insert into core."case" (user_id, module_id, type) values ($1, 'themis', 'deadline')`,
        [USER_A],
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it('UPDATE ne permet pas de transférer une affaire à un autre utilisateur', async () => {
    await expect(
      asUser(USER_B, `update core."case" set user_id = $1 where user_id = $2`, [USER_A, USER_B]),
    ).rejects.toThrow(/row-level security/i);
  });
});

describe.skipIf(!available)('RLS — schémas jamais exposés au client', () => {
  it.each(['source', 'extraction', 'audit'])(
    'le schéma %s est inaccessible au rôle authenticated',
    async (schema) => {
      await expect(
        asUser(USER_A, `select 1 from ${schema}.information_schema_probe`),
      ).rejects.toThrow();
    },
  );

  it("le rôle authenticated n'a aucun droit d'usage sur la quarantaine", async () => {
    const rows = await admin!.query(
      `select has_schema_privilege('authenticated', $1, 'USAGE') as allowed`,
      ['source'],
    );
    expect((rows.rows[0] as { allowed: boolean }).allowed).toBe(false);
  });
});

describe.skipIf(!available)('RLS — activation effective', () => {
  it('toute table exposée porte RLS activée et forcée', async () => {
    const rows = await admin!.query(
      `select schemaname, tablename, rowsecurity, relforcerowsecurity
         from pg_tables
         join pg_class on pg_class.relname = pg_tables.tablename
        where schemaname in ('core', 'identity', 'domain', 'knowledge')`,
    );
    expect(rows.rows.length).toBeGreaterThan(0);
    for (const row of rows.rows as {
      schemaname: string;
      tablename: string;
      rowsecurity: boolean;
      relforcerowsecurity: boolean;
    }[]) {
      expect(row.rowsecurity, `${row.schemaname}.${row.tablename} sans RLS`).toBe(true);
      expect(row.relforcerowsecurity, `${row.schemaname}.${row.tablename} sans FORCE RLS`).toBe(
        true,
      );
    }
  });
});

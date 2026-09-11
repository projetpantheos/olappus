/**
 * Connexions externes portées par la base — G6a.
 *
 * `RUN-42` exige pour G6 : scopes minimaux et **purge à la déconnexion**. Ces
 * tests attaquent la base directement, en contournant tout code applicatif —
 * c'est le seul moyen de montrer que la purge tient même quand le code de
 * déconnexion se trompe.
 *
 * Aucun fournisseur réel, aucune donnée personnelle : `google-synthetique` est
 * un fournisseur qui n'existe pas.
 *
 * Prérequis : pile Supabase locale démarrée.
 */

import { randomUUID } from 'node:crypto';

import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { encryptField, randomDek, type Binding } from './crypto';
import { ALLOWED_SCOPES, CONNECTION_STATUSES } from './oauth';

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

const PROVIDER = 'google-synthetique';

async function fixtureUser(): Promise<string> {
  const userId = randomUUID();
  await db!.query(
    `insert into auth.users (id, instance_id, aud, role, email)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2)`,
    [userId, `${userId}@synthetique.test`],
  );
  await db!.query('insert into core."user" (user_id) values ($1)', [userId]);
  return userId;
}

/** Un jeton chiffré, comme le serveur d'échange en produirait. */
function sealedToken(userId: string, field: string): string {
  const binding: Binding = {
    actorId: userId,
    entity: 'identity.connection',
    field,
    rowId: userId,
  };
  return JSON.stringify(
    encryptField('jeton-SYNTHETIQUE', { version: 1, key: randomDek() }, binding),
  );
}

/** Crée une connexion active, par le seul chemin qui y mène. */
async function connect(
  userId: string,
  scopes: readonly string[] = ['metadata.read'],
): Promise<string> {
  const id = randomUUID();
  await db!.query(
    `insert into identity.connection (connection_id, user_id, provider, status, scopes)
     values ($1, $2, $3, 'AUTHORIZING', $4)`,
    [id, userId, PROVIDER, scopes],
  );
  await db!.query(
    `update identity.connection
        set status = 'CONNECTED', access_token = $2, refresh_token = $3,
            expires_at = now() + interval '1 hour', connected_at = now(),
            external_account_ref = $4
      where connection_id = $1`,
    [
      id,
      sealedToken(userId, 'access_token'),
      sealedToken(userId, 'refresh_token'),
      'ref-SYNTHETIQUE',
    ],
  );
  return id;
}

beforeAll(async () => {
  if (!available) return;
  db = new Client(CONNECTION);
  await db.connect();
});

afterAll(async () => {
  if (db) await db.end();
});

describe.skipIf(!available)('Jetons — jamais en clair, même en SQL direct', () => {
  it('refuse un jeton en clair', async () => {
    const userId = await fixtureUser();
    await expect(
      db!.query(
        `insert into identity.connection (user_id, provider, status, scopes, access_token)
         values ($1, $2, 'AUTHORIZING', '{metadata.read}', '"ya29.jeton-en-clair"'::jsonb)`,
        [userId, PROVIDER],
      ),
    ).rejects.toThrow(/connection_tokens_are_ciphertext/);
  });

  it('accepte une enveloppe chiffrée', async () => {
    const userId = await fixtureUser();
    await expect(connect(userId)).resolves.toBeTruthy();
  });

  it('refuse une connexion active sans jeton', async () => {
    // Une connexion « active » sans jeton donnerait à l'application l'illusion
    // d'un accès qu'elle n'a pas.
    const userId = await fixtureUser();
    const id = randomUUID();
    await db!.query(
      `insert into identity.connection (connection_id, user_id, provider, status, scopes)
       values ($1, $2, $3, 'AUTHORIZING', '{metadata.read}')`,
      [id, userId, PROVIDER],
    );
    await expect(
      db!.query(`update identity.connection set status = 'CONNECTED' where connection_id = $1`, [
        id,
      ]),
    ).rejects.toThrow(/connection_connected_has_token/);
  });
});

describe.skipIf(!available)('Purge à la déconnexion — portée par la base', () => {
  it('purge effectivement les jetons', async () => {
    const userId = await fixtureUser();
    const id = await connect(userId);

    await db!.query(
      `update identity.connection
          set status = 'DISCONNECTED', access_token = null, refresh_token = null,
              expires_at = null, external_account_ref = null, disconnected_at = now()
        where connection_id = $1`,
      [id],
    );

    const { rows } = await db!.query<{
      access_token: unknown;
      refresh_token: unknown;
      external_account_ref: string | null;
    }>(
      'select access_token, refresh_token, external_account_ref from identity.connection where connection_id = $1',
      [id],
    );
    expect(rows[0]?.access_token).toBeNull();
    expect(rows[0]?.refresh_token).toBeNull();
    expect(rows[0]?.external_account_ref).toBeNull();
  });

  it('rend IMPOSSIBLE une déconnexion qui oublie de purger', async () => {
    // Le cœur de cette gate. Ce n'est pas une tâche de nettoyage qu'on espère
    // voir passer : la base refuse d'écrire l'état incohérent.
    const userId = await fixtureUser();
    const id = await connect(userId);
    await expect(
      db!.query(`update identity.connection set status = 'DISCONNECTED' where connection_id = $1`, [
        id,
      ]),
    ).rejects.toThrow(/connection_purged_when_closed/);
  });

  it('rend IMPOSSIBLE une révocation qui laisse un jeton', async () => {
    const userId = await fixtureUser();
    const id = await connect(userId);
    await expect(
      db!.query(
        `update identity.connection set status = 'REVOKED', revoked_at = now()
          where connection_id = $1`,
        [id],
      ),
    ).rejects.toThrow(/connection_purged_when_closed/);
  });

  it('refuse de replacer un jeton sur une connexion fermée', async () => {
    const userId = await fixtureUser();
    const id = await connect(userId);
    await db!.query(
      `update identity.connection
          set status = 'DISCONNECTED', access_token = null, refresh_token = null,
              expires_at = null, external_account_ref = null
        where connection_id = $1`,
      [id],
    );
    await expect(
      db!.query(`update identity.connection set access_token = $2 where connection_id = $1`, [
        id,
        sealedToken(userId, 'access_token'),
      ]),
    ).rejects.toThrow(/connection_purged_when_closed/);
  });

  it('exige une date sur toute révocation', async () => {
    const userId = await fixtureUser();
    const id = await connect(userId);
    await expect(
      db!.query(
        `update identity.connection
            set status = 'REVOKED', access_token = null, refresh_token = null,
                expires_at = null, external_account_ref = null
          where connection_id = $1`,
        [id],
      ),
    ).rejects.toThrow(/connection_revocation_dated/);
  });
});

describe.skipIf(!available)('Scopes — deny by default', () => {
  it('refuse un scope non déclaré pour le fournisseur', async () => {
    const userId = await fixtureUser();
    await expect(connect(userId, ['mail.readall'])).rejects.toThrow(/Scope non déclaré/);
  });

  it('refuse une connexion active sans aucun scope', async () => {
    const userId = await fixtureUser();
    await expect(connect(userId, [])).rejects.toThrow(/sans aucun scope/);
  });

  it('refuse d’élargir les scopes après coup', async () => {
    // Un garde qui ne tiendrait qu'à l'insertion se contournerait par un
    // update — la faute trouvée en G5 sur la publication IA.
    const userId = await fixtureUser();
    const id = await connect(userId);
    await expect(
      db!.query(
        `update identity.connection set scopes = '{metadata.read,mail.readall}'
          where connection_id = $1`,
        [id],
      ),
    ).rejects.toThrow(/Scope non déclaré/);
  });

  it('interdit de déclarer un scope donnant accès au corps des messages', async () => {
    // `docs/15` et la décision R4. Même un administrateur ne peut pas ajouter
    // un tel scope à la liste blanche sans que la base refuse.
    await expect(
      db!.query(
        `insert into identity.provider_scope (provider, scope, purpose)
         values ($1, 'mail.readall', 'tentative')`,
        [PROVIDER],
      ),
    ).rejects.toThrow(/provider_scope_no_full_access/);
  });

  it('déclare en base exactement les scopes déclarés dans le code', async () => {
    // Deux vérités sur le même sujet en produisent toujours une fausse.
    const { rows } = await db!.query<{ provider: string; scope: string }>(
      'select provider, scope from identity.provider_scope',
    );
    const enBase = rows.map((r) => `${r.provider}:${r.scope}`).sort();
    const dansLeCode = Object.entries(ALLOWED_SCOPES)
      .flatMap(([provider, scopes]) => scopes.map((s) => `${provider}:${s}`))
      .sort();
    expect(enBase).toEqual(dansLeCode);
  });
});

describe.skipIf(!available)('Machine à états — un consentement retiré ne se rétablit pas', () => {
  it('refuse de passer connecté sans autorisation', async () => {
    const userId = await fixtureUser();
    const id = randomUUID();
    await db!.query(
      `insert into identity.connection (connection_id, user_id, provider, status, scopes)
       values ($1, $2, $3, 'DISCONNECTED', '{metadata.read}')`,
      [id, userId, PROVIDER],
    );
    await expect(
      db!.query(
        `update identity.connection
            set status = 'CONNECTED', access_token = $2, expires_at = now() + interval '1 hour',
                connected_at = now()
          where connection_id = $1`,
        [id, sealedToken(userId, 'access_token')],
      ),
    ).rejects.toThrow(/Transition de connexion interdite/);
  });

  it('refuse de rétablir une connexion révoquée', async () => {
    const userId = await fixtureUser();
    const id = await connect(userId);
    await db!.query(
      `update identity.connection
          set status = 'REVOKED', revoked_at = now(), access_token = null,
              refresh_token = null, expires_at = null, external_account_ref = null
        where connection_id = $1`,
      [id],
    );
    await expect(
      db!.query(`update identity.connection set status = 'AUTHORIZING' where connection_id = $1`, [
        id,
      ]),
    ).rejects.toThrow(/Transition de connexion interdite/);
  });

  it('n’autorise qu’une seule connexion vivante par fournisseur', async () => {
    // Deux connexions actives, ce sont deux réponses à « avec quel consentement
    // lit-on ? ».
    const userId = await fixtureUser();
    await connect(userId);
    await expect(connect(userId)).rejects.toThrow(/connection_unique_live/);
  });

  it('accepte une nouvelle connexion après déconnexion', async () => {
    const userId = await fixtureUser();
    const id = await connect(userId);
    await db!.query(
      `update identity.connection
          set status = 'DISCONNECTED', access_token = null, refresh_token = null,
              expires_at = null, external_account_ref = null
        where connection_id = $1`,
      [id],
    );
    await expect(connect(userId)).resolves.toBeTruthy();
  });

  it('déclare en base les mêmes états que le code', async () => {
    const { rows } = await db!.query<{ def: string }>(
      `select pg_get_constraintdef(oid) as def from pg_constraint
        where conrelid = 'identity.connection'::regclass and conname like '%status%'`,
    );
    const def = rows.map((r) => r.def).join(' ');
    for (const statut of CONNECTION_STATUSES) {
      expect(def, `état ${statut} absent de la contrainte`).toContain(statut);
    }
  });
});

describe.skipIf(!available)('Isolation — la connexion d’un autre reste invisible', () => {
  async function asUser(userId: string, sql: string, params: unknown[] = []): Promise<unknown[]> {
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
      return result.rows;
    } finally {
      await client.end();
    }
  }

  it('ne montre à un utilisateur que ses propres connexions', async () => {
    const a = await fixtureUser();
    const b = await fixtureUser();
    await connect(a);
    await connect(b);
    const vues = await asUser(a, 'select connection_id from identity.connection');
    expect(vues).toHaveLength(1);
  });

  it('n’accorde au client aucun droit d’écriture', async () => {
    const { rows } = await db!.query<{ priv: string; granted: boolean }>(
      `select p.priv, has_table_privilege('authenticated', 'identity.connection', p.priv) as granted
         from unnest(array['insert','update','delete']) as p(priv)`,
    );
    expect(rows.filter((r) => r.granted).map((r) => r.priv)).toEqual([]);
  });

  it('ne laisse pas lire la liste des scopes autorisés', async () => {
    const { rows } = await db!.query<{ granted: boolean }>(
      `select has_table_privilege('authenticated', 'identity.provider_scope', 'select') as granted`,
    );
    expect(rows[0]?.granted).toBe(false);
  });
});

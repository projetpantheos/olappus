/**
 * Chiffrement L3 porté par la base — `SEC-31`, ADR-0008.
 *
 * Ces tests attaquent la base directement, en contournant tout code applicatif.
 * C'est le seul moyen de prouver ce que `SEC-31` exige réellement : qu'un champ
 * L3 **ne peut pas** recevoir de valeur en clair, y compris quand le code se
 * trompe et y compris par un accès SQL direct.
 *
 * Un contrôle porté par la discipline de l'appelant n'est pas un contrôle.
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

import {
  DEFAULT_KDF_PARAMS,
  KDF,
  decryptField,
  deriveKek,
  encryptField,
  randomDek,
  randomSalt,
  secretEquals,
  unwrapDek,
  wrapDek,
  type Binding,
} from './crypto';
import { encryptedFields, type Registry } from './data-registry';

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

/** Crée un utilisateur et le Case auquel rattacher une action. */
async function fixtureUser(): Promise<{ userId: string; caseId: string }> {
  const userId = randomUUID();
  await db!.query(
    `insert into auth.users (id, instance_id, aud, role, email)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2)`,
    [userId, `${userId}@synthetique.test`],
  );
  await db!.query('insert into core."user" (user_id) values ($1)', [userId]);
  const caseId = randomUUID();
  await db!.query(
    `insert into core."case" (case_id, user_id, module_id, type) values ($1, $2, 'test', 'TEST')`,
    [caseId, userId],
  );
  return { userId, caseId };
}

async function insertAction(caseId: string, userId: string, payload: unknown): Promise<void> {
  await db!.query(
    `insert into core.action (case_id, user_id, type, risk_level, permission_level, prepared_payload)
     values ($1, $2, 'TEST', 'LOW', 'PREPARE', $3)`,
    [caseId, userId, payload === null ? null : JSON.stringify(payload)],
  );
}

/** Exécute une requête sous l'identité d'un utilisateur authentifié. */
async function asUser(userId: string, sql: string): Promise<Record<string, unknown>[]> {
  const client = new Client(CONNECTION);
  await client.connect();
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', [
      'request.jwt.claims',
      JSON.stringify({ sub: userId, role: 'authenticated' }),
    ]);
    await client.query('set local role authenticated');
    const result = await client.query(sql);
    await client.query('commit');
    return result.rows as Record<string, unknown>[];
  } finally {
    await client.end();
  }
}

beforeAll(async () => {
  if (!available) return;
  db = new Client(CONNECTION);
  await db.connect();
});

afterAll(async () => {
  if (db) await db.end();
});

describe.skipIf(!available)('La base refuse le clair sur un champ L3', () => {
  it('rejette une charge préparée en clair', async () => {
    // Le contrôle qui compte : même en SQL direct, avec tous les droits, on ne
    // peut pas écrire le destinataire d'une action en clair.
    const { userId, caseId } = await fixtureUser();
    await expect(
      insertAction(caseId, userId, { recipient: 'service@marchand.test', body: 'Réclamation' }),
    ).rejects.toThrow(/action_prepared_payload_encrypted/);
  });

  it('accepte une enveloppe chiffrée valide', async () => {
    const { userId, caseId } = await fixtureUser();
    const sealed = encryptField(
      JSON.stringify({ recipient_ref: randomUUID() }),
      { version: 1, key: randomDek() },
      { actorId: userId, entity: 'core.action', field: 'prepared_payload', rowId: caseId },
    );
    await expect(insertAction(caseId, userId, sealed)).resolves.toBeUndefined();
  });

  it('accepte l’absence de charge — une action peut n’avoir rien à préparer', async () => {
    const { userId, caseId } = await fixtureUser();
    await expect(insertAction(caseId, userId, null)).resolves.toBeUndefined();
  });

  it('rejette une enveloppe à laquelle on a joint le clair', async () => {
    // Sans cette borne, on croirait la donnée protégée parce que la forme est
    // respectée, alors que le clair voyage à côté du chiffré.
    const { userId, caseId } = await fixtureUser();
    const sealed = encryptField(
      'valeur',
      { version: 1, key: randomDek() },
      { actorId: userId, entity: 'core.action', field: 'prepared_payload', rowId: caseId },
    );
    await expect(
      insertAction(caseId, userId, { ...sealed, recipient: 'service@marchand.test' }),
    ).rejects.toThrow(/action_prepared_payload_encrypted/);
  });

  it('rejette une enveloppe sans tag d’authentification', async () => {
    const { userId, caseId } = await fixtureUser();
    const sealed = encryptField(
      'valeur',
      { version: 1, key: randomDek() },
      { actorId: userId, entity: 'core.action', field: 'prepared_payload', rowId: caseId },
    );
    const { tag: _tag, ...sansTag } = sealed;
    await expect(insertAction(caseId, userId, sansTag)).rejects.toThrow(
      /action_prepared_payload_encrypted/,
    );
  });

  it('rejette un algorithme substitué', async () => {
    const { userId, caseId } = await fixtureUser();
    const sealed = encryptField(
      'valeur',
      { version: 1, key: randomDek() },
      { actorId: userId, entity: 'core.action', field: 'prepared_payload', rowId: caseId },
    );
    await expect(insertAction(caseId, userId, { ...sealed, alg: 'AES-128-CBC' })).rejects.toThrow(
      /action_prepared_payload_encrypted/,
    );
  });

  it('rejette une mise à jour vers du clair', async () => {
    // Une contrainte qui ne tiendrait qu'à l'insertion se contournerait par un
    // update — c'est exactement la faute trouvée en G5 sur la publication IA.
    const { userId, caseId } = await fixtureUser();
    const sealed = encryptField(
      'valeur',
      { version: 1, key: randomDek() },
      { actorId: userId, entity: 'core.action', field: 'prepared_payload', rowId: caseId },
    );
    await insertAction(caseId, userId, sealed);
    await expect(
      db!.query(
        `update core.action set prepared_payload = '{"recipient":"a@b.test"}'::jsonb
                  where case_id = $1`,
        [caseId],
      ),
    ).rejects.toThrow(/action_prepared_payload_encrypted/);
  });
});

describe.skipIf(!available)('Clés utilisateur — le serveur ne détient rien qui ouvre', () => {
  async function insertKey(
    userId: string,
    version: number,
    wrapped: unknown,
    status = 'ACTIVE',
  ): Promise<void> {
    await db!.query(
      `insert into identity.user_key
         (user_id, key_version, wrapped_dek, kdf, kdf_salt, kdf_params, status, revoked_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        version,
        JSON.stringify(wrapped),
        KDF,
        randomSalt().toString('base64'),
        JSON.stringify(DEFAULT_KDF_PARAMS),
        status,
        status === 'REVOKED' ? new Date() : null,
      ],
    );
  }

  function wrapped(userId: string, version = 1): ReturnType<typeof wrapDek> {
    const kek = deriveKek('secret-de-recuperation', randomSalt(), { N: 1024, r: 8, p: 1 });
    return wrapDek(randomDek(), kek, version, {
      actorId: userId,
      entity: 'identity.user_key',
      field: 'wrapped_dek',
      rowId: userId,
    });
  }

  it('n’accepte qu’une DEK enveloppée, jamais une clé en clair', async () => {
    const { userId } = await fixtureUser();
    await expect(insertKey(userId, 1, { key: randomDek().toString('base64') })).rejects.toThrow(
      /user_key_wrapped_is_envelope/,
    );
  });

  it('accepte une DEK correctement enveloppée', async () => {
    const { userId } = await fixtureUser();
    await expect(insertKey(userId, 1, wrapped(userId))).resolves.toBeUndefined();
  });

  it('n’autorise qu’une seule clé ACTIVE par utilisateur', async () => {
    // Deux clés actives, ce sont deux vérités sur « avec quoi chiffre-t-on
    // maintenant » — et une donnée qu'on ne saura plus relire.
    const { userId } = await fixtureUser();
    await insertKey(userId, 1, wrapped(userId, 1));
    await expect(insertKey(userId, 2, wrapped(userId, 2))).rejects.toThrow(
      /user_key_single_active/,
    );
  });

  it('accepte une clé sortante à côté de la clé active — c’est ce qui rend la rotation possible', async () => {
    const { userId } = await fixtureUser();
    await insertKey(userId, 1, wrapped(userId, 1), 'RETIRING');
    await expect(insertKey(userId, 2, wrapped(userId, 2))).resolves.toBeUndefined();
  });

  it('exige une date sur toute révocation', async () => {
    const { userId } = await fixtureUser();
    await expect(
      db!.query(
        `insert into identity.user_key
           (user_id, key_version, wrapped_dek, kdf_salt, kdf_params, status, revoked_at)
         values ($1, 1, $2, 'sel', '{}'::jsonb, 'REVOKED', null)`,
        [userId, JSON.stringify(wrapped(userId))],
      ),
    ).rejects.toThrow(/user_key_revocation_dated/);
  });

  it('refuse deux fois la même version de clé', async () => {
    const { userId } = await fixtureUser();
    await insertKey(userId, 1, wrapped(userId, 1), 'RETIRING');
    await expect(insertKey(userId, 1, wrapped(userId, 1))).rejects.toThrow(
      /user_key_version_unique/,
    );
  });

  it('ne stocke aucune colonne susceptible de contenir une clé en clair', async () => {
    // ADR-0008 : aucune clé maître serveur. Ce test vérifie l'absence plutôt
    // que de la supposer — une colonne ajoutée par mégarde le ferait échouer.
    const { rows } = await db!.query<{ full: string }>(
      `select table_schema || '.' || table_name || '.' || column_name as full
         from information_schema.columns
        where table_schema in ('identity','core','source','extraction','domain','knowledge','audit')
          and (column_name ~ '(^|_)(dek|kek|private_key|secret|passphrase|plaintext)($|_)')`,
    );
    expect(rows.map((r) => r.full)).toEqual(['identity.user_key.wrapped_dek']);
  });
});

describe.skipIf(!available)('Le registre et la base disent la même chose', () => {
  it('impose une contrainte en base pour chaque champ déclaré chiffré', async () => {
    // Un champ déclaré chiffré au registre et sans contrainte en base ferait
    // mentir la gouvernance — c'est le pire des deux mondes : la confiance
    // sans la protection.
    const { rows } = await db!.query<{ tbl: string; def: string }>(
      `select rel.relnamespace::regnamespace::text || '.' || rel.relname as tbl,
              pg_get_constraintdef(con.oid) as def
         from pg_constraint con
         join pg_class rel on rel.oid = con.conrelid
        where con.contype = 'c'`,
    );

    const nonProtégés = encryptedFields(registry).filter((full) => {
      const lastDot = full.lastIndexOf('.');
      const table = full.slice(0, lastDot);
      const column = full.slice(lastDot + 1);
      return !rows.some(
        (r) =>
          r.tbl === table && r.def.includes('is_ciphertext_envelope') && r.def.includes(column),
      );
    });

    expect(nonProtégés, 'champs déclarés chiffrés sans contrainte en base').toEqual([]);
  });

  it('protège la table des clés par RLS, activée et forcée', async () => {
    // Le chiffrement est une défense en profondeur, jamais un substitut à RLS.
    const { rows } = await db!.query<{ relrowsecurity: boolean; relforcerowsecurity: boolean }>(
      `select relrowsecurity, relforcerowsecurity
         from pg_class where oid = 'identity.user_key'::regclass`,
    );
    expect(rows[0]?.relrowsecurity).toBe(true);
    expect(rows[0]?.relforcerowsecurity).toBe(true);
  });

  it('ne donne au client aucun droit sur la table des clés', async () => {
    // Le schéma identity est accessible depuis G2, pour que chacun lise son
    // propre appareil. La protection ne vient donc pas du schéma mais du
    // deny-by-default : cette table n'a reçu aucun grant, et n'en recevra pas.
    const { rows } = await db!.query<{ priv: string; granted: boolean }>(
      `select p.priv, has_table_privilege('authenticated', 'identity.user_key', p.priv) as granted
         from unnest(array['select','insert','update','delete']) as p(priv)`,
    );
    expect(rows.filter((r) => r.granted).map((r) => r.priv)).toEqual([]);
  });

  it('n’ouvre la DEK enveloppée que par une porte nommée, et seulement la sienne', async () => {
    const a = await fixtureUser();
    const b = await fixtureUser();
    const binding = (id: string) => ({
      actorId: id,
      entity: 'identity.user_key',
      field: 'wrapped_dek',
      rowId: id,
    });
    const kek = deriveKek('secret', randomSalt(), { N: 1024, r: 8, p: 1 });
    for (const { userId } of [a, b]) {
      await db!.query(
        `insert into identity.user_key (user_id, key_version, wrapped_dek, kdf_salt, kdf_params)
         values ($1, 1, $2, 'sel', '{}'::jsonb)`,
        [userId, JSON.stringify(wrapDek(randomDek(), kek, 1, binding(userId)))],
      );
    }

    const vu = await asUser(a.userId, 'select key_version from core.my_key_material()');
    expect(vu).toHaveLength(1);
  });
});

describe.skipIf(!available)('Aller-retour complet — le code et la base s’accordent', () => {
  it('relit et déchiffre ce qu’il a écrit', async () => {
    const { userId, caseId } = await fixtureUser();
    const binding: Binding = {
      actorId: userId,
      entity: 'core.action',
      field: 'prepared_payload',
      rowId: caseId,
    };
    const clair = JSON.stringify({ recipient_ref: randomUUID(), motif: 'garantie légale' });
    const key = { version: 1, key: randomDek() };

    await insertAction(caseId, userId, encryptField(clair, key, binding));

    const { rows } = await db!.query<{ prepared_payload: unknown }>(
      'select prepared_payload from core.action where case_id = $1',
      [caseId],
    );
    const stocké = rows[0]?.prepared_payload as Parameters<typeof decryptField>[0];

    expect(JSON.stringify(stocké)).not.toContain('garantie légale');
    expect(decryptField(stocké, new Map([[1, key.key]]), binding)).toBe(clair);
  });

  it('déverrouille la DEK depuis le matériel stocké, et pas autrement', async () => {
    const { userId } = await fixtureUser();
    const binding: Binding = {
      actorId: userId,
      entity: 'identity.user_key',
      field: 'wrapped_dek',
      rowId: userId,
    };
    const params = { N: 1024, r: 8, p: 1 };
    const salt = randomSalt();
    const dek = randomDek();
    const kek = deriveKek('codes-de-recuperation', salt, params);

    await db!.query(
      `insert into identity.user_key (user_id, key_version, wrapped_dek, kdf_salt, kdf_params)
       values ($1, 1, $2, $3, $4)`,
      [
        userId,
        JSON.stringify(wrapDek(dek, kek, 1, binding)),
        salt.toString('base64'),
        JSON.stringify(params),
      ],
    );

    const { rows } = await db!.query<{
      wrapped_dek: unknown;
      kdf_salt: string;
      kdf_params: unknown;
    }>('select wrapped_dek, kdf_salt, kdf_params from identity.user_key where user_id = $1', [
      userId,
    ]);
    const ligne = rows[0];
    const rejoué = deriveKek(
      'codes-de-recuperation',
      Buffer.from(ligne?.kdf_salt ?? '', 'base64'),
      ligne?.kdf_params as typeof params,
    );

    expect(
      secretEquals(
        unwrapDek(ligne?.wrapped_dek as Parameters<typeof unwrapDek>[0], rejoué, binding),
        dek,
      ),
    ).toBe(true);
  });
});

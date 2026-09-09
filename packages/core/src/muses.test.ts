/**
 * Muses minimal et License Gate — G5.
 * Tests d'acceptation P0 n°23 à 27.
 *
 * La condition de sortie de G5 est précise : **une source `blocked` rend
 * l'ingestion impossible même si l'endpoint répond**. C'est pourquoi ces tests
 * attaquent la base directement — un endpoint qui répond ne prouve rien, et un
 * garde applicatif se contourne.
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

const CONNECTION = {
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: process.env['SUPABASE_LOCAL_DB_PASSWORD'] ?? 'postgres',
  database: 'postgres',
} as const;

interface SourceRegistry {
  readonly ingestible_statuses: readonly string[];
  readonly statuses: Record<string, string>;
  readonly sources: readonly {
    source_id: string;
    status: string;
    license_verified: boolean;
    license_name?: string | null;
    blocking_conditions?: readonly string[];
  }[];
  readonly approval_checklist: readonly string[];
}

const registry = parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      '..',
      'governance',
      'source_registry.yaml',
    ),
    'utf8',
  ),
) as SourceRegistry;

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

/** Crée une source enregistrée mais non approuvée, licence non vérifiée. */
async function reviewRequiredSource(id: string): Promise<string> {
  await db!.query(
    `insert into knowledge.source (source_id, name, jurisdiction, status)
     values ($1, 'Source synthétique en revue', 'FR', 'REVIEW_REQUIRED')`,
    [id],
  );
  return id;
}

/** Crée une source approuvée, licence vérifiée — le seul chemin légitime. */
async function approvedSource(id: string): Promise<string> {
  await db!.query(
    `insert into knowledge.source
       (source_id, name, jurisdiction, status, license_name, license_verified, last_checked_at)
     values ($1, 'Source synthétique', 'FR', 'APPROVED', 'Licence de test', true, now())`,
    [id],
  );
  return id;
}

async function insertFact(
  sourceId: string,
  overrides: Partial<{
    status: string;
    verification_level: string;
    valid_from: string | null;
    valid_to: string | null;
    subject: string;
    object_value: string;
  }> = {},
): Promise<string> {
  const rows = await db!.query<{ fact_id: string }>(
    `insert into knowledge.fact
       (source_id, subject, predicate, object_value, jurisdiction,
        valid_from, valid_to, status, verification_level)
     values ($1, $2, 'delai_jours', $3, 'FR', $4, $5, $6, $7)
     returning fact_id`,
    [
      sourceId,
      overrides.subject ?? 'garantie_legale_conformite',
      overrides.object_value ?? '730',
      overrides.valid_from ?? '2020-01-01',
      overrides.valid_to ?? null,
      overrides.status ?? 'UNVERIFIED',
      overrides.verification_level ?? 'OFFICIAL',
    ],
  );
  return rows.rows[0]!.fact_id;
}

beforeAll(async () => {
  if (!available) return;
  db = new Client(CONNECTION);
  await db.connect();
});

afterAll(async () => {
  if (db) await db.end();
});

describe.skipIf(!available)('License Gate — la condition de sortie de G5', () => {
  it('refuse toute ingestion depuis une source non approuvée', async () => {
    // Une source enregistrée mais non approuvée est inerte. Un endpoint qui
    // répondrait n'y changerait rien.
    const id = await reviewRequiredSource(`src-revue-${randomUUID().slice(0, 8)}`);
    await expect(insertFact(id)).rejects.toThrow(/License Gate/i);
  });

  it('refuse l’ingestion depuis les sources réelles du registre', async () => {
    // Le contrôle qui compte vraiment : aucune source réelle n'est ingérable
    // aujourd'hui. Il lit le registre au lieu de nommer une source en dur, pour
    // ne pas devenir faux le jour où l'une d'elles sera approuvée.
    for (const source of registry.sources) {
      if (registry.ingestible_statuses.includes(source.status)) continue;
      await expect(insertFact(source.source_id), source.source_id).rejects.toThrow(/License Gate/i);
    }
  });

  it('refuse une source inconnue — default deny', async () => {
    await expect(insertFact('source-jamais-enregistree')).rejects.toThrow();
  });

  it('autorise une source approuvée dont la licence est vérifiée', async () => {
    const id = await approvedSource(`src-ok-${randomUUID().slice(0, 8)}`);
    await expect(insertFact(id)).resolves.toBeTruthy();
  });

  it('interdit d’approuver une source sans licence vérifiée', async () => {
    // Le cœur du gate : on ne peut pas contourner la vérification en passant
    // simplement le statut à APPROVED.
    //
    // Sur une source synthétique, jamais sur une source du registre : ce test
    // écrit, et le 2026-09-09 il a réellement approuvé Légifrance en base parce
    // que sa licence venait d'être vérifiée. Le test de dérive l'a rattrapé,
    // mais un test qui modifie une donnée de gouvernance ne devrait pas exister.
    const id = await reviewRequiredSource(`src-sans-licence-${randomUUID().slice(0, 8)}`);
    await expect(
      db!.query(`update knowledge.source set status = 'APPROVED' where source_id = $1`, [id]),
    ).rejects.toThrow();
  });

  it('rend une source inerte dès qu’elle repasse en revue', async () => {
    const id = await approvedSource(`src-revoq-${randomUUID().slice(0, 8)}`);
    await insertFact(id);
    await db!.query(
      `update knowledge.source
          set status = 'REVIEW_REQUIRED', license_verified = false,
              license_name = null, last_checked_at = null
        where source_id = $1`,
      [id],
    );
    await expect(insertFact(id)).rejects.toThrow(/License Gate/i);
  });
});

describe.skipIf(!available)('Muses — l’IA propose, elle ne certifie jamais', () => {
  it('refuse qu’une proposition IA atteigne un statut publié', async () => {
    // Test d'acceptation n°23. AI-11 : l'IA peut proposer, jamais créer
    // directement une connaissance validée ou certifiée.
    const id = await approvedSource(`src-ia-${randomUUID().slice(0, 8)}`);
    for (const status of ['VALIDATED', 'CERTIFIED', 'PUBLISHED']) {
      await expect(insertFact(id, { status, verification_level: 'AI_PROPOSED' })).rejects.toThrow(
        /proposition IA/i,
      );
    }
  });

  it('accepte une proposition IA au statut de proposition', async () => {
    const id = await approvedSource(`src-ia2-${randomUUID().slice(0, 8)}`);
    await expect(
      insertFact(id, { status: 'PROPOSED', verification_level: 'AI_PROPOSED' }),
    ).resolves.toBeTruthy();
  });

  it('refuse de promouvoir après coup une proposition IA', async () => {
    // Le garde s'applique aussi à la mise à jour : passer par PROPOSED puis
    // promouvoir serait le contournement évident.
    const id = await approvedSource(`src-ia3-${randomUUID().slice(0, 8)}`);
    const factId = await insertFact(id, {
      status: 'PROPOSED',
      verification_level: 'AI_PROPOSED',
    });
    await expect(
      db!.query(`update knowledge.fact set status = 'PUBLISHED' where fact_id = $1`, [factId]),
    ).rejects.toThrow(/proposition IA/i);
  });
});

describe.skipIf(!available)('Muses — quorum indépendant', () => {
  it('ne compte pas deux comptes liés comme deux validations', async () => {
    // Test d'acceptation n°24. docs/09 : des validateurs issus d'un même
    // cluster ne constituent pas un quorum.
    const id = await approvedSource(`src-quorum-${randomUUID().slice(0, 8)}`);
    const factId = await insertFact(id);
    for (const reviewer of [randomUUID(), randomUUID()]) {
      await db!.query(
        `insert into knowledge.review (fact_id, reviewer_id, origin_group, verdict)
         values ($1, $2, 'cluster-unique', 'APPROVE')`,
        [factId, reviewer],
      );
    }
    const rows = await db!.query<{ quorum: boolean }>(
      'select knowledge.has_independent_quorum($1) as quorum',
      [factId],
    );
    expect(rows.rows[0]!.quorum).toBe(false);
  });

  it('reconnaît un quorum de validateurs indépendants', async () => {
    const id = await approvedSource(`src-quorum2-${randomUUID().slice(0, 8)}`);
    const factId = await insertFact(id);
    for (const group of ['origine-a', 'origine-b']) {
      await db!.query(
        `insert into knowledge.review (fact_id, reviewer_id, origin_group, verdict)
         values ($1, $2, $3, 'APPROVE')`,
        [factId, randomUUID(), group],
      );
    }
    const rows = await db!.query<{ quorum: boolean }>(
      'select knowledge.has_independent_quorum($1) as quorum',
      [factId],
    );
    expect(rows.rows[0]!.quorum).toBe(true);
  });

  it('ne compte pas un rejet comme une validation', async () => {
    const id = await approvedSource(`src-quorum3-${randomUUID().slice(0, 8)}`);
    const factId = await insertFact(id);
    await db!.query(
      `insert into knowledge.review (fact_id, reviewer_id, origin_group, verdict)
       values ($1, $2, 'a', 'APPROVE'), ($1, $3, 'b', 'REJECT')`,
      [factId, randomUUID(), randomUUID()],
    );
    const rows = await db!.query<{ quorum: boolean }>(
      'select knowledge.has_independent_quorum($1) as quorum',
      [factId],
    );
    expect(rows.rows[0]!.quorum).toBe(false);
  });
});

describe.skipIf(!available)('Muses — contradictions et temporalité', () => {
  it('conserve les deux connaissances contradictoires', async () => {
    // Test d'acceptation n°25. AI-10 : la source « perdante » est conservée
    // avec la résolution, jamais supprimée.
    const id = await approvedSource(`src-conflit-${randomUUID().slice(0, 8)}`);
    const a = await insertFact(id, { object_value: '730' });
    const b = await insertFact(id, { object_value: '1095' });
    await db!.query(
      `insert into knowledge.conflict (subject, predicate, fact_a, fact_b, resolution)
       values ('garantie_legale_conformite', 'delai_jours', $1, $2, 'A_WINS')`,
      [a, b],
    );
    const rows = await db!.query<{ n: number }>(
      'select count(*)::int as n from knowledge.fact where fact_id in ($1, $2)',
      [a, b],
    );
    expect(Number(rows.rows[0]!.n)).toBe(2);
  });

  it('refuse un conflit d’une connaissance avec elle-même', async () => {
    const id = await approvedSource(`src-conflit2-${randomUUID().slice(0, 8)}`);
    const a = await insertFact(id);
    await expect(
      db!.query(
        `insert into knowledge.conflict (subject, predicate, fact_a, fact_b)
         values ('x', 'y', $1, $1)`,
        [a],
      ),
    ).rejects.toThrow();
  });

  it('sélectionne la règle applicable à une date donnée', async () => {
    // Test d'acceptation n°26. Une règle expirée ne s'applique pas.
    const id = await approvedSource(`src-temps-${randomUUID().slice(0, 8)}`);
    const ancienne = await insertFact(id, {
      subject: `sujet-${randomUUID().slice(0, 8)}`,
      valid_from: '2019-01-01',
      valid_to: '2021-12-31',
      status: 'PUBLISHED',
    });
    const courante = await insertFact(id, {
      subject: `sujet-courant-${randomUUID().slice(0, 8)}`,
      valid_from: '2022-01-01',
      valid_to: null,
      status: 'PUBLISHED',
    });

    const rows = await db!.query<{ fact_id: string }>(
      `select fact_id from knowledge.fact
        where fact_id in ($1, $2)
          and valid_from <= current_date
          and (valid_to is null or valid_to >= current_date)`,
      [ancienne, courante],
    );
    expect(rows.rows.map((r) => r.fact_id)).toEqual([courante]);
  });

  it('refuse une validité temporelle incohérente', async () => {
    const id = await approvedSource(`src-temps2-${randomUUID().slice(0, 8)}`);
    await expect(
      insertFact(id, { valid_from: '2026-01-01', valid_to: '2025-01-01' }),
    ).rejects.toThrow();
  });

  it('permet de suspendre une connaissance publiée sans la supprimer', async () => {
    // Test d'acceptation n°27. AI-10 : pas de modification silencieuse ;
    // SUSPENDED, puis REVIEW, puis republication ou retrait.
    const id = await approvedSource(`src-susp-${randomUUID().slice(0, 8)}`);
    const factId = await insertFact(id, { status: 'PUBLISHED' });
    await db!.query(`update knowledge.fact set status = 'SUSPENDED' where fact_id = $1`, [factId]);
    const rows = await db!.query<{ status: string }>(
      'select status from knowledge.fact where fact_id = $1',
      [factId],
    );
    expect(rows.rows[0]!.status).toBe('SUSPENDED');
  });
});

describe.skipIf(!available)('Registre des sources — la base et le YAML coïncident', () => {
  it('déclare en base chaque source du registre, avec le même statut', async () => {
    for (const source of registry.sources) {
      const rows = await db!.query<{ status: string }>(
        'select status from knowledge.source where source_id = $1',
        [source.source_id],
      );
      expect(rows.rows[0]?.status, `${source.source_id} absente de la base`).toBe(source.status);
    }
  });

  it('n’approuve aucune source dont la licence n’est pas vérifiée', async () => {
    for (const source of registry.sources) {
      if (registry.ingestible_statuses.includes(source.status)) {
        expect(source.license_verified, `${source.source_id} approuvée sans licence vérifiée`).toBe(
          true,
        );
      }
    }
  });

  it('assortit toute source non approuvée de ses conditions bloquantes', async () => {
    // Une source bloquée sans motif écrit est une source qu'on débloquera un
    // jour sans savoir ce qui manquait.
    for (const source of registry.sources) {
      if (!registry.ingestible_statuses.includes(source.status)) {
        expect(source.blocking_conditions?.length ?? 0, source.source_id).toBeGreaterThan(0);
      }
    }
  });

  it('porte en base la même vérification de licence que le registre', async () => {
    // Deux vérités sur le même sujet en produisent toujours une fausse. Le
    // jour où quelqu'un approuvera une source, c'est la base qui décidera —
    // elle doit donc porter les mêmes valeurs que le YAML, pas des valeurs
    // voisines.
    const rows = await db!.query<{
      source_id: string;
      license_name: string | null;
      license_verified: boolean;
      last_checked_at: Date | null;
    }>('select source_id, license_name, license_verified, last_checked_at from knowledge.source');

    for (const source of registry.sources) {
      const row = rows.rows.find((r) => r.source_id === source.source_id);
      expect(row, source.source_id).toBeDefined();
      expect(row?.license_verified, `${source.source_id} : license_verified divergent`).toBe(
        source.license_verified,
      );
      expect(row?.license_name ?? null, `${source.source_id} : license_name divergent`).toBe(
        source.license_name ?? null,
      );
      // Une licence déclarée vérifiée sans date n'est pas une vérification.
      if (source.license_verified) {
        expect(
          row?.last_checked_at,
          `${source.source_id} : date de vérification absente`,
        ).not.toBeNull();
      }
    }
  });

  it('ne confond pas licence vérifiée et source approuvée', () => {
    // Le piège de cette étape. Les deux licences sont vérifiées ; aucune source
    // n'est ingérable, parce que les quotas et le cache restent ouverts.
    const verified = registry.sources.filter((s) => s.license_verified);
    expect(verified.length).toBeGreaterThan(0);
    for (const source of verified) {
      if (!registry.ingestible_statuses.includes(source.status)) {
        expect(source.blocking_conditions?.length ?? 0, source.source_id).toBeGreaterThan(0);
      }
    }
  });

  it('écrit chaque condition bloquante comme une phrase, pas comme une paire', () => {
    // Défaut trouvé le 2026-09-09, présent depuis G5 : « Hors périmètre P0:
    // aucun module... » n'était pas une chaîne mais une paire clé/valeur. YAML
    // avale un « : » suivi d'une espace dans un scalaire non quoté. La
    // condition existait donc dans le fichier, comptait pour une, et se serait
    // affichée « [object Object] » à l'utilisateur.
    for (const source of registry.sources) {
      for (const condition of source.blocking_conditions ?? []) {
        expect(typeof condition, `${source.source_id} : condition non textuelle`).toBe('string');
        expect(String(condition).trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('porte une liste de contrôle d’approbation', async () => {
    expect(registry.approval_checklist.length).toBeGreaterThanOrEqual(5);
  });
});

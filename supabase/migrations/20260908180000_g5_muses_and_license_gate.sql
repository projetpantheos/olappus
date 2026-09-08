-- =============================================================================
-- G5 — Muses minimal et License Gate
--
-- AI-10 : SOURCE → OBSERVATION/FACT → PROPOSAL → INDEPENDENT REVIEW →
--         CERTIFICATION → PUBLICATION
--
-- Deux invariants sont portés par la base, pas par la discipline des appelants :
--   1. une source non approuvée ne peut rien produire, même si son endpoint
--      répond ;
--   2. une proposition d'IA ne peut jamais devenir une connaissance publiée.
-- =============================================================================

-- =============================================================================
-- knowledge.source — le registre des sources, en base
-- =============================================================================

create table knowledge.source (
  source_id      text primary key,
  name           text not null,
  jurisdiction   text,
  status         text not null default 'REVIEW_REQUIRED'
                   check (status in ('APPROVED', 'APPROVED_WITH_CONDITIONS',
                                     'REVIEW_REQUIRED', 'REJECTED', 'DEPRECATED')),
  license_name       text,
  license_verified   boolean not null default false,
  last_checked_at    timestamptz,
  created_at         timestamptz not null default now(),

  -- Le coeur du License Gate : approuver sans licence verifiee est impossible.
  -- Ce n'est pas une convention, c'est une contrainte.
  constraint source_approval_requires_verified_license
    check (
      status not in ('APPROVED', 'APPROVED_WITH_CONDITIONS')
      or (license_verified = true and license_name is not null and last_checked_at is not null)
    )
);

comment on table knowledge.source is
  'Registre des sources externes. Default deny : seuls APPROVED et APPROVED_WITH_CONDITIONS ouvrent l''ingestion, et exigent une licence verifiee.';

-- Sources du registre YAML, dans leur etat reel : non verifiees.
insert into knowledge.source (source_id, name, jurisdiction, status) values
  ('legifrance',  'Légifrance',  'FR', 'REVIEW_REQUIRED'),
  ('rappelconso', 'RappelConso', 'FR', 'REVIEW_REQUIRED');

create or replace function knowledge.is_source_ingestible(p_source_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select status in ('APPROVED', 'APPROVED_WITH_CONDITIONS')
       from knowledge.source where source_id = p_source_id),
    false  -- source inconnue : refusee. Default deny.
  );
$$;

comment on function knowledge.is_source_ingestible is
  'Default deny : une source inconnue est refusee au meme titre qu''une source bloquee.';

-- =============================================================================
-- knowledge.fact — connaissance issue d'une source
-- =============================================================================

create table knowledge.fact (
  fact_id       uuid primary key default gen_random_uuid(),
  source_id     text not null references knowledge.source (source_id),
  subject       text not null,
  predicate     text not null,
  object_value  text not null,
  jurisdiction  text,
  valid_from    date,
  valid_to      date,
  status        text not null default 'UNVERIFIED'
                  check (status in ('UNVERIFIED', 'PROPOSED', 'UNDER_REVIEW',
                                    'VALIDATED', 'CERTIFIED', 'PUBLISHED',
                                    'SUSPENDED', 'RETIRED')),
  verification_level text not null
                       check (verification_level in ('OFFICIAL', 'CERTIFIED', 'VALIDATED',
                                                     'COMMUNITY', 'AI_PROPOSED')),
  version       integer not null default 1,
  contradiction_group uuid,
  created_at    timestamptz not null default now(),

  constraint fact_validity_order check (valid_to is null or valid_to > valid_from)
);

comment on table knowledge.fact is
  'Connaissance collective. Aucune donnee personnelle (AI-10). Une correction cree une nouvelle version, jamais un ecrasement.';

create index fact_subject_idx on knowledge.fact (subject, predicate);

-- --- License Gate : rien n'entre depuis une source non approuvée -------------
-- C'est la condition de sortie de G5. Le declencheur s'applique y compris a un
-- acces direct : un endpoint qui repond ne suffit jamais.

create or replace function knowledge.enforce_license_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not knowledge.is_source_ingestible(new.source_id) then
    raise exception
      'License Gate : la source % n''est pas approuvee, aucune ingestion possible', new.source_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger fact_license_gate
  before insert or update on knowledge.fact
  for each row execute function knowledge.enforce_license_gate();

-- --- Une proposition d'IA ne devient jamais une connaissance publiée ---------
-- AI-11 : « l'IA peut proposer, elle ne peut jamais creer directement une
-- connaissance validee ou certifiee ». Porte en base, la regle tient meme si un
-- appelant l'oublie.

create or replace function knowledge.forbid_ai_publication()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.verification_level = 'AI_PROPOSED'
     and new.status in ('VALIDATED', 'CERTIFIED', 'PUBLISHED')
  then
    raise exception
      'Une proposition IA ne peut pas atteindre le statut % sans gouvernance humaine', new.status
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger fact_ai_publication_guard
  before insert or update on knowledge.fact
  for each row execute function knowledge.forbid_ai_publication();

-- =============================================================================
-- knowledge.proposal, review, certification
-- =============================================================================

create table knowledge.proposal (
  proposal_id  uuid primary key default gen_random_uuid(),
  fact_id      uuid not null references knowledge.fact (fact_id) on delete cascade,
  origin       text not null check (origin in ('HUMAN', 'AI', 'OFFICIAL_SOURCE')),
  content      text not null,
  created_at   timestamptz not null default now()
);

comment on table knowledge.proposal is
  'Proposition de connaissance. Une proposition n''est pas une connaissance : elle attend une revue.';

create table knowledge.review (
  review_id    uuid primary key default gen_random_uuid(),
  fact_id      uuid not null references knowledge.fact (fact_id) on delete cascade,
  reviewer_id  uuid not null,
  -- Deux validateurs issus de la meme origine ne constituent pas deux
  -- validations independantes (docs/09, AI-10).
  origin_group text not null,
  verdict      text not null check (verdict in ('APPROVE', 'REJECT', 'ABSTAIN')),
  created_at   timestamptz not null default now(),

  constraint review_unique_per_reviewer unique (fact_id, reviewer_id)
);

comment on table knowledge.review is
  'Revue independante. origin_group sert a detecter un quorum artificiel : des comptes lies ne comptent pas comme independants.';

create table knowledge.certification (
  certification_id uuid primary key default gen_random_uuid(),
  fact_id          uuid not null references knowledge.fact (fact_id) on delete cascade,
  certified_by     uuid not null,
  certified_at     timestamptz not null default now(),
  revoked_at       timestamptz
);

comment on table knowledge.certification is
  'Certification revocable (docs/09). Une certification revoquee laisse sa trace.';

-- --- Quorum : deux validations humaines indépendantes + une certifiée -------
-- AI-10 pour les regles critiques. La fonction est exposee pour etre testee et
-- reutilisee, plutot que reecrite dans chaque appelant.

create or replace function knowledge.has_independent_quorum(p_fact_id uuid, p_required integer default 2)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select count(distinct origin_group) >= p_required
    from knowledge.review
   where fact_id = p_fact_id
     and verdict = 'APPROVE';
$$;

comment on function knowledge.has_independent_quorum is
  'Compte les groupes d''origine distincts, pas les validateurs : des comptes lies ne forment pas un quorum.';

-- =============================================================================
-- knowledge.conflict — les contradictions sont conservées
-- =============================================================================

create table knowledge.conflict (
  conflict_id  uuid primary key default gen_random_uuid(),
  subject      text not null,
  predicate    text not null,
  fact_a       uuid not null references knowledge.fact (fact_id) on delete cascade,
  fact_b       uuid not null references knowledge.fact (fact_id) on delete cascade,
  resolution   text check (resolution in ('A_WINS', 'B_WINS', 'UNRESOLVED')),
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),

  constraint conflict_distinct_facts check (fact_a <> fact_b)
);

comment on table knowledge.conflict is
  'Contradiction entre deux connaissances. AI-10 : la source « perdante » est conservee avec la resolution, jamais supprimee.';

-- =============================================================================
-- RLS
-- =============================================================================
-- La connaissance collective est lisible par tout compte authentifie : elle ne
-- contient aucune donnee personnelle. L'ecriture reste a la gouvernance.

alter table knowledge.source        enable row level security;
alter table knowledge.fact          enable row level security;
alter table knowledge.proposal      enable row level security;
alter table knowledge.review        enable row level security;
alter table knowledge.certification enable row level security;
alter table knowledge.conflict      enable row level security;

alter table knowledge.source        force row level security;
alter table knowledge.fact          force row level security;
alter table knowledge.proposal      force row level security;
alter table knowledge.review        force row level security;
alter table knowledge.certification force row level security;
alter table knowledge.conflict      force row level security;

grant select on knowledge.source, knowledge.fact, knowledge.conflict to authenticated;

create policy source_readable on knowledge.source
  for select to authenticated using (true);

-- Seule la connaissance publiée est visible : une proposition en cours de revue
-- n'a pas à circuler comme si elle était établie.
create policy fact_published_readable on knowledge.fact
  for select to authenticated using (status = 'PUBLISHED');

create policy conflict_readable on knowledge.conflict
  for select to authenticated using (true);

-- proposal, review et certification ne recoivent aucun grant : l'identite des
-- contributeurs n'est pas exposee dans la connaissance publique (AI-10).

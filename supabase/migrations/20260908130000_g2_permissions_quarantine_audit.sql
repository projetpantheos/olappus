-- =============================================================================
-- G2 — Permissions, quarantaine, extraction, audit et purge
--
-- Suite de 20260908120000. Mêmes principes : deny by default, RLS activée et
-- forcée, aucune table créée hors de ce que le Data Registry déclare.
--
-- Nouveauté : les durées de rétention d'ADR-0015 cessent d'être déclaratives.
-- Elles vivent dans `core.retention_policy`, et les fonctions de purge les
-- lisent. Une rétention sans purge est une rétention infinie qui s'ignore.
-- =============================================================================

-- =============================================================================
-- core.permission
-- =============================================================================
-- Dimensions imposées par SEC-08 :
-- WHO + ACTION + RESOURCE + CONDITIONS + DATA SCOPE + EXPIRATION.

create table core.permission (
  permission_id uuid primary key default gen_random_uuid(),
  user_id       uuid not null references core."user" (user_id) on delete cascade,
  action        text not null,
  resource      text not null,
  level         text not null
                  check (level in ('READ', 'SUGGEST', 'PREPARE',
                                   'EXECUTE_WITH_CONFIRMATION', 'AUTO_EXECUTE')),
  conditions    jsonb not null default '{}'::jsonb,
  data_scope    text not null,
  granted_at    timestamptz not null default now(),
  expires_at    timestamptz,
  revoked_at    timestamptz,

  -- Une permission expirée ou révoquée n'est jamais « presque valide ».
  constraint permission_revocation_consistency
    check (revoked_at is null or revoked_at >= granted_at),
  constraint permission_expiration_consistency
    check (expires_at is null or expires_at > granted_at)
);

comment on table core.permission is
  'Permission accordée par l''utilisateur (SEC-08). AUTO_EXECUTE existe dans le vocabulaire mais reste hors P0 : aucune action n''est exécutée sans confirmation.';

create index permission_user_idx on core.permission (user_id);

-- Une permission est utilisable si elle n'est ni révoquée ni expirée.
-- Concentrer cette règle ici évite qu'elle soit réécrite, et mal, dans chaque
-- appelant.
create or replace function core.permission_is_active(p core.permission)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select p.revoked_at is null
     and (p.expires_at is null or p.expires_at > now());
$$;

alter table core.permission enable row level security;
alter table core.permission force row level security;

grant usage on schema core to authenticated;
grant select on core.permission to authenticated;

-- Lecture seule côté client : accorder et révoquer une permission passe par le
-- serveur, avec audit. Une permission que le client pourrait s'accorder
-- lui-même ne serait pas une permission.
create policy permission_select_own on core.permission
  for select to authenticated
  using (user_id = (select auth.uid()));

-- =============================================================================
-- source.raw_quarantine
-- =============================================================================
-- Aucun `grant` : ce schéma reste inaccessible aux rôles client, y compris en
-- lecture. RLS est tout de même activée — défense en profondeur si un grant
-- était ajouté par erreur un jour.

create table source.raw_quarantine (
  source_id     uuid primary key default gen_random_uuid(),
  user_id       uuid not null references core."user" (user_id) on delete cascade,
  connector_id  text not null,
  payload_raw   bytea,
  content_hash  text not null,
  observed_at   timestamptz not null,
  created_at    timestamptz not null default now(),
  purged_at     timestamptz,

  -- Déduplication : la même charge, vue deux fois, n'est ingérée qu'une fois.
  constraint raw_quarantine_unique_content unique (user_id, connector_id, content_hash)
);

comment on table source.raw_quarantine is
  'Quarantaine. Rien n''en sort sans extraction, normalisation et minimisation. payload_raw est purgé après 7 jours (ADR-0015) ; les métadonnées de déduplication survivent le temps de la connexion.';

comment on column source.raw_quarantine.purged_at is
  'Date de purge de payload_raw. La ligne subsiste pour la déduplication, sans son contenu.';

create index raw_quarantine_purge_idx on source.raw_quarantine (created_at)
  where payload_raw is not null;

alter table source.raw_quarantine enable row level security;
alter table source.raw_quarantine force row level security;

-- =============================================================================
-- extraction.record
-- =============================================================================

create table extraction.record (
  extraction_id     uuid primary key default gen_random_uuid(),
  source_id         uuid not null references source.raw_quarantine (source_id) on delete cascade,
  user_id           uuid not null references core."user" (user_id) on delete cascade,
  extractor_version text not null,
  confidence        text not null
                      check (confidence in ('CONFIRMED', 'HIGH_CONFIDENCE', 'PROBABLE',
                                            'UNCERTAIN', 'INSUFFICIENT_DATA')),
  created_at        timestamptz not null default now()
);

comment on table extraction.record is
  'Extraction intermédiaire. extractor_version est obligatoire : sans elle, aucune correction n''est traçable et aucune explication reproductible.';

create index extraction_source_idx on extraction.record (source_id);

alter table extraction.record enable row level security;
alter table extraction.record force row level security;

-- =============================================================================
-- audit.action_log
-- =============================================================================

create table audit.action_log (
  entry_id    uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  action_id   uuid not null,
  occurred_at timestamptz not null default now()
);

comment on table audit.action_log is
  'Journal des actions externes. Append-only. Aucune valeur interdite par SEC-34 : ni jeton, ni corps brut, ni adresse. actor_id est nullable car il est anonymisé, et non supprimé, à la clôture du compte (SEC-33).';

create index action_log_occurred_idx on audit.action_log (occurred_at);

alter table audit.action_log enable row level security;
alter table audit.action_log force row level security;

-- Append-only : aucune politique d'UPDATE ni de DELETE n'est créée, donc
-- aucune n'est possible, même pour le propriétaire des données.

-- =============================================================================
-- Rétention exécutable
-- =============================================================================
-- ADR-0015 fixe les durées. Sans les tâches ci-dessous, ces durées ne seraient
-- que des commentaires dans un fichier YAML.

create table core.retention_policy (
  key           text primary key,
  interval_spec interval not null,
  authority     text not null,
  note          text not null
);

comment on table core.retention_policy is
  'Durées de rétention chiffrées. Toute valeur ici doit correspondre au vocabulaire de governance/data_registry.yaml — un test le vérifie.';

insert into core.retention_policy (key, interval_spec, authority, note) values
  ('days_7',    interval '7 days',    'ADR-0015',
   'Charge brute de quarantaine : delai de rejeu d''une extraction corrigee.'),
  ('months_24', interval '24 months', 'ADR-0015',
   'Audit des actions externes : horizon de la garantie legale de conformite.');

alter table core.retention_policy enable row level security;
alter table core.retention_policy force row level security;

-- --- Purge de la charge brute ------------------------------------------------
-- La ligne est conservée, son contenu est effacé : la déduplication doit
-- survivre à la purge, sinon une resynchronisation réingère tout.
create or replace function source.purge_expired_quarantine()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cutoff interval;
  purged integer;
begin
  select interval_spec into strict cutoff
    from core.retention_policy where key = 'days_7';

  update source.raw_quarantine
     set payload_raw = null,
         purged_at = now()
   where payload_raw is not null
     and created_at < now() - cutoff;

  get diagnostics purged = row_count;
  return purged;
end;
$$;

comment on function source.purge_expired_quarantine is
  'Efface payload_raw au-dela de la duree ADR-0015. Conserve la ligne pour la deduplication.';

-- --- Purge de l'audit --------------------------------------------------------
create or replace function audit.purge_expired_action_log()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cutoff interval;
  purged integer;
begin
  select interval_spec into strict cutoff
    from core.retention_policy where key = 'months_24';

  delete from audit.action_log
   where occurred_at < now() - cutoff;

  get diagnostics purged = row_count;
  return purged;
end;
$$;

comment on function audit.purge_expired_action_log is
  'Supprime les entrees d''audit au-dela de la duree ADR-0015.';

-- Ces fonctions sont exécutables par le service uniquement : aucun `grant`
-- n'est accordé aux rôles client.
revoke all on function source.purge_expired_quarantine() from public, anon, authenticated;
revoke all on function audit.purge_expired_action_log() from public, anon, authenticated;

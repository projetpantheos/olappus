-- =============================================================================
-- G2 — Schémas et base RLS
--
-- Autorité : ADR-0005 (schémas PostgreSQL), governance/data_registry.yaml.
-- Principe : deny by default. Aucun rôle client ne reçoit de droit par défaut ;
-- chaque accès est accordé explicitement, puis restreint par RLS.
--
-- Cette migration ne crée que des entités déclarées SPECIFIED au Data Registry.
-- Aucune table n'est créée « pour plus tard ».
-- =============================================================================

-- --- Schémas ----------------------------------------------------------------
create schema if not exists identity;
create schema if not exists core;
create schema if not exists source;
create schema if not exists extraction;
create schema if not exists domain;
create schema if not exists knowledge;
create schema if not exists audit;

comment on schema identity is 'Métadonnées d''identité uniquement. IDENTITY IS NOT DOMAIN DATA.';
comment on schema core is 'État métier de référence : Case, Detection, Action, Outcome, Evidence.';
comment on schema source is 'Quarantaine des charges brutes. Rien n''en sort sans normalisation.';
comment on schema extraction is 'Extractions intermédiaires, non durables par défaut.';
comment on schema domain is 'Domaine canonique normalisé.';
comment on schema knowledge is 'Connaissance collective. Aucune donnée personnelle.';
comment on schema audit is 'Journaux d''audit. Append-only.';

-- --- Deny by default --------------------------------------------------------
-- Les rôles client ne peuvent rien faire tant qu'un GRANT explicite n'est pas
-- posé. C'est ce qui rend le moindre privilège vérifiable plutôt que déclaratif.
revoke all on schema identity, core, source, extraction, domain, knowledge, audit
  from anon, authenticated;

alter default privileges in schema identity, core, source, extraction, domain, knowledge, audit
  revoke all on tables from anon, authenticated;

-- Les schémas de quarantaine, d'extraction et d'audit ne sont jamais exposés
-- au client, quel que soit l'utilisateur.
grant usage on schema core, domain, knowledge to authenticated;

-- =============================================================================
-- identity
-- =============================================================================

create table identity.device (
  device_id             uuid primary key default gen_random_uuid(),
  account_id            uuid not null references auth.users (id) on delete cascade,
  public_key_reference  text,
  status                text not null default 'active'
                          check (status in ('active', 'revoked')),
  created_at            timestamptz not null default now(),
  revoked_at            timestamptz,
  constraint device_revoked_consistency
    check ((status = 'revoked') = (revoked_at is not null))
);

comment on table identity.device is
  'Identité d''appareil, révocable et auditable (SEC-08). La révocation ne supprime pas la ligne : la trace est conservée pour l''audit.';

create index device_account_idx on identity.device (account_id);

-- =============================================================================
-- core
-- =============================================================================

create table core."user" (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

comment on table core."user" is
  'Identifiant métier opaque de l''utilisateur. Le domaine n''utilise jamais l''email comme clé (DAT-08).';

create table core."case" (
  case_id     uuid primary key default gen_random_uuid(),
  user_id     uuid not null references core."user" (user_id) on delete cascade,
  module_id   text not null,
  type        text not null,
  status      text not null default 'DETECTED'
                check (status in ('DETECTED', 'TRIAGED', 'EVIDENCE_READY',
                                  'ACTION_PROPOSED', 'WAITING_CONFIRMATION',
                                  'EXECUTING', 'WAITING_EXTERNAL',
                                  'RESOLVED', 'DISMISSED', 'EXPIRED')),
  priority    integer not null default 0,
  confidence  text not null default 'INSUFFICIENT_DATA'
                check (confidence in ('CONFIRMED', 'HIGH_CONFIDENCE', 'PROBABLE',
                                      'UNCERTAIN', 'INSUFFICIENT_DATA')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table core."case" is
  'Primitive universelle du produit (PRD-12). La machine à états est contrainte en base, pas seulement en code.';

create index case_user_idx on core."case" (user_id);
create index case_status_idx on core."case" (user_id, status);

-- =============================================================================
-- RLS
-- =============================================================================
-- Contrôle n°1 de SEC-23. Chaque table exposée porte RLS, et les politiques
-- sont écrites par opération : une politique « for all » masquerait le fait
-- qu'INSERT et SELECT n'ont pas la même clause.

alter table identity.device enable row level security;
alter table core."user"     enable row level security;
alter table core."case"     enable row level security;

-- Le propriétaire des tables ne contourne pas RLS : sans cela, une fonction
-- SECURITY DEFINER mal écrite ouvrirait tout.
alter table identity.device force row level security;
alter table core."user"     force row level security;
alter table core."case"     force row level security;

-- --- core.user --------------------------------------------------------------
grant select on core."user" to authenticated;

create policy user_select_self on core."user"
  for select to authenticated
  using (user_id = (select auth.uid()));

-- --- core.case --------------------------------------------------------------
grant select, insert, update, delete on core."case" to authenticated;

create policy case_select_own on core."case"
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy case_insert_own on core."case"
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- `using` filtre les lignes visibles, `with check` empêche de faire fuir une
-- ligne vers un autre utilisateur en modifiant user_id. Les deux sont
-- nécessaires : l'une sans l'autre laisse un trou.
create policy case_update_own on core."case"
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy case_delete_own on core."case"
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- --- identity.device --------------------------------------------------------
-- L'appareil est lisible par son propriétaire ; sa création et sa révocation
-- passent par le serveur (SEC-35), donc aucun droit d'écriture au client.
grant select on identity.device to authenticated;
grant usage on schema identity to authenticated;

create policy device_select_own on identity.device
  for select to authenticated
  using (account_id = (select auth.uid()));

-- =============================================================================
-- Schémas jamais exposés au client
-- =============================================================================
-- source, extraction et audit n'ont reçu aucun `grant usage` : ils sont
-- inaccessibles aux rôles anon et authenticated par construction, et pas
-- seulement par absence de politique.

-- --- Déclencheur de mise à jour ---------------------------------------------
create or replace function core.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger case_touch_updated_at
  before update on core."case"
  for each row execute function core.touch_updated_at();

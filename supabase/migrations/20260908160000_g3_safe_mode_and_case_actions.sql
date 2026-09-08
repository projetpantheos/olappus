-- =============================================================================
-- G3 — Safe Mode, actions et machine à états
--
-- SEC-32 et PRD-12. Le contrôle décisif est porté par la base : un garde
-- applicatif seul serait contournable par un chemin de code oublié.
-- =============================================================================

-- =============================================================================
-- Safe Mode — SEC-32
-- =============================================================================

create table core.safe_mode (
  id           boolean primary key default true check (id),
  active       boolean not null default false,
  scope        text not null default 'GLOBAL' check (scope in ('GLOBAL', 'MODULE')),
  module_id    text,
  reason       text,
  activated_at timestamptz,
  activated_by uuid,
  lifted_at    timestamptz,
  lifted_by    uuid,

  -- Une activation porte toujours un motif et une date : un Safe Mode dont on
  -- ignore la cause ne se lève jamais en confiance.
  constraint safe_mode_activation_consistency
    check (active = false or (reason is not null and activated_at is not null)),
  constraint safe_mode_module_scope
    check ((scope = 'MODULE') = (module_id is not null))
);

comment on table core.safe_mode is
  'Etat de degradation volontaire (SEC-32). Une seule ligne : la contrainte sur id l''impose.';

insert into core.safe_mode (id, active) values (true, false);

alter table core.safe_mode enable row level security;
alter table core.safe_mode force row level security;

grant select on core.safe_mode to authenticated;

-- L'etat de degradation n'est pas un secret : l'UI doit pouvoir l'afficher
-- avec sa raison, plutot que de griser des boutons sans explication.
create policy safe_mode_readable on core.safe_mode
  for select to authenticated using (true);

create or replace function core.is_safe_mode_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select active from core.safe_mode where id = true;
$$;

-- =============================================================================
-- core.action — PRD-12
-- =============================================================================

create table core.action (
  action_id        uuid primary key default gen_random_uuid(),
  case_id          uuid not null references core."case" (case_id) on delete cascade,
  user_id          uuid not null references core."user" (user_id) on delete cascade,
  type             text not null,
  risk_level       text not null
                     check (risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status           text not null default 'PROPOSED'
                     check (status in ('PROPOSED', 'PREPARED', 'WAITING_CONFIRMATION',
                                       'EXECUTING', 'EXECUTED', 'FAILED',
                                       'CANCELLED', 'EXPIRED')),
  permission_level text not null
                     check (permission_level in ('READ', 'SUGGEST', 'PREPARE',
                                                 'EXECUTE_WITH_CONFIRMATION', 'AUTO_EXECUTE')),
  -- Reference canonique du destinataire. Jamais une adresse libre extraite
  -- d'un contenu non fiable (invariant untrusted_content).
  recipient_ref    uuid,
  prepared_payload jsonb,
  confirmed_at     timestamptz,
  confirmed_by     uuid,
  executed_at      timestamptz,
  created_at       timestamptz not null default now(),

  -- Une action executee porte toujours sa confirmation : l'ordre confirmation
  -- puis execution est une contrainte, pas une convention.
  constraint action_confirmation_precedes_execution
    check (executed_at is null or (confirmed_at is not null and confirmed_at <= executed_at)),
  constraint action_confirmation_has_author
    check ((confirmed_at is null) = (confirmed_by is null))
);

comment on table core.action is
  'Action proposee puis eventuellement executee (PRD-12). Aucune execution sans confirmation prealable, garantie en base.';

create index action_case_idx on core.action (case_id);
create index action_user_status_idx on core.action (user_id, status);

alter table core.action enable row level security;
alter table core.action force row level security;

grant select on core.action to authenticated;

create policy action_select_own on core.action
  for select to authenticated
  using (user_id = (select auth.uid()));

-- =============================================================================
-- Le garde : Safe Mode interdit toute exécution
-- =============================================================================
-- Test d'acceptation n°17. Ce déclencheur s'applique y compris à un accès
-- direct à la base : c'est ce qui distingue un contrôle d'une intention.

create or replace function core.forbid_execution_in_safe_mode()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('EXECUTING', 'EXECUTED')
     and (old.status is null or old.status not in ('EXECUTING', 'EXECUTED'))
     and core.is_safe_mode_active()
  then
    raise exception 'Safe Mode actif : aucune action externe ne peut demarrer'
      using errcode = 'raise_exception';
  end if;
  return new;
end;
$$;

create trigger action_safe_mode_guard
  before insert or update on core.action
  for each row execute function core.forbid_execution_in_safe_mode();

-- =============================================================================
-- Machine à états des actions
-- =============================================================================
-- PRD-12 impose VIEW → SUGGEST → PREPARE → CONFIRM → EXECUTE. Une transition
-- illegale ne doit pas dependre du fait que tous les appelants soient corrects.

create or replace function core.enforce_action_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  allowed text[];
begin
  if old.status = new.status then
    return new;
  end if;

  allowed := case old.status
    when 'PROPOSED'             then array['PREPARED', 'CANCELLED', 'EXPIRED']
    when 'PREPARED'             then array['WAITING_CONFIRMATION', 'CANCELLED', 'EXPIRED']
    when 'WAITING_CONFIRMATION' then array['EXECUTING', 'CANCELLED', 'EXPIRED']
    when 'EXECUTING'            then array['EXECUTED', 'FAILED']
    else array[]::text[]
  end;

  if not (new.status = any(allowed)) then
    raise exception 'transition d''action interdite : % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger action_transition_guard
  before update on core.action
  for each row execute function core.enforce_action_transition();

comment on function core.enforce_action_transition is
  'Machine a etats de PRD-12 portee par la base. EXECUTED, FAILED, CANCELLED et EXPIRED sont terminaux.';

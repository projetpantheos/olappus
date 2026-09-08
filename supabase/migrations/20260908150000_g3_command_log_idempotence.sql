-- =============================================================================
-- G3 — Journal des commandes et idempotence
--
-- ARC-42. L'unicité est portée par une contrainte de base, jamais par une
-- vérification applicative : « existe-t-il déjà ? » suivi d'une insertion laisse
-- une fenêtre que deux requêtes concurrentes franchissent toutes les deux.
-- =============================================================================

create table core.command_log (
  command_id   uuid primary key,
  actor_id     uuid not null references core."user" (user_id) on delete cascade,
  command_name text not null,
  status       text not null default 'IN_PROGRESS'
                 check (status in ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
  result       jsonb,
  received_at  timestamptz not null default now(),
  completed_at timestamptz,

  -- Une commande terminée porte toujours sa date de fin, et inversement.
  constraint command_completion_consistency
    check ((status = 'IN_PROGRESS') = (completed_at is null))
);

comment on table core.command_log is
  'Journal d''idempotence (ARC-42). La cle primaire EST le verrou : un rejeu ne peut pas produire un second effet.';

create index command_log_actor_idx on core.command_log (actor_id);

alter table core.command_log enable row level security;
alter table core.command_log force row level security;

-- Aucun droit client : l'enregistrement d'une commande est une operation
-- serveur. Un client capable d'ecrire ici pourrait se declarer deja traite.

-- --- Réservation d'une commande ---------------------------------------------
-- Retourne l'état réel de la commande :
--   ACCEPTED    la commande est nouvelle, l'appelant peut l'exécuter
--   REPLAY_*    la commande existe déjà ; l'appelant ne réexécute rien
--
-- C'est `on conflict do nothing` qui rend l'opération sûre : la base tranche,
-- pas le code appelant.
create or replace function core.claim_command(
  p_command_id   uuid,
  p_actor_id     uuid,
  p_command_name text
)
returns table (outcome text, status text, result jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted boolean := false;
  existing core.command_log;
begin
  insert into core.command_log (command_id, actor_id, command_name)
  values (p_command_id, p_actor_id, p_command_name)
  on conflict (command_id) do nothing;

  get diagnostics inserted = row_count;

  if inserted then
    return query select 'ACCEPTED'::text, 'IN_PROGRESS'::text, null::jsonb;
    return;
  end if;

  select * into existing from core.command_log where command_id = p_command_id;

  -- Un rejeu portant un autre acteur ou un autre nom n'est pas un rejeu :
  -- c'est une collision d'identifiant, et elle doit être bruyante.
  if existing.actor_id <> p_actor_id or existing.command_name <> p_command_name then
    raise exception 'command_id % deja utilise pour une autre commande', p_command_id
      using errcode = 'unique_violation';
  end if;

  return query select 'REPLAY'::text, existing.status, existing.result;
end;
$$;

comment on function core.claim_command is
  'Reserve un command_id. ACCEPTED = a executer, REPLAY = deja connu, avec son resultat memorise (ARC-42).';

-- --- Clôture d'une commande --------------------------------------------------
create or replace function core.complete_command(
  p_command_id uuid,
  p_status     text,
  p_result     jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('COMPLETED', 'FAILED') then
    raise exception 'statut de cloture invalide : %', p_status;
  end if;

  update core.command_log
     set status = p_status,
         result = p_result,
         completed_at = now()
   where command_id = p_command_id
     and status = 'IN_PROGRESS';

  if not found then
    -- Cloturer deux fois masquerait une double execution : on refuse.
    raise exception 'commande % absente ou deja cloturee', p_command_id;
  end if;
end;
$$;

comment on function core.complete_command is
  'Cloture une commande en cours. Refuse une double cloture, qui masquerait une double execution.';

revoke all on function core.claim_command(uuid, uuid, text) from public, anon, authenticated;
revoke all on function core.complete_command(uuid, text, jsonb) from public, anon, authenticated;

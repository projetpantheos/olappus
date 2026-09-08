-- =============================================================================
-- G2 — Anonymisation de l'audit et ordonnancement des purges
--
-- Deux écarts entre ce que les spécifications promettaient et ce que la base
-- faisait réellement, comblés ici.
-- =============================================================================

-- =============================================================================
-- 1. Anonymisation de l'audit à la clôture du compte
-- =============================================================================
-- SEC-33 déclare `audit.action_log` en `delete: anonymize` : le journal des
-- actions externes doit survivre à la suppression du compte, sans permettre de
-- remonter à la personne. Rien ne l'appliquait : `actor_id` restait en clair
-- après suppression. C'est un test de suppression qui l'a révélé.
--
-- L'anonymisation se fait à la suppression de `core.user`, atteinte par cascade
-- depuis `auth.users`.

create or replace function audit.anonymize_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update audit.action_log
     set actor_id = null
   where actor_id = old.user_id;
  return old;
end;
$$;

comment on function audit.anonymize_actor is
  'Detache les entrees d''audit de la personne a la cloture du compte. Le fait subsiste, l''identite disparait (SEC-33).';

create trigger user_deletion_anonymizes_audit
  before delete on core."user"
  for each row execute function audit.anonymize_actor();

-- =============================================================================
-- 2. Ordonnancement des purges
-- =============================================================================
-- Les fonctions de purge existaient mais rien ne les appelait : une rétention
-- dont la purge n'est jamais déclenchée est une rétention infinie.
--
-- pg_cron n'est pas disponible dans toutes les configurations. Plutôt que de
-- présupposer l'extension, on expose un point d'entrée unique et on enregistre
-- chaque exécution : l'ordonnanceur (cron, tâche planifiée ou Edge Function)
-- appelle cette fonction, et l'absence d'exécution devient visible.

create table core.retention_run (
  run_id       uuid primary key default gen_random_uuid(),
  ran_at       timestamptz not null default now(),
  quarantine_purged integer not null,
  audit_purged      integer not null
);

comment on table core.retention_run is
  'Journal des executions de purge. Sans trace, une purge qui ne tourne plus est indetectable.';

alter table core.retention_run enable row level security;
alter table core.retention_run force row level security;

create or replace function core.run_retention_purges()
returns core.retention_run
language plpgsql
security definer
set search_path = ''
as $$
declare
  q integer;
  a integer;
  entry core.retention_run;
begin
  select source.purge_expired_quarantine() into q;
  select audit.purge_expired_action_log() into a;

  insert into core.retention_run (quarantine_purged, audit_purged)
  values (q, a)
  returning * into entry;

  return entry;
end;
$$;

comment on function core.run_retention_purges is
  'Point d''entree unique des purges de retention (ADR-0015). A appeler quotidiennement par l''ordonnanceur.';

revoke all on function core.run_retention_purges() from public, anon, authenticated;

-- --- Détection d'un ordonnanceur en panne ------------------------------------
-- Une purge qui a cessé de tourner ne se voit pas : les données s'accumulent
-- silencieusement. Cette vue rend l'anomalie interrogeable.

create or replace view core.retention_health as
  select
    (select max(ran_at) from core.retention_run) as last_run_at,
    (select max(ran_at) from core.retention_run) > now() - interval '48 hours'
      as is_healthy,
    (select count(*) from source.raw_quarantine
      where payload_raw is not null
        and created_at < now() - (select interval_spec from core.retention_policy
                                   where key = 'days_7')) as overdue_quarantine_rows;

comment on view core.retention_health is
  'Sante de la retention : date de derniere purge et volume en retard. Une purge arretee doit etre visible.';

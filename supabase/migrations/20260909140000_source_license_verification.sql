-- =============================================================================
-- Vérification des licences de sources — relevé du 2026-09-09.
--
-- Ce que cette migration fait : consigner en base ce que le registre consigne
-- en YAML. Rien de plus. Les deux sources restent REVIEW_REQUIRED.
--
-- Ce qu'elle ne fait PAS : approuver. Le droit de réutiliser n'est pas la
-- capacité d'exploiter — les quotas et la stratégie de cache restent ouverts,
-- et le License Gate continue donc de refuser toute ingestion.
-- =============================================================================

update knowledge.source
   set license_name     = 'Licence Ouverte / Open Licence version 2.0',
       license_verified = true,
       last_checked_at  = timestamptz '2026-09-09 00:00:00+00'
 where source_id in ('legifrance', 'rappelconso');

-- Garde-fou : si l'un des deux passait APPROVED par cette migration, ce serait
-- une erreur silencieuse. On échoue bruyamment plutôt.
do $$
begin
  if exists (
    select 1 from knowledge.source
     where source_id in ('legifrance', 'rappelconso')
       and status in ('APPROVED', 'APPROVED_WITH_CONDITIONS')
  ) then
    raise exception
      'Une source a été approuvée sans que cette migration ne le prévoie. Vérifier governance/source_registry.yaml.';
  end if;
end $$;

comment on column knowledge.source.license_verified is
  'Vraie quand la licence a été lue à la source primaire, avec sa date. Couvre le droit de réutilisation, et lui seul : elle ne dit rien des quotas ni des conditions d''exploitation. La contrainte source_approval_requires_verified_license en fait un préalable à APPROVED, pas un équivalent.';

-- =============================================================================
-- G3 — Detection, Evidence, Outcome, Merchant et règles juridiques
--
-- Ces cinq entités étaient déclarées SPECIFIED au Data Registry sans exister en
-- base : la gouvernance parlait dans le vide. C'est un test de dérive
-- registre ↔ schéma qui l'a révélé, pas une relecture.
--
-- Elles complètent la primitive de PRD-12 :
--   CASE → DETECTION → EVIDENCE → RECOMMENDATION → ACTION → OUTCOME
-- =============================================================================

-- =============================================================================
-- core.detection — pourquoi un Case existe
-- =============================================================================

create table core.detection (
  detection_id uuid primary key default gen_random_uuid(),
  case_id      uuid not null references core."case" (case_id) on delete cascade,
  user_id      uuid not null references core."user" (user_id) on delete cascade,
  -- Sans règle ni version, aucune explication n'est reproductible et aucune
  -- correction n'est traçable (PRD-12, DAT-10).
  rule_id      text not null,
  rule_version text not null,
  confidence   text not null
                 check (confidence in ('CONFIRMED', 'HIGH_CONFIDENCE', 'PROBABLE',
                                       'UNCERTAIN', 'INSUFFICIENT_DATA')),
  detected_at  timestamptz not null default now()
);

comment on table core.detection is
  'Detection ayant produit un Case. rule_id et rule_version sont obligatoires : c''est ce qui rend le WHY reproductible.';

create index detection_case_idx on core.detection (case_id);

-- =============================================================================
-- core.evidence — sur quoi la détection s'appuie
-- =============================================================================

create table core.evidence (
  evidence_id  uuid primary key default gen_random_uuid(),
  case_id      uuid not null references core."case" (case_id) on delete cascade,
  user_id      uuid not null references core."user" (user_id) on delete cascade,
  source_id    uuid references source.raw_quarantine (source_id) on delete set null,
  -- Empreinte d'integrite : permet de demontrer qu'une preuve n'a pas ete
  -- alteree, y compris apres purge de la charge brute (SEC-33).
  content_hash text not null,
  captured_at  timestamptz not null default now()
);

comment on table core.evidence is
  'Preuve rattachee a un Case. content_hash survit a la purge de la quarantaine : l''integrite reste demontrable sans conserver le contenu.';

create index evidence_case_idx on core.evidence (case_id);

-- =============================================================================
-- core.outcome — ce qui s'est réellement passé
-- =============================================================================

create table core.outcome (
  outcome_id  uuid primary key default gen_random_uuid(),
  action_id   uuid not null references core.action (action_id) on delete cascade,
  user_id     uuid not null references core."user" (user_id) on delete cascade,
  result      text not null
                check (result in ('SUCCESS', 'PARTIAL', 'FAILURE', 'NO_RESPONSE', 'UNKNOWN')),
  observed_at timestamptz not null default now()
);

comment on table core.outcome is
  'Resultat verifie d''une action (PRD-12). UNKNOWN et NO_RESPONSE sont des resultats a part entiere : une action sans reponse n''est pas un succes.';

create index outcome_action_idx on core.outcome (action_id);

-- =============================================================================
-- domain.merchant — identité canonique
-- =============================================================================

create table domain.merchant (
  merchant_id          uuid primary key default gen_random_uuid(),
  user_id              uuid not null references core."user" (user_id) on delete cascade,
  canonical_name       text not null,
  -- Identifiants officiels servant de pivot. DAT-10 : ne jamais utiliser le nom
  -- libre comme identifiant maitre.
  external_identifiers jsonb not null default '[]'::jsonb,
  created_at           timestamptz not null default now(),

  constraint merchant_unique_per_user unique (user_id, canonical_name)
);

comment on table domain.merchant is
  'Identite canonique de marchand. La resolution passe par identifiant externe exact, puis chaine normalisee - jamais par rapprochement probabiliste sans revue (DAT-10).';

-- =============================================================================
-- knowledge.legal_rule — connaissance collective
-- =============================================================================

create table knowledge.legal_rule (
  rule_id            uuid primary key default gen_random_uuid(),
  jurisdiction       text not null,
  instrument_ref     text not null,
  in_force_from      date not null,
  in_force_to        date,
  verification_level text not null
                       check (verification_level in ('OFFICIAL', 'CERTIFIED', 'VALIDATED',
                                                     'COMMUNITY', 'AI_PROPOSED')),
  created_at         timestamptz not null default now(),

  -- Une regle temporelle sans debut de validite ne peut pas etre appliquee
  -- correctement (AI-10 : valid_from obligatoire).
  constraint legal_rule_validity_order
    check (in_force_to is null or in_force_to > in_force_from)
);

comment on table knowledge.legal_rule is
  'Regle juridique datee et sourcee (ADR-0003). Une regle expiree, hors juridiction ou insuffisamment verifiee ne produit aucune affirmation : la sortie est INSUFFICIENT_DATA.';

create index legal_rule_jurisdiction_idx on knowledge.legal_rule (jurisdiction, in_force_from);

-- =============================================================================
-- RLS
-- =============================================================================

alter table core.detection          enable row level security;
alter table core.evidence           enable row level security;
alter table core.outcome            enable row level security;
alter table domain.merchant         enable row level security;
alter table knowledge.legal_rule    enable row level security;

alter table core.detection          force row level security;
alter table core.evidence           force row level security;
alter table core.outcome            force row level security;
alter table domain.merchant         force row level security;
alter table knowledge.legal_rule    force row level security;

grant select on core.detection, core.evidence, core.outcome, domain.merchant to authenticated;
grant select on knowledge.legal_rule to authenticated;

create policy detection_select_own on core.detection
  for select to authenticated using (user_id = (select auth.uid()));

create policy evidence_select_own on core.evidence
  for select to authenticated using (user_id = (select auth.uid()));

create policy outcome_select_own on core.outcome
  for select to authenticated using (user_id = (select auth.uid()));

create policy merchant_select_own on domain.merchant
  for select to authenticated using (user_id = (select auth.uid()));

-- La connaissance collective est lisible par tout compte authentifie : elle ne
-- contient aucune donnee personnelle (AI-10). L'ecriture reste a la gouvernance.
create policy legal_rule_readable on knowledge.legal_rule
  for select to authenticated using (true);

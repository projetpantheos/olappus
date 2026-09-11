-- =============================================================================
-- G6a — Connexions externes (Hermès / OAuth).
--
-- Condition de sortie de G6 : PKCE + `state`, échange côté serveur, scopes
-- minimaux, **purge à la déconnexion**. Les deux premiers points vivent dans
-- `packages/core/src/oauth.ts` ; les deux derniers sont portés ici, par la
-- base, parce qu'une purge promise par du code applicatif est une purge qui
-- finira par être oubliée.
--
-- Aucun fournisseur réel n'est déclaré. Cette migration décrit un mécanisme,
-- pas une intégration : Google arrive en G6b, et n'apportera qu'une ligne
-- dans `identity.provider_scope`.
-- =============================================================================

-- --- Scopes autorisés, par fournisseur --------------------------------------
-- Deny by default, au même titre que le License Gate : un scope non déclaré
-- ici ne peut pas être enregistré, quelle que soit la requête que le client a
-- réellement envoyée au fournisseur.
--
-- Miroir de `ALLOWED_SCOPES` dans `packages/core/src/oauth.ts`. Un test relie
-- les deux : deux vérités sur le même sujet en produisent toujours une fausse.

create table identity.provider_scope (
  provider    text not null,
  scope       text not null,
  purpose     text not null,
  created_at  timestamptz not null default now(),
  primary key (provider, scope),

  -- `docs/15` : métadonnées et extraits structurés, jamais le corps complet ni
  -- les pièces jointes par défaut. La décision R4 du fondateur, rendue
  -- impossible à contourner par inadvertance.
  constraint provider_scope_no_full_access
    check (scope !~* '(full|readall|read_all|body|attachment|write|modify|compose|send)')
);

comment on table identity.provider_scope is
  'Scopes autorisés par fournisseur. Deny by default : ce qui n''y figure pas ne peut pas être connecté.';

insert into identity.provider_scope (provider, scope, purpose) values
  ('google-synthetique', 'metadata.read',
   'Fournisseur synthétique de G6a. Aucune donnée réelle, aucun compte externe.');

-- =============================================================================
-- identity.connection
-- =============================================================================

create table identity.connection (
  connection_id  uuid primary key default gen_random_uuid(),
  user_id        uuid not null references core."user" (user_id) on delete cascade,
  provider       text not null,

  status         text not null default 'DISCONNECTED'
                   check (status in ('DISCONNECTED', 'AUTHORIZING', 'CONNECTED',
                                     'EXPIRED', 'REVOKED')),

  scopes         text[] not null default '{}',

  -- Jetons chiffrés par la DEK de l'utilisateur (SEC-31, ADR-0017). Le serveur
  -- seul ne peut pas les relire — c'est la conséquence assumée d'ADR-0008.
  access_token   jsonb,
  refresh_token  jsonb,
  expires_at     timestamptz,

  -- Référence pseudonyme du compte distant. JAMAIS l'adresse email : ADR-0012
  -- la classe AI_FORBIDDEN, et `identity` n'est pas le domaine.
  external_account_ref text,

  connected_at    timestamptz,
  revoked_at      timestamptz,
  disconnected_at timestamptz,
  created_at      timestamptz not null default now(),

  constraint connection_tokens_are_ciphertext
    check (core.is_ciphertext_envelope(access_token)
       and core.is_ciphertext_envelope(refresh_token)),

  -- Une seule connexion vivante par utilisateur et par fournisseur. Deux
  -- connexions actives, ce sont deux réponses à « avec quel consentement
  -- lit-on ? ».
  constraint connection_unique_live
    exclude (user_id with =, provider with =)
    where (status in ('AUTHORIZING', 'CONNECTED', 'EXPIRED')),

  -- Une connexion active porte ses jetons et sa date d'expiration.
  constraint connection_connected_has_token
    check (status <> 'CONNECTED'
        or (access_token is not null and expires_at is not null and connected_at is not null)),

  -- LA PURGE, PORTÉE PAR LA BASE. Une connexion déconnectée ou révoquée ne
  -- peut PAS détenir de jeton : ce n'est pas une tâche de nettoyage qu'on
  -- espère voir passer, c'est un état que la base refuse d'écrire.
  constraint connection_purged_when_closed
    check (status not in ('DISCONNECTED', 'REVOKED')
        or (access_token is null and refresh_token is null
            and expires_at is null and external_account_ref is null)),

  constraint connection_revocation_dated
    check ((status = 'REVOKED') = (revoked_at is not null))
);

comment on table identity.connection is
  'Connexion à un fournisseur externe. Jetons chiffrés, purge portée par contrainte (G6, SEC-33).';

comment on constraint connection_purged_when_closed on identity.connection is
  'Purge à la déconnexion, condition de sortie de G6. Portée par la base : une connexion fermée ne peut pas détenir de jeton, même si le code de déconnexion oublie de les effacer.';

create index connection_user_idx on identity.connection (user_id, provider);

-- --- Scopes : deny by default -----------------------------------------------

create or replace function identity.enforce_declared_scopes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unknown text;
begin
  select s into v_unknown
    from unnest(new.scopes) as s
   where not exists (
     select 1 from identity.provider_scope p
      where p.provider = new.provider and p.scope = s
   )
   limit 1;

  if v_unknown is not null then
    raise exception
      'Scope non déclaré pour ce fournisseur : % (identity.provider_scope fait foi).', v_unknown
      using errcode = 'check_violation';
  end if;

  -- Une connexion active sans aucun scope lirait « tout ou rien » selon
  -- l'humeur de l'appelant. On tranche : rien.
  if new.status = 'CONNECTED' and coalesce(array_length(new.scopes, 1), 0) = 0 then
    raise exception 'Connexion active sans aucun scope.' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger connection_scope_guard
  before insert or update on identity.connection
  for each row execute function identity.enforce_declared_scopes();

-- --- Machine à états ---------------------------------------------------------
-- Miroir de `TRANSITIONS` dans `packages/core/src/oauth.ts`. Portée en base
-- pour la même raison que le reste : un garde applicatif se contourne.

create or replace function identity.enforce_connection_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  if not (
    (old.status = 'DISCONNECTED' and new.status = 'AUTHORIZING')
    or (old.status = 'AUTHORIZING' and new.status in ('CONNECTED', 'DISCONNECTED'))
    or (old.status = 'CONNECTED'   and new.status in ('EXPIRED', 'REVOKED', 'DISCONNECTED'))
    -- Un consentement retiré ne se rétablit pas côté serveur : REVOKED ne mène
    -- qu'à DISCONNECTED, jamais directement à une nouvelle autorisation.
    or (old.status = 'EXPIRED'     and new.status in ('AUTHORIZING', 'DISCONNECTED'))
    or (old.status = 'REVOKED'     and new.status = 'DISCONNECTED')
  ) then
    raise exception 'Transition de connexion interdite : % vers %.', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger connection_transition_guard
  before update on identity.connection
  for each row execute function identity.enforce_connection_transition();

-- --- Déconnexion : un seul chemin, qui purge ---------------------------------
-- Exposer une fonction évite que chaque appelant réinvente la purge — et
-- surtout, en oublie un champ.

create or replace function core.disconnect_connection(p_connection_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update identity.connection
     set status               = 'DISCONNECTED',
         access_token         = null,
         refresh_token        = null,
         expires_at           = null,
         external_account_ref = null,
         disconnected_at      = now()
   where connection_id = p_connection_id
     and user_id = (select auth.uid());

  if not found then
    raise exception 'Connexion introuvable ou n''appartenant pas à l''appelant.'
      using errcode = 'insufficient_privilege';
  end if;
end;
$$;

comment on function core.disconnect_connection(uuid) is
  'Déconnecte et purge en une opération. La contrainte connection_purged_when_closed garantit qu''aucun autre chemin ne peut laisser un jeton derrière lui.';

revoke all on function core.disconnect_connection(uuid) from public, anon;
grant execute on function core.disconnect_connection(uuid) to authenticated;

-- =============================================================================
-- RLS
-- =============================================================================
-- Défense en profondeur : les jetons sont déjà chiffrés, RLS reste exigée.

alter table identity.connection enable row level security;
alter table identity.connection force row level security;

alter table identity.provider_scope enable row level security;
alter table identity.provider_scope force row level security;

create policy connection_select_self on identity.connection
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Aucune politique d'écriture pour le client : une connexion se crée et se
-- ferme par un chemin de service tracé. `core.disconnect_connection` suffit au
-- besoin légitime de l'application.
grant select on identity.connection to authenticated;

-- `identity.provider_scope` ne reçoit aucun grant : la liste des scopes
-- autorisés n'a pas à être lisible par le client, et encore moins modifiable.

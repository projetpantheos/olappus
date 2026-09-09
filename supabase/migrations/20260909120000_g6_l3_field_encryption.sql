-- =============================================================================
-- Chiffrement applicatif des champs L3 — SEC-31, ADR-0008, ADR-0017.
--
-- Cette migration précède G6 délibérément. G6 apporte les premières données
-- réelles : collecter d'abord et protéger ensuite serait l'ordre inverse du
-- bon, et la migration d'un champ déjà peuplé est autrement plus risquée.
--
-- Principe : le chiffrement est porté par la base, pas par la discipline de
-- l'appelant. Un champ L3 ne peut PAS recevoir de valeur en clair, même si le
-- code applicatif se trompe, même par un accès SQL direct.
-- =============================================================================

-- --- Garde de forme d'une enveloppe chiffrée --------------------------------
-- Miroir exact de `isCiphertext` dans packages/core/src/crypto.ts. Les deux
-- existent, et c'est voulu : le code refuse le clair sans aller jusqu'à la
-- base, la base refuse le clair même quand le code se trompe.

create or replace function core.is_ciphertext_envelope(p_value jsonb)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select p_value is null
      or (
        jsonb_typeof(p_value) = 'object'
        and p_value ? 'v'   and jsonb_typeof(p_value -> 'v')   = 'number'
        and p_value ? 'kv'  and jsonb_typeof(p_value -> 'kv')  = 'number'
        and p_value ? 'alg' and p_value ->> 'alg' = 'AES-256-GCM'
        and p_value ? 'iv'  and jsonb_typeof(p_value -> 'iv')  = 'string'
        and p_value ? 'ct'  and jsonb_typeof(p_value -> 'ct')  = 'string'
        and p_value ? 'tag' and jsonb_typeof(p_value -> 'tag') = 'string'
        -- Une enveloppe ne porte QUE ces six clés. Sans cette borne, on
        -- pourrait joindre le clair à côté du chiffré et croire la donnée
        -- protégée parce que la forme est respectée.
        and (select count(*) from jsonb_object_keys(p_value)) = 6
      );
$$;

comment on function core.is_ciphertext_envelope(jsonb) is
  'Vrai si la valeur est nulle ou une enveloppe AES-256-GCM versionnée (SEC-31). Refuse toute clé supplémentaire : le clair ne voyage pas à côté du chiffré.';

-- =============================================================================
-- Clés utilisateur
-- =============================================================================
-- Ce que cette table contient : des DEK **enveloppées**, inutilisables sans la
-- KEK, elle-même dérivée d'un secret que seul l'utilisateur détient.
--
-- Ce qu'elle ne contient pas, et ne doit jamais contenir : une clé en clair,
-- un secret de récupération, ou quoi que ce soit permettant à un administrateur
-- de déchiffrer les données d'un utilisateur. C'est ADR-0008 : aucune clé
-- maître serveur. Un test vérifie cette absence plutôt que de la supposer.

create table identity.user_key (
  key_id        uuid primary key default gen_random_uuid(),
  user_id       uuid not null references core."user" (user_id) on delete cascade,

  -- Version de clé. Sans elle, aucune rotation : seulement une réécriture
  -- atomique de toute la base, c'est-à-dire une migration à risque.
  key_version   integer not null,

  -- DEK chiffrée par la KEK. Jamais la DEK elle-même.
  wrapped_dek   jsonb not null,

  -- Paramètres de dérivation, stockés avec la clé : durcir les paramètres
  -- demain ne doit pas rendre les clés d'hier indéchiffrables.
  kdf           text not null default 'scrypt' check (kdf in ('scrypt', 'argon2id')),
  kdf_salt      text not null,
  kdf_params    jsonb not null,

  status        text not null default 'ACTIVE'
                  check (status in ('ACTIVE', 'RETIRING', 'REVOKED')),
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz,

  constraint user_key_version_unique unique (user_id, key_version),

  constraint user_key_wrapped_is_envelope
    check (core.is_ciphertext_envelope(wrapped_dek)),

  -- Une clé révoquée porte sa date : la révocation est un fait daté, pas un
  -- drapeau que l'on peut poser sans trace.
  constraint user_key_revocation_dated
    check ((status = 'REVOKED') = (revoked_at is not null))
);

comment on table identity.user_key is
  'DEK enveloppées, une par version et par utilisateur (SEC-31). Aucune clé en clair, aucune clé maître serveur (ADR-0008).';

create index user_key_user_idx on identity.user_key (user_id, status);

-- Une seule clé ACTIVE par utilisateur : deux clés actives, ce sont deux
-- vérités sur « avec quoi chiffre-t-on maintenant ».
create unique index user_key_single_active
  on identity.user_key (user_id)
  where status = 'ACTIVE';

-- =============================================================================
-- Champs L3 chiffrés
-- =============================================================================
-- Le registre fait foi sur ce qui est chiffré (governance/data_registry.yaml,
-- attribut `encryption`). Un test relie les deux : un champ déclaré chiffré au
-- registre et sans contrainte en base ferait mentir la gouvernance.

alter table core.action
  add constraint action_prepared_payload_encrypted
    check (core.is_ciphertext_envelope(prepared_payload));

comment on column core.action.prepared_payload is
  'Contenu exact de l''action préparée, chiffré (L3, SEC-31). CONSÉQUENCE : le serveur seul ne peut pas relire une action préparée. Son exécution suppose une session où l''utilisateur a déverrouillé sa DEK — ce qui rejoint EXECUTE_WITH_CONFIRMATION, et interdit une exécution par tâche de fond silencieuse.';

-- =============================================================================
-- RLS
-- =============================================================================
-- Même sur une table qui ne contient que du chiffré : le chiffrement est une
-- défense en profondeur, jamais un substitut à RLS (SEC-31).

alter table identity.user_key enable row level security;
alter table identity.user_key force row level security;

create policy user_key_select_self on identity.user_key
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Pas de politique INSERT, UPDATE ni DELETE pour le client : une clé se pose et
-- se révoque par un chemin de service tracé, elle ne s'écrase pas depuis
-- l'application.

-- --- Accès client -----------------------------------------------------------
-- Le schéma identity porte déjà un `usage` accordé en G2 pour que chacun lise
-- son propre appareil. La fermeture ne vient donc pas du schéma mais du
-- deny-by-default sur les tables : `identity.user_key` ne reçoit AUCUN grant,
-- et reste donc hors de portée du client.
--
-- Le client a pourtant besoin de sa DEK enveloppée pour la déverrouiller
-- localement. Elle passe par une porte unique et nommée, dont le périmètre est
-- lisible en une ligne — plutôt que par un grant sur la table, qui donnerait
-- plus que ce qui est nécessaire.

create or replace function core.my_key_material()
returns table (
  key_version integer,
  wrapped_dek jsonb,
  kdf         text,
  kdf_salt    text,
  kdf_params  jsonb,
  status      text
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.key_version, k.wrapped_dek, k.kdf, k.kdf_salt, k.kdf_params, k.status
    from identity.user_key k
   where k.user_id = (select auth.uid())
     and k.status <> 'REVOKED'
   order by k.key_version desc;
$$;

comment on function core.my_key_material() is
  'Matériel de clé de l''appelant, et de lui seul (SEC-31). Ne rend que du chiffré : sans le secret de l''utilisateur, ces lignes n''ouvrent rien.';

revoke all on function core.my_key_material() from public, anon;
grant execute on function core.my_key_material() to authenticated;

# ADR-0005 — Schémas PostgreSQL comme convention de données

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D4
- **Approuvé par** : Fondateur
- **Réversible** : **non** après la première migration

## Context

Deux conventions incompatibles coexistaient :

- `docs/07_DATA_MODEL` : préfixes plats `core_*`, `private_*`, `knowledge_*`, `data_*`, tables au pluriel (`profiles`, `insights`, `detections`, `action_proposals`) ;
- `compiled_decisions/data_privacy/08_CANONICAL_DATA_MODEL` : schémas `identity.`, `core.`, `source.`, `extraction.`, `domain.`, `knowledge.`, `audit.`, entités au singulier (`core.case`, `domain.merchant`).

Chacune commande une écriture différente des politiques RLS, des grants et des migrations. La première migration fige ce choix.

## Decision

Schémas PostgreSQL :

```
identity     -- account, device : métadonnées d'identité uniquement
core         -- user, permission, module, capability, case, detection,
                evidence, action, outcome, notification, preference, feature_flag
source       -- connector, raw_quarantine
extraction   -- record, field
domain       -- merchant, product, subscription, contract, document,
                transaction, deadline, travel_item
knowledge    -- source, fact, evidence, rule, rule_version, legal_rule,
                proposal, review, certification, conflict
audit        -- business_event, security_event, data_access, action_log
```

Règles :

- entités au **singulier** ;
- identifiants opaques, jamais porteurs de sens (`email`, date, nom de marchand) ;
- les secrets vivent dans un schéma non exposé, hors tables métier ;
- `REVOKE` par défaut, `GRANT` explicite par schéma ;
- RLS activée et testée sur toute table exposée.

`docs/07_DATA_MODEL` est rétrogradé en document historique.

## Rationale

Seule convention cohérente avec la « séparation logique par schémas/domaines » posée par `architecture/03`, et avec un octroi de droits par schéma qui rend le moindre privilège vérifiable au lieu d'être déclaratif.

## Alternatives

- **Préfixes plats** — rejetée : les grants ne peuvent plus s'exprimer par domaine, et le moindre privilège devient une convention de nommage plutôt qu'une frontière réelle.

## Consequences

**Irréversible après la première migration.** Les suites RLS sont organisées par schéma. Toute nouvelle entité doit être rattachée explicitement à un schéma, ce qui force à qualifier son propriétaire.

## Affected systems

Toutes les migrations, toutes les politiques RLS, le Data Registry, les projections, l'export.

## Security

Positif : `REVOKE`/`GRANT` par schéma, deny-by-default démontrable, séparation nette des secrets.

## Privacy

Positif : la frontière `identity` / `domain` matérialise l'invariant `IDENTITY IS NOT DOMAIN DATA`.

## Tests

Suite RLS par schéma, avec isolation cross-user sur SELECT/INSERT/UPDATE/DELETE.

## Rollback

Impossible sans migration complète des données. Toute remise en cause exige un nouvel ADR et un plan de migration validé.

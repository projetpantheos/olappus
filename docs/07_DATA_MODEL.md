# DATA MODEL

<!-- AUTHORITY-BANNER -->

> **Statut : HISTORIQUE** — la convention de nommage `core_*` / `private_*` / `knowledge_*` / `data_*` est **abrogée par ADR-0005** (schémas PostgreSQL `identity/core/source/extraction/domain/knowledge/audit`). Restent à promouvoir : les règles sur les secrets OAuth et sur l'evidence. Voir `docs/DEPRECATION_MAP.md`.

## Séparation logique

- `core_*` : identité, événements, cases, actions, audit.
- `private_*` : documents, sources connectées, données dérivées utilisateur.
- `knowledge_*` : connaissances publiques/collectives sans données personnelles brutes.
- `data_*` : métadonnées des datasets et snapshots/licences.

## Tables Core principales

`profiles`, `source_connections`, `domain_events`, `detections`, `insights`, `cases`, `case_events`, `action_proposals`, `action_executions`, `audit_events`.

## Tables Private principales

`documents`, `evidence`, `normalized_entities`, `subscriptions`, `deadlines`, `user_preferences`.

## Tables Knowledge

`knowledge_sources`, `knowledge_candidates`, `knowledge_votes`, `knowledge_validators`, `knowledge_facts`, `knowledge_fact_versions`, `knowledge_edges`, `knowledge_reviews`.

## Source Registry

`data_sources`, `data_ingestions`, `data_snapshots`, `data_license_checks`.

## Principes

- UUID côté public ;
- external_id conservé seulement si nécessaire ; sinon hash ;
- JSONB pour payloads d'events bornés, mais pas pour construire une base informe ;
- index sur `user_id`, `occurred_at`, `status`, `correlation_id` ;
- rétention explicite ;
- soft delete uniquement si une obligation fonctionnelle l'impose ; sinon purge réelle.

## OAuth secrets

Les refresh tokens Google ne vivent jamais dans une table accessible au client. Stockage chiffré serveur, secret de chiffrement hors DB, accès service-only.

## Evidence

Une evidence possède : source, date, type, empreinte, référence au document/événement et niveau de fiabilité. Les preuves doivent être supprimables avec l'utilisateur.

## RLS

Toutes les tables privées sont scellées par `user_id` et testées en cross-user isolation. Les tables de connaissance publique ne doivent jamais contenir de clé de liaison permettant de retrouver un utilisateur.

# 03 — Core / Modules Architecture

## Stack cible
- Mobile : Expo / React Native / TypeScript
- Backend : Supabase / PostgreSQL
- Automation : n8n lorsque pertinent, jamais comme source de vérité
- Web : secondaire, construit plus tard sur les mêmes contrats
- Local : SQLite pour le local-first

## Monorepo
apps/mobile
apps/web
packages/core
packages/module-sdk
packages/modules/*
packages/privacy
packages/security
packages/knowledge
packages/ai-gateway
packages/ui
packages/test-fixtures
supabase/migrations
supabase/functions
tooling
docs

## Core
Le Core possède l'état métier de référence, l'autorisation, les contrats, la gouvernance d'accès, les événements et les invariants.

## Modules
Un module :
- expose des capacités ;
- consomme des contrats Core ;
- ne possède pas la vérité globale ;
- ne dépend pas directement d'un autre module ;
- peut être désactivé ;
- possède un manifeste déclaratif.

## Interdiction
module A → module B est interdit.
module A → Core → module B est autorisé.

## Manifeste obligatoire
module id/version/status
permissions
data_required/data_produced
commands
queries
events_consumed/events_produced
knowledge_dependencies
rule_dependencies
ai_policy
retention_policy
privacy
external_actions
risk_level

## DB
Prototype : une instance Supabase, séparation logique par schémas/domaines.
Pas une base physique par Dieu.
Séparation conceptuelle :
core / identity / knowledge / rules / audit-events / domain modules

## Accès DB
Pas d'accès arbitraire.
RLS + grants + contraintes + APIs/domain functions + manifeste + audit.

## Source de vérité
Core possède l'état métier. Les projections et vues optimisées ne sont pas la source de vérité.

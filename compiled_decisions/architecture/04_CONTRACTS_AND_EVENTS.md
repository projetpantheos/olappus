# 04 — Commands / Queries / Events

## Command
Une Command demande une modification.
Exemples :
CreateCase, PrepareAction, ConfirmAction, UpdateSubscription.

Obligatoire :
- command_id unique ;
- version ;
- autorisation Core ;
- idempotence si effets secondaires ;
- validation runtime.

## Query
Lecture pure.
Aucun effet secondaire.

## Event
Fait accompli.
Exemples :
CaseCreated.v1, SubscriptionDetected.v1, ActionPrepared.v1.

Règles :
- immutable ;
- versionné ;
- horodaté ;
- traçable.

## Compatibilité
Ne pas casser un contrat sans période de migration.
Ajouter v2 avant de retirer v1.
Pattern :
ADD → MIGRATE → VERIFY → SWITCH → REMOVE

## Transactions
Atomicité pour les opérations Core critiques.
Appels externes en dehors des transactions DB, avec états d'action, retry limité et idempotence.

## Erreurs
Erreurs structurées :
- code ;
- message utilisateur ;
- retryable ;
- safe details ;
- correlation id.

Aucune donnée sensible dans erreurs/logs.

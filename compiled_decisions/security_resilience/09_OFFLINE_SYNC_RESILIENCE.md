# 09 — Local-first / Sync / Résilience

## Modèle

Local-first hybride.
Le téléphone contient les données utiles au quotidien.
Le cloud conserve une copie minimale chiffrée pour sync/restore/traitements nécessaires.

## États

ONLINE
DEGRADED
OFFLINE

L'UX doit exposer clairement les capacités disponibles.

## Local

SQLite.
P0 :

- cache local ;
- lecture offline ;
- certaines écritures ;
- outbox.

## Outbox

LOCAL COMMAND → LOCAL VALIDATION → LOCAL DB → OUTBOX → CORE → ACK

Toute Command à effet secondaire porte un command_id idempotent.

## Conflits

Pas de last-write-wins universel.

- préférences simples : dernière modification ;
- UI : dernière modification souvent acceptable ;
- permissions : révocation prioritaire ;
- cases critiques : conflit explicite ;
- actions externes : jamais fusion silencieuse ;
- knowledge : version/gouvernance.

## Suppression

La suppression doit se propager et être vérifiable.

## Backups

Un backup n'est considéré fiable qu'après test de restauration.
Rétention des backups alignée sur la politique de suppression.

## Modèle portable

Le modèle métier reste indépendant de Supabase afin de permettre migration ou export.

# COST + OBSERVABILITY

## Objective
Prototype presque gratuit et coût visible en permanence.

## Default stack
Supabase Free + Expo free tier + services sans coût obligatoire. Supabase RLS/Storage sont suffisants pour un prototype sécurisé avec limites connues. Les secret keys doivent rester côté serveur. [réf. non résolue — à revérifier]

## Cost controls
- cache ;
- sync incrémentale ;
- batch ;
- backoff ;
- no polling tight loops ;
- local processing ;
- AI off by default ;
- query budgets per connector ;
- storage retention.

## Metrics
Par connecteur : calls, bytes, errors, sync duration, duplicates, rate limit hits.
Pour IA : calls, tokens/size, purpose, success, fallback, data-classification.
Pour data ingestion : download size, parse errors, rows added/changed/deleted, license status.

## Budget alarms
Feature flag ou alerte dès :
- > quota quotidien configurable ;
- > N appels IA/jour ;
- > N MB téléchargés par source ;
- stockage proche limite ;
- synchronisation anormalement fréquente.

## No personal telemetry
Les analytics produit doivent être minimales et éviter le contenu utilisateur. Les métriques de sécurité ne doivent pas contenir de secrets.

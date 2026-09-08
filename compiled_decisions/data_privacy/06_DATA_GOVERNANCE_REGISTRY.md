# 06 — Data Registry

## Objectif

Le Data Registry est la source déclarative de gouvernance des champs métier.

Chaque champ doit indiquer :

- owner ;
- classification ;
- sources ;
- modules autorisés ;
- retention ;
- encryption ;
- anonymization ;
- export ;
- deletion ;
- AI policy ;
- provenance.

## Exemple

merchant_id

- owner: Core
- classification: L2
- allowed modules: Déméter, Perséphone
- AI: minimized_only
- export: yes
- deletion: cascade

## Data Governance as Code

Le Registry doit alimenter autant que possible :

- politiques d'accès ;
- tests RLS ;
- documentation ;
- rétention ;
- export ;
- suppression ;
- contrôles AI.

## Quatre niveaux

L1 Preferences
L2 Business
L3 Sensitive
L4 Secrets

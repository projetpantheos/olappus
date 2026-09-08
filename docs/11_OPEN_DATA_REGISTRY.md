# OPEN DATA REGISTRY

<!-- AUTHORITY-BANNER -->

> **Statut : À PROMOUVOIR** — les champs obligatoires du registre et la règle `default deny` doivent être remontés dans `governance/source_registry.yaml`. **Toutes les licences citées sont non vérifiées** et doivent être revérifiées à la source primaire avant toute ingestion.

## Règle absolue

Aucune source n'est ingérée parce qu'elle est “publique” ou “open”. Elle doit être enregistrée dans `data_sources` et passer le `license_check`.

## Champs obligatoires

`id, name, producer, URL, dataset_version, license_name, SPDX_if_available, commercial_use, modification_allowed, redistribution_allowed, attribution_required, share_alike, personal_data_notes, API_or_download, update_frequency, quality_score, legal_review_status, last_verified_at`.

## Default deny

Si la licence ou les conditions de réutilisation commerciale ne sont pas clairement établies : `blocked`.

## Seed approved / high-confidence candidates

1. **Licence Ouverte 2.0 / Etalab** : autorise la réutilisation gratuite à des fins commerciales ou non, sous obligations d'attribution. [réf. non résolue — à revérifier]
2. **Légifrance API** : API accessible gratuitement après inscription ; données soumises à Licence Ouverte 2.0 et conditions API/PISTE. [réf. non résolue — à revérifier]
3. **BAN** : ressources publiques CSV/BAL/Addok ; licence ouverte 2.0. [réf. non résolue — à revérifier]
4. **BODACC API** : accès gratuit ; licence ouverte 2.0 + conditions API. [réf. non résolue — à revérifier]
5. **RappelConso** : candidate prioritaire ; vérifier la fiche dataset et sa licence au moment du bootstrap avant ingestion.
6. **SIRENE** : candidate prioritaire ; vérifier la fiche/API et la licence au moment du bootstrap avant ingestion.
7. **Prix carburants** : candidate utile ; vérifier fiche et licence au moment du bootstrap.

## Open Food Facts

Utilisable mais **hors “golden path” de licence simplifiée** : ODbL et conditions propres au projet. Il faut isoler la provenance, l'attribution et les éventuelles obligations de partage avant de l'inclure dans une base dérivée commerciale. Ne pas copier sa base dans une base propriétaire sans analyse de licence.

## Dataset acquisition tiers

- Tier S : forte valeur, licence claire, API/download gratuit.
- Tier A : forte valeur mais intégration plus coûteuse.
- Tier B : enrichissement.
- Blocked : payant, licence non commerciale, attribution impossible, ou risque juridique non résolu.

## JOIN-first strategy

Prioriser les sources avec identifiants utiles : SIREN/SIRET, adresse, GTIN, identifiants juridiques, dates et versions.

## Current sources to investigate next

- RappelConso
- SignalConso/public aggregates
- SIRENE / Annuaire Entreprises
- BAN
- Légifrance
- BODACC
- INSEE indices/prix
- carburants
- ADEME
- données européennes Safety Gate
- Open Food Facts (isolated)

## Important

Une source peut être gratuite mais inadéquate pour la commercialisation. La source registry doit pouvoir passer de `approved` à `blocked` sans modifier le code métier.

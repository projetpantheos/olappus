# 13 — Analytics / Monetization

## Analytics

Séparer :

1. technical logs ;
2. business audit ;
3. product analytics.

Analytics agrégées par défaut.
Les comportements individuels ne sont capturés que si fonctionnellement nécessaires.

Afficher un espace « Ce qu'Olappus mesure ».

Pas d'usage automatique du comportement comme entraînement IA.

## North Star

Mental Load Removed.
Mesure pratique : Attention Avoided.

## Monetization

Freemium + Premium possible, mais architecture indépendante du business model.

Plans futurs possibles :
FREE / PREMIUM / FAMILY / PRO / PARTNER / B2B2C / TRIAL

## Entitlements

user_id + capability + status + source + valid_from + valid_until

Sources :
subscription / trial / promotion / partner / admin / bundle / family

Les modules connaissent les capabilities, pas les prix.

## Non-payant

- export de ses données ;
- suppression ;
- contrôles de confidentialité ;
- contrôle sécurité ;
- récupération de compte ;
- transparence de base.

## Données

Pas de vente de données personnelles.
Pas de publicité ciblée basée sur les données utilisateur.

## Coûts IA

Séparer coûts variables et fonctionnalités.
Routing déterministe → petit modèle → modèle puissant.

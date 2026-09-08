# MODULE SYSTEM

## But

Permettre d'ajouter une future brique sans modifier le Core sauf extension de contrat explicitement versionnée.

## Module contract

Un module doit déclarer :

- id/version ;
- domaine ;
- couleur thématique ;
- permissions nécessaires ;
- événements consommés ;
- événements produits ;
- commandes ;
- actions ;
- tables possédées ;
- migrations ;
- knowledge providers ;
- connecteurs ;
- écrans ;
- tests ;
- budget de ressources.

## Ownership

Un module possède ses tables métier. Le Core possède identity/events/cases/actions/audit. Aucun module ne lit directement les tables privées d'un autre module sans contrat.

## Capability pattern

Exemple :

```yaml
id: hades
version: 1.0.0
capabilities:
  consumes: [payment.detected, invoice.detected]
  emits: [subscription.detected, subscription.changed]
  commands: [subscription.confirm, subscription.ignore]
```

## Versionnement

- SemVer interne pour contrats ;
- événements versionnés ;
- migrations forward-compatible ;
- deprecation policy ;
- pas de breaking change silencieux.

## Installation

Une future brique doit passer :

1. revue contrat ;
2. revue sécurité ;
3. revue data/license ;
4. migrations ;
5. tests ;
6. feature flag ;
7. activation progressive.

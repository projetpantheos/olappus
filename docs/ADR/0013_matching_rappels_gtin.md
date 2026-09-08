# ADR-0013 — Correspondance des rappels produit sur GTIN exact

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D19
- **Approuvé par** : Fondateur
- **Réversible** : oui, par ADR appuyé sur des mesures de précision

## Context

Les rappels produit font partie des cas de protection listés par `docs/10_CONSUMER_PROTECTION`. Le kit définit une déduplication en quatre niveaux (identifiant exact, chaîne normalisée, correspondance probabiliste, revue humaine) mais ne dit rien de la politique applicable à un sujet de **sécurité physique**.

Les deux erreurs n'ont pas le même coût :

- **faux positif** — panique, produit sain jeté, perte de confiance durable ;
- **faux négatif** — exposition à un risque physique.

Un badge de confiance ne compense ni l'un ni l'autre.

## Decision

Toute correspondance entre un produit détenu par l'utilisateur et un rappel officiel repose **exclusivement sur un GTIN exact**.

- Aucun rapprochement sur nom de produit, y compris normalisé.
- Aucun rapprochement probabiliste, même présenté comme `PROBABLE`.
- La couverture est volontairement partielle : l'UX doit l'annoncer explicitement plutôt que de laisser croire à une surveillance exhaustive.

Règle inscrite dans `DAT-44_CANONICAL_IDENTIFIERS`.

## Rationale

Sur un sujet de sécurité, l'approximation ne se compense pas par un affichage d'incertitude : l'utilisateur agit sur l'alerte, pas sur le badge.

## Alternatives

- **GTIN + nom normalisé avec confirmation utilisateur** — rejetée pour le P0 : déplace la charge de la vérification sur l'utilisateur, exactement ce que le produit prétend réduire.

## Consequences

Le taux de couverture des rappels sera faible tant que les GTIN ne sont pas fiablement extraits. C'est un choix assumé : mieux vaut peu d'alertes justes qu'une couverture large et incertaine.

## Affected systems

Module de rappels (hors P0), `domain.product`, identifiants canoniques, microcopy.

## Security

Neutre côté système, positif côté sécurité de l'utilisateur.

## Privacy

Neutre.

## Tests

- Un rappel dont le GTIN ne correspond pas exactement ne crée aucun Case.
- Aucun chemin de code ne produit d'alerte de rappel à partir d'un nom de produit.

## Rollback

Élargissement possible ultérieurement, sur la base de mesures de précision et de rappel documentées, par nouvel ADR.

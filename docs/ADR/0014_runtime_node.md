# ADR-0014 — Runtime Node épinglé

- **Statut** : ACCEPTED — **amendé le 2026-09-08** (prémisse corrigée, voir ci-dessous)
- **Date** : 2026-09-08
- **Décision d'origine** : D13
- **Approuvé par** : Fondateur
- **Réversible** : oui

## Context

La machine de développement est en Node v24.20.0. Le kit ne mentionne aucune version de runtime, ce qui expose à une incompatibilité de toolchain découverte au milieu du bootstrap.

### Amendement du 2026-09-08

La version initiale de cet ADR retenait **Node 22 LTS** au motif que Node 24 serait « hors LTS ». **Cette prémisse était fausse** : Node 24 est entré en LTS active en octobre 2025 et l'est toujours, tandis que Node 22 est passé en maintenance à la même date. Épingler Node 22 aurait imposé une installation supplémentaire pour retenir une ligne moins bien supportée que celle déjà présente.

L'intention de la décision — **épingler une version explicite** — est inchangée ; seule la cible est corrigée.

## Decision

- **Node 24 LTS**, déjà présent sur la machine, est la version retenue.
- Elle est épinglée avant toute commande de bootstrap : `.nvmrc` à la racine, champ `engines` dans le `package.json` racine, même version dans la CI.
- **Vérification obligatoire au bootstrap** : si la version d'Expo installée déclare une exigence incompatible, c'est cette exigence qui prime, et la version épinglée est ajustée avec mention dans cet ADR.

## Rationale

Épingler avant `create-expo` évite de confondre une incompatibilité de toolchain avec une erreur de configuration. Retenir la ligne LTS active plutôt qu'une ligne en maintenance évite une installation inutile et un support plus court.

## Alternatives

- **Node 22 LTS** — écartée après correction : ligne en maintenance depuis octobre 2025, et installation supplémentaire sans bénéfice.
- **Ne rien épingler** — rejetée : la CI et la machine locale divergeraient silencieusement.

## Consequences

Prérequis d'installation avant G1. Le vert local et le vert CI portent sur la même version.

## Affected systems

Environnement de développement, `package.json`, CI.

## Security

Neutre. Une version LTS bénéficie d'un support de sécurité aligné sur l'écosystème.

## Privacy

Neutre.

## Rollback

Changement de version épinglée par mise à jour de `.nvmrc`, `engines` et CI simultanément.

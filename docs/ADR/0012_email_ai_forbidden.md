# ADR-0012 — `email` en AI_FORBIDDEN

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D7
- **Approuvé par** : Fondateur
- **Réversible** : oui

## Context

`09_DATA_CLASSIFICATION_MATRIX.csv` classait `email` en L3 avec la politique `AI_MINIMIZED_ONLY`, alors que `address` et `phone`, de même niveau L3, sont en `AI_FORBIDDEN`, et que `docs/14_AI_POLICY` interdit par défaut l'envoi d'« identifiants directs » à une IA externe. L'invariant `IDENTITY IS NOT DOMAIN DATA` rendait cette asymétrie injustifiable.

## Decision

- `email` passe en **`AI_FORBIDDEN`**.
- Deux dérivés sont introduits et peuvent être exposés en `AI_MINIMIZED_ONLY` :
  - `email_domain` — domaine seul, utile à la résolution de marchand ;
  - `sender_pseudonym_id` — pseudonyme stable, local, sans corrélation inter-utilisateurs.
- Le pipeline d'extraction produit ces dérivés **avant** tout appel au AI Gateway.

## Rationale

L'adresse email est un identifiant direct : elle permet à elle seule la ré-identification. Le domaine et un pseudonyme stable suffisent aux usages fonctionnels visés (résolution de marchand, déduplication d'expéditeur).

## Alternatives

- **Conserver `AI_MINIMIZED_ONLY`** — rejetée : contredit la politique IA et l'invariant d'identité.

## Consequences

Toute tâche d'extraction utilisant l'expéditeur doit être réécrite pour consommer les dérivés. Le Data Registry devra porter ces deux nouveaux champs avec leur classification, rétention et politique d'export.

## Affected systems

`09_DATA_CLASSIFICATION_MATRIX.csv`, Data Registry, pipeline d'extraction Hermès, AI Gateway.

## Security

Positif.

## Privacy

Ferme le risque P2 du rapport d'audit G0 : plus aucun identifiant direct ne peut atteindre une IA externe.

## Tests

- Test de fuite : aucun appel au AI Gateway ne contient une adresse email complète.
- Test de dérivation : `email_domain` et `sender_pseudonym_id` sont produits avant l'appel.

## Rollback

Retour possible par ADR de remplacement, avec justification de la nécessité fonctionnelle.

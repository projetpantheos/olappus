# ADR-0003 — Thémis porte la protection du consommateur en P0

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D15
- **Approuvé par** : Fondateur
- **Réversible** : oui (module dédié possible en P1)

## Context

Le contrat produit annonce un positionnement hybride à deux piliers, dont **50 % protection du consommateur**, et `docs/10_CONSUMER_PROTECTION` détaille 8 types de cas : hausse de facture, renouvellement, garantie, remboursement attendu, problème de livraison, rappel produit, échéance de contrat, contestation documentée.

Or les trois modules domaine du P0 couvrent : les récurrences et abonnements (Hadès), les variations de prix (Argos), les échéances (Thémis). **Aucun ne porte les droits, les procédures, les médiateurs ni les réclamations.** Les modules qui les portaient dans `docs/00_PREVIOUS_BLUEPRINT` — Dikè (droit) et Mercure (rappels/achats) — ne figurent ni au P0, ni dans la liste « Après P0 », ni au manifeste : ils ont disparu de la couche normative sans décision tracée.

En l'état, le P0 livrait un détecteur d'abonnements, pas une couche de protection.

## Decision

Thémis est étendu et devient le porteur des règles juridiques datées et du calcul de délais.

Il possède l'entité `knowledge.legal_rule` :

```
rule_id
jurisdiction
instrument_ref          -- texte de référence
article_ref
version_date
in_force_from
in_force_to
procedure_steps[]
deadline_rule           -- règle de calcul versionnée
source_ref              -- entrée du Source Registry
verification_level
```

Règles de comportement obligatoires :

1. Les règles de calcul de délai sont **versionnées** ; un délai affiché conserve la version de règle qui l'a produit.
2. Aucune affirmation n'est produite si la règle est expirée, hors juridiction ou sous le seuil de confiance : la sortie est `INSUFFICIENT_DATA`.
3. La formulation prudente de `docs/09_MUSES_GOVERNANCE` est imposée : « X signalements correspondent à Y », jamais « X est frauduleux ».
4. Aucun délai n'est affiché sans sa source et sa date de calcul.

Un module de droits dédié (ex-Dikè) reste envisageable en P1, par extension et non par réécriture.

## Rationale

Thémis possède déjà les échéances ; y greffer les règles datées tient la promesse produit sans ajouter un module au P0 ni allonger le chemin jusqu'au premier usage réel.

## Alternatives

- **Module Dikè en P0** — rejetée : allonge nettement le P0 pour un bénéfice atteignable par extension.
- **P0 = détection seule, promesse ajustée** — rejetée : ampute le positionnement de moitié.

## Consequences

Le périmètre de Thémis s'élargit dans `project.manifest.json`. La spécification `PRD-38 Consumer Rights Engine` devient un livrable de G5/G7. Le risque de préjudice par délai mal calculé devient un objet testable au lieu d'une intention.

## Affected systems

Thémis, `knowledge.*`, Source Registry, Hélios (affichage de la confiance et de la provenance), tests d'acceptation.

## Security

Neutre côté données.

## Privacy

Neutre : les règles juridiques sont de la connaissance collective, sans donnée personnelle.

## Tests

- Une règle expirée ne produit jamais d'affirmation.
- Une situation hors juridiction retourne `INSUFFICIENT_DATA`.
- Tout délai affiché porte source, version de règle et date de calcul.

## Rollback

Extension additive : désactivable par feature flag sans toucher au reste de Thémis.

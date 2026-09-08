# ADR-0007 — Périmètre juridique du P0 : France, trois droits

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D16
- **Approuvé par** : Fondateur
- **Réversible** : oui (extension par ADR)

## Context

ADR-0003 confie à Thémis les règles juridiques datées. Sans périmètre explicite, le module tenterait de couvrir un espace juridique illimité, avec un risque direct de préjudice : un délai mal calculé fait perdre un droit définitivement.

## Decision

- **Juridiction** : France uniquement.
- **Droits couverts en P0** : garantie légale de conformité, droit de rétractation, résiliation/réclamation.
- Chaque droit est adossé à un texte identifié, daté, et enregistré au Source Registry avec sa licence.
- Toute situation hors juridiction ou hors des trois droits retourne `INSUFFICIENT_DATA` et n'affiche aucune estimation.
- Médiateurs, voies de recours et procédures contentieuses sont **hors P0**.

Aucune sortie n'est présentée comme un conseil juridique. Le produit affiche la source, la date, la juridiction et le niveau de confiance, conformément à `docs/10_CONSUMER_PROTECTION`.

## Rationale

Trois droits suffisent à démontrer la chaîne complète `source → règle → délai → preuve → action` sans disperser l'effort de vérification juridique, qui est le vrai facteur limitant.

## Alternatives

- **Un seul droit** — écartée : ne démontre pas la généralité du moteur.
- **Trois droits + médiateurs** — écartée pour le P0 : ajoute une source officielle supplémentaire à enregistrer et vérifier.

## Consequences

Une source juridique officielle doit être approuvée au Source Registry en G5. La couverture est volontairement partielle et doit être annoncée comme telle dans l'UX.

## Affected systems

Thémis, `knowledge.legal_rule`, Source Registry, Hélios, microcopy.

## Security

Neutre.

## Privacy

Neutre.

## Legal

Ce périmètre est une limite d'ingénierie, pas un avis juridique. La revue par un conseil qualifié reste requise avant lancement public (`29_LEGAL_RISK_CHECKPOINTS`). Aucune revendication de conformité n'est faite.

## Tests

- Situation hors juridiction ⇒ `INSUFFICIENT_DATA`.
- Droit hors des trois couverts ⇒ aucune affirmation, aucun délai affiché.
- Toute règle appliquée porte un texte de référence daté.

## Rollback

Extension ou réduction du périmètre par nouvel ADR ; aucune donnée à migrer.

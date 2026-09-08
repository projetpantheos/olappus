# ADR-0011 — Muses minimal avant Hermès

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D11
- **Approuvé par** : Fondateur
- **Réversible** : oui

## Context

Trois ordonnancements coexistaient : `18_P0_BUILD_ORDER` place Muses en phase 3, avant le produit et le connecteur réel ; `product/02_MVP_P0` le place en position 5 ; `docs/23_FOUNDER_RUNBOOK` place Open Data et Knowledge en phase 8, après tous les modules produit. Écart d'environ quatre phases sur le même sujet.

## Decision

**G5 livre Muses minimal et le License Gate, avant le connecteur Gmail (G6).**

Périmètre G5 :

- `knowledge.source`, `fact`, `evidence`, `proposal`, `review`, `certification`, `rule`, `rule_version`, `legal_rule`, `conflict` ;
- séparation stricte candidate ≠ fact ;
- validité temporelle (`valid_from` / `valid_until`) obligatoire ;
- suspension gouvernée d'une règle publiée ;
- **License Gate** : une source dont le statut n'est pas `APPROVED` rend l'ingestion impossible, même si l'endpoint répond ;
- une seule source approuvée pour commencer.

Reporté après le premier Case bout en bout : réputation par domaine, anti-Sybil, détection de collusion, quorum étendu (voir `AI-37`, D18).

## Rationale

Thémis (ADR-0003) a besoin de règles juridiques sourcées et versionnées pour exister : le pipeline de connaissance conditionne les moteurs déterministes. À l'inverse, la réputation ne conditionne rien tant que Muses n'est pas public — ce qui n'est pas requis au lancement (`10_MUSES_KNOWLEDGE_GOVERNANCE`, phase 1 : équipe Olappus + sources officielles).

## Alternatives

- **Muses après les modules produit** — rejetée : Thémis n'aurait aucune règle sourcée à exploiter.
- **Muses complet en G5** — rejetée : effort largement anticipé pour un système non public.

## Consequences

Aucune règle certifiée n'est publiée avant que les seuils anti-abus ne soient chiffrés. Le premier usage réel arrive une gate plus tard que dans le runbook historique — coût assumé.

## Affected systems

`knowledge.*`, Source Registry, Thémis, ordre des gates.

## Security

Positif : le License Gate et la séparation candidate/fact sont en place avant toute ingestion externe.

## Privacy

Positif : la frontière connaissance collective / données utilisateur est posée avant l'arrivée de données réelles.

## Tests

- Une source `blocked` ou `REVIEW_REQUIRED` ne peut pas être ingérée.
- Une proposition issue d'une IA ne peut pas devenir une connaissance publiée.
- Une contradiction crée un objet de conflit au lieu d'écraser.

## Rollback

Réordonnancement possible tant qu'aucune source n'est ingérée.

# ADR-0004 — Pas d'upload de documents en P0

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D3
- **Approuvé par** : Fondateur
- **Réversible** : oui (ajout additif ultérieur)

## Context

L'onglet « Mémoire » et le CTA global `+ Ajouter` figurent dans la navigation primaire de `14_UX_JOURNEY_BIBLE`, et `24_P0_ACCEPTANCE_TESTS` teste des documents et des evidences. Pourtant Mnémosyne n'apparaît ni dans `product/02_MVP_P0`, ni dans `project.manifest.json`. Il apparaît en revanche dans `docs/01`, dans le runbook fondateur (phase 6) et dans le fichier de prompts agrégé.

Un onglet de navigation primaire dépendait donc d'un module dont l'appartenance au P0 était contestée.

## Decision

Aucun upload utilisateur en P0.

- L'onglet « Mémoire » présente **en lecture seule** les evidences issues d'Hermès.
- L'Evidence Vault (`PRD-39`) se nourrit des pièces extraites par le connecteur.
- Le CTA `+ Ajouter` est retiré du P0 ou limité aux actions ne créant pas de fichier.
- Bucket privé, limites MIME/taille, signed URLs et purge de fichiers ne sont pas implémentés en P0.

Mnémosyne devient un ajout additif ultérieur, introduit par son propre manifeste de module.

## Rationale

Préserve la navigation prévue sans ouvrir en P0 la surface d'attaque « upload », qui appelle à elle seule cinq familles de tests : MIME spoofing, taille excessive, noms de fichiers dangereux, PDF/images malformés et bombes de décompression, SVG/HTML.

## Alternatives

- **Inclure l'upload en P0** — rejetée : coût de sécurité disproportionné au stade prototype.
- **Retirer l'onglet Mémoire** — rejetée : s'écarte inutilement de l'UX Journey Bible alors qu'un contenu lisible existe déjà.

## Consequences

Les tests d'acceptation portant sur les documents utilisateurs sont marqués « hors P0 » dans `TEST_MAP.md`. Le parcours de suppression P0 ne porte pas sur des fichiers utilisateurs, ce qui simplifie l'inventaire de suppression (`SEC-33`).

## Affected systems

Navigation, Hélios, Evidence Vault, Storage (non utilisé en P0), tests d'acceptation.

## Security

Positif : réduit significativement la surface d'attaque du P0.

## Privacy

Positif : aucune donnée déposée volontairement par l'utilisateur hors périmètre du connecteur.

## Tests

Aucun test d'upload en P0. Un test vérifie qu'aucune route d'upload n'est exposée.

## Rollback

Sans objet : la décision retire une fonctionnalité, elle ne crée pas de dette.

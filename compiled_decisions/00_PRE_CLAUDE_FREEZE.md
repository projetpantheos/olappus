# OLAPPUS — PRE-CLAUDE FREEZE

Version 1.0 — 2026-09-08

## Objet

Ce document définit la dernière phase de préparation avant le développement autonome assisté par Claude Code.

## Règle

Le projet doit être suffisamment défini pour que Claude puisse implémenter sans inventer :

- le modèle mental produit ;
- l'architecture ;
- le modèle de données ;
- la gouvernance privacy ;
- les contrats CQE ;
- le comportement UX ;
- les permissions ;
- les tests d'acceptation ;
- la gestion des erreurs ;
- le workflow de release.

## Les 6 artefacts bloquants

1. UX Journey Bible
2. UI Component Specification
3. Canonical Data Model
4. Data Classification Matrix
5. CQE Contracts
6. P0 Acceptance Tests

## Artefacts complémentaires

7. Module Manifest Schema
8. Offline/Sync Specification
9. AI Gateway Specification
10. Security Control Matrix
11. Project State
12. ADR/Decision Ledger
13. Synthetic Data / Adversarial Fixtures
14. Release Checklist

## Freeze rule

Après validation G0, toute modification structurante passe par le Decision Ledger.
Une zone volontairement non définie doit être explicitement marquée `OPEN`, jamais implicitement inventée.

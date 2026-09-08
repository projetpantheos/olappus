# 16 — Git / Versioning / Release / Evolution

## Git
main protégée.
Branches courtes :
feature/*, fix/*, chore/*

Pas de GitFlow lourd.

## Versioning
Core/modules versionnés.
Contrats versionnés.
Ne pas casser un contrat sans migration.

## Décisions
Decision Ledger avec ADR :
ID, date, status, context, decision, rationale, alternatives, consequences, affected systems, security, privacy, supersedes/superseded_by, approved_by.

## Changements de schéma
ADD → MIGRATE → VERIFY → SWITCH → REMOVE

## Feature flags
INTERNAL → ALPHA → BETA → ROLLOUT → 100%
Désactiver une feature ne signifie pas supprimer ses données.

## Rollback
1. feature rollback ;
2. application rollback ;
3. migration rollback si possible, sinon procédure de correction additive.

## Régression
BUG → DETECTION → CONTAINMENT → ROLLBACK/FLAG OFF → ROOT CAUSE → FIX → REGRESSION TEST → RELEASE → POSTMORTEM

Toute régression importante crée un test permanent.

## Décision verrouillée
Un conflit avec une décision verrouillée déclenche STOP.

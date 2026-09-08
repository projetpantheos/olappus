# ADR-0009 — Tests RLS et migrations en local (Docker + Supabase CLI)

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D12
- **Approuvé par** : Fondateur
- **Réversible** : oui

## Context

`23_SECURITY_CONTROL_MATRIX` place « RLS on exposed tables » en premier contrôle, avec un test automatisé pour preuve, et `24_P0_ACCEPTANCE_TESTS` n°13 exige que RLS bloque un accès non autorisé. `docs/19_RELEASE_RUNBOOK` exige des migrations testées sur base jetable.

L'audit G0 a constaté qu'aucun de ces tests n'avait d'environnement d'exécution : ni Docker, ni CLI Supabase sur la machine. La gate G2 aurait été atteinte sans pouvoir être démontrée.

## Decision

Docker Desktop et la CLI Supabase sont installés. Toutes les suites RLS cross-user et tous les tests de migration s'exécutent sur une **base locale jetable**, recréée à chaque exécution.

Repli documenté si le local devient impraticable : second projet Supabase DEV dédié aux tests, distinct du DEV de développement, ne contenant que des données synthétiques.

## Rationale

Le local est gratuit, hors ligne, reproductible, et supprime tout risque de mélange avec des données non synthétiques. Il permet en outre les tests de migration destructive, impossibles sur un projet partagé.

## Alternatives

- **Projet Supabase DEV jetable distant** — retenue comme repli seulement : dépend du réseau, consomme du quota, complique les migrations destructives.
- **Reporter** — exclue : contredit la matrice de contrôle.

## Consequences

Prérequis d'installation avant G2. La CI est configurée sur la même stack pour que le vert local et le vert CI aient la même signification.

## Affected systems

Environnement de développement, CI, suites de tests, runbook de release.

## Security

Positif : rend démontrable le contrôle de sécurité n°1, et supprime le besoin d'un projet distant pour tester des politiques.

## Privacy

Positif : aucune donnée ne sort de la machine pendant les tests.

## Tests

Isolation cross-user sur SELECT/INSERT/UPDATE/DELETE, par schéma (ADR-0005), plus tests Storage lorsque Storage sera utilisé.

## Rollback

Bascule vers le repli distant sans changement de code de test.

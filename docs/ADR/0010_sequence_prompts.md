# ADR-0010 — Séquence de prompts faisant foi

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D2
- **Approuvé par** : Fondateur
- **Réversible** : oui

## Context

Deux séquences d'exécution portaient les mêmes numéros pour des contenus différents :

| N° | `01_TO_10_EXECUTION_PROMPTS.md` | Fichiers individuels |
|---|---|---|
| 03 | Hélios | Core |
| 04 | Hermès | Module SDK |
| 05 | **Chronos** | Muses |
| 06 | **Mnémosyne** | Hélios |
| 07 | Hadès/Argos/Thémis | Hermès |
| 08 | Data + Muses | Hadès/Argos/Thémis |
| 09 | Case/Actions | Offline |
| 10 | Security gate | Release |

Aucun des deux fichiers ne se déclarait subordonné à l'autre.

## Decision

Les fichiers individuels `prompts/02_BOOTSTRAP_FOUNDATION.md` → `prompts/11_NEW_MODULE.md` font foi.

`prompts/01_TO_10_EXECUTION_PROMPTS.md` est déplacé vers `prompts/_archive/` avec une note d'archivage.

Les prompts individuels seront réalignés sur la taxonomie G0–G9 d'ADR-0001 lors d'une passe ultérieure.

## Rationale

Les fichiers individuels sont alignés sur `18_P0_BUILD_ORDER` (Core → Module SDK → Muses → produit). La version agrégée introduit Chronos et Mnémosyne, tous deux hors P0 — Mnémosyne étant explicitement écarté par ADR-0004.

## Alternatives

- **Fichier agrégé faisant foi** — rejetée : incompatible avec ADR-0004.
- **Réécriture fusionnée immédiate** — écartée pour l'instant : ajoute une tâche de rédaction avant le bootstrap, sans bénéfice immédiat.

## Consequences

Un seul jeu de prompts est cité en session. L'archive reste consultable comme trace de cadrage.

## Affected systems

`prompts/`, runbook fondateur.

## Security

Neutre.

## Privacy

Neutre.

## Rollback

Restauration du fichier archivé, sans effet sur le code.

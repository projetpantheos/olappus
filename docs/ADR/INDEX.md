# DECISION LEDGER — INDEX DES ADR

Le Decision Ledger est **la source d'autorité du projet**. Vue condensée des invariants : `DECISION_LEDGER_COMPILED.md` (racine du kit). Vue décisionnelle tracée : ce dossier.

Règle : une décision verrouillée ne se modifie qu'en créant un ADR qui la remplace explicitement (`16_EVOLUTION_GIT_RELEASES`). **L'absence d'instruction n'est jamais une autorisation implicite.**

## Lot G0 — 2026-09-08

| ADR | Titre | Origine | Statut | Réversible |
|---|---|---|---|---|
| [0001](0001_taxonomie_gates.md) | Taxonomie de gates unique G0–G9 | D1 | ACCEPTED | oui |
| [0002](0002_monorepo_npm_workspaces.md) | Monorepo npm workspaces | D6 | ACCEPTED | oui |
| [0003](0003_themis_protection_consommateur.md) | Thémis porte la protection du consommateur | D15 | ACCEPTED | oui |
| [0004](0004_pas_upload_documents_p0.md) | Pas d'upload de documents en P0 | D3 | ACCEPTED | oui |
| [0005](0005_schemas_postgresql.md) | Schémas PostgreSQL comme convention de données | D4 | ACCEPTED | **non** |
| [0006](0006_enveloppe_cqe.md) | Enveloppe Command/Event canonique | D5 | ACCEPTED | **non** |
| [0007](0007_perimetre_juridique_p0.md) | Périmètre juridique du P0 : France, trois droits | D16 | ACCEPTED | oui |
| [0008](0008_perte_recovery_codes.md) | Perte des recovery codes : données L3 non récupérables | D17 | ACCEPTED | non |
| [0009](0009_tests_rls_local.md) | Tests RLS et migrations en local | D12 | ACCEPTED | oui |
| [0010](0010_sequence_prompts.md) | Séquence de prompts faisant foi | D2 | ACCEPTED | oui |
| [0011](0011_position_muses.md) | Muses minimal avant Hermès | D11 | ACCEPTED | oui |
| [0012](0012_email_ai_forbidden.md) | `email` en AI_FORBIDDEN | D7 | ACCEPTED | oui |
| [0013](0013_matching_rappels_gtin.md) | Correspondance des rappels produit sur GTIN exact | D19 | ACCEPTED | oui |
| [0014](0014_runtime_node.md) | Runtime Node épinglé (Node 24 LTS) | D13 | ACCEPTED, amendé | oui |

## Décisions appliquées sans ADR dédié

Corrections d'incohérence sans arbitrage réel, appliquées le 2026-09-08 et tracées ici :

| Réf. | Correction | Fichier touché |
|---|---|---|
| D8 | Niveau `L0_RAW_QUARANTINE` ajouté à la taxonomie (la valeur `RAW` était hors des quatre niveaux déclarés) | `compiled_decisions/data_privacy/09_DATA_CLASSIFICATION_MATRIX.csv` |
| D9 | `16_DESIGN_TOKENS.json` fait foi pour la terracotta (`#7C4332`) ; contraste AA rétabli | `docs/04_DESIGN_SYSTEM.md` |
| D10 | Chemin d'autorité du Decision Ledger corrigé ; codes de domaine attribués pour supprimer les collisions de numéro | `project.manifest.json`, `compiled_decisions/00_INDEX.md` |
| D14 | 42 marqueurs de citation non résolubles remplacés par `[réf. non résolue — à revérifier]` dans 12 fichiers | `docs/*.md` |
| D18 | Seuils anti-abus Muses différés à G5, sans publication de règle certifiée avant chiffrage | `compiled_decisions/00_OPEN_ITEMS.md` |
| D20 | Thème sombre marqué `OPEN` | `compiled_decisions/00_OPEN_ITEMS.md` |

## Invariants ajoutés au manifeste par ce lot

1. `untrusted_content_cannot_parameterize_external_actions`
2. `no_durable_third_party_identity`

Voir `project.manifest.json` et `compiled_decisions/security_resilience/23_SECURITY_CONTROL_MATRIX.md`.

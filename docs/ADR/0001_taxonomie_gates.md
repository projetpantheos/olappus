# ADR-0001 — Taxonomie de gates unique G0–G9

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D1
- **Approuvé par** : Fondateur
- **Réversible** : oui, tant qu'aucun rapport de gate n'est archivé

## Context

Quatre documents définissaient des gates, trois utilisant la numérotation G0–G10 pour des contenus différents :

- `project.manifest.json` : 7 gates (G0 Audit → G5 Magic Moment → Beta) ;
- `docs/24_GATES_CHECKLIST` : 11 gates (G4 = Google, G5 = Knowledge, G6 = Muses) ;
- `docs/23_FOUNDER_RUNBOOK` : 11 gates (G4 = Hermès, G5 = Calendar, G6 = Mnémosyne) ;
- `compiled_decisions/runbooks/17_FOUNDER_GATES` : 5 gates thématiques, orthogonales et non conflictuelles.

« G4 » désignait donc simultanément Muses, Google/OAuth et Hermès. Or le label de gate est porteur d'information dans `PROJECT_STATE.md`, dans le format de revue fondateur (champ `GATE`) et dans `30_DEFINITION_OF_DONE` (« all mandatory gates green »).

L'audit G0 a par ailleurs relevé que les 7 gates du manifeste ne comportaient **aucune gate dédiée au connecteur externe**, pourtant l'étape la plus risquée du P0.

## Decision

Taxonomie unique :

| Gate | Objet | Condition de sortie |
|---|---|---|
| G0 | Audit | Décisions bloquantes tranchées, couche d'autorité cohérente |
| G1 | Foundation | Dépôt, TS strict, Expo, CI, secret scan, séparation d'environnements |
| G2 | Privacy / Security baseline | Data Registry, quarantine, normalisation, RLS ; preuve d'échec d'accès non autorisé |
| G3 | Core contracts | CQE figés + runtime, Case/Action/Outcome, audit, manifestes, lint d'imports, Safe Mode |
| G4 | Demo Mode + Hélios déterministe | Première valeur < 5 min, sans aucun appel externe |
| G5 | Muses minimal + License Gate | Source `blocked` ⇒ ingestion impossible |
| G6 | **Connecteur externe (Hermès / OAuth)** | Aucun token ni corps brut dans les logs |
| G7 | Modules domaine + protection | Chaque insight porte reason codes + evidence |
| G8 | Offline / Outbox | Aucune résurrection après suppression, rejeu idempotent |
| G9 | Release / Beta | Suites vertes, rollback répété, aucune décision RED ouverte |

Les 5 gates thématiques de `17_FOUNDER_GATES` (DATA / TRUST / ACTION / CHANGE / RELEASE) s'appliquent **à chaque** gate numérotée, en surcouche.

`docs/23_FOUNDER_RUNBOOK` et `docs/24_GATES_CHECKLIST` sont rétrogradés en **checklists de contenu**. Leur numérotation est abrogée. La table de correspondance fait foi : `compiled_decisions/runbooks/RUN-42_GATE_MAP.md`.

## Rationale

Seule option cohérente à la fois avec la couche machine (manifeste), avec `18_P0_BUILD_ORDER` et avec le niveau d'exigence sécurité du kit, tout en préservant une gate explicite pour le connecteur externe.

## Alternatives

- **Manifeste seul (7 gates)** — rejetée : supprime la gate de sécurité connecteur.
- **Runbook fondateur (11 gates)** — rejetée : conserve Calendar et Mnémosyne, hors P0 après ADR-0004.

## Consequences

Toute revue de session cite une gate de cette table et d'elle seule. `project.manifest.json` est mis à jour. Les prompts d'exécution seront réalignés sur cette numérotation.

## Affected systems

Documentation, `project.manifest.json`, `PROJECT_STATE.md`, format de revue fondateur.

## Security

Positif : rétablit une gate de sécurité explicite pour OAuth et le connecteur externe.

## Privacy

Neutre.

## Tests

Aucun test logiciel. La correspondance gate → checklist est vérifiée à la revue.

## Rollback

Trivial tant qu'aucun rapport de gate n'est archivé.

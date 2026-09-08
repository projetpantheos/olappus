# OLAPPUS — PROJECT STATE

Dernière mise à jour : 2026-09-08 (étape 0, post-G0)
Ce fichier est le **seul** porteur de l'état d'avancement. `project.manifest.json` ne porte que les invariants et les conventions.

## Current phase

Étape 0 terminée — préparation de G1 Foundation

## Current gate

**G0 — PASSED**. Prochaine : G1 Foundation.
Taxonomie applicable : `compiled_decisions/runbooks/RUN-42_GATE_MAP.md` (G0–G9).

## Last successful checkpoint

2026-09-08 — Audit G0 rendu, 14 décisions tranchées (ADR-0001 → ADR-0014), réparations documentaires appliquées.

## Status

READY_FOR_BOOTSTRAP

## Completed

- Compilation des décisions produit, privacy, sécurité, Muses, monétisation, UX
- Couche de spécification pré-Claude
- **Audit G0** : architecture, fichiers manquants, 13 contradictions, dépendances, risques privacy et sécurité
- **Analyse de cohérence** : promesse consommateur, sécurité des données, angles morts
- **14 ADR** déposés dans `docs/ADR/`
- **Étape 0** : carte d'autorité (`docs/DEPRECATION_MAP.md`), liste des zones ouvertes (`compiled_decisions/00_OPEN_ITEMS.md`), table de correspondance des gates, chemin d'autorité corrigé, 42 marqueurs de citation traités, prompt agrégé archivé

## In progress

Aucun travail en cours. En attente du démarrage de G1.

## Blocked

Rien. Prérequis avant G1/G2 : Docker Desktop (ADR-0009). Node 24 LTS déjà présent et retenu (ADR-0014 amendé) ; la CLI Supabase sera une dépendance du projet, pas une installation globale. Seul compte à créer maintenant : GitHub (dépôt privé). Supabase hébergé et Google Cloud attendent G6 ; Expo/EAS attend G9 — voir docs/SETUP_FONDATEUR.md.

## Open decisions

Aucune décision RED ouverte.
Zones volontairement non définies : voir `compiled_decisions/00_OPEN_ITEMS.md` (10 items, dont les seuils anti-abus Muses différés à G5).

## Known risks

- Le Data Registry machine-lisible n'existe pas encore ; il conditionne G2 et donc tout le reste (chemin critique).
- Six contrôles de la matrice de sécurité n'ont pas encore de spécification d'implémentation : chiffrement L3, Safe Mode, idempotence, vérification de suppression, restauration de backup, révocation d'appareil.
- Les licences et quotas de sources open data cités dans `docs/` sont non vérifiés ; aucune ingestion possible avant re-vérification à la source primaire.
- Revue juridique/DPO requise avant tout pilote public.

## Privacy status

DESIGN_READY / IMPLEMENTATION_PENDING
Renforcé : `email` en `AI_FORBIDDEN` (ADR-0012), niveau `L0_RAW_QUARANTINE` introduit, règle des données de tiers posée.

## Security status

DESIGN_READY / IMPLEMENTATION_PENDING
Renforcé : deux invariants ajoutés au manifeste (contenu non fiable ne paramètre pas d'action externe ; pas d'identité de tiers durable). Modèle de clés tranché (ADR-0008), spécification `SEC-31` à écrire en G2.

## Test status

SPEC_READY / IMPLEMENTATION_PENDING
Les 40 tests d'acceptation ont désormais un environnement d'exécution prévu (ADR-0009). `TEST_MAP.md` reste à produire.

## Next founder action

Suivre docs/SETUP_FONDATEUR.md : configurer git, installer Docker Desktop, créer le dépôt GitHub privé, préparer le coffre de secrets. Les comptes Supabase, Expo et Google Cloud ne sont pas nécessaires avant G6/G9. Puis lancer `prompts/02_BOOTSTRAP_FOUNDATION.md`.

## Next Claude action

G1 Foundation : `git init`, `.gitignore` et secret scan **en premier commit**, monorepo npm workspaces, TypeScript strict, Expo, CI, séparation d'environnements, politique de journalisation (`SEC-34`). Aucun compte réel, aucun secret de production.

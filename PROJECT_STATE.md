# OLAPPUS — PROJECT STATE

Dernière mise à jour : 2026-09-08 (fin de G1)
Ce fichier est le **seul** porteur de l'état d'avancement. `project.manifest.json` ne porte que les invariants et les conventions.

## Current phase

G1 Foundation terminée — en attente de revue fondateur.

## Current gate

**G1 — PASSED**, sous réserve de revue. Prochaine : **G2 Privacy / Security baseline**.
Taxonomie applicable : `compiled_decisions/runbooks/RUN-42_GATE_MAP.md` (G0–G9).

## Last successful checkpoint

2026-09-08 — G1 : dépôt initialisé, socle monorepo, application Expo, chaîne CI verte. 3 commits, aucun push.

## Status

G1_COMPLETE / PENDING_FOUNDER_REVIEW

## Completed

- Compilation des décisions produit, privacy, sécurité, Muses, monétisation, UX
- Couche de spécification pré-Claude
- **Audit G0** : architecture, fichiers manquants, 13 contradictions, dépendances, risques privacy et sécurité
- **Analyse de cohérence** : promesse consommateur, sécurité des données, angles morts
- **14 ADR** déposés dans `docs/ADR/`
- **Étape 0** : carte d'autorité (`docs/DEPRECATION_MAP.md`), zones ouvertes (`compiled_decisions/00_OPEN_ITEMS.md`), table de correspondance des gates, chemin d'autorité corrigé, 42 marqueurs de citation traités, prompt agrégé archivé
- **G1 Foundation** : dépôt git, `.gitignore` avant le premier `git add`, scan de secrets, monorepo npm workspaces, TypeScript 6 strict, ESLint 10, Prettier, vitest 5, CI GitHub Actions, `.env.example`, `SEC-34`, application Expo SDK 57 minimale

## In progress

Aucun travail en cours. En attente de la revue de G1 et du démarrage de G2.

## Blocked

Rien. Le dépôt distant n'est pas configuré : aucun push n'a été effectué, l'URL du dépôt GitHub reste à fournir.

## Open decisions

Aucune décision RED ouverte.
Zones volontairement non définies : voir `compiled_decisions/00_OPEN_ITEMS.md` (10 items, dont les seuils anti-abus Muses différés à G5).

## Known risks

- Le Data Registry machine-lisible n'existe pas encore ; il conditionne G2 et donc tout le reste (chemin critique).
- Six contrôles de la matrice de sécurité n'ont pas encore de spécification d'implémentation : chiffrement L3, Safe Mode, idempotence, vérification de suppression, restauration de backup, révocation d'appareil.
- 14 vulnérabilités modérées transitives dans la chaîne Expo (`decode-uri-component` via `expo-router`, `uuid` via `@expo/config-plugins`). Aucune haute ni critique. Acceptées et surveillées : le correctif proposé par npm redescendrait Expo en 46.
- Les licences et quotas de sources open data cités dans `docs/` sont non vérifiés ; aucune ingestion possible avant re-vérification à la source primaire.
- Revue juridique/DPO requise avant tout pilote public.

## Privacy status

DESIGN_READY / IMPLEMENTATION_PENDING
Renforcé : `email` en `AI_FORBIDDEN` (ADR-0012), niveau `L0_RAW_QUARANTINE` introduit, règle des données de tiers posée. Aucune donnée réelle ni compte réel dans le dépôt.

## Security status

DESIGN_READY / IMPLEMENTATION_PENDING
Deux invariants ajoutés au manifeste (contenu non fiable ne paramètre pas d'action externe ; pas d'identité de tiers durable). Modèle de clés tranché (ADR-0008), `SEC-31` à écrire en G2. Contrôles opérationnels en G1 : scan de secrets automatisé, audit de dépendances, `SEC-34` écrit.

## Test status

PARTIEL — la chaîne existe, la couverture est symbolique.
2 tests unitaires. Les 40 tests d'acceptation ont un environnement d'exécution prévu (ADR-0009) mais ne sont pas écrits. `TEST_MAP.md` reste à produire.

## Next founder action

Relire `docs/GATE_REPORTS/G1.md`, fournir l'URL du dépôt GitHub privé pour configurer le remote, puis autoriser le premier push.

## Next Claude action

G2 Privacy / Security baseline : écrire `governance/data_registry.yaml` (chemin critique), puis quarantine, normalisation, identité/appareil/permissions, RLS par schéma, et la **preuve automatisée qu'un accès non autorisé échoue**. Nécessite la CLI Supabase en dépendance de projet et la stack locale Docker.

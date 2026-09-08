# OLAPPUS — PROJECT STATE

Dernière mise à jour : 2026-09-08 (fin de G2)
Ce fichier est le **seul** porteur de l'état d'avancement. `project.manifest.json` ne porte que les invariants et les conventions.

## Current phase

G2 Privacy / Security baseline terminée — en attente de revue fondateur.

## Current gate

**G2 — PASSED**, sous réserve de revue. Prochaine : **G3 Core contracts**.
Taxonomie applicable : `compiled_decisions/runbooks/RUN-42_GATE_MAP.md` (G0–G9).

## Last successful checkpoint

2026-09-08 — G2 : Data Registry exécutable, isolation RLS prouvée, normalisation, suppression vérifiée, rétention purgée et supervisée. 66 tests, 13 commits poussés.

## Status

G2_COMPLETE / PENDING_FOUNDER_REVIEW

## Completed

- Compilation des décisions produit, privacy, sécurité, Muses, monétisation, UX
- Couche de spécification pré-Claude
- **Audit G0** : architecture, fichiers manquants, 13 contradictions, dépendances, risques privacy et sécurité
- **Analyse de cohérence** : promesse consommateur, sécurité des données, angles morts
- **15 ADR** déposés dans `docs/ADR/`
- **Étape 0** : carte d'autorité, zones ouvertes, table de correspondance des gates, chemin d'autorité corrigé, 42 marqueurs de citation traités
- **G1 Foundation** : dépôt git, `.gitignore` avant tout `git add`, scan de secrets, monorepo npm workspaces, TypeScript 6 strict, ESLint 10, vitest 5, CI, application Expo SDK 57 minimale
- **G2 Privacy / Security** : Data Registry exécutable, 7 schémas en deny by default, RLS activée et forcée, permissions, quarantaine, audit append-only, normalisation canonique, suppression vérifiée, rétention chiffrée, purgée et supervisée
- **Spécifications de sécurité** : `SEC-31`, `SEC-33`, `SEC-34`, `SEC-35`, `DAT-43`

## In progress

Aucun travail en cours. En attente de la revue de G2 et du démarrage de G3.

## Blocked

Rien. La pile Supabase locale doit tourner (`npx supabase start`) pour que les tests de base s'exécutent ; ils sont **ignorés, et non silencieusement verts**, en son absence.

## Open decisions

Aucune décision RED ouverte.
Zones volontairement non définies : voir `compiled_decisions/00_OPEN_ITEMS.md`.

## Known risks

- Le chiffrement applicatif L3 est spécifié (`SEC-31`) mais **non implémenté**. Aucun champ L3 n'est encore collecté ; l'écart doit être comblé **avant G6**, qui apportera les premières données réelles.
- Les purges de rétention ne sont pas encore déclenchées par un ordonnanceur. Le point d'entrée existe, et son inactivité est détectable via `core.retention_health`.
- La suppression n'est vérifiée que sur 6 des 12 emplacements de `SEC-33` ; les autres n'existent pas encore (SQLite local, outbox, sauvegardes, journaux).
- La rétention des sauvegardes reste ouverte (OPEN-06) : la durée après laquelle une donnée supprimée disparaît de toutes les copies est inconnue et ne doit pas être annoncée.
- 14 vulnérabilités modérées transitives dans la chaîne Expo, aucune haute ni critique.
- Licences de sources open data non vérifiées ; aucune ingestion avant re-vérification à la source primaire.
- Revue juridique/DPO requise avant tout pilote public.

## Privacy status

IMPLEMENTATION_STARTED
Le registre gouverne réellement : classification, politique IA, export, suppression et rétention sont validés en CI. Données de tiers traitées (`DAT-43`), `email` en `AI_FORBIDDEN`, quarantaine purgée à 7 jours.

## Security status

IMPLEMENTATION_STARTED
Isolation entre utilisateurs **démontrée** par 16 tests. Schémas sensibles inaccessibles par construction. Audit append-only et anonymisé à la clôture. Reste : chiffrement L3, Safe Mode (`SEC-32`), idempotence (`ARC-42`).

## Test status

66 tests : 16 d'isolation RLS, 10 de rétention, 4 de suppression, 23 de normalisation, 11 de gouvernance du registre, 2 de socle.
`TEST_MAP.md` — correspondance avec les 40 tests d'acceptation P0 — reste à produire.

## Next founder action

Relire `docs/GATE_REPORTS/G2.md`, puis autoriser le démarrage de G3.

## Next Claude action

G3 Core contracts : enveloppe CQE figée (ADR-0006) avec validation runtime, Case/Action/Outcome, audit, manifestes de modules validés contre `ARC-19`, lint d'architecture interdisant les imports inter-modules, et `SEC-32` (Safe Mode).

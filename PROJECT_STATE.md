# OLAPPUS — PROJECT STATE

Dernière mise à jour : 2026-09-08 (fin de G4)
Ce fichier est le **seul** porteur de l'état d'avancement. `project.manifest.json` ne porte que les invariants et les conventions.

## Current phase

G4 Demo Mode + Hélios terminée sur sa partie vérifiable — **en attente du jugement de première valeur**, qui n’appartient pas à un agent.

## Current gate

**G4 — PASSED sur la partie vérifiable**, un point ouvert : le jugement de première valeur.
Prochaine : **G5 Muses minimal + License Gate**.
Taxonomie applicable : `compiled_decisions/runbooks/RUN-42_GATE_MAP.md` (G0–G9).

## Last successful checkpoint

2026-09-08 — G4 : moteurs déterministes, Demo Mode, 14 catégories adverses, Hélios, parcours de Case, première valeur, typographies. 200 tests, 26 commits poussés.

## Status

G4_COMPLETE / PENDING_FOUNDER_JUDGEMENT

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
- **G3 Core contracts** : contrats CQE avec validation runtime stricte, idempotence portée par la base, Safe Mode, machine à états des actions, Detection/Evidence/Outcome/Merchant/règles juridiques, manifestes de modules, lint d'isolation, moteur de capacités `ARC-41`, `docs/TEST_MAP.md`
- **La matrice de contrôle `SEC-23` n'a plus aucune spécification manquante**

## In progress

Aucun travail en cours. En attente du jugement de première valeur et du démarrage de G5.

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
Isolation entre utilisateurs **démontrée** par 16 tests. Schémas sensibles inaccessibles par construction. Audit append-only et anonymisé à la clôture. Safe Mode, idempotence et machine à états portés par la base, vérifiés par accès direct SQL. **Reste : le chiffrement applicatif L3**, spécifié (`SEC-31`) et non implémenté.

## Test status

143 tests : 19 de contrats CQE, 17 de capacités, 16 d'isolation RLS, 12 de manifestes, 11 de Safe Mode et machine à états, 10 de rétention, 9 d'idempotence, 8 d'isolation de modules, 23 de normalisation, 11 de gouvernance du registre, 4 de suppression, 3 de dérive registre/schéma.
`docs/TEST_MAP.md` relie les 40 tests d'acceptation P0 : **15 couverts, 9 partiels, 14 à venir, 2 non couverts**.

Les deux non couverts sont les tests d'accessibilité (34, 35). Ils ne dépendent d'aucune gate mais d'un choix d'outillage de test React Native, ouvert depuis G1.

## Next founder action

Ouvrir l’application (`npm run --workspace @olappus/mobile web`) et juger la première valeur : comprenez-vous ce qu’Olappus a vu, sur quoi il se fonde, et ce qu’il ne fera pas sans vous — en moins de cinq minutes ? Puis relire `docs/GATE_REPORTS/G4.md`.

## Next Claude action

G5 Muses minimal + License Gate : source, fact, proposal, review, certification, versioning, validité temporelle, suspension gouvernée. Une source `blocked` doit rendre l’ingestion impossible même si l’endpoint répond. Écran de provenance (`PRD-14` Journey J).

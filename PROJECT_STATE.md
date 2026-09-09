# OLAPPUS — PROJECT STATE

Dernière mise à jour : 2026-09-09 (fin de G5)
Ce fichier est le **seul** porteur de l'état d'avancement. `project.manifest.json` ne porte que les invariants et les conventions.

## Current phase

G5 Muses minimal + License Gate terminée. La couche de connaissance existe, elle est gouvernée, et elle est **fermée** : aucune source n’est approuvée, donc Olappus n’affirme rien en matière de droits — et il le dit à l’utilisateur.

## Current gate

**G5 — PASSED.** Les cinq conditions de sortie sont portées par la base et vérifiées par des contrôles négatifs.
Prochaine : **G6 Hermès / connexions externes** — à n’ouvrir qu’après l’implémentation du chiffrement L3 (`SEC-31`).
Taxonomie applicable : `compiled_decisions/runbooks/RUN-42_GATE_MAP.md` (G0–G9).

## Last successful checkpoint

2026-09-09 — G5 : schéma `knowledge`, License Gate porté par déclencheur, interdiction de publication par l’IA, quorum indépendant, contradictions conservées, validité temporelle, suspension gouvernée, écran de provenance. **228 tests**, chaîne CI à EXIT 0.

## Status

G5_COMPLETE / PENDING_SOURCE_APPROVAL

Le passage d’une source en `APPROVED` est une **action fondateur**, pas une action d’agent : la licence se lit à la source primaire, pas dans une note du kit.

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
- **G4 Demo Mode + Hélios** : moteurs déterministes, Demo Mode traversant les mêmes moteurs que la production, 14 catégories de fixtures adverses, navigation à quatre entrées, parcours de Case, écran de première valeur
- **G5 Muses + License Gate** : schéma `knowledge` (source, fact, proposal, review, certification, conflict), License Gate porté par déclencheur, contrainte rendant `APPROVED` impossible sans licence vérifiée, quorum compté par origine et non par compte, contradictions conservées, validité temporelle, suspension sans suppression, écran de provenance
- **La matrice de contrôle `SEC-23` n'a plus aucune spécification manquante**

## In progress

Aucun travail en cours. Deux choses sont attendues avant G6 : l’approbation d’au moins une source officielle (fondateur) et l’implémentation du chiffrement applicatif L3 (`SEC-31`).

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
- **Aucune source n’est approuvée.** Légifrance et RappelConso sont en `REVIEW_REQUIRED` : le produit ne peut rien affirmer sur les droits de l’utilisateur. Ce n’est pas une panne, c’est le License Gate qui fonctionne — mais c’est bloquant pour la valeur juridique du produit.
- **Aucune ingestion réelle n’a eu lieu** : le chemin d’ingestion lui-même (parsing, versionnement, hachage de source) n’est pas éprouvé sur des données réelles.
- La résolution d’identité des marchands par référentiel officiel reste ouverte : aucune source de ce type n’est enregistrée (test 21, reporté en G6).
- Revue juridique/DPO requise avant tout pilote public.

## Privacy status

IMPLEMENTATION_STARTED
Le registre gouverne réellement : classification, politique IA, export, suppression et rétention sont validés en CI. Données de tiers traitées (`DAT-43`), `email` en `AI_FORBIDDEN`, quarantaine purgée à 7 jours.

## Security status

IMPLEMENTATION_STARTED
Isolation entre utilisateurs **démontrée** par 16 tests. Schémas sensibles inaccessibles par construction. Audit append-only et anonymisé à la clôture. Safe Mode, idempotence et machine à états portés par la base, vérifiés par accès direct SQL. **Reste : le chiffrement applicatif L3**, spécifié (`SEC-31`) et non implémenté.

## Test status

**228 tests, chaîne CI à EXIT 0** : 205 côté paquets (vitest) et 23 côté application mobile (jest-expo).
Dont, pour G5 : 20 tests Muses et License Gate exécutés **par accès direct à la base**, et 8 tests de provenance côté écran, dont 3 qui vérifient que l’écran ne diverge pas de `governance/source_registry.yaml`.

`docs/TEST_MAP.md` relie les 40 tests d'acceptation P0 : **28 couverts, 8 partiels, 4 à venir, 0 non couvert**.

Les tests de base sont **ignorés, et non silencieusement verts**, quand la pile Supabase locale ne tourne pas. Un test qui se saute lui-même en affichant du vert est plus dangereux qu'un test absent.

## Next founder action

**Franchir la liste de contrôle d’approbation de Légifrance** — 7 points dans `governance/source_registry.yaml`, à faire à la source primaire. Tant qu’elle n’est pas franchie, la couche juridique du produit reste muette par conception.

Puis ouvrir l’onglet Protection et juger : le produit vous dit ce qu’il ne sait pas. Est-ce compréhensible sans connaître le projet ?

## Next Claude action

**Chiffrement applicatif L3 (`SEC-31`), avant d’ouvrir G6.** G6 apporte les premières données réelles : collecter d’abord et protéger ensuite serait l’ordre inverse du bon.

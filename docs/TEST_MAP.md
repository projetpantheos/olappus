# CARTE DES TESTS — 40 tests d'acceptation P0

Établie en G3. Relie chaque test de `RUN-24_P0_ACCEPTANCE_TESTS` à une suite réelle.

**Raison d'être** : sans cette table, personne ne peut dire ce qui est couvert. La produire tard, c'est découvrir les trous quand il est coûteux de les combler.

Statuts : **COUVERT** — une suite le vérifie · **PARTIEL** — vérifié en partie, la limite est dite · **À VENIR** — dépend d'une gate ultérieure · **NON COUVERT** — aucun plan à ce jour.

Dernière mise à jour : 2026-09-11 (G6a — mécanisme OAuth, chiffrement client, récupération) · 422 tests exécutés.

## Produit

| #   | Test                                                  | Statut      | Où                                                                                   | Gate |
| --- | ----------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ | ---- |
| 1   | Demo Mode sans permission externe                     | **COUVERT** | `bienvenue.test.tsx` — aucune permission, aucune connexion, vérifié par test         | G4   |
| 2   | Premier insight rapide et compréhensible              | **PARTIEL** | L’écran existe et est mesurable ; le « moins de 5 min » relève du jugement fondateur | G4   |
| 3   | Hélios ne montre que l’utile                          | **COUVERT** | `rules.test.ts` — filtrage du SILENCE, tri par priorité                              | G4   |
| 4   | L’absence de problème ne fabrique pas de notification | **COUVERT** | `demo-mode.test.ts` — scénario délibérément muet                                     | G4   |
| 5   | Chaque Case explique WHY et PROOF                     | **COUVERT** | Écran de Case + `rules.test.ts` : evidence_refs jamais vide                          | G4   |
| 6   | Une détection peu fiable n’est pas surinterprétée     | **COUVERT** | `rules.test.ts` — sous le seuil, jamais de niveau ACTION                             | G4   |

## Privacy

| #   | Test                                                                   | Statut      | Où                                                                                                        | Gate |
| --- | ---------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- | ---- |
| 7   | La charge brute ne contourne jamais la quarantaine                     | **PARTIEL** | schéma `source` inaccessible au client (`rls.test.ts`) ; le pipeline d'ingestion n'existe pas encore      | G6   |
| 8   | Les tables de domaine ne contiennent que du normalisé                  | **PARTIEL** | `normalization.test.ts` : aucun fait dérivé ne naît d'une normalisation échouée                           | G6   |
| 9   | Les champs d'identité sont absents des modules qui n'en ont pas besoin | **COUVERT** | `data-registry.test.ts` + `rls.test.ts`                                                                   | G2   |
| 10  | L'IA externe ne reçoit que des champs minimisés autorisés              | **PARTIEL** | registre : `email` en `AI_FORBIDDEN`, politique IA validée par classification. Le AI Gateway n'existe pas | G4   |
| 11  | La suppression retire les copies selon la politique                    | **COUVERT** | `deletion.test.ts` — 6 des 12 emplacements de `SEC-33` existent                                           | G2   |
| 12  | La déconnexion est explicite sur ce qui est conservé                   | **COUVERT** | `contracts.test.ts` : `DisconnectConnectorCommandV1` exige un choix explicite                             | G3   |

## Sécurité

| #   | Test                                                   | Statut      | Où                                                                       | Gate |
| --- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------ | ---- |
| 13  | RLS bloque un accès non autorisé                       | **COUVERT** | `rls.test.ts` — 16 tests                                                 | G2   |
| 14  | Un appareil révoqué ne synchronise pas                 | **À VENIR** | `SEC-35` écrit ; la synchronisation n'existe pas                         | G8   |
| 15  | Une permission révoquée bloque l'action                | **COUVERT** | `capability.test.ts` + `rls.test.ts`                                     | G3   |
| 16  | Le rejeu d'une commande à effet de bord est idempotent | **COUVERT** | `idempotence.test.ts` — 9 tests, dont la concurrence                     | G3   |
| 17  | Safe Mode empêche l'exécution externe                  | **COUVERT** | `safe-mode.test.ts` — vérifié par accès direct à la base                 | G3   |
| 18  | Aucun secret critique dans le bundle client            | **PARTIEL** | `secret-scan` sur le dépôt ; l'analyse du bundle construit reste à faire | G9   |

## Données

| #   | Test                                              | Statut      | Où                                                                                                                          | Gate |
| --- | ------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- | ---- |
| 19  | Les montants ont une représentation canonique     | **COUVERT** | `normalization.test.ts`                                                                                                     | G2   |
| 20  | Dates et fuseaux canoniques                       | **COUVERT** | `normalization.test.ts`                                                                                                     | G2   |
| 21  | Les doublons de marchands ne prolifèrent pas      | **PARTIEL** | canonicalisation testée ; la résolution par référentiel officiel reste ouverte — aucune source de ce type n'est enregistrée | G6   |
| 22  | La provenance accompagne tout fait dérivé durable | **COUVERT** | `normalization.test.ts` + `data-registry.test.ts`                                                                           | G2   |

## Muses

| #   | Test                                                   | Statut      | Où                                                                              | Gate |
| --- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------- | ---- |
| 23  | Une proposition IA ne devient pas connaissance publiée | **COUVERT** | `muses.test.ts` — déclencheur `fact_ai_publication_guard`, y compris à l'update | G5   |
| 24  | Une règle critique exige un quorum                     | **COUVERT** | `muses.test.ts` — quorum compté par `origin_group`, pas par nombre de comptes   | G5   |
| 25  | Une contradiction crée un objet de conflit             | **COUVERT** | `muses.test.ts` — les deux faits survivent, aucun n'est écrasé                  | G5   |
| 26  | La validité temporelle sélectionne la règle applicable | **COUVERT** | `muses.test.ts` — sélection à une date donnée, bornes incohérentes refusées     | G5   |
| 27  | Une règle publiée peut être suspendue                  | **COUVERT** | `muses.test.ts` — suspension sans suppression                                   | G5   |

## Offline

| #   | Test                                                        | Statut      | Où                                                                                                     | Gate |
| --- | ----------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ | ---- |
| 28  | Lecture hors ligne des données autorisées en cache          | À VENIR     | —                                                                                                      | G8   |
| 29  | Une écriture locale atteint le serveur via l'outbox         | À VENIR     | `ARC-42` écrit                                                                                         | G8   |
| 30  | Un conflit n'écrase pas silencieusement un état critique    | À VENIR     | —                                                                                                      | G8   |
| 31  | Une donnée supprimée ne réapparaît pas à la synchronisation | **PARTIEL** | `deletion.test.ts` : la clé étrangère l'empêche déjà ; les tombstones arrivent avec la synchronisation | G8   |

## UX

| #   | Test                                                                 | Statut      | Où                                                                | Gate |
| --- | -------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- | ---- |
| 32  | Chaque écran définit ses états                                       | **COUVERT** | `components.test.tsx` — les 7 états rendus et testés              | G4   |
| 33  | La feuille d'action énonce destinataire, données, impact, permission | **PARTIEL** | contrat et machine à états en place ; l'écran reste à faire       | G4   |
| 34  | Libellés d’accessibilité sur les contrôles                           | **COUVERT** | `components.test.tsx` — libellé accessible complet, hint d’action | G4   |
| 35  | La couleur n’est jamais le seul porteur d’état                       | **COUVERT** | `components.test.tsx` — niveau écrit en toutes lettres            | G4   |

## Release

| #   | Test                                     | Statut      | Où                                       | Gate |
| --- | ---------------------------------------- | ----------- | ---------------------------------------- | ---- |
| 36  | typecheck / lint / tests / build passent | **COUVERT** | `npm run ci` + `expo export`             | G1   |
| 37  | Les suites privacy et sécurité passent   | **COUVERT** | chaîne CI complète                       | G2   |
| 38  | Un plan de rollback existe               | **COUVERT** | rapports de gate, section ROLLBACK       | G1   |
| 39  | `PROJECT_STATE` est à jour               | **COUVERT** | mis à jour à chaque fin de gate          | G0   |
| 40  | Aucune décision RED ouverte              | **COUVERT** | `docs/ADR/INDEX.md` + `00_OPEN_ITEMS.md` | G0   |

## Bilan

| Statut          | Nombre |
| --------------- | ------ |
| COUVERT         | 28     |
| PARTIEL         | 8      |
| À VENIR         | 4      |
| **NON COUVERT** | **0**  |

**Plus aucun test n'est sans plan.** Les deux tests d'accessibilité (34 et 35) étaient les seuls : ils ne dépendaient d'aucune gate, mais d'un choix d'outillage de test React Native, ouvert depuis G1 et tranché en G4 (jest-expo et la bibliotheque de test React Native).

PRD-14 section 18 vise WCAG AA. La cible est désormais **vérifiable** : elle cesse d'être une intention pour devenir un engagement testable dès que les premiers écrans réels existent.

## Annexe — suites qui servent un contrôle SEC-23 sans être un test P0

Les 40 tests d'acceptation de `RUN-24` ne couvrent pas tout ce que la matrice
`SEC-23` exige. Ces suites-là n'ont donc pas de ligne dans le tableau
ci-dessus, et se perdraient sans cette annexe.

| Contrôle `SEC-23`                       | Suite                                                 | Ce qui est prouvé                                                                                        |
| --------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Sensitive fields encrypted              | `crypto.test.ts` (25 tests)                           | Altération rejetée, cryptogramme déplacé refusé, rotation lisible, secret perdu = donnée perdue          |
| Sensitive fields encrypted              | `encryption.test.ts` (20 tests)                       | La **base** refuse le clair, à l'insertion comme à l'update ; aucune colonne de clé en clair             |
| Sensitive fields encrypted              | `data-registry.test.ts` (7 des 18 tests)              | Tout champ L3/L4 déclare son sort au chiffrement ; toute dérogation porte sa justification               |
| No secrets in repo                      | `secret-scan.test.ts` (9 tests)                       | Les règles du scanner sont éprouvées, y compris ce qu'elles ne prétendent pas couvrir                    |
| Aucun jeton ni corps brut dans les logs | `logging.test.ts` (22 tests)                          | Rédaction par nom de clé **et** par forme de valeur ; erreurs sur liste blanche ; `no-console` en erreur |
| PKCE + `state`                          | `oauth.test.ts` (31 tests)                            | Un contrôle négatif par mode d'échec ; `plain` jamais accepté ; rejeu et `state` inconnu indiscernables  |
| Scopes minimaux                         | `connection.test.ts` (21 tests)                       | Deny by default en base ; un scope donnant accès au corps des messages ne peut pas être déclaré          |
| Purge à la déconnexion                  | `connection.test.ts`                                  | Portée par contrainte : une connexion fermée **ne peut pas** détenir de jeton                            |
| Chiffrement client (ADR-0008)           | `crypto-web.test.ts` (15 tests)                       | Interopérabilité serveur ↔ appareil dans les deux sens ; échec bruyant sans WebCrypto                    |
| Informer avant de collecter             | `recovery.test.ts` (22), `recuperation.test.tsx` (13) | La collecte est refusée tant que le secret n'est pas créé **et** confirmé                                |

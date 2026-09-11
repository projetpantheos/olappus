# OLAPPUS — PROJECT STATE

Dernière mise à jour : 2026-09-09 (chiffrement L3, avant G6)
Ce fichier est le **seul** porteur de l'état d'avancement. `project.manifest.json` ne porte que les invariants et les conventions.

## Current phase

G5 terminée. **Le chiffrement applicatif L3 est implémenté**, avant l’ouverture de G6 et donc avant la première donnée réelle : c’est l’ordre qui compte, un champ déjà peuplé se migre bien plus mal.

## Current gate

**G5 — PASSED.** Les cinq conditions de sortie sont portées par la base et vérifiées par des contrôles négatifs.
**Dette de G2 comblée** : `SEC-31` n’est plus une spécification, c’est une contrainte en base.
Prochaine : **G6 Hermès / connexions externes**, désormais ouvrable.
Taxonomie applicable : `compiled_decisions/runbooks/RUN-42_GATE_MAP.md` (G0–G9).

## Last successful checkpoint

2026-09-09 — Chiffrement L3 : AES-256-GCM lié à son contexte, hiérarchie KEK/DEK sans clé maître serveur, rotation versionnée, contrainte en base refusant le clair, décision de chiffrement obligatoire au registre. **280 tests**, chaîne CI à EXIT 0.

## Status

G5_COMPLETE / L3_ENCRYPTION_IMPLEMENTED / PENDING_SOURCE_APPROVAL

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
- **Journalisation et rédaction (`SEC-34`)** : point de passage unique, rédaction par nom de clé **et** par forme de valeur, erreurs structurées sur liste blanche, `no-console` passé d'avertissement à erreur — un contrôle qui n'échoue pas n'en est pas un
- **Stratégie de cache (ADR-0018)** : OPEN-07 tranché sans dépendre d’un quota inconnu — aucune requête sur le chemin utilisateur, vérification quotidienne au plus, expiration par obsolescence juridique, plafond appris de la source
- **G5 Muses + License Gate** : schéma `knowledge` (source, fact, proposal, review, certification, conflict), License Gate porté par déclencheur, contrainte rendant `APPROVED` impossible sans licence vérifiée, quorum compté par origine et non par compte, contradictions conservées, validité temporelle, suspension sans suppression, écran de provenance
- **Chiffrement applicatif L3 (`SEC-31`, ADR-0017)** : AES-256-GCM, cryptogramme lié à `actor_id : entité : champ : ligne`, KEK dérivée par scrypt d'un secret utilisateur, DEK enveloppée en base, rotation versionnée, contrainte `is_ciphertext_envelope` refusant le clair à l'insertion **et** à la mise à jour
- **La matrice de contrôle `SEC-23` n'a plus aucune spécification manquante**

## In progress

Aucun travail en cours. G6 est techniquement ouvrable. Reste l’approbation d’au moins une source officielle, qui est une action fondateur.

## Blocked

Rien. La pile Supabase locale doit tourner (`npx supabase start`) pour que les tests de base s'exécutent ; ils sont **ignorés, et non silencieusement verts**, en son absence.

## Open decisions

Aucune décision RED ouverte.
Zones volontairement non définies : voir `compiled_decisions/00_OPEN_ITEMS.md`.

## Known risks

- **Le chiffrement L3 fonctionne des deux côtés** depuis le 2026-09-11 : un test d'interopérabilité vérifie dans les deux sens que l'appareil ouvre ce que le serveur a scellé. ADR-0008 cesse de tenir par la seule forme du schéma.
- **Mais React Native n'expose pas `crypto.subtle` nativement.** L'implémentation fonctionne sur le web ; sur iOS et Android, il faut un polyfill ou un module natif, non encore choisi. Le fournisseur est injecté et son absence lève une erreur explicite — aucun repli sur un aléa non cryptographique. **À trancher avant G6b**, donc avant toute donnée réelle sur un appareil réel.
- Le chiffrement L3 **n'a encore chiffré aucune donnée réelle** : il est prouvé par des tests, pas par l'usage. Le parcours produit qui manque est celui d'ADR-0008 — génération des recovery codes, information de l'utilisateur **avant** la première collecte, et distinction entre « retrouver son compte » et « retrouver ses données ». Il relève de G6.
- Une action préparée ne peut pas être relue par le serveur seul (ADR-0017). Toute exécution différée devra être conçue avec cette contrainte, non contre elle.
- scrypt est le repli assumé de `SEC-31` ; Argon2id reste la cible. Le schéma stocke l'algorithme par clé, donc la bascule se fera utilisateur par utilisateur.
- Les purges de rétention ne sont pas encore déclenchées par un ordonnanceur. Le point d'entrée existe, et son inactivité est détectable via `core.retention_health`.
- La suppression n'est vérifiée que sur 6 des 12 emplacements de `SEC-33` ; les autres n'existent pas encore (SQLite local, outbox, sauvegardes, journaux).
- La rétention des sauvegardes reste ouverte (OPEN-06) : la durée après laquelle une donnée supprimée disparaît de toutes les copies est inconnue et ne doit pas être annoncée.
- 14 vulnérabilités modérées transitives dans la chaîne Expo, aucune haute ni critique.
- **Aucune source n’est approuvée.** Les deux licences sont **vérifiées** depuis le 2026-09-09 (Licence Ouverte 2.0, textes lus aux sources primaires) et la stratégie de cache est tranchée (ADR-0018). Il reste à créer l’accès PISTE. Le produit ne peut donc toujours rien affirmer sur les droits de l’utilisateur.
- **Les quotas de l’API Légifrance ne sont pas publiés** et sont modifiables sans préavis. Le plafond réel ne sera connu qu’en le rencontrant ; il devra alors être consigné au registre (`rate_limit.observed_rate_limit`).
- **Les données de l’API Légifrance ne sont pas opposables** (CGU art. VI.1 : seuls les PDF signés du JORF le sont), et la DILA ne garantit ni leur complétude ni leur fraîcheur, ni aucun niveau de disponibilité. Le cache et le silence gracieux cessent d’être des optimisations.
- **Aucune ingestion réelle n’a eu lieu** : le chemin d’ingestion lui-même (parsing, versionnement, hachage de source) n’est pas éprouvé sur des données réelles.
- La résolution d’identité des marchands par référentiel officiel reste ouverte : aucune source de ce type n’est enregistrée (test 21, reporté en G6).
- Revue juridique/DPO requise avant tout pilote public.

## Privacy status

IMPLEMENTATION_STARTED
Le registre gouverne réellement : classification, politique IA, export, suppression et rétention sont validés en CI. Données de tiers traitées (`DAT-43`), `email` en `AI_FORBIDDEN`, quarantaine purgée à 7 jours.

## Security status

IMPLEMENTATION_STARTED
Isolation entre utilisateurs **démontrée** par 16 tests. Schémas sensibles inaccessibles par construction. Audit append-only et anonymisé à la clôture. Safe Mode, idempotence et machine à états portés par la base, vérifiés par accès direct SQL. Chiffrement applicatif L3 **implémenté et porté par la base** : un champ L3 ne peut pas recevoir de clair, même en SQL direct avec tous les droits. Aucune clé maître serveur (ADR-0008), vérifié par un test qui échouerait si une colonne de clé en clair apparaissait.

## Test status

**318 tests, chaîne CI à EXIT 0** : 293 côté paquets (vitest) et 25 côté application mobile (jest-expo).
Dont, pour le chiffrement : 25 tests de primitives, 20 tests exécutés **par accès direct à la base** — la base refuse le clair à l'insertion comme à la mise à jour — et 7 tests de gouvernance du registre.

`docs/TEST_MAP.md` relie les 40 tests d'acceptation P0 : **28 couverts, 8 partiels, 4 à venir, 0 non couvert**.

Les tests de base sont **ignorés, et non silencieusement verts**, quand la pile Supabase locale ne tourne pas. Un test qui se saute lui-même en affichant du vert est plus dangereux qu'un test absent.

## Next founder action

**Créer l’application sur PISTE** (`piste.gouv.fr`) et l’abonner à l’API Légifrance. Cela produit les identifiants OAuth — à placer dans `.env.local`, jamais ailleurs — et fait accepter les CGU PISTE, dont le PDF est un scan illisible autrement.

Les quotas ne sont **pas publiés** sur le portail. ADR-0018 rend ce point non bloquant : la stratégie est écrite pour ne dépendre d’aucun plafond connu. Il ne reste donc que le point 7 de la liste d’approbation, la date de vérification finale. Procédure : `docs/RUNBOOK_APPROBATION_SOURCE.md`. Tant qu’elle n’est pas franchie, la couche juridique du produit reste muette par conception.

Puis ouvrir l’onglet Protection et juger : le produit vous dit ce qu’il ne sait pas. Est-ce compréhensible sans connaître le projet ?

## Next Claude action

**G6 — Hermès / connexions externes.** La gate est **RED** dans la matrice d'autonomie (authentification, sécurité) : elle demande votre validation explicite avant d'être ouverte.

Deux de ses conditions de sortie sont déjà tenues, délibérément écrites avant le connecteur : le chiffrement L3 (`SEC-31`) et la rédaction des journaux (`SEC-34`). Il reste, dans la gate elle-même : PKCE et `state`, échange côté serveur, scopes minimaux, purge à la déconnexion — plus le parcours de recovery codes d'ADR-0008, sans lequel la clé de chiffrement existe mais n'est jamais remise à l'utilisateur.

# DEMANDE D'OUVERTURE — G6 Connecteur externe (Hermès / OAuth)

Date : 2026-09-09 · Format imposé par `17_FOUNDER_GATES` (YELLOW / RED)
Connecteur retenu par le fondateur : **Google**

---

## Comment on ouvre une gate

Il n'y a pas de commande ni de cérémonie. `17_FOUNDER_GATES` dit seulement ceci :

- **GREEN** — je suis autonome (UI, tests, docs, fixtures, accessibilité) ;
- **YELLOW** — je propose, puis j'attends. Une nouvelle API externe est YELLOW ;
- **RED** — validation explicite. Authentification, sécurité, données sensibles, nouvelle catégorie de données : G6 les touche toutes les quatre.

**Ouvrir G6 = répondre aux quatre décisions ci-dessous.** Rien d'autre. Ce document est là pour que la réponse soit un choix, pas une signature à l'aveugle.

---

## WHAT — ce que la gate demande

`RUN-42` fixe la condition de sortie : **PKCE + `state`, échange côté serveur, scopes minimaux, purge à la déconnexion, et aucun jeton ni corps brut dans les journaux.**

Deux de ces cinq points sont **déjà tenus**, écrits délibérément avant la gate :

| Condition                          | État                                                       |
| ---------------------------------- | ---------------------------------------------------------- |
| Aucun jeton ni corps dans les logs | **Fait** — `SEC-34`, 22 tests, `no-console` en erreur      |
| Chiffrement des champs L3          | **Fait** — `SEC-31`/ADR-0017, porté par la base, 45 tests  |
| PKCE + `state`                     | À faire                                                    |
| Échange côté serveur               | À faire                                                    |
| Scopes minimaux                    | À faire — **et c'est une décision produit, pas technique** |
| Purge à la déconnexion             | À faire — `SEC-33` recense déjà les emplacements           |

## WHY — pourquoi Google, et pourquoi maintenant

Le périmètre P0 (`ADR-0007`) porte trois droits : garantie légale, rétractation, résiliation. Ces trois situations naissent d'un achat, et la trace d'un achat arrive par courriel. Sans Gmail, Hélios n'a rien de réel à regarder — le Demo Mode restera une démonstration.

C'est le bon connecteur. **Ce n'est pas nécessairement le bon moment**, et je dois le dire avant que vous validiez.

## IMPACT — ce que cela change, irréversiblement

**Ce sera la première donnée réelle du produit.** Jusqu'ici, tout est synthétique. Cela déclenche trois choses d'un coup :

1. **Le RGPD s'applique pour de bon.** Base légale, information, exercice des droits, DPO : `docs/13` et `docs/27` deviennent des obligations datées, plus des documents.
2. **Le chiffrement L3 doit fonctionner côté client.** Il est aujourd'hui implémenté en Node et prouvé par 45 tests, mais l'implémentation client (WebCrypto / expo-crypto) n'existe pas. Or ADR-0008 exige que la DEK n'atteigne jamais le serveur : tant que le client ne déchiffre pas, la garantie tient par le schéma, pas par le chemin d'exécution.
3. **Le parcours de recovery codes n'existe pas.** `SEC-31` est explicite : _« L'utilisateur est informé **avant** la collecte de la première donnée sensible, pas au moment de la perte. »_ Collecter d'abord et prévenir ensuite inverserait l'ordre que la spécification impose.

**La création du projet Google Cloud démarre des compteurs.** En configuration External/Testing, la liste est limitée à 100 utilisateurs test et les jetons de rafraîchissement de test peuvent expirer sous 7 jours selon les scopes. Ces deux chiffres viennent de `docs/15` et y portent le marqueur « référence non résolue » : **je ne les ai pas vérifiés à la source**, et ils sont à confirmer avant de créer le projet, pas après.

**Certains scopes Gmail sont « restreints ».** Les manipuler côté serveur peut déclencher une évaluation de sécurité par un tiers, avec un coût et un délai réels. Même origine, même réserve : non vérifié.

## RISKS — ce qui peut mal tourner

1. **Le risque majeur n'est pas technique.** C'est de collecter le courriel de quelqu'un avant que le produit sache le protéger de bout en bout et le lui dire. Les points 2 et 3 d'IMPACT sont des préalables, pas des finitions.
2. **Le scope est un engagement, pas un réglage.** Un scope trop large obtenu une fois est difficile à réduire ensuite sans redemander le consentement. `docs/15` impose métadonnées et extraits structurés plutôt que le corps complet ; ce choix se fait maintenant.
3. **Prototype ≠ production.** `docs/15` interdit de présenter une configuration Testing comme une architecture de production. Le risque est de s'y habituer.
4. **Les états d'échec sont nombreux** — jeton expiré, consentement révoqué, scope manquant, quota, pagination, délai dépassé, source supprimée. Chacun doit produire un silence explicite, jamais une erreur muette ni une affirmation fausse.
5. **La purge à la déconnexion doit être vérifiée, pas déclarée.** `SEC-33` recense douze emplacements ; six existent aujourd'hui.

## Ce que je recommande — G6 en deux temps

**Je recommande de ne pas brancher Gmail d'abord.**

Les cinq conditions de sortie de G6 se démontrent **sans toucher une seule donnée réelle** : PKCE, `state`, échange serveur, purge et absence de jeton dans les journaux sont des propriétés du mécanisme, pas des données.

### G6a — le mécanisme, contre un fournisseur synthétique

Le flux OAuth complet, éprouvé contre un serveur d'autorisation local : `state` rejoué, `state` absent, PKCE sans vérificateur, code réutilisé, jeton expiré, consentement révoqué, purge à la déconnexion. Plus l'implémentation client du chiffrement L3 et le parcours de recovery codes.

Aucun compte Google, aucun compteur démarré, aucune donnée personnelle. **Le jour où le vrai fournisseur arrive, il ne reste que la configuration.**

### G6b — Google, une fois le mécanisme prouvé

Création du projet, scopes minimaux, connexion réelle. Décision séparée, prise en connaissance du mécanisme déjà éprouvé.

Cet ordre est le même que celui qui a servi pour le chiffrement et pour la rédaction des journaux : **construire le contrôle avant la chose qu'il contrôle.** À chaque fois, l'inverse aurait été moins cher sur le moment et beaucoup plus cher ensuite.

## FILES — ce que G6a toucherait

- `packages/core/src/oauth.ts` — PKCE, `state`, vérification, machine à états du connecteur
- `packages/core/src/oauth.test.ts` — contrôles négatifs, un par mode d'échec
- `apps/mobile/src/crypto/` — implémentation client du chiffrement L3 (WebCrypto / expo-crypto)
- `apps/mobile/src/app/recuperation/` — parcours de recovery codes (ADR-0008)
- Migration : `identity.connection` — jetons chiffrés, jamais en clair
- `governance/data_registry.yaml` — nouvelle entité, classification et rétention

## TESTS — ce qui devra être démontré

Chaque mode d'échec de `docs/15` produit un contrôle négatif : `state` rejoué refusé, PKCE sans vérificateur refusé, code d'autorisation réutilisé refusé, jeton expiré non silencieusement ignoré, consentement révoqué rendant la connexion inerte, purge vérifiée par lecture directe en base, et aucun jeton retrouvable dans une sortie journalisée.

Plus, côté chiffrement client : un compte récupéré sans recovery codes n'ouvre aucune donnée L3.

## ROLLBACK

G6a : aucune donnée réelle, aucun compte externe, aucun compteur. Retour = `git reset` et suppression d'une migration.
G6b : révocation du consentement côté Google, purge locale, suppression du projet Cloud. **Plus coûteux, et c'est précisément pourquoi il vient en second.**

---

## LES QUATRE DÉCISIONS — RED, à valider explicitement

| #      | Décision                                                                                                                    | Ma recommandation                                                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **R1** | Ouvrir G6                                                                                                                   | **Oui**                                                                  |
| **R2** | En deux temps — G6a mécanisme synthétique, puis G6b Google — ou Google directement ?                                        | **Deux temps.** Google directement collecte du réel avant les préalables |
| **R3** | Le chiffrement L3 côté client et le parcours de recovery codes précèdent-ils toute connexion réelle ?                       | **Oui.** `SEC-31` l'impose déjà : informer **avant** la collecte         |
| **R4** | Scopes Gmail : métadonnées et extraits structurés uniquement, sans corps complet ni pièces jointes par défaut (`docs/15`) ? | **Oui.** Un scope obtenu large se réduit mal ensuite                     |

Une réponse par ligne suffit. Un « non » sur R2 ou R3 est recevable — c'est votre produit et votre calendrier — mais je consignerai alors dans le rapport de gate que la collecte a précédé la protection, parce que c'est ce que le rapport devra dire.

# ADR-0017 — Dérivation de clé par scrypt, et liaison du chiffré à son contexte

- **Statut** : ACCEPTED, **amendé le 2026-09-11** (§ « Amendement — PBKDF2 sur l'appareil »)
- **Date** : 2026-09-09
- **Décision d'origine** : mise en œuvre de `SEC-31`, sous ADR-0008
- **Approuvé par** : Fondateur
- **Réversible** : oui pour le KDF (versionné par utilisateur) ; **non** pour la liaison au contexte

## Context

`SEC-31` fixe les propriétés attendues du chiffrement applicatif L3 sans trancher deux points que l'implémentation ne peut pas éluder.

**Premier point — le KDF.** `SEC-31` demande « Argon2id, à défaut scrypt ». Argon2id n'existe pas dans la bibliothèque standard de Node : l'adopter aujourd'hui ajoute une dépendance native (`node-argon2`) ou WebAssembly à la chaîne de construction, sur un projet dont aucune donnée réelle n'est encore collectée, et dont la chaîne CI doit rester réparable par une personne seule.

**Second point — ce que le chiffrement authentifie.** AES-GCM authentifie le message. Il n'authentifie pas _où_ ce message est stocké. Un attaquant disposant de l'écriture en base ne lit rien, mais il peut **déplacer** un cryptogramme d'une ligne à l'autre. Il ne casse pas la confidentialité ; il fait lire à la victime une valeur qui n'est pas la sienne. Rien dans `SEC-31` ne l'interdit explicitement.

## Decision

### 1. scrypt, versionné par utilisateur

Le KDF est **scrypt** (`node:crypto`), paramètres `N = 32768, r = 8, p = 1`, sortie de 256 bits.

Ce choix n'est tenable que parce qu'il est **réversible sans migration globale** : `identity.user_key` stocke, avec chaque clé, l'algorithme employé, son sel et ses paramètres. Passer à Argon2id se fait alors utilisateur par utilisateur, au prochain déverrouillage, sans rendre illisible ce qui a été écrit avant. La contrainte `check (kdf in ('scrypt', 'argon2id'))` inscrit dès maintenant la cible dans le schéma.

Le facteur atténuant est réel mais ne doit pas servir d'excuse : la KEK dérive de **recovery codes générés par le système**, à haute entropie, et non d'un mot de passe choisi par un humain. C'est le cas où l'écart entre scrypt et Argon2id pèse le moins.

### 2. Le chiffré est lié à son contexte

Chaque valeur chiffrée est liée, par les données authentifiées additionnelles de GCM, au quadruplet :

```
actor_id : entité : champ : identifiant de ligne
```

Une valeur déplacée vers un autre utilisateur, un autre champ ou une autre ligne **ne se déchiffre pas**. Elle est rejetée, pas silencieusement lue.

Cette liaison est **irréversible** : elle entre dans le calcul du tag d'authentification. La changer rendrait illisible tout ce qui a été écrit avant. Elle est donc fixée maintenant, avant la première donnée réelle — c'est précisément la raison pour laquelle cette implémentation précède G6.

## Consequences

**Une action préparée ne peut pas être exécutée par le serveur seul.** `core.action.prepared_payload` est chiffré avec la DEK de l'utilisateur ; le serveur ne peut donc pas relire le destinataire ni le contenu sans que l'utilisateur ait déverrouillé sa clé dans la session.

Ce n'est pas un effet de bord à corriger : cela rejoint `EXECUTE_WITH_CONFIRMATION` et **interdit par construction une exécution par tâche de fond silencieuse**. Toute exécution différée devra être conçue en connaissance de cette contrainte, et non contre elle.

**Le déplacement d'identifiant de ligne devient un choix de conception.** Puisque `rowId` entre dans la liaison, ré-identifier une ligne (changer sa clé primaire) rend son contenu illisible. Les identifiants sont immuables ; cette ADR en fait une exigence et non une habitude.

**Les paramètres scrypt coûtent environ 100 ms par déverrouillage.** C'est délibéré, et ce coût est celui de l'utilisateur légitime une fois par session, contre celui de l'attaquant à chaque essai.

## Amendement du 2026-09-11 — PBKDF2 sur l'appareil

L'implémentation du chiffrement côté appareil a révélé un fait que cette ADR n'avait pas anticipé : **WebCrypto ne propose pas scrypt.** Il propose PBKDF2, et rien d'autre qui convienne.

Trois issues étaient possibles.

Ajouter une implémentation de scrypt en JavaScript pur, ou un module natif : c'est du code cryptographique non audité embarqué dans l'application, pour aligner une fonction sur l'autre. Le remède serait pire que le mal.

Dériver toutes les KEK côté serveur : cela obligerait le secret de l'utilisateur à transiter. **C'est exactement ce qu'ADR-0008 interdit**, et cela viderait l'implémentation appareil de sa raison d'être.

**Retenu : la fonction de dérivation dépend de l'endroit où elle s'exécute, et chaque clé dit laquelle a servi.** Une KEK dérivée sur l'appareil porte `kdf = 'pbkdf2'`, une KEK dérivée côté serveur porte `kdf = 'scrypt'`. La colonne existait déjà, précisément pour que ce genre de divergence soit lisible plutôt que fatal.

PBKDF2-SHA256, **600 000 itérations**. Le facteur atténuant déjà invoqué pour scrypt vaut ici aussi, et davantage : le secret d'entrée est un jeu de recovery codes généré par le système, à haute entropie, jamais un mot de passe choisi par un humain. C'est le cas où l'écart entre fonctions de dérivation pèse le moins.

**Ce qui n'a pas bougé, et ne devait pas bouger** : le format d'enveloppe, l'algorithme de chiffrement et la liaison au contexte sont **identiques des deux côtés**. Ils vivent désormais dans un module unique, `crypto-envelope.ts`, partagé par les deux implémentations. Un test d'interopérabilité vérifie dans les deux sens que l'appareil ouvre ce que le serveur a scellé. Une divergence d'un seul octet dans les données authentifiées rendrait la donnée illisible pour toujours, sans réparation possible ; les dupliquer aurait rendu cette divergence inévitable.

### Ce que cet amendement laisse ouvert

**React Native n'expose pas `crypto.subtle` nativement.** Sur le web, l'implémentation fonctionne aujourd'hui. Sur iOS et Android, il faudra une implémentation — polyfill ou module natif — que le projet n'a pas encore choisie. Le fournisseur est donc **injecté**, et son absence lève une erreur explicite au lieu de se rabattre sur un aléa non cryptographique : un chiffrement dégradé serait pire qu'une absence de chiffrement, parce qu'il donnerait l'apparence d'une protection.

Ce choix est à faire **avant G6b**, c'est-à-dire avant toute donnée réelle sur un appareil réel.

## Alternatives écartées

**Argon2id immédiatement, via dépendance native.** Écarté pour aujourd'hui, pas pour toujours : le schéma le prévoit. Ajouter une dépendance native à une chaîne de construction que le fondateur doit pouvoir réparer seul, avant la moindre donnée réelle, échange un gain marginal contre une fragilité certaine.

**Ne pas lier le chiffré à son contexte.** Écarté. GCM authentifie ces données additionnelles gratuitement ; s'en passer aurait été un choix, pas une économie. Et ce choix se serait payé après la première donnée réelle, quand il aurait été trop tard pour le reprendre.

**Une clé maître serveur, avec dérivation par utilisateur.** Écarté par ADR-0008, et cette ADR n'y revient pas. Une clé maître rendrait la récupération possible — et rendrait aussi possible une réquisition, une exfiltration et un accès administrateur abusif. C'est l'arbitrage que le produit a déjà tranché.

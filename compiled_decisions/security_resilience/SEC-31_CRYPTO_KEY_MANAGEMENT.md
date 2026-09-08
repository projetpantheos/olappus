# SEC-31 — Chiffrement et gestion des clés

Gate : G2 · Contrôle : `SEC-23` « Sensitive fields encrypted » · Décision fondatrice : **ADR-0008**

`SEC-08` exigeait un chiffrement applicatif des données L3 sans dire lequel, avec quelles clés, ni ce qu'il advient en cas de perte des moyens de récupération. Ce document comble ce vide.

## Ce que le chiffrement doit protéger

**Contre quoi** : une base compromise, une sauvegarde exfiltrée, un accès administrateur abusif, une réquisition portant sur les serveurs.

**Contre quoi il ne protège pas** : un appareil compromis de l'utilisateur, une session volée, une erreur de politique RLS. Le chiffrement applicatif est une défense en profondeur, jamais un substitut à RLS.

Le chiffrement au repos du disque et de la base est un complément, pas la mesure : il ne protège pas d'un accès légitime à la base.

## Hiérarchie de clés

```
Recovery codes (utilisateur, hors ligne)
        │  dérivation
        ▼
      KEK utilisateur ──── chiffre ────► DEK utilisateur
                                              │
                                              ▼
                                    champs L3 chiffrés en base
```

- **DEK** — une clé de données par utilisateur, jamais en clair au repos.
- **KEK** — dérivée d'un secret détenu par l'utilisateur, jamais stockée telle quelle côté serveur.
- **Aucune clé maître serveur ne permet de déchiffrer les données d'un utilisateur.** C'est la conséquence directe d'ADR-0008.

## Algorithmes

| Usage                  | Choix                                       | Motif                                                                                     |
| ---------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Chiffrement de champ   | AES-256-GCM                                 | Chiffrement authentifié : une altération est détectée, pas seulement une lecture empêchée |
| Dérivation de clé      | Argon2id, à défaut scrypt                   | Résistance au matériel dédié                                                              |
| Empreintes d'intégrité | SHA-256                                     | Aligné sur `content_hash` du registre                                                     |
| Aléa                   | générateur cryptographique de la plateforme | Jamais `Math.random`                                                                      |

Chaque valeur chiffrée porte : identifiant de version de clé, nonce, tag d'authentification, version d'algorithme. Sans versionnement, aucune rotation n'est possible.

## Où vivent les clés

| Emplacement    | Contenu                                   | Interdit                                                                                                             |
| -------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Appareil       | secrets de session, matériel de clé local | **Jamais** dans le stockage non chiffré de l'application ; toujours le stockage sécurisé natif (Keychain / Keystore) |
| Serveur        | DEK chiffrées, jamais en clair            | Jamais dans une table métier, jamais dans les journaux                                                               |
| Secret store   | secrets de service                        | Jamais dans le dépôt, jamais dans le bundle mobile                                                                   |
| Recovery codes | chez l'utilisateur uniquement             | Jamais côté serveur, même chiffrés                                                                                   |

## Rotation

`CREATE NEW → TEST → SWITCH → REVOKE OLD` (`SEC-08`).

La rotation n'est possible que si chaque valeur chiffrée porte sa version de clé : le déchiffrement reste possible avec l'ancienne clé pendant la transition, et la réécriture est progressive. Une rotation qui exige une réécriture atomique de toute la base n'est pas une rotation, c'est une migration à risque.

## Perte des recovery codes

**Les données L3 sont définitivement perdues** (ADR-0008). Aucun escrow, aucune récupération de service.

Conséquences produit, obligatoires :

1. L'utilisateur est informé **avant** la collecte de la première donnée sensible, pas au moment de la perte.
2. La génération des recovery codes est un moment produit à part entière, avec confirmation de mise en sécurité.
3. Le parcours de récupération distingue explicitement **retrouver son compte** et **retrouver ses données** : le premier est possible, le second non.

## Ce qui n'est pas chiffré au niveau applicatif

Les identifiants opaques, les horodatages, les états et les priorités restent en clair : ils sont nécessaires aux index, aux politiques RLS et aux requêtes. Le registre indique quels champs sont concernés par le chiffrement — c'est lui qui fait foi, pas une décision au cas par cas dans le code.

## Preuves attendues

- aucune clé de déchiffrement utilisateur présente côté serveur ;
- un compte récupéré sans recovery codes n'accède pas aux données L3 ;
- une valeur chiffrée altérée est rejetée, pas silencieusement déchiffrée ;
- une valeur chiffrée avec l'ancienne clé reste lisible pendant une rotation ;
- l'écran d'information précède toute collecte de donnée L3.

## Zones ouvertes

Le choix exact du magasin de secrets serveur dépend de l'hébergement, non décidé (`00_OPEN_ITEMS`). Ce document fixe les propriétés exigées ; il ne présuppose pas le fournisseur.

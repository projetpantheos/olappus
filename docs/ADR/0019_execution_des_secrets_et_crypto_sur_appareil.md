# ADR-0019 — Où s'exécute l'échange OAuth, et comment chiffrer sur l'appareil

- **Statut** : PROPOSED — les deux décisions sont RED (sécurité, authentification)
- **Date** : 2026-09-11
- **Décision d'origine** : les deux points laissés ouverts à la clôture de G6a
- **Approuvé par** : _en attente_
- **Réversible** : oui pour l'hébergement ; **partiellement** pour la cryptographie d'appareil

## Context

G6a s'est achevée sur deux questions que je ne pouvais pas trancher seul, et qui bloquent G6b.

**Où s'exécute l'échange du code contre les jetons ?** `docs/15` l'impose côté serveur, secrets jamais dans le client. Or il n'existe aucun serveur applicatif à ce jour.

**Comment chiffrer sur iOS et Android ?** React Native n'expose pas `crypto.subtle`. L'implémentation de `crypto-web.ts` fonctionne sur le web et nulle part ailleurs.

J'ai instruit les deux. Les faits ci-dessous ont été relevés le 2026-09-11 à la documentation Expo SDK 57 et au registre npm ; ils sont datés parce qu'ils périment.

## Decision proposée

### 1. L'échange OAuth s'exécute dans une Edge Function Supabase

**Ce qui décide** : aucun fournisseur nouveau. Supabase est déjà la base, sa CLI est déjà une dépendance de développement, et `supabase functions serve` tourne en local — le développement ne dépend donc d'aucun compte distant. Le runtime est Deno, qui expose WebCrypto nativement, donc le même format d'enveloppe que le reste du code.

**Ce que cela ne décide pas**, et c'est délibéré : l'hébergement. Une Edge Function s'exécute aussi bien sur Supabase Cloud que sur une instance auto-hébergée. `OPEN-07` et le choix du magasin de secrets serveur restent ouverts, comme `SEC-31` le prévoit.

Le `client_secret` du fournisseur ne quitte jamais cette fonction. Le client reçoit uniquement le résultat, et le `PISTE_CLIENT_SECRET` / `GOOGLE_OAUTH_CLIENT_SECRET` de `.env.example` n'a jamais de contrepartie préfixée `EXPO_PUBLIC_`.

### 2. Sur l'appareil : `expo-crypto` pour le chiffrement, `@noble/hashes` pour la dérivation

**`expo-crypto`** (SDK 57, déjà dans le périmètre Expo, zéro dépendance npm) fournit exactement ce que notre enveloppe demande :

| Besoin                           | Ce qu'`expo-crypto` expose                              |
| -------------------------------- | ------------------------------------------------------- |
| AES-256-GCM                      | `aesEncryptAsync` / `aesDecryptAsync`                   |
| Données authentifiées (AAD)      | option `additionalData`, explicitement « for GCM mode » |
| Nonce, cryptogramme, tag séparés | `AESSealedData.fromParts(iv, ciphertext, tag)`          |
| Aléa cryptographique             | `getRandomValues`, `getRandomBytes`                     |

C'est une correspondance terme à terme avec `crypto-envelope.ts`, y compris sur la séparation `iv` / `ct` / `tag` que nous avions dû reconstituer à la main côté WebCrypto. Disponible sur Android, iOS, tvOS et web, **inclus dans Expo Go** : aucun build de développement n'est requis, et le cycle d'itération reste celui d'aujourd'hui.

**Il manque la dérivation de clé** : `expo-crypto` n'expose pas PBKDF2. Retenu : **`@noble/hashes`** — MIT, zéro dépendance, audité, et employé uniquement pour cette fonction.

### 3. Ce que cela change pour le code déjà écrit

Rien dans le format : `crypto-envelope.ts` reste la source unique, et `crypto-web.ts` reste l'implémentation du web. S'ajoute `crypto-native.ts`, troisième implémentation du **même** contrat, avec le même test d'interopérabilité étendu à trois sens plutôt que deux.

C'est précisément ce que l'extraction du 2026-09-11 rendait possible. Sans elle, il aurait fallu dupliquer le format une fois de plus.

## Consequences

**Le secret de récupération doit vivre dans `expo-secure-store`**, c'est-à-dire le Keychain iOS et le Keystore Android, comme `SEC-31` l'exige (« toujours le stockage sécurisé natif »). Jamais dans `AsyncStorage`, qui n'est pas chiffré.

**PBKDF2 en JavaScript pur coûte du temps.** 600 000 itérations sur un téléphone d'entrée de gamme se comptent en secondes, pas en millisecondes. C'est une fois par déverrouillage, et c'est un coût assumé : le baisser pour gagner une seconde reviendrait à payer la sécurité avec la monnaie de l'utilisateur. L'écran de déverrouillage devra donc annoncer une attente, plutôt que paraître figé.

**Trois implémentations à maintenir en accord.** Le risque augmente mécaniquement. Il est tenu par une seule chose : le test d'interopérabilité croisée, qui doit couvrir les trois sens et échouer bruyamment à la moindre divergence d'un octet.

## Alternatives écartées

**`react-native-quick-crypto`.** Implémentation JSI en C/C++, rapide, et qui couvrirait AES et PBKDF2 d'un coup. Écartée : six dépendances transitives sur le chemin cryptographique, et un module natif qui impose un build de développement — Expo Go cesse de fonctionner. Le gain de vitesse ne paie pas ce prix tant que la seule opération coûteuse arrive une fois par session.

**Une implémentation AES en JavaScript pur (`@noble/ciphers`).** Écartée pour le chiffrement : `expo-crypto` s'appuie sur les primitives de la plateforme, ce qui vaut mieux qu'une implémentation logicielle sur le chemin où passent les jetons. Retenue en revanche pour la seule dérivation, faute d'alternative native.

**Échange du code côté client, sans serveur.** Certains types de clients OAuth n'ont pas de `client_secret`, ce qui rendrait l'échange possible depuis l'appareil. Écartée : `docs/15` impose explicitement un échange côté serveur, et cette décision-là n'est pas à reprendre au moment de la mettre en œuvre.

**Un serveur applicatif dédié (Node).** Écartée pour l'instant : un fournisseur de plus, un déploiement de plus, un budget récurrent de plus, pour une fonction qui tient en cinquante lignes.

## Ce qui reste à faire par le fondateur

Ces décisions n'engagent rien tant que les actions suivantes ne sont pas faites, et elles ne sont pas de mon ressort :

1. **Valider cette ADR** — elle est RED sur ses deux volets.
2. **Créer le projet Google Cloud** et l'écran de consentement, ce qui démarre les compteurs décrits dans `docs/GATE_REPORTS/G6_OUVERTURE.md`.
3. **Vérifier à la source** les deux chiffres que `docs/15` avance sans référence résoluble : la limite d'utilisateurs de test, et l'expiration des jetons de rafraîchissement en configuration Testing.
4. **Décider de l'hébergement** de la fonction — Supabase Cloud ou auto-hébergement. Le code est le même ; le budget, la juridiction des données et les obligations RGPD ne le sont pas.

# ADR-0008 — Perte des recovery codes : données L3 non récupérables

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D17
- **Approuvé par** : Fondateur
- **Réversible** : non — structure l'authentification et la cryptographie dès G2

## Context

`08_SECURITY_AUTH_SECRETS` pose que « récupérer le compte ≠ obtenir automatiquement la clé de déchiffrement de toutes les données locales », sans en tirer de conséquence opérationnelle. Le kit exige par ailleurs un chiffrement applicatif des données L3 sans spécifier ni algorithme, ni hiérarchie de clés, ni rotation, ni comportement en cas de perte des moyens de récupération.

Tant que ce point n'est pas tranché, aucune spécification cryptographique n'est écrivable.

## Decision

**Aucun escrow serveur.** La perte des recovery codes entraîne la perte définitive de l'accès aux données chiffrées L3.

Conséquences imposées :

1. L'UX énonce cette conséquence **avant** la saisie ou la collecte de la première donnée sensible.
2. La génération des recovery codes est un moment produit à part entière, pas une case à cocher.
3. La spécification `SEC-31_CRYPTO_KEY_MANAGEMENT` en découle : DEK par utilisateur, KEK dérivée, chiffrement authentifié (AES-256-GCM ou équivalent), secrets hors code et hors tables métier côté serveur, Keychain/Keystore via secure storage côté device — **jamais** AsyncStorage —, rotation `CREATE NEW → TEST → SWITCH → REVOKE OLD`.
4. Les parcours d'inscription et de récupération sont conçus ensemble en G2, jamais séparément.

## Rationale

Un escrow annulerait la garantie au moment précis où elle compte. Le coût de ce choix est un moment d'UX explicite, pas une perte de fonctionnalité.

## Alternatives

- **Escrow serveur** — rejetée : plus confortable, mais transforme la promesse « nous ne pouvons pas lire vos données » en « nous pourrions ». Aurait dû être déclarée dans la politique de confidentialité.

## Consequences

Un utilisateur qui perd ses recovery codes perd ses données L3. Cette conséquence est assumée et doit être annoncée, testée en UX et présente dans la documentation utilisateur.

## Affected systems

Authentification, cryptographie, onboarding, parcours de récupération, `SEC-31`.

## Security

Fortement positif : aucune clé maître exploitable côté serveur.

## Privacy

Fortement positif : réduit la surface de compromission et la portée d'une réquisition.

## Tests

- L'écran d'annonce précède toute collecte de donnée L3.
- Un compte récupéré sans recovery codes n'accède pas aux données L3.
- Aucune clé de déchiffrement utilisateur n'est présente côté serveur.

## Rollback

Introduire un escrow ultérieurement changerait la promesse : exigerait un nouvel ADR, une information des utilisateurs et une mise à jour de la politique de confidentialité.

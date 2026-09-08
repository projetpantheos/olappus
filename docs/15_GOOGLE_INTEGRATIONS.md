# GOOGLE INTEGRATIONS

## Gmail prototype
Lecture seule, synchronisation incrémentale, scopes minimaux compatibles.

Google recommande de demander les scopes les plus précis possibles. Certains scopes Gmail sont sensibles ou restreints ; l'accès à des données de portée restreinte stockées/transmises sur des serveurs peut déclencher une évaluation de sécurité. [réf. non résolue — à revérifier]

En configuration External/Testing, Google limite la liste à 100 utilisateurs test et les refresh tokens de test peuvent expirer après 7 jours selon les scopes. [réf. non résolue — à revérifier]

## Architecture OAuth
Le connecteur Google doit être séparé de l'identité Olappus. Flux recommandé : Authorization Code + PKCE, state anti-CSRF, callback serveur, échange du code côté backend, secrets uniquement côté serveur, handoff one-shot vers l'application.

## Gmail data minimization
- préférer metadata/snippets structurés lorsque suffisants ;
- ne pas stocker le body complet par défaut ;
- ne télécharger les pièces jointes que pour une finalité active ;
- suppression et purge sur disconnect.

## Calendar
Lecture seule au MVP. Sync incrémentale, cache et quotas maîtrisés.

## Google project separation
Dev/staging/prod doivent être séparés. Google recommande des projets séparés par déploiement. [réf. non résolue — à revérifier]

## Production readiness
Ne jamais présenter le prototype Google Testing comme architecture de production. Avant mise à l'échelle : revue OAuth, scopes, consent screen, vérification et politique de données.

## Fail states
- token expiré ;
- consentement révoqué ;
- scope manquant ;
- quota ;
- pagination ;
- timeout ;
- source supprimée.

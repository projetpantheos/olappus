# 08 — Security / Authentication / Secrets

## Auth
Compte indépendant de Google/Apple.
Passkey recommandée.
Récupération :
- recovery codes ;
- email vérifié ;
- éventuellement appareil de confiance.

Récupérer le compte ≠ obtenir automatiquement la clé de déchiffrement de toutes les données locales.

## Devices
Chaque appareil possède une identité propre, révocable et auditable.

## Permissions
Dimension :
WHO + ACTION + RESOURCE + CONDITIONS + DATA SCOPE + EXPIRATION

Niveaux :
READ → SUGGEST → PREPARE → EXECUTE_WITH_CONFIRMATION → AUTO_EXECUTE

## Chiffrement
Application-level encryption pour les données L3 appropriées.
Chiffrement serveur/disque en complément.
Clés et secrets hors code et hors tables métier.

## Secrets
Jamais dans :
- Git ;
- bundle mobile ;
- code ;
- DB métier.
Prévoir rotation :
CREATE NEW → TEST → SWITCH → REVOKE OLD

## Safe Mode
En cas d'incident critique :
- arrêter actions externes ;
- désactiver modules ;
- suspendre règles ;
- révoquer sessions ;
- désactiver auto-exécution ;
- passer en lecture seule lorsque pertinent.

## Environnements
LOCAL → DEV → STAGING → PRODUCTION
Jamais de données production dans DEV.
Accès production par procédure contrôlée.

# SECURITY THREAT MODEL

## Security posture

Référence de contrôle mobile : OWASP MASVS/MAS (stockage, authentification, réseau, confidentialité, etc.). [réf. non résolue — à revérifier]

## Adversaries

- utilisateur malveillant ;
- compte compromis ;
- fournisseur tiers compromis ;
- contenu externe avec prompt injection ;
- upload malveillant ;
- token compromis ;
- API abusée ;
- fuite de logs ;
- développeur/IA de code introduisant un secret ;
- mauvaise policy RLS ;
- SSRF ;
- supply-chain dependency compromise.

## Critical controls

- RLS sur toutes les données privées ;
- service role/secret keys server-only ;
- secure storage mobile ;
- aucun token sensible dans logs ;
- OAuth state + PKCE ;
- validation stricte des webhooks/callbacks ;
- rate limits ;
- validation de taille/MIME des uploads ;
- stockage privé + URLs signées ;
- SSRF protection ;
- CSP/escaping pour contenus affichés ;
- audit trail ;
- suppression vérifiable ;
- dependency lockfile + audit CI ;
- backups/restauration testés avant production.

Supabase indique que les secret keys contournent RLS et ne doivent jamais être embarquées dans une application ou un navigateur ; le stockage privé doit utiliser RLS pour contrôler les objets. [réf. non résolue — à revérifier]

## Mobile secure storage

Utiliser le stockage sécurisé natif via abstraction Expo-compatible pour les petits secrets et tokens de session ; ne jamais utiliser AsyncStorage pour les secrets. Android Keystore protège les clés non exportables et Apple Keychain fournit un stockage chiffré pour les petits secrets. [réf. non résolue — à revérifier]

## Prompt injection

Tout email, document, titre, ticket, nom de fichier, résultat de recherche et contribution Muses est **donnée non fiable**. Ne jamais concaténer ce contenu comme instruction système.

## SSRF

Pas de fetch serveur arbitraire à partir d'une URL utilisateur. Allowlist de domaines lorsque nécessaire, blocage IP privées/loopback/link-local, timeouts et redirections contrôlées.

## Supply chain

- lockfile ;
- versions pinnées ;
- dépendances minimales ;
- audit des packages ;
- revue des nouveaux packages ;
- pas de package abandonné si une alternative stable existe.

## Security levels

Classer les opérations 0–5 ; aucune action de niveau 4+ n'est automatisée sans confirmation renforcée.

## Security kill switches

Feature flags pour désactiver indépendamment Gmail, IA, upload et actions externes.

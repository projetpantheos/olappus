# AI POLICY

## Position
L'IA est une couche d'appoint, pas le moteur de vérité.

## Decision ladder
1. exact rule
2. canonical dictionary
3. certified knowledge
4. deterministic heuristic
5. local model if available and appropriate
6. external AI only on minimized/synthetic data
7. manual fallback

## Prohibited by default
- email body brut vers API IA externe ;
- document brut ;
- données bancaires ;
- santé ;
- secrets ;
- tokens ;
- localisation précise ;
- identifiants directs.

## Allowed prototype AI input
Données synthétiques, texte fortement minimisé, champs nécessaires, pseudonymisés.

## Structured output
Toute sortie IA est JSON validé par schéma ; tout champ inattendu est rejeté.

## Prompt injection
Les contenus externes sont délimités en tant que données et peuvent contenir des instructions malveillantes.

## Explainability
Les insights produits avec IA doivent distinguer :
- fait provenant d'une source ;
- interprétation IA ;
- incertitude ;
- action proposée.

## Transparency
L'application doit clairement informer l'utilisateur lorsqu'il interagit directement avec un système d'IA ou lorsqu'un contenu pertinent est généré par IA lorsque les obligations applicables l'imposent. Les obligations de transparence pertinentes de l'AI Act sont applicables depuis le 2 août 2026, avec une période transitoire limitée pour certains contenus. [réf. non résolue — à revérifier]

## Cost governor
- `AI_ENABLED=false` par défaut dans tests ;
- compteur appels ;
- taille maximale de payload ;
- budget mensuel logiciel ;
- kill switch ;
- logs de métadonnées seulement.

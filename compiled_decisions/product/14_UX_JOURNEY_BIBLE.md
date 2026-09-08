# 14 — UX Journey Bible

## 1. UX North Star

Olappus réduit la charge mentale sans devenir une nouvelle source d'attention.

## 2. Navigation primaire

- Aujourd'hui
- Protection
- Mémoire
- Plus

Hélios est l'écran « Aujourd'hui » et la porte d'entrée principale.

## 3. Navigation secondaire

`Plus` contient notamment :

- Modules
- Connexions
- Permissions
- IA
- Données
- Mon contrôle
- Aide

## 4. Journey A — First Value

Installation
→ promesse
→ Demo Mode
→ premier cas synthétique
→ Why
→ Proof
→ Options
→ Action préparée
→ résultat simulé
→ connexion facultative

Objectif : comprendre la valeur avant de demander beaucoup de données.

## 5. Journey B — Connecter Gmail

Aujourd'hui / Connexion
→ expliquer pourquoi
→ montrer scope minimal
→ consentement
→ OAuth
→ test de connexion
→ récupération minimale
→ Quarantine
→ Extraction
→ Normalisation
→ Case
→ Hélios

## 6. Journey C — Case

Hélios
→ Case
→ WHY
→ PROOF
→ CONFIDENCE
→ OPTIONS
→ ACTION
→ CONFIRMATION
→ RESULT
→ FOLLOW-UP

## 7. Journey D — aucune action nécessaire

Détection faible / pure information
→ ne pas interrompre
→ éventuellement digest/inbox
→ possibilité de « pourquoi vous ne m'avez pas alerté ? »

Le silence est un comportement produit.

## 8. Journey E — incertitude

UNKNOWN/INSUFFICIENT_DATA
→ expliquer la limite
→ ne pas surinterpréter
→ proposer éventuellement une donnée manquante
→ ne jamais transformer une probabilité faible en affirmation.

## 9. Journey F — Offline

Badge discret :
ONLINE / DEGRADED / OFFLINE

Les capacités sont évaluées dynamiquement.
Ne jamais afficher une action présentée comme exécutable si elle ne l'est pas offline.

## 10. Journey G — Permission

Action
→ permission absente
→ expliquer le besoin
→ afficher scope
→ demander le niveau exact
→ confirmation
→ journal d'audit.

## 11. Journey H — Suppression

Mon contrôle
→ données
→ catégorie/source
→ impact
→ option export
→ confirmation
→ suppression
→ purge
→ vérification
→ état final.

## 12. Journey I — Déconnexion

Connexion
→ scope actuel
→ déconnecter
→ expliquer que Disconnect ≠ Delete
→ choisir :
A conserver données métier
B supprimer aussi les données liées à la source
→ exécuter procédure.

## 13. Journey J — Knowledge/Muses

Information
→ source
→ fact
→ evidence
→ confidence
→ knowledge status
→ contradiction éventuelle
→ résolution.

## 14. Structure d'un Case

Header :

- titre clair
- niveau d'attention
- confiance
- date

Corps :

1. Pourquoi
2. Preuve
3. Ce que cela implique
4. Options
5. Action

Footer :

- snooze
- dismiss
- history
- provenance

## 15. États standards

Chaque écran doit définir :

- loading
- empty
- normal
- success
- error
- degraded
- offline
- blocked
- unknown
- insufficient_data

## 16. Règle d'action

Par défaut :
VIEW → SUGGEST → PREPARE → CONFIRM → EXECUTE

Toute auto-exécution doit afficher au préalable la permission persistante concernée.

## 17. Microcopy

Style :

- calme ;
- factuel ;
- non infantilisant ;
- sans culpabilisation ;
- sans sensationnalisme ;
- dire « nous ne savons pas » quand nécessaire.

## 18. Accessibilité

WCAG AA comme cible.

- contraste ;
- taille de texte ;
- lecteur d'écran ;
- labels ;
- focus ;
- mouvement désactivable ;
- zones tactiles suffisantes ;
- informations non dépendantes de la couleur seule.

## 19. Analytics UX

Capturer seulement les événements nécessaires pour comprendre :

- valeur ;
- erreur ;
- abandon ;
- fiabilité.
  Pas de télémétrie comportementale superflue.

## 20. Screen Spec Contract

Tout nouvel écran doit posséder :
id, goal, journey, entry, exit, data, permissions, states, actions, accessibility, analytics, privacy, security, tests.

# OLAPPUS PRODUCT OS

<!-- AUTHORITY-BANNER -->
> **Statut : HISTORIQUE** — remplacé par `compiled_decisions/product/01_PRODUCT_CONTRACT.md` et `02_MVP_P0.md`. La liste P0 de ce document (incluant Mnémosyne) est abrogée par **ADR-0004**. Voir `docs/DEPRECATION_MAP.md`.


## Positionnement
Olappus n'est pas une super-app où l'utilisateur doit apprendre une collection de modules. Les dieux sont des domaines métier internes. L'utilisateur voit principalement un système : **surveiller → comprendre → prouver → agir → vérifier**.

## Promesse
**« Et si les dieux étaient avec vous ? »**

Sous-promesse : **Olappus surveille, comprend, protège et simplifie votre quotidien.**

## Valeur fondamentale
La métrique stratégique est **l'attention évitée**, pas le nombre de fonctionnalités.

KPIs :
- événements surveillés ;
- alertes utiles / alertes totales ;
- faux positifs ;
- actions évitées ;
- dossiers résolus ;
- euros détectés / récupérés ;
- minutes estimées économisées ;
- % d'événements résolus sans IA ;
- % de connaissances réutilisées sans IA.

## États universels
Toute information entrante doit converger vers :
- Rien à faire ;
- À surveiller ;
- Action recommandée ;
- Action urgente ;
- Opportunité.

## 4 surfaces principales
1. **Aujourd'hui / Hélios** : attention, priorités, actions.
2. **Protection** : dossiers, alertes consommateur, preuves, droits et démarches.
3. **Mémoire** : documents, événements, sources, historique.
4. **Plus** : connexions, réglages, confidentialité, modules secondaires.

Un CTA global `+ Ajouter` permet d'importer une pièce, un document, un ticket, une information ou une connexion.

## Primitive UX universelle
Chaque insight important doit permettre :
- **Pourquoi ?** — explication et provenance ;
- **Prouver** — preuves utilisées ;
- **Agir** — action proposée ;
- **Plus tard** — snooze ;
- **Ignorer** — avec possibilité d'annuler.

## Case Engine
Une situation complexe doit devenir un `Case` suivi jusqu'à sa clôture :
`détecté → confirmé → preuves → action proposée → confirmation → exécution → réponse → résolu/abandonné`.

## Hélios
Hélios est le produit quotidien. Il fusionne événements, détections, échéances et opportunités. Il ne montre pas le fonctionnement interne des modules.

## Règle d'or des notifications
Olappus doit réduire le bruit. Regrouper les événements relatifs à un même problème ; privilégier le digest ; notification immédiate uniquement si urgence réelle ou risque matériel temporel.

## Briques initiales
P0 : Hélios, Hermès, Mnémosyne, Hadès, Argos, Thémis, Muses minimalistes.
P1 : Mercure, Asclépios, Peithô, Déméter, Perséphone, Poséidon, Apollon.
P2 : autres briques.

Némésis bancaire, santé humaine, médicaments, investissement et automatisations financières sont hors du premier prototype.

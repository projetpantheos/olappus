# PLAN UX ET DESIGN

Établi en G4, après ouverture de `references/olappus_da_light_reference.png`.

---

## 1. Ce qui existe déjà dans le kit

Le plan n'est pas à inventer : il est là, et il est dense.

| Document                    | Contenu                                                                                                                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRD-14_UX_JOURNEY_BIBLE`   | **10 parcours** (première valeur, connexion, Case, silence, incertitude, hors ligne, permission, suppression, déconnexion, connaissance), **10 états d'écran**, microcopie, accessibilité, et un **Screen Spec Contract** en 14 points obligatoire pour tout nouvel écran |
| `PRD-15_UI_COMPONENT_SPEC`  | **27 composants** nommés, leurs variantes, la règle de la CaseCard, la composition de l'ActionSheet, et 5 interdits explicites                                                                                                                                            |
| `PRD-16_DESIGN_TOKENS.json` | Couleurs, typographie, échelle d'espacement, rayons, durées de motion, rôles sémantiques                                                                                                                                                                                  |
| `docs/04_DESIGN_SYSTEM`     | Direction artistique, 6 palettes thématiques, contrastes mesurés, iconographie, motion                                                                                                                                                                                    |
| `docs/03_UX_SPEC`           | Structure d'Hélios, carte d'insight, notifications, langage de confiance                                                                                                                                                                                                  |
| `references/*.png`          | **Deux planches visuelles** : direction claire (principale) et sombre (ancienne)                                                                                                                                                                                          |

## 2. Ce que G4 a livré — et ce qu'il n'a pas livré

**Livré** : 3 composants sur 27 (`CaseCard`, `ScreenState`, sections de Case), les 7 états d'écran, la navigation à 4 entrées, le parcours `WHY → PROOF → OPTIONS → ACTION`, la palette neutre et les rôles sémantiques, l'accessibilité testée.

**Non livré, et volontairement** : typographie du système (aucune police chargée), iconographie (aucune icône), motion, les 6 palettes thématiques, 24 composants, le parcours de première valeur (`PRD-14` Journey A), l'onboarding.

La condition de sortie de G4 (`RUN-42`) porte sur la **première valeur compréhensible**, pas sur la bibliothèque de composants. L'esthétique actuelle est donc conforme au périmètre — mais elle n'est pas encore celle du produit, et il ne faut pas la prendre pour telle.

---

## 3. Trois contradictions entre la référence visuelle et la couche normative

Ces écarts ne sont pas des détails de goût : ils portent sur la structure du produit.

### C-UX-1 — La navigation n'est pas la même

| Source                                          | Entrées                                                         |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `PRD-14` §2 (normatif)                          | Aujourd'hui · **Protection** · Mémoire · Plus                   |
| Référence visuelle, bloc « Navigation globale » | **Accueil** · Aujourd'hui · Mémoire · Plus                      |
| Maquettes de la même référence                  | Accueil · Voyages · Planning · Carte · Météo — **cinq entrées** |

Trois structures différentes. Celle des maquettes décrit un autre produit : un compagnon de voyage, pas une couche d'attention et de protection.

### C-UX-2 — Deux systèmes de couleur

La référence propose une palette **vert profond et sable** : `#1F2A2E`, `#35524A`, `#A7BFAE`, `#E9EFEA`, `#DCC8A3`, `#F7F4EF`.

`PRD-16` propose un ivoire `#F7F4EC` avec **six familles thématiques** (olive, bronze, bleu profond, lavande, terracotta, bleu Égée), chacune porteuse d'un domaine.

Le fond est presque identique (`#F7F4EF` contre `#F7F4EC`). Tout le reste diverge : la référence est monochrome verte, les jetons sont polychromes par domaine.

### C-UX-3 — Les modules de la référence ne sont pas ceux du P0

La référence met en scène **Chronos** (planning), **Déméter** (lieux et expériences), **Apollon** (carte et trajets), **Hygie** (météo et qualité de l'eau) — tous hors P0 — et surtout **Argos y désigne le budget**, alors que `PRD-02` lui attribue les variations de prix.

Un même nom pour deux rôles, c'est le type de divergence qui coûte cher plus tard.

**Lecture la plus probable** : cette planche est un _moodboard de vision_, produit avant la compilation des décisions. Elle dit l'ambiance mieux qu'aucun texte, et se trompe sur la structure.

---

## 4. Plan par gate

### G4 — reste à faire pour clore

- Parcours de **première valeur** (`PRD-14` Journey A) : promesse → Demo Mode → premier cas → valeur → connexion facultative
- Typographie du système : une serif d'affichage libre et une sans-serif de texte, chargées via `expo-font`
- Jeu d'icônes minimal, avec **libellé accessible** pour chacune

### G5 — Muses

- Écran de provenance (`PRD-14` Journey J) : source → fait → preuve → confiance → statut → contradiction
- Composants `SourceChip`, `StatusBadge`, `Timeline`

### G6 — Connecteur — **FAIT le 2026-09-11**

- ~~Journey B complet~~ : expliquer pourquoi, scope minimal, consentement, test de connexion. **Ajout non prévu au plan** : l'écran refuse de connecter tant que le secret de récupération n'est pas créé et confirmé, ce qui rend visible l'ordre imposé par `SEC-31`.
- ~~`PermissionRow`, `ActionSheet` complet~~ : les sept éléments de `PRD-15` sont des propriétés **requises**, pas des options — un ActionSheet amputé ne compile pas.
- ~~Journeys G, H, I~~ : les trois écrans de confiance. Journey H énumère ce que la suppression a vérifié **et** ce qu'elle ne peut pas vérifier — six emplacements sur douze existent.
- Ajouté : `StatusBadge`, qui porte les quatre états du moteur de capacités.

**6 composants sur 27.** Reste 21, répartis sur G7, G8 et G9.

### G7 — Modules domaine

- `EvidenceList`, `EvidenceItem`, `DocumentRow`, `SubscriptionRow`, `FilterBar`
- Formulation prudente des affirmations juridiques

### G8 — Hors ligne

- `SyncStatus`, badge `ONLINE / DEGRADED / OFFLINE`, branché sur le moteur de capacités déjà écrit

### G9 — Avant pilote

- Passe complète des 27 composants contre `PRD-15`
- Mesure réelle des contrastes dans le composant final — `docs/04` prévient de ne pas se fier aux hexadécimaux
- Revue des 10 parcours

---

## 5. Décisions prises (ADR-0016)

- **Navigation** : `PRD-14` fait foi — Aujourd’hui · Protection · Mémoire · Plus. Confirmée, sans changement.
- **Référence visuelle** : moodboard. Autorité sur l’ambiance, l’identité et les familles typographiques ; aucune sur la structure, les modules ou la palette fonctionnelle.
- **Couleurs** : `PRD-16` reste la source. Ses valeurs sont mesurées, celles de la planche ne le sont pas.

## 6. Recommandations restantes

1. **Ne pas embellir avant G6.** Les écrans qui décideront de la confiance sont ceux de la permission, de la suppression et de la déconnexion, pas la carte d'attention.

# ADR-0016 — Navigation primaire et statut de la référence visuelle

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : C-UX-1, C-UX-2, C-UX-3 (`docs/UX_DESIGN_PLAN.md`)
- **Approuvé par** : Fondateur
- **Réversible** : oui pour la navigation, tant que peu d'écrans existent

## Context

L'ouverture de `references/olappus_da_light_reference.png`, en G4, a révélé trois divergences entre la planche visuelle et la couche normative :

1. **Navigation** — `PRD-14` §2 : _Aujourd'hui · Protection · Mémoire · Plus_. La planche : _Accueil · Aujourd'hui · Mémoire · Plus_. Ses maquettes : _Accueil · Voyages · Planning · Carte · Météo_, soit **cinq** entrées.
2. **Couleurs** — la planche propose un système vert profond et sable ; `PRD-16` un ivoire avec six familles thématiques par domaine.
3. **Modules** — la planche met en scène Chronos, Déméter, Apollon et Hygie, tous hors P0, et **Argos y désigne le budget** alors que `PRD-02` lui attribue les variations de prix.

La planche est manifestement antérieure à la compilation des décisions : c'est une vision, pas une spécification.

## Decision

### Navigation

`PRD-14` fait foi : **Aujourd'hui · Protection · Mémoire · Plus**.

« Protection » reste en navigation primaire parce qu'elle porte la moitié du positionnement produit (`PRD-01`). La retirer ferait du pilier consommateur une fonctionnalité secondaire, ce qu'aucune décision n'a acté.

### Statut de la référence visuelle

**Moodboard.** Elle fait foi sur :

- l'ambiance : lumière, espace, calme, densité ;
- les matières et textures : marbre, pierre calcaire, bois d'olivier, lin, métal doré ;
- l'identité : logo colonne et laurier, signature « Et si les dieux étaient avec vous ? » ;
- les familles typographiques : serif d'affichage à l'antique, sans-serif de lecture.

Elle ne fait foi ni sur la navigation, ni sur les modules, ni sur la palette fonctionnelle, ni sur le périmètre.

`PRD-16_DESIGN_TOKENS.json` reste la source des couleurs : ses valeurs sont mesurées et contrastées, celles de la planche ne le sont pas.

## Rationale

Une planche visuelle dit l'ambiance mieux qu'aucun texte, et se trompe presque toujours sur la structure — elle est produite avant que les arbitrages soient faits. Lui donner autorité sur le visuel imposerait de re-mesurer tous les contrastes ; lui donner autorité sur la structure réintroduirait des modules hors périmètre.

Lui retirer toute autorité serait l'excès inverse : l'identité travaillée là serait perdue sans raison.

## Alternatives

- **Navigation de la référence** — rejetée : sort Protection de la navigation primaire sans décision produit.
- **Planche normative sur le visuel** — rejetée : impose de re-mesurer tous les contrastes pour un gain esthétique non démontré.
- **Planche historique sans autorité** — rejetée : perte inutile de l'identité visuelle.

## Consequences

La navigation implémentée en G4 est confirmée, sans changement.

`docs/DEPRECATION_MAP.md` porte désormais le statut de la référence — sans quoi un agent futur l'appliquerait littéralement et réintroduirait Apollon, Hygie et une navigation à cinq entrées.

Les noms de modules de la planche (Chronos, Déméter, Apollon, Hygie) et l'Argos-budget **ne sont pas des décisions produit**. Le sens d'Argos reste celui de `PRD-02` : variations de prix.

## Affected systems

Navigation de l'application, `docs/DEPRECATION_MAP.md`, `docs/UX_DESIGN_PLAN.md`, tout futur travail d'écran.

## Security / Privacy

Neutre.

## Tests

Un test vérifie que la navigation primaire expose exactement les quatre entrées de `PRD-14`.

## Rollback

Changer la navigation reste peu coûteux tant que peu d'écrans existent. Le coût croîtra à chaque gate.

# ADR-0015 — Durées de rétention de la quarantaine, de l'extraction et de l'audit

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D21, D22
- **Approuvé par** : Fondateur
- **Réversible** : oui, par nouvel ADR — mais les données déjà purgées ne reviennent pas

## Context

La première version du Data Registry portait **neuf champs en `retention: OPEN`**, faute de durée décidée. `DAT-07` impose une rétention « par catégorie, au minimum nécessaire, avec auto-suppression lorsque possible », et `SEC-23` exige une vérification de suppression — or **on ne vérifie pas une purge dont la durée n'est pas chiffrée**. Les mentions « court » ou « nécessaire » ne sont pas testables.

`RUN-17` classe tout changement de rétention en **YELLOW** : proposition puis attente d'arbitrage.

## Decision

| Champ                                | Rétention                 | Motif                                                            |
| ------------------------------------ | ------------------------- | ---------------------------------------------------------------- |
| `source.raw_quarantine.payload_raw`  | **7 jours** (`days_7`)    | Délai de rejeu d'une extraction après correction d'un extracteur |
| `source.raw_quarantine.source_id`    | `connection_lifetime`     | Déduplication                                                    |
| `source.raw_quarantine.content_hash` | `connection_lifetime`     | Déduplication sans conserver le contenu                          |
| `source.raw_quarantine.observed_at`  | `connection_lifetime`     | Déduplication et synchronisation incrémentale                    |
| `extraction.record.extraction_id`    | `case_lifetime`           | Traçabilité de l'extraction ayant produit le Case                |
| `extraction.record.confidence`       | `case_lifetime`           | Explication de la confiance affichée                             |
| `audit.action_log.actor_id`          | **24 mois** (`months_24`) | Preuve d'action externe                                          |
| `audit.action_log.action_id`         | **24 mois** (`months_24`) | Preuve d'action externe                                          |
| `audit.action_log.occurred_at`       | **24 mois** (`months_24`) | Preuve d'action externe                                          |

Le vocabulaire du registre gagne `days_7` et `months_24`. Un test interdit désormais toute réapparition d'une rétention `OPEN`.

## Rationale

**La charge brute à 7 jours.** C'est le poste le plus sensible du système : le seul endroit où transitent des données de tiers non filtrées (`DAT-43`). La seule raison de la conserver est de pouvoir rejouer une extraction après correction d'un bug. Sept jours couvrent ce besoin sans transformer la quarantaine en archive. Les métadonnées de déduplication lui survivent, car sans elles une resynchronisation réingère tout — mais elles ne contiennent pas de contenu.

**L'audit à 24 mois.** L'audit des actions externes est ce qui protège l'utilisateur : c'est la trace de ce qu'Olappus a envoyé en son nom. Sa durée doit couvrir l'horizon du droit qu'il sert. La garantie légale de conformité, l'un des trois droits du périmètre P0 (ADR-0007), s'étend sur deux ans : un audit s'éteignant avant elle laisserait une réclamation tardive sans preuve. À la clôture du compte, ces entrées sont **anonymisées et non supprimées** (`SEC-33`).

## Alternatives

- **Quarantaine à 48 h** — écartée : impose de resynchroniser la source à chaque correction d'extracteur, au lieu de rejouer l'existant.
- **Quarantaine à 30 jours** — écartée : quadruple la fenêtre d'exposition pour un confort d'itération.
- **Audit à 6 ou 12 mois** — écartés : plus économes en données conservées, mais l'audit s'éteindrait avant l'horizon des droits que le produit prétend défendre.

## Consequences

Une correction d'extracteur au-delà de sept jours exige une resynchronisation de la source. C'est le coût assumé de la minimisation.

Ces durées ne valent que si les tâches de purge existent réellement : une rétention déclarée sans purge automatique est une rétention infinie qui s'ignore. Leur implémentation reste à faire dans G2.

## Affected systems

Data Registry, pipeline de quarantaine, tâches de purge, `SEC-33`, rapport de suppression présenté à l'utilisateur.

## Security

Neutre.

## Privacy

Positif : supprime neuf durées indéterminées, dont celle du seul emplacement contenant des données de tiers non filtrées.

## Tests

- aucune rétention `OPEN` dans le registre ;
- purge effective au-delà de la durée déclarée — **à écrire**, sans quoi ces durées restent déclaratives.

## Rollback

Allonger une durée est possible par nouvel ADR ; les données déjà purgées ne sont pas récupérables.

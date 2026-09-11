# ADR-0020 — Hébergement : service géré, en Europe

- **Statut** : ACCEPTED
- **Date** : 2026-09-11
- **Décision d'origine** : point laissé ouvert par ADR-0019 §1
- **Approuvé par** : Fondateur
- **Réversible** : oui, et c'est une propriété à préserver activement

## Context

ADR-0019 a placé l'échange OAuth dans une fonction serveur sans dire **où** cette fonction s'exécute. Le code est identique dans les deux cas ; le budget, la juridiction des données et les obligations RGPD ne le sont pas.

Le budget cible du projet est de **0 € récurrent** (`OPEN-07`). Le projet est mené par une personne seule.

Chiffres relevés le 2026-09-11 sur la page de tarification du fournisseur :

| Offre    | Coût      | Ce qu'elle donne                                                                 |
| -------- | --------- | -------------------------------------------------------------------------------- |
| Gratuite | 0 $       | 500 Mo de base, 2 projets actifs, **mise en pause après 1 semaine d'inactivité** |
| Pro      | 25 $/mois | Pas de mise en pause, 8 Go, support                                              |

## Decision

**Service géré, région européenne.** Offre gratuite pendant le développement ; passage à l'offre payante **le jour où un utilisateur réel existe**, et pas avant.

La mise en pause après une semaine d'inactivité est acceptable pour développer et **disqualifie l'offre gratuite dès le premier utilisateur** : une application qui cesse de fonctionner parce que personne ne s'en est servi pendant huit jours n'est pas un produit.

### Pourquoi pas l'auto-hébergement

Un serveur loué coûte moins cher en euros — 5 à 20 € par mois contre 25 $. Il coûte infiniment plus cher dans la seule ressource réellement rare ici : **le temps du fondateur**. Sauvegardes, correctifs de sécurité, surveillance, restauration après incident : c'est un métier, et un métier où l'erreur ne se paie pas en heures perdues mais en fuite de données.

Ce raisonnement n'est pas définitif. Il se renverse si un jour la juridiction des données l'exige, ou si le coût à l'échelle devient significatif devant le chiffre d'affaires. D'ici là, il tient.

## Consequences

**Obligations RGPD, dès le premier utilisateur réel** — et non « avant la mise en production », ce qui arrive toujours trop tard :

1. **Contrat de sous-traitance** signé avec l'hébergeur (article 28 du RGPD). Ce n'est pas une formalité : sans lui, le traitement est irrégulier.
2. **Région européenne** choisie à la création du projet. Une région se change mal après coup : elle implique une migration de données.
3. **Registre des traitements** et information des personnes, portés par `docs/13`.

**Le passage à l'offre payante est une date, pas une intention.** Il doit précéder l'ouverture à des utilisateurs, sinon la première semaine creuse coupe le service.

**La réversibilité doit rester vraie.** Le produit ne doit dépendre d'aucune fonctionnalité propriétaire qui n'existerait pas sur une instance auto-hébergée. Concrètement : rien qui ne soit du PostgreSQL standard, des politiques de sécurité au niveau des lignes, et des fonctions Deno. C'est une contrainte à tenir à chaque ajout, pas une case à cocher une fois.

## Alternatives écartées

**Auto-hébergement immédiat.** Écarté pour le temps, pas pour le prix. À reconsidérer si la juridiction ou l'échelle l'imposent.

**Rester sur l'offre gratuite après ouverture.** Écarté : la mise en pause rendrait le produit indisponible précisément pendant les périodes creuses, c'est-à-dire au pire moment pour un produit qui promet de veiller quand l'utilisateur ne regarde pas.

**Un autre fournisseur.** Non instruit, et délibérément : changer de fournisseur maintenant reviendrait à jeter la base, les politiques de sécurité et les migrations déjà écrites, pour un gain non démontré.

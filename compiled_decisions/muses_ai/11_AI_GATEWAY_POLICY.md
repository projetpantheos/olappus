# 11 — AI Gateway Policy

## Rôle

L'IA est une capacité, pas une autorité.

Ordre :
DETERMINISTIC → RULE ENGINE → KNOWLEDGE → AI IF NEEDED

## Gateway

MODULE → AI GATEWAY → MODEL ROUTER → PROVIDER

Les modules demandent des tâches, pas un fournisseur/model spécifique.

## Politique par donnée

AI_ALLOWED
AI_MINIMIZED_ONLY
AI_LOCAL_ONLY
AI_FORBIDDEN

## Routage coût/privacy

Pas d'IA si inutile.
Sinon :
petit modèle → modèle plus puissant uniquement si nécessaire.

## Pipeline

MINIMIZE BEFORE AI.

## Interdit

- envoyer le raw utilisateur à l'IA par défaut ;
- utiliser l'IA comme source de vérité ;
- entraîner automatiquement les modèles sur le comportement utilisateur ;
- contourner le Data Registry.

## AI proposal

Les sorties IA sont des propositions structurées, traçables et séparées des connaissances validées.
Conserver version du modèle, version système, date, sources fournies, éléments de preuve et hash utile pour l'audit, sans dépendre d'un raisonnement caché comme artefact de confiance.

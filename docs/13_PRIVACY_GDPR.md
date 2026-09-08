# PRIVACY / RGPD / MOBILE

## Principes

- minimisation ;
- finalité explicite ;
- transparence ;
- contrôle utilisateur ;
- conservation limitée ;
- suppression/export ;
- privacy by design/default.

La CNIL recommande de minimiser les données et de choisir les permissions les moins intrusives répondant au besoin. Elle distingue les permissions techniques du consentement quand une finalité et un traitement l'exigent. [réf. non résolue — à revérifier]

## UX privacy

Chaque connexion doit expliquer :

- quelles données sont lues ;
- pourquoi ;
- où elles sont traitées ;
- combien de temps ;
- avec quels sous-traitants ;
- comment déconnecter et supprimer.

## Data inventory

Pour chaque champ : finalité, base légale à déterminer juridiquement, source, sensibilité, destinataires, durée, suppression.

## Privacy Center

L'utilisateur peut voir :

- connexions ;
- scopes ;
- dernières synchronisations ;
- données stockées ;
- IA utilisée ou non ;
- sous-traitants ;
- export ;
- suppression.

## Data deletion

Suppression idempotente :

1. couper connexions ;
2. révoquer/effacer secrets ;
3. supprimer fichiers ;
4. supprimer données privées ;
5. anonymiser seulement ce qui doit légalement survivre ;
6. journal technique non personnel.

## Sensitive domains

Santé humaine, banque, biométrie, enfants, localisation fine et contacts sont hors chemin critique MVP. Ne pas les collecter “pour plus tard”.

## Legal note

Ce document est une spécification produit/technique et ne remplace pas une analyse juridique formelle ou un avis DPO/avocat avant commercialisation.

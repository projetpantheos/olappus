# MUSES GOVERNANCE

## Mission

Les Muses sont une mémoire collective certifiée, pas une démocratie brute de l'information.

## Roles

- Contributor : propose une observation.
- Validator : valide/invalide des candidats dans des domaines autorisés.
- Certified validator : rôle accordé selon une procédure et révocable.
- Official source : source externe avec provenance prioritaire.
- System/AI : assiste, jamais autorité finale.

## Reputation

Réputation par domaine, pas score global unique.
Critères : exactitude historique, indépendance, activité saine, taux de faux positifs, validations confirmées/révocables.

## Quorum

Un candidat sensible exige plusieurs validations indépendantes ; le seuil dépend du domaine.
Les validateurs issus d'un même cluster de comptes, IP/empreinte comportementale ou source ne doivent pas être considérés comme totalement indépendants.

## Certification

La certification peut être :

- automatique après quorum dans des domaines à faible risque ;
- manuelle pour domaines à fort impact ;
- temporaire pour connaissances évolutives.

## Révocation

Toute knowledge fact possède : statut, version, sources, validators, dates, expiration éventuelle. Une contradiction forte peut suspendre automatiquement un fait avant revue.

## Anti-Sybil / anti-collusion

Prévoir dès le design : rate limits, âge de compte, réputation progressive, limites de votes, détection de graphes de collusion, diversité des sources, cooldown avant certification.

## Sensitive domains

Droit, santé, finance, sécurité et consignes potentiellement dangereuses : certification renforcée, sources officielles prioritaires, aucune publication automatique issue du seul crowd.

## Principe de langage

Jamais : “la communauté prouve que X est frauduleux”.
Préférer : “X signalements/cas publics correspondent à Y ; voici les sources et la date”.

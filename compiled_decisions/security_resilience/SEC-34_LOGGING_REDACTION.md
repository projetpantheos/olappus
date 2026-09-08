# SEC-34 — Journalisation et rédaction

Écrit en G1. Contrôle rattaché : `SEC-23` — « No production secrets in repo » et, plus largement, l'exigence de `docs/12_SECURITY_THREAT_MODEL` : _aucun jeton sensible dans les logs_.

Condition de sortie de G6 : **aucun jeton ni corps de message brut dans les journaux.**

## Trois flux distincts

`PRD-13_ANALYTICS_MONETIZATION` impose de séparer :

| Flux                    | Contenu                                 | Destinataire      | Rétention                       |
| ----------------------- | --------------------------------------- | ----------------- | ------------------------------- |
| **Journaux techniques** | erreurs, latences, codes de retour      | exploitation      | courte, chiffrée en jours       |
| **Audit métier**        | qui a fait quoi sur quelle ressource    | `audit.*` en base | selon la politique de rétention |
| **Analytics produit**   | agrégats de valeur, d'erreur, d'abandon | agrégé            | agrégé par défaut               |

Ces flux ne se mélangent jamais. Un événement d'audit n'est pas un log technique, et inversement.

## Interdits de journalisation

Ne doivent **jamais** apparaître dans un journal, une trace, un message d'erreur, un rapport de crash ou une capture de télémétrie :

- jetons OAuth (access, refresh), clés d'API, `service_role`, mots de passe, codes de récupération ;
- corps de message, pièces jointes, contenu de document, extraits de quarantaine ;
- adresse email complète, adresse postale, numéro de téléphone, IBAN ;
- identité d'un tiers (invariant `no_durable_third_party_identity`) ;
- contenu d'un prompt ou d'une réponse d'IA portant des données utilisateur ;
- valeurs de champs classés L3 ou L4 au Data Registry.

## Autorisés

- identifiants opaques (`user_id`, `case_id`, `command_id`, `correlation_id`) ;
- `email_domain`, `sender_pseudonym_id` (dérivés, ADR-0012) ;
- codes d'erreur structurés, indicateurs booléens, compteurs, durées ;
- nom de la règle ou du module ayant produit une décision.

## Forme des erreurs

`ARC-04` impose des erreurs structurées : `code`, message utilisateur, `retryable`, détails sûrs, `correlation_id`. Le message utilisateur ne contient jamais de valeur de champ sensible ; les détails sûrs sont une liste blanche, jamais un déversement d'objet.

## Rédaction

Toute écriture de journal passe par une fonction de rédaction unique qui :

1. remplace les valeurs des clés interdites par `[REDACTED]` ;
2. tronque toute chaîne dépassant une longueur fixée ;
3. n'imprime jamais un objet entier par sérialisation implicite ;
4. échoue de façon sûre : en cas de doute, elle omet plutôt qu'elle ne divulgue.

Le contournement de cette fonction est traité comme un défaut de sécurité, pas comme un raccourci.

## En développement

Les mêmes règles s'appliquent en local. Un journal de développement finit dans une capture d'écran, un ticket ou une conversation avec un assistant : la fuite y est aussi réelle qu'en production.

`.gitignore` exclut `*.log` et `logs/` — les journaux ne sont jamais versionnés.

## Preuves attendues

- test : une charge synthétique contenant jeton, corps de mail et adresse ne laisse aucune de ces valeurs dans la sortie journalisée ;
- test : un objet d'erreur sérialisé ne contient aucune clé interdite ;
- revue : aucun appel direct à `console` hors outillage (règle ESLint `no-console`).

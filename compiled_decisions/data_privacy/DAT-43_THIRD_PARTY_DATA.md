# DAT-43 — Données de tiers

Gate : G2 · Invariant : `no_durable_third_party_identity` · Contrôle : `SEC-23`

## L'angle mort

Tout le kit raisonne en « données de l'utilisateur » : les quatre classifications, le registre, l'export, la suppression sont indexés sur `user_id`.

Or un email contient les données personnelles de **son expéditeur**, et souvent d'autres personnes. Ces personnes ne sont pas utilisatrices d'Olappus. Elles n'ont rien accepté, ne peuvent rien consulter, et ne sont destinataires ni de l'export ni de la suppression demandés par l'utilisateur.

Sans règle, un connecteur de messagerie constitue mécaniquement un fichier de tiers.

## La règle

> Hors entité canonique de type marchand ou organisation, **résolue via un référentiel officiel enregistré**, aucune identité de tiers n'est conservée durablement.

Concrètement, à la sortie du pipeline de normalisation :

| Cas                                                                          | Traitement                                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Expéditeur résolu comme marchand ou organisation via un référentiel officiel | conservé comme `domain.merchant`, avec identifiant pivot et provenance                                        |
| Expéditeur non résolu                                                        | réduit à `email_domain` + `sender_pseudonym_id` (pseudonyme **local**, stable pour cet utilisateur seulement) |
| Personne physique mentionnée dans un contenu                                 | **non extraite**                                                                                              |
| Coordonnées de tiers (adresse, téléphone) dans un contenu                    | **non extraites**                                                                                             |

## Pourquoi un pseudonyme local et non global

Un pseudonyme stable **entre utilisateurs** permettrait de savoir que deux personnes correspondent avec le même tiers — c'est un graphe social reconstitué par accident. Le pseudonyme est donc dérivé par utilisateur : deux utilisateurs recevant du même expéditeur obtiennent deux pseudonymes différents.

Le prix est réel : aucune connaissance collective ne peut se construire sur les expéditeurs non résolus. C'est le comportement voulu.

## Articulation avec les autres règles

- **`ADR-0012`** : l'email de l'utilisateur est `AI_FORBIDDEN` ; a fortiori celui d'un tiers. Seuls `email_domain` et `sender_pseudonym_id` peuvent atteindre le AI Gateway.
- **`AI-36`** (à écrire) : un tiers apparaissant dans un contenu non fiable ne peut en aucun cas devenir destinataire d'une action externe. Cette règle et l'invariant d'action externe se renforcent mutuellement.
- **`DAT-11`** : l'export utilisateur ne contient pas d'identité de tiers. Exporter la liste de ses correspondants reviendrait à leur faire subir une divulgation qu'ils n'ont pas choisie.
- **`AI-10`** : aucune connaissance collective ne se construit sur une personne physique.

## Ce qui reste possible

L'utilisateur voit ses propres emails dans sa messagerie : Olappus n'a pas à en reconstituer le contenu pour être utile. Ce que le produit conserve, ce sont des **faits métier normalisés** — un montant, une échéance, un marchand — pas des correspondants.

## Preuves attendues

- test de fuite : après ingestion d'un lot synthétique comportant des expéditeurs particuliers, aucune table durable ne contient leur adresse, leur nom ou leurs coordonnées ;
- test : deux utilisateurs recevant du même expéditeur non résolu obtiennent des pseudonymes différents ;
- test : l'export utilisateur ne contient aucune identité de tiers ;
- contrôle de registre : l'entrée `control.third_party_identity` reste en `retention: not_retained`, `export: false`, `ai_policy: AI_FORBIDDEN` — déjà vérifié par la suite du Data Registry.

## Limite assumée

Cette règle réduit le risque, elle ne l'annule pas : un contenu brut en quarantaine contient nécessairement des données de tiers avant extraction. C'est précisément pourquoi la quarantaine est classée `L0_RAW_QUARANTINE`, inaccessible au client, interdite à l'IA, et dotée d'une rétention courte — dont la durée exacte reste à chiffrer.

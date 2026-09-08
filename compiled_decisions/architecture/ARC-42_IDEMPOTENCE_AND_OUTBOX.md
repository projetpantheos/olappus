# ARC-42 — Idempotence des commandes et outbox

Gate : G3 · Contrôle : `SEC-23` « Command idempotence » · Test d'acceptation P0 n°16

`ARC-17` pose que « toute Command à effet de bord est idempotente par `command_id` ». Le principe ne dit ni **où** l'unicité est portée, ni **ce que renvoie** un rejeu, ni **combien de temps** la trace est conservée. Sans ces trois réponses, l'idempotence n'est pas implémentable.

## Pourquoi le sujet est critique ici

Le produit prépare des **actions externes** — réclamations, résiliations, contestations. Rejouer une commande, c'est envoyer deux fois un courrier au nom de l'utilisateur.

Le rejeu n'est pas un cas rare : `ARC-21` prévoit un outbox local qui retransmet après une coupure. Un client hors ligne qui reprend ne sait pas si sa commande est passée. **La seule protection est côté serveur.**

## Où l'unicité est portée

Dans la base, par une contrainte, jamais par une vérification applicative.

```
core.command_log
  command_id   uuid primary key   -- la contrainte EST le verrou
  actor_id     uuid
  command_name text
  status       text
  result       jsonb
  received_at  timestamptz
  completed_at timestamptz
```

Une vérification applicative « existe-t-il déjà ? » suivie d'une insertion laisse une fenêtre entre les deux : deux requêtes concurrentes la franchissent toutes les deux. La clé primaire ferme cette fenêtre par construction.

## Ce que renvoie un rejeu

Un rejeu **n'est pas une erreur** : c'est le comportement normal d'un client qui a perdu la réponse.

| État de la commande d'origine | Réponse au rejeu                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `COMPLETED`                   | Le **résultat mémorisé**, à l'identique. Aucun nouvel effet.                                                                  |
| `IN_PROGRESS`                 | `IN_PROGRESS` — au client de réessayer plus tard, sans réexécution.                                                           |
| `FAILED`                      | L'erreur mémorisée. Un rejeu ne relance pas une commande échouée : c'est une nouvelle décision, donc un nouveau `command_id`. |

Renvoyer le résultat mémorisé plutôt qu'un succès vide est ce qui rend le rejeu **transparent** : le client obtient la même chose qu'à la première tentative.

## Ce que l'idempotence ne couvre pas

Elle protège du **rejeu de la même commande**. Elle ne protège pas de deux commandes distinctes demandant la même chose : deux `command_id` différents sont deux intentions différentes.

Le doublon fonctionnel — l'utilisateur qui clique deux fois et génère deux commandes — relève de l'UI et de la machine à états du Case, pas de cette table.

## Rétention de la trace

`command_log` conserve un identifiant d'acteur et un résultat : c'est une donnée utilisateur, soumise au Data Registry.

La fenêtre doit couvrir le délai maximal pendant lequel un outbox peut retransmettre — au-delà, une commande très ancienne rejouée serait réexécutée. Cette durée dépend de la politique de synchronisation hors ligne, décidée en **G8**. D'ici là, la trace est conservée sans purge, et le registre le déclare explicitement.

## Ordre dans l'outbox

`ARC-21` impose : validation locale → transaction locale → outbox → validation serveur → événement.

L'outbox vide ses commandes **dans l'ordre d'émission par appareil**. Une commande bloquée ne doit pas être contournée par les suivantes : `ConfirmAction` après `PrepareAction` n'a aucun sens dans l'ordre inverse. En cas d'échec définitif d'une commande, la file de cet appareil s'arrête et l'utilisateur est informé — plutôt que de continuer sur un état divergent.

## Preuves attendues

- rejeu du même `command_id` : aucun second effet, résultat identique ;
- deux insertions concurrentes du même `command_id` : une seule réussit, l'autre lit le résultat ;
- une commande `FAILED` rejouée ne se relance pas ;
- deux `command_id` distincts produisent deux effets, même charge identique ;
- l'ordre d'émission par appareil est respecté au vidage de l'outbox (G8).

## Zone ouverte

La rétention de `core.command_log` reste à chiffrer (G8), une fois connue la fenêtre maximale de retransmission hors ligne.

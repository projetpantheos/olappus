# SEC-32 — Safe Mode

Gate : G3 · Contrôle : `SEC-23` « Safe Mode » · Test d'acceptation P0 n°17

`SEC-08` énumère ce que Safe Mode doit faire — arrêter les actions externes, désactiver les modules, suspendre les règles, révoquer les sessions, désactiver l'auto-exécution, passer en lecture seule — sans dire **qui l'active**, **jusqu'où il va**, ni **comment on en sort**. Sans ces réponses, il n'est pas implémentable, et un dispositif d'urgence qu'on n'a jamais su déclencher n'existe pas.

## À quoi il sert

Contenir un incident SEV-1 (`SEC-28`) : fuite suspectée, connecteur compromis, règle défectueuse produisant des actions erronées, comportement anormal non expliqué.

Le principe est asymétrique et assumé : **Safe Mode dégrade le produit pour protéger l'utilisateur.** Il vaut mieux qu'Olappus ne fasse rien pendant une heure qu'il n'envoie un courrier erroné au nom de quelqu'un.

## Portée

| Capacité                       | Sous Safe Mode            | Motif                                                                   |
| ------------------------------ | ------------------------- | ----------------------------------------------------------------------- |
| Lecture des Cases existants    | **autorisée**             | Priver l'utilisateur de ses données ne protège personne                 |
| Export de ses données          | **autorisée**             | `PRD-13` : jamais bloqué, y compris en incident                         |
| Détection, création de Cases   | suspendue                 | Une règle défectueuse ne doit pas continuer à produire                  |
| Préparation d'action           | suspendue                 | —                                                                       |
| **Exécution d'action externe** | **interdite**             | Le seul effet irréversible du produit                                   |
| Ingestion par connecteur       | suspendue                 | Contient un connecteur compromis                                        |
| Appels au AI Gateway           | suspendus                 | —                                                                       |
| Écritures locales et outbox    | acceptées, **non vidées** | Ne pas perdre le travail de l'utilisateur ; ne pas l'appliquer non plus |
| Sessions                       | révocables au cas par cas | La révocation globale est une décision distincte                        |

Une action déjà `EXECUTING` au moment du déclenchement n'est pas interrompue à l'aveugle : elle est menée jusqu'à un état connu, puis plus rien ne démarre. Interrompre en cours laisserait un état externe indéterminé — pire que l'incident.

## Qui l'active

**Activation** : le fondateur, ou une règle automatique sur signal fort (taux d'erreur d'actions externes au-delà d'un seuil, révocation en masse). Une activation automatique est toujours **notifiée**, jamais silencieuse.

**Désactivation** : humaine et explicite, jamais automatique. Un système qui décide seul que l'incident est terminé décide seul de reprendre les actions irréversibles.

**Portée du déclenchement** : globale ou par module. Un connecteur compromis n'exige pas de figer les moteurs déterministes.

## Comment on en sort

1. cause identifiée ;
2. correctif déployé ;
3. vérification sur données synthétiques ;
4. levée explicite, tracée dans l'audit ;
5. reprise progressive : modules d'abord, actions externes en dernier ;
6. post-mortem (`SEC-28`), et test de régression permanent (`GOV-16`).

## Ce que l'utilisateur voit

`PRD-14` §15 impose un état d'écran pour chaque situation, et `PRD-15` interdit d'afficher une action comme exécutable si elle ne l'est pas. Sous Safe Mode, les actions concernées apparaissent en `BLOCKED` **avec une raison compréhensible** — pas grisées sans explication, pas silencieusement absentes.

La formulation dit ce qui est vrai : le produit est volontairement en retrait, les données sont intactes, l'utilisateur n'a rien fait de mal.

## Implémentation

L'état vit dans `core.safe_mode`, lue par le moteur de capacités (`ARC-41`). Une seule ligne, lisible par tout compte authentifié — l'état de dégradation n'est pas un secret, et l'UI doit pouvoir l'afficher.

Le contrôle décisif est **en base** : une contrainte empêche toute transition vers `EXECUTING` tant que Safe Mode est actif. Un garde applicatif seul serait contournable par un chemin de code oublié.

## Preuves attendues

- aucune action externe ne peut passer en `EXECUTING` sous Safe Mode, **y compris par accès direct à la base** ;
- la lecture des Cases et l'export restent possibles ;
- l'activation et la levée sont tracées dans l'audit ;
- la levée est refusée sans acteur humain identifié ;
- l'UI expose l'état `BLOCKED` avec sa raison.

## Zone ouverte

Les seuils d'activation automatique ne sont pas chiffrés : ils supposent des métriques d'actions externes qui n'existeront qu'après G7. D'ici là, **l'activation est manuelle uniquement**, et c'est explicitement le comportement attendu, pas un manque.

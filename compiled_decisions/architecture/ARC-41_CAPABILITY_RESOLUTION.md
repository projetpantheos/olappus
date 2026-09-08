# ARC-41 — Résolution des capacités

Gate : G3 · Exigé par `PRD-01`, `PRD-14` §15, `PRD-15`

Le kit impose partout qu'une fonctionnalité soit `AVAILABLE`, `PARTIAL`, `BLOCKED` ou `UNKNOWN` « avec une raison compréhensible ». Aucun document ne dit **qui calcule cet état**, ni à partir de quoi. C'est un moteur transverse, pas une propriété d'affichage : sans lui, chaque écran réinvente la règle, et les réponses divergent.

## Le problème que ce moteur évite

Un utilisateur voit « indisponible hors ligne » alors que la vraie cause est une permission révoquée. Il se reconnecte, rien ne change, il ne comprend pas. Le produit a dit quelque chose de vrai et d'inutile.

**La raison affichée doit être la vraie cause, pas la première trouvée.** C'est ce qui impose un ordre de priorité explicite plutôt qu'une suite de `if`.

## Entrées

| Entrée                   | Origine                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Safe Mode                | `core.safe_mode` (SEC-32)                                                           |
| Feature flag             | `core.feature_flag`                                                                 |
| Permission               | `core.permission`, avec expiration et révocation                                    |
| Entitlement              | hors P0 (OPEN-05) — l'emplacement de lecture existe, il répond toujours « accordé » |
| État du connecteur       | `source.connector`                                                                  |
| Réseau                   | client : `ONLINE` / `DEGRADED` / `OFFLINE`                                          |
| Exigences de la capacité | niveau de permission requis, réseau requis, connecteur requis                       |

## Ordre de priorité

L'ordre n'est pas arbitraire : il va du plus structurel au plus conjoncturel.

1. **UNKNOWN** — une entrée déterminante est inconnue. Le produit ne sait pas, et le dit. Annoncer `AVAILABLE` puis échouer, ou annoncer `BLOCKED` à tort, sont deux mensonges.
2. **Safe Mode** — décision de sécurité globale, elle prime sur tout le reste.
3. **Feature flag** — la capacité n'existe pas dans cette version.
4. **Permission** — absente, insuffisante, expirée ou révoquée.
5. **Entitlement** — hors P0.
6. **Connecteur** — déconnecté ou en erreur.
7. **Réseau** — hors ligne pour une capacité qui l'exige.
8. **AVAILABLE**.

Une cause de sécurité (2 à 4) prime toujours sur une cause de disponibilité (6 à 7). Sinon l'utilisateur corrigerait le mauvais problème.

## `PARTIAL`

`PARTIAL` n'est pas un `BLOCKED` poli. Il signifie : **une partie utile fonctionne réellement**.

Réseau dégradé avec une capacité qui tolère le cache, connecteur en erreur mais données déjà normalisées consultables. Si rien d'utile ne fonctionne, la réponse est `BLOCKED` — un `PARTIAL` complaisant fait cliquer dans le vide.

## `UNKNOWN`

Réservé à l'ignorance réelle : état de connecteur non encore sondé, drapeau non chargé. Ce n'est pas une valeur de repli commode. `PRD-14` Journey E l'exige : expliquer la limite plutôt que de surinterpréter.

## Ce que le moteur ne fait pas

Il **n'autorise rien**. Il calcule ce que l'interface doit montrer. L'autorisation réelle est faite par le Core à l'exécution de la Command, et par RLS en base.

Un moteur de capacités qui servirait de contrôle d'accès serait un contrôle côté client — c'est-à-dire aucun contrôle.

## Preuves attendues

- une permission révoquée donne `BLOCKED` pour cause de permission, **même hors ligne** ;
- Safe Mode prime sur toutes les autres causes ;
- une entrée inconnue donne `UNKNOWN`, jamais `AVAILABLE` ;
- `PARTIAL` n'est rendu que lorsqu'une partie utile fonctionne ;
- chaque réponse porte un code de raison stable, affichable et testable.

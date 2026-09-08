# SEC-35 — Cycle de vie appareil et session

Gate : G2 · Contrôle : `SEC-23` « Device revocation » · Test d'acceptation P0 n°14

`SEC-08` exige que chaque appareil ait « une identité propre, révocable et auditable », et `ARC-21` que « la révocation invalide la synchronisation serveur future pour cet appareil ». Ni l'un ni l'autre ne dit ce que devient une session en cours, un outbox rempli ou un cache local. Ce document le fixe.

## États

```
ENREGISTRÉ ──► ACTIF ──► RÉVOQUÉ
                 │           │
                 └── inactif ┘   (l'inactivité n'est pas une révocation)
```

La ligne d'appareil **n'est jamais supprimée** à la révocation : `status = 'revoked'` et `revoked_at` renseigné. La contrainte est portée par la base (`device_revoked_consistency`), pas seulement par le code. Supprimer la ligne effacerait la trace de l'événement de sécurité lui-même.

## Ce que la révocation fait, immédiatement

| Effet                                             | Portée                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Synchronisation serveur                           | refusée pour cet appareil, définitivement                                      |
| Session en cours                                  | invalidée au prochain appel serveur                                            |
| Commandes de l'outbox de cet appareil déjà reçues | **conservées et traitées** si elles étaient valides au moment de leur émission |
| Commandes émises après la révocation              | rejetées                                                                       |
| Actions externes préparées, non confirmées        | passent en `EXPIRED`, jamais exécutées                                         |

### Le point non évident

Une commande déjà parvenue au serveur et validée **avant** la révocation reste valide. Révoquer un appareil n'est pas annuler ce qu'il a légitimement fait. Traiter la révocation comme un rollback rétroactif casserait l'immutabilité des Events (`ADR-0006`) et créerait des trous dans l'audit.

En revanche, une **action externe** préparée et non confirmée est annulée : l'utilisateur n'a pas confirmé, et la confirmation ne peut plus venir d'un appareil révoqué.

## Ce que la révocation ne fait pas

**Elle ne vide pas les données locales de l'appareil.** Le serveur n'a aucun moyen d'y contraindre un appareil qui ne se connecte plus — c'est précisément le cas d'un appareil perdu ou volé.

C'est la raison d'être d'ADR-0008 et de `SEC-31` : les données L3 locales sont chiffrées, et la clé n'est pas dérivable sans les secrets de l'utilisateur. **La protection d'un appareil perdu vient du chiffrement, pas de la révocation.**

L'UX doit le dire ainsi, sans laisser croire à un effacement à distance.

## Multi-appareils

- L'identité d'appareil est explicite (`ARC-21`), jamais déduite d'un identifiant de session.
- Un utilisateur voit la liste de ses appareils, avec date de création et dernière synchronisation.
- Révoquer l'appareil courant est possible — c'est une déconnexion définitive de cet appareil, pas une suppression de compte.
- Le dernier appareil actif peut être révoqué : le compte reste récupérable par les recovery codes, dans les limites d'ADR-0008.

## Enregistrement d'un nouvel appareil

L'enregistrement passe par le serveur (`identity.device` n'accorde aucun droit d'écriture au client, cf. migration G2). Un appareil ne s'auto-déclare pas : il est enregistré à l'issue d'une authentification réussie, puis audité.

## Preuves attendues

- test d'intégration : un appareil révoqué ne peut plus synchroniser ;
- test : une commande valide reçue avant la révocation reste appliquée ;
- test : une commande émise après la révocation est rejetée ;
- test : une action externe préparée non confirmée passe en `EXPIRED` à la révocation ;
- test : la ligne d'appareil subsiste avec `revoked_at` renseigné ;
- test RLS : un utilisateur ne voit que ses propres appareils (déjà couvert par `device_select_own`).

## Zone ouverte

La durée de vie des sessions et la politique de rafraîchissement des jetons ne sont pas décidées. Elles relèvent de l'implémentation de l'authentification, prévue plus loin dans G2 ; ce document fixe ce que la révocation doit produire, pas la mécanique de session.

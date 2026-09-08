# SEC-33 — Inventaire de suppression et vérification

Gate : G2 · Contrôle : `SEC-23` « Deletion verification » · Tests d'acceptation P0 n°11 et n°31

`DAT-07` exige une suppression « contrôlée, auditable et vérifiable », et `SEC-23` en demande la preuve. Or **on ne peut pas vérifier une suppression sans savoir où sont les copies.** Ce document est cet inventaire.

## Le principe qui gouverne tout le reste

`DISCONNECT ≠ DELETE`. Déconnecter une source ne supprime pas les données déjà dérivées. La confusion des deux est un dark pattern, dans un sens comme dans l'autre : supprimer ce que l'utilisateur croyait garder est aussi grave que garder ce qu'il croyait supprimer.

Séquence imposée par `DAT-07` : `REVOKE CONNECTORS → DELETE → PURGE COPIES/CACHES → VERIFY`.

## Inventaire des emplacements

Toute donnée utilisateur peut exister à ces endroits. Une suppression qui en oublie un n'est pas une suppression.

| #   | Emplacement                                       | Mode                                      | Vérifiable ?              | Délai                           |
| --- | ------------------------------------------------- | ----------------------------------------- | ------------------------- | ------------------------------- |
| 1   | PostgreSQL — schémas `core`, `domain`, `identity` | suppression en cascade depuis `core.user` | oui, requête              | immédiat                        |
| 2   | PostgreSQL — schéma `source` (quarantaine)        | suppression                               | oui, requête              | immédiat                        |
| 3   | PostgreSQL — schéma `extraction`                  | suppression                               | oui, requête              | immédiat                        |
| 4   | PostgreSQL — schéma `audit`                       | **anonymisation**, pas suppression        | oui, requête              | immédiat                        |
| 5   | Storage (fichiers)                                | suppression d'objet                       | oui, listing              | immédiat                        |
| 6   | SQLite local, sur chaque appareil                 | suppression locale                        | **non** depuis le serveur | à la prochaine synchronisation  |
| 7   | Outbox local                                      | purge des commandes en attente            | non depuis le serveur     | à la prochaine synchronisation  |
| 8   | Caches applicatifs et projections                 | invalidation                              | oui                       | immédiat                        |
| 9   | Journaux techniques                               | expiration seule                          | non ciblable              | selon rétention (`SEC-34`)      |
| 10  | Sauvegardes de base                               | expiration seule                          | non ciblable              | selon rétention des sauvegardes |
| 11  | Exports générés à la demande                      | suppression du fichier                    | oui                       | immédiat                        |
| 12  | Tombstones anti-résurrection                      | **conservés délibérément**                | oui                       | jusqu'à convergence             |

### Les trois cas honnêtes

**L'audit est anonymisé, pas supprimé.** Le registre le déclare (`delete: anonymize`). Un journal d'action externe doit survivre à la suppression du compte, sans permettre de remonter à la personne. Le dire à l'utilisateur fait partie de la suppression.

**Les sauvegardes et les journaux ne sont pas ciblables.** On ne réécrit pas une sauvegarde pour en retirer une ligne. Ils expirent. La seule promesse tenable est : _aucune restauration ne réintroduit des données supprimées_, garantie par les tombstones (#12). `DAT-07` l'exige : la rétention des sauvegardes doit être alignée sur la politique de suppression.

**L'appareil est hors de portée du serveur.** Une suppression déclenchée sur un appareil ne vide pas les autres tant qu'ils ne se synchronisent pas. `ARC-21` le pose déjà : la suppression des données locales est une opération de sécurité distincte.

## Anti-résurrection

Sans marqueur de suppression, un appareil hors ligne resynchronise ses lignes supprimées et les ressuscite. C'est le test d'acceptation n°31.

Un tombstone porte : identifiant de l'objet, date de suppression, portée. Il est conservé **le temps nécessaire à la convergence**, puis purgé — un tombstone éternel est lui-même une donnée conservée.

## Ce que la vérification doit prouver

1. Après suppression, aucune requête sur les schémas 1 à 3 ne retourne de ligne pour cet utilisateur.
2. Les entrées d'audit subsistent mais ne portent plus d'identifiant remontant à la personne.
3. Aucun objet de stockage ne reste rattaché à l'utilisateur.
4. Une synchronisation ultérieure d'un appareil hors ligne ne réintroduit rien.
5. Le rapport de suppression remis à l'utilisateur distingue ce qui est supprimé, ce qui est anonymisé et ce qui expirera.

## Ce que l'utilisateur doit voir

`PRD-14` Journey H impose : catégorie, impact, option d'export **avant** suppression, confirmation, purge, vérification, état final.

Ne jamais afficher « toutes vos données ont été supprimées » si l'audit est conservé sous forme anonymisée et si les sauvegardes expireront plus tard. La formulation exacte fait partie du contrôle.

## Preuves attendues

- test d'intégration : suppression d'un utilisateur synthétique, puis assertion sur chacun des douze emplacements applicables ;
- test de résurrection : réinjection d'une commande de synchronisation portant une ligne supprimée, rejetée par le tombstone ;
- revue : le rapport de suppression correspond à l'inventaire, sans promesse excédant ce qui est vérifiable.

## Zone ouverte

La rétention des sauvegardes n'est pas décidée (`00_OPEN_ITEMS` OPEN-06). Tant qu'elle ne l'est pas, la durée après laquelle une donnée supprimée disparaît réellement de toutes les copies **reste inconnue** — et ne doit donc pas être annoncée à l'utilisateur.

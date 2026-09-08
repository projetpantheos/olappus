# 07 — Privacy / Anonymisation / Rétention

## Principe
COLLECT LESS → STORE LESS → KEEP LESS → SHARE LESS

## États de confidentialité
IDENTIFIABLE → PSEUDONYMOUS → ANONYMOUS / AGGREGATED

Ne jamais qualifier une donnée d'« anonyme » simplement parce qu'un nom a été supprimé.

## Pseudonymisation
Lorsque la fonctionnalité nécessite une donnée personnelle, la donnée est systématiquement pseudonymisée lorsque possible, séparée de l'identité et protégée.

## Anonymisation
Pour statistiques, produit et connaissance générale :
- suppression ;
- généralisation ;
- agrégation ;
- réduction de précision ;
- analyse du risque de ré-identification.

## Minimisation AVANT IA
Une facture contenant nom, adresse, téléphone et IBAN ne transmet à l'IA que les champs nécessaires à la tâche, par exemple fournisseur, montant, date, type de document.

## Raw
Raw temporaire par défaut.
Conservation durable uniquement si :
- nécessaire au fonctionnement ;
- document utilisateur explicitement conservé ;
- preuve nécessaire ;
- obligation légitime.

## Rétention
Par catégorie, au minimum nécessaire, avec auto-suppression lorsque possible.
Déconnexion d'une source ≠ suppression automatique de toutes les données antérieures.

## Export
Export complet, structuré et ouvert :
JSON / CSV / documents pertinents / provenance.

## Suppression
REVOKE CONNECTORS → DELETE → PURGE COPIES/CACHES → VERIFY
Suppression contrôlée, auditable et vérifiable.

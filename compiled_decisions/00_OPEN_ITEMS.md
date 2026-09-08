# OPEN ITEMS — zones volontairement non définies

`00_PRE_CLAUDE_FREEZE.md` impose : « Une zone volontairement non définie doit être explicitement marquée `OPEN`, jamais implicitement inventée. »

Ce fichier est cette liste. **Une zone marquée `OPEN` ne peut pas être comblée par initiative d'un agent** : elle exige une décision, tracée par ADR.

Dernière mise à jour : 2026-09-08 (étape 0, post-G0).

---

## OPEN-01 — Thème sombre
Les design tokens ne couvrent que la palette claire. Une référence visuelle sombre existe (`references/poseidon_dark_reference.png`) et `docs/00` §41 mentionne un mode dark/light.
**Statut** : hors P0. Aucun composant ne doit supposer l'existence de tokens sombres.
**Décision requise avant** : première implémentation d'un thème.

## OPEN-02 — Internationalisation
Aucune stratégie i18n. `10_NORMALIZATION_SPEC` impose de stocker un code de langue pour les contenus durables, ce qui est une exigence de données, pas d'interface.
**Statut** : P0 en français uniquement, sans infrastructure i18n.

## OPEN-03 — Notifications push
Le produit impose une politique de silence et de regroupement, mais aucun canal de notification n'est spécifié (fournisseur, permissions, digest, quiet hours).
**Statut** : hors P0. Hélios est consulté, il ne pousse pas.

## OPEN-04 — Seuils anti-abus Muses
Quorum par domaine, âge de compte minimal, cooldown avant certification, signaux d'indépendance, plafonds de validation, seuil de suspension automatique.
**Statut** : différé à G5 (D18). **Aucune règle certifiée ne peut être publiée avant chiffrage de ces seuils.**

## OPEN-05 — Porteur des entitlements
`13_ANALYTICS_MONETIZATION` définit la forme d'un entitlement (`user_id + capability + status + source + valid_from + valid_until`) mais aucune table n'existe dans le modèle canonique, et le moteur de capacités devra les lire.
**Statut** : hors P0 (aucune monétisation en P0), mais le moteur de capacités doit prévoir l'emplacement de lecture.

## OPEN-06 — Modèle de sauvegarde et de restauration
`23_SECURITY_CONTROL_MATRIX` exige une preuve de restauration testée, sans runbook associé.
**Statut** : requis avant G9, non requis avant.

## OPEN-07 — Stratégie de cache par source open data
Le budget cible est de 0 € récurrent, mais aucune stratégie de fréquence, cache et quota n'est définie par source, alors que `docs/00` §24 la réclame.
**Statut** : requis avant la première ingestion (G5).

## OPEN-08 — Comptes partagés, foyers, mineurs
Le modèle suppose un utilisateur unique par compte. Rien n'est dit des comptes partagés, des foyers ni des mineurs.
**Statut** : hors P0. `13_PRIVACY_GDPR` place déjà les enfants hors chemin critique.

## OPEN-09 — Multi-tenant
ADR-0006 retire `tenantId` de l'enveloppe d'événement.
**Statut** : un éventuel multi-tenant exigera une v2 d'enveloppe et un ADR de remplacement.

## OPEN-10 — Médiateurs et voies de recours
Écartés du périmètre juridique P0 par ADR-0007.
**Statut** : candidats P1, conditionnés à une source officielle enregistrée.

---

## Zones explicitement **fermées** (ne pas rouvrir sans ADR)

- Escrow de clés côté serveur — fermé par **ADR-0008**.
- Matching flou des rappels produit — fermé par **ADR-0013**.
- Envoi d'une adresse email complète à une IA — fermé par **ADR-0012**.
- Upload de documents en P0 — fermé par **ADR-0004**.
- Dépendance directe module → module — fermé par le ledger (invariant dur).

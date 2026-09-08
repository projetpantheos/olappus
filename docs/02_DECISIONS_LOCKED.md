# DECISIONS LOCKED

<!-- AUTHORITY-BANNER -->
> **Statut : CHECKLIST** — décisions fondateur toujours valables, **sauf** la clause « monorepo simple uniquement si le dépôt réel le justifie », abrogée par **ADR-0002** (monorepo npm workspaces). Voir `docs/DEPRECATION_MAP.md`.


## Décisions du fondateur
- A1 Supabase : OUI.
- B1 local-first : OUI, autant que raisonnable.
- B2 traitement/hébergement cible en Europe : OUI.
- C2 réputation des validateurs : OUI.
- C3 certification : OUI.
- D1 données personnelles brutes interdites aux IA externes : OUI.
- E1 futures briques sans modification du Core autant que possible : OUI.
- Web : secondaire ; API et modèle de données doivent néanmoins être indépendants de l'UI mobile.

## Defaults techniques
- Expo + React Native + TypeScript strict.
- Expo Router.
- Supabase Auth/Postgres/Storage/Edge Functions.
- Zod pour les frontières de données.
- Tests unitaires + intégration + RLS + sécurité.
- CI sur chaque PR.
- Monorepo simple uniquement si le dépôt réel le justifie ; sinon structure modulaire unique.
- Android+iOS avec priorité de test Android si une seule plateforme doit être optimisée en premier.

## Décisions interdites sans validation humaine
- changement de fournisseur de base de données ;
- suppression ou affaiblissement RLS ;
- ajout de scopes Google ;
- ajout d'une IA externe recevant des données personnelles ;
- ajout d'une dépendance payante obligatoire ;
- ajout d'un traitement de santé humaine ou financier réglementé ;
- automatisation d'une action externe irréversible ;
- modification du schéma Core cassant la compatibilité des modules.

## Décisions à différer
- architecture bancaire ;
- stratégie de monétisation définitive ;
- Web complet ;
- stack IA production ;
- KMS managé payant ;
- stratégie de certification juridique externe.

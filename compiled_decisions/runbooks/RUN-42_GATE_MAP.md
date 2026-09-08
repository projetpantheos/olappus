# RUN-42 — Table de correspondance des gates

Établie par **ADR-0001**. Cette table est la **seule numérotation de gates valable**. Les numérotations de `docs/23_FOUNDER_RUNBOOK` et `docs/24_GATES_CHECKLIST` sont abrogées ; leur contenu reste utilisable comme checklist, rattaché ci-dessous.

## Gates numérotées

| Gate   | Objet                                   | Condition de sortie                                                                                                                              | Checklists rattachées                      |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| **G0** | Audit                                   | Décisions bloquantes tranchées et consignées en ADR ; couche d'autorité cohérente                                                                | `docs/23` phase 1 · `docs/24` G1           |
| **G1** | Foundation                              | Dépôt initialisé, `.gitignore`, secret scan vert, TS strict, Expo, CI, séparation d'environnements, Node épinglé                                 | `docs/23` phases 0 et 2.1 · `docs/24` G0   |
| **G2** | Privacy / Security baseline             | Data Registry, quarantine, normalisation, identité/appareil/permissions, RLS ; **preuve** qu'un accès non autorisé échoue ; suppression vérifiée | `docs/23` phases 2.2–2.6 · `docs/24` G2    |
| **G3** | Core contracts                          | Enveloppe CQE figée + validation runtime, Case/Action/Outcome, audit, manifestes validés, lint d'imports, Safe Mode                              | `docs/24` G1 (contrats)                    |
| **G4** | Demo Mode + Hélios déterministe         | Première valeur < 5 min **sans aucun appel externe** ; fixtures adverses passantes ; Why/Proof/Options/Action complet                            | `docs/23` phase 3 · `docs/24` G3           |
| **G5** | Muses minimal + License Gate            | Une source `blocked` rend l'ingestion impossible même si l'endpoint répond ; candidate ≠ fact ; validité temporelle                              | `docs/23` phase 8 · `docs/24` G5 et G6     |
| **G6** | **Connecteur externe (Hermès / OAuth)** | PKCE + state, échange serveur, scopes minimaux, purge sur déconnexion ; **aucun token ni corps brut dans les logs**                              | `docs/23` phase 4 · `docs/24` G4           |
| **G7** | Modules domaine + protection            | Chaque insight porte reason codes et evidence ; aucune affirmation juridique sans source datée ; Evidence Vault                                  | `docs/23` phases 7 et 9 · `docs/24` G7     |
| **G8** | Offline / Outbox                        | Lecture offline, écriture via outbox, rejeu idempotent, aucune résurrection après suppression                                                    | —                                          |
| **G9** | Release / Beta                          | Suites privacy/security vertes, dependency audit, rollback répété, `PROJECT_STATE` à jour, aucune décision RED ouverte                           | `docs/23` phase 10 · `docs/24` G8, G9, G10 |

## Gates thématiques (surcouche)

Issues de `17_FOUNDER_GATES`, elles s'appliquent **à chaque** gate numérotée :

| Gate        | Question                                    |
| ----------- | ------------------------------------------- |
| **DATA**    | Cette donnée est-elle nécessaire ?          |
| **TRUST**   | D'où vient-elle ?                           |
| **ACTION**  | Quel est le risque ?                        |
| **CHANGE**  | Touche-t-on un invariant ?                  |
| **RELEASE** | Peut-on démontrer que la version est sûre ? |

## Matrice d'autonomie

Inchangée (`17_FOUNDER_GATES`) : **GREEN** — Claude autonome (UI, tests, docs, fixtures, refactoring local, bugs non critiques, accessibilité) · **YELLOW** — proposer puis attendre (nouvelle table, nouveau module, nouvelle API externe, nouvelle permission, nouvelle règle métier, nouvel usage IA, changement de rétention) · **RED** — validation explicite du fondateur (production, données sensibles, sécurité, chiffrement, authentification, auto-exécution, finance/santé/juridique, suppression massive, migration destructive, nouvelle catégorie de données).

## Format de revue de fin de gate

```
GATE
STATUS
EVIDENCE
RISKS
OPEN DECISIONS
ROLLBACK
NEXT GATE
```

Une gate n'est verte que si sa condition de sortie est **démontrée par une preuve**, jamais déclarée.

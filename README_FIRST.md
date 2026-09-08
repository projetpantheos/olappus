# OLAPPUS — FINAL CLAUDE CODE LAUNCH KIT

Version de cadrage : 2026-09-05 · **Kit à jour : 2026-09-08 (post-G0, étape 0)** · Statut : `G0_APPROVED`

## Mission

Construire un prototype mobile installable d'Olappus, très peu coûteux, fortement sécurisé, local-first autant que raisonnable, et pensé dès le départ comme un produit extensible par briques.

## Promesse

**« Et si les dieux étaient avec vous ? »**

Olappus surveille, comprend, protège et simplifie le quotidien. Il réduit la charge mentale en demandant l'attention de l'utilisateur uniquement quand elle est réellement nécessaire.

## Principes bloquants

1. La sécurité et la vie privée priment sur la vitesse de développement.
2. Le prototype doit pouvoir fonctionner sans IA externe.
3. Les données personnelles brutes ne sont jamais envoyées à une IA externe par défaut.
4. Les règles déterministes, les référentiels et les connaissances validées passent avant l'IA.
5. Les Muses ne sont jamais une autorité automatique : contribution ≠ vérité.
6. Une future brique doit s'ajouter via un contrat de module sans casser le Core.
7. Les actions externes à impact doivent être prévisualisées, confirmées puis vérifiées.
8. Aucune publicité ciblée, revente de données ou commission cachée dans la vision cible.
9. Tout dataset externe doit passer par le contrôle de licence et de provenance avant ingestion.
10. L'interface web est prévue, mais le mobile est la priorité du prototype.
11. **Aucun paramètre d'action externe — destinataire, adresse, IBAN, URL, référence de dossier — ne peut provenir de contenu non fiable.** Ces valeurs viennent du référentiel canonique ou d'une saisie explicite de l'utilisateur.
12. **Aucune identité de tiers n'est conservée durablement** hors entité canonique résolue via un référentiel officiel.

## Choix verrouillés

- Backend : Supabase.
- Architecture : local-first autant que raisonnable.
- Hébergement et traitement des données de production cible : Europe.
- Muses : réputation + certification.
- IA : données personnelles brutes interdites aux API IA externes sauf décision explicite ultérieure et contrôle DPO/juridique.
- Core : stable ; futures briques branchées par événements/capabilities.
- Budget prototype : objectif 0 € de coûts récurrents obligatoires hors domaine/compte store éventuel.
- **Dépôt** : monorepo npm workspaces, version de Node épinglée — Node 24 LTS (ADR-0002, ADR-0014).
- **Données** : schémas PostgreSQL `identity/core/source/extraction/domain/knowledge/audit` (ADR-0005).
- **Contrats** : enveloppe CQE snake_case + `actor_id`, sans `tenantId` (ADR-0006).

---

## ORDRE D'AUTORITÉ

1. **`docs/ADR/`** — Decision Ledger. **Autorité maximale.** Commencer par `docs/ADR/INDEX.md`.
2. `compiled_decisions/` — couche normative. Entrée : `compiled_decisions/00_INDEX.md`.
3. `DECISION_LEDGER_COMPILED.md` (racine) — vue condensée des invariants.
4. `docs/` — selon le statut défini par **`docs/DEPRECATION_MAP.md`**.
5. Implémentation existante.
6. Préférence d'ingénierie.

En cas de conflit non résolu par cette hiérarchie : **STOP et DECISION REQUIRED** (`claude_governance/15_CLAUDE_STOP_PROTOCOL.md`).

`compiled_decisions/00_OPEN_ITEMS.md` liste les zones volontairement non définies. **Une zone `OPEN` ne se comble pas par initiative : elle exige une décision tracée par ADR.**

## Ordre de lecture

**1. Gouvernance et décisions**

1. `docs/ADR/INDEX.md`
2. `docs/DEPRECATION_MAP.md`
3. `compiled_decisions/00_OPEN_ITEMS.md`
4. `DECISION_LEDGER_COMPILED.md`
5. `project.manifest.json`
6. `PROJECT_STATE.md`

**2. Couche normative** 7. `compiled_decisions/00_INDEX.md` puis l'ordre qu'il donne 8. `compiled_decisions/runbooks/RUN-42_GATE_MAP.md` (gates et matrice d'autonomie)

**3. Couche de cadrage** — dans l'ordre historique ci-dessous, **en appliquant le statut de `DEPRECATION_MAP`** :
`docs/01` → `docs/27`, puis `docs/00_PREVIOUS_BLUEPRINT.md` (le plus riche en schémas encore à promouvoir).

**4. Prompts**
`prompts/00_MASTER_PROMPT.md`, puis `prompts/02_BOOTSTRAP_FOUNDATION.md` → `prompts/11_NEW_MODULE.md`.
(`prompts/01_TO_10_EXECUTION_PROMPTS.md` est archivé et ne fait plus foi — ADR-0010.)

## Première consigne

**Ne code rien avant d'avoir lu le Decision Ledger, vérifié les contraintes et confirmé la gate courante.**

Le G0 est passé : l'audit est fait, 14 décisions sont tranchées. La gate courante et l'action suivante sont dans `PROJECT_STATE.md`. Les gestes concrets côté fondateur sont dans `docs/SETUP_FONDATEUR.md`.

## Références externes

Toute licence, tout quota et toute date cités dans `docs/` sont **non vérifiés** (42 marqueurs de citation non résolubles remplacés le 2026-09-08). Re-vérification obligatoire à la source primaire avant ingestion d'une source et avant tout texte affiché à l'utilisateur. Aucune revendication de conformité RGPD ou AI Act ne peut être faite à partir de ce kit.

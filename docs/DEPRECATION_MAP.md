# CARTE D'AUTORITÉ DES DOCUMENTS `docs/`

Établie à l'étape 0 (2026-09-08), après le G0. Supprime l'ambiguïté entre la couche de cadrage `docs/` (2026-09-05) et la couche compilée `compiled_decisions/` (2026-09-08).

## Ordre d'autorité

1. `docs/ADR/` — **Decision Ledger. Autorité maximale.**
2. `compiled_decisions/` — couche normative.
3. `docs/` — selon le statut ci-dessous.
4. Implémentation existante.
5. Préférence d'ingénierie.

En cas de conflit non résolu par cette carte : **STOP et DECISION REQUIRED**.

## Statuts

- **NORMATIF** — fait foi, aucun équivalent compilé plus précis.
- **À PROMOUVOIR** — contient des schémas exécutables absents de la couche compilée ; ils doivent être remontés (voir la colonne « cible »).
- **CHECKLIST** — contenu utilisable, mais ne fait pas autorité sur la structure ni sur la numérotation.
- **HISTORIQUE** — remplacé ; conservé comme trace.

| Document | Statut | Remarque / cible |
|---|---|---|
| `00_PREVIOUS_BLUEPRINT.md` | **À PROMOUVOIR** | Source Registry (26 champs), modèle de connaissance (18 champs), Consumer Protection Graph, Evidence Vault, Privacy Firewall, identifiants pivots, KPI. → `governance/source_registry.yaml`, `PRD-38`, `PRD-39`, `DAT-44`, `RUN-45` |
| `01_PRODUCT_OS.md` | HISTORIQUE | Remplacé par `product/01_PRODUCT_CONTRACT` et `product/02_MVP_P0`. Sa liste P0 (avec Mnémosyne) est abrogée par ADR-0004 |
| `02_DECISIONS_LOCKED.md` | CHECKLIST | Décisions fondateur toujours valables, **sauf** la clause « monorepo si justifié », abrogée par ADR-0002 |
| `03_UX_SPEC.md` | CHECKLIST | Remplacé sur la structure par `product/14_UX_JOURNEY_BIBLE` |
| `04_DESIGN_SYSTEM.md` | CHECKLIST | Direction artistique normative ; **les valeurs de couleur font foi dans `product/16_DESIGN_TOKENS.json`** (ADR/D9) |
| `05_ARCHITECTURE_CORE.md` | CHECKLIST | Enveloppe d'événement **abrogée** par ADR-0006. Restent utiles : interface `Connector`, frontières de sécurité client/serveur |
| `06_MODULE_SYSTEM.md` | CHECKLIST | Remplacé sur la structure par `architecture/03` et `architecture/19_MODULE_MANIFEST_SCHEMA.json` |
| `07_DATA_MODEL.md` | HISTORIQUE | Convention de nommage **abrogée** par ADR-0005. À promouvoir malgré tout : règles sur les secrets OAuth et sur l'evidence |
| `08_KNOWLEDGE_ENGINE.md` | **À PROMOUVOIR** | Pipeline de réutilisation avant IA, métriques de qualité, règles d'auto-incrémentation. → `RUN-45` |
| `09_MUSES_GOVERNANCE.md` | NORMATIF | Base de la spécification anti-abus `AI-37` (seuils à chiffrer, OPEN-04) |
| `10_CONSUMER_PROTECTION.md` | NORMATIF | Base de `PRD-38` et `PRD-39`. Niveaux d'action 0–5 applicables |
| `11_OPEN_DATA_REGISTRY.md` | **À PROMOUVOIR** | Champs obligatoires du registre et règle `default deny`. **Toutes les licences citées sont à revérifier** |
| `12_SECURITY_THREAT_MODEL.md` | NORMATIF | Adversaires et contrôles critiques. Les références externes sont à revérifier |
| `13_PRIVACY_GDPR.md` | NORMATIF | — |
| `14_AI_POLICY.md` | NORMATIF | Renforcé par ADR-0012 (`email` en `AI_FORBIDDEN`) |
| `15_GOOGLE_INTEGRATIONS.md` | NORMATIF | Applicable à G6. Quotas et contraintes cités à revérifier avant usage |
| `16_CASE_ACTION_ENGINE.md` | NORMATIF | Cohérent avec `product/12`. `ActionProposal` reste la forme de référence |
| `17_COST_OBSERVABILITY.md` | NORMATIF | — |
| `18_TESTING_SECURITY.md` | NORMATIF | Base de la suite de sécurité |
| `19_RELEASE_RUNBOOK.md` | NORMATIF | — |
| `20_CLAUDE_ENGINEERING_RULES.md` | NORMATIF | Redondant avec `claude_governance/14` ; les deux sont compatibles |
| `21_CLAUDE_EVOLUTION_PROTOCOL.md` | NORMATIF | — |
| `22_MODULE_TEMPLATE.md` | CHECKLIST | **Divergent** de `architecture/19_MODULE_MANIFEST_SCHEMA.json` : `safety_level` vs `risk_level`, `owned_tables` vs `data_access`, absence d'`ai_policy`. **Le schéma JSON fait foi** ; le template YAML doit être réaligné |
| `23_FOUNDER_RUNBOOK.md` | CHECKLIST | Numérotation de gates **abrogée** par ADR-0001. Contenu des phases toujours utile |
| `24_GATES_CHECKLIST.md` | CHECKLIST | Numérotation de gates **abrogée** par ADR-0001. Contenu des points de contrôle toujours utile |
| `25_SOURCE_RESEARCH_NOTES.md` | HISTORIQUE | Point de départ de recherche. Aucune source ne peut être ingérée sur la seule foi de ce document |
| `26_PRODUCT_REVIEW_CTO.md` | HISTORIQUE | Points de vigilance produit, toujours pertinents |
| `27_LEGAL_DATA_AI_CHECKPOINTS.md` | NORMATIF | Checkpoints avant pilote public. Dates et obligations citées à revérifier |

## Note sur les références externes

42 marqueurs de citation non résolubles ont été remplacés par `[réf. non résolue — à revérifier]` dans 12 fichiers (D14). Toute licence, tout quota et toute date cités dans `docs/` sont donc **non vérifiés** : re-vérification obligatoire à la source primaire avant ingestion d'une source et avant tout texte affiché à l'utilisateur.

Aucune revendication de conformité RGPD ou AI Act ne peut être faite à partir de ce kit.

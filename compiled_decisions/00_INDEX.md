# OLAPPUS — Compilation intégrale des décisions

Version 1.1 — mise à jour 2026-09-08 (étape 0, post-G0)

Ce dossier transforme les décisions prises pendant le cadrage en un **contrat opérationnel** pour le produit, l'architecture et Claude Code.

## Statut et autorité

1. `docs/ADR/` — Decision Ledger, **autorité maximale**.
2. **Ce dossier** — couche normative.
3. `docs/` — selon `docs/DEPRECATION_MAP.md`.

- Une décision verrouillée ne se modifie qu'au travers d'un ADR qui la remplace explicitement.
- **Une absence d'instruction n'est jamais une autorisation implicite.**
- Les zones volontairement non définies sont listées dans `00_OPEN_ITEMS.md` et ne se comblent pas par initiative.

## Codes de domaine

Les numéros seuls sont ambigus : neuf d'entre eux existent en double entre sous-dossiers. **Citer un document par son code de domaine**, jamais par son numéro nu.

| Préfixe | Domaine                    | Dossier                |
| ------- | -------------------------- | ---------------------- |
| `PRD`   | Produit                    | `product/`             |
| `ARC`   | Architecture               | `architecture/`        |
| `DAT`   | Données et confidentialité | `data_privacy/`        |
| `SEC`   | Sécurité et résilience     | `security_resilience/` |
| `AI`    | Muses et IA                | `muses_ai/`            |
| `RUN`   | Runbooks et gates          | `runbooks/`            |
| `GOV`   | Gouvernance Claude         | `claude_governance/`   |

Exemple : `SEC-08` = `security_resilience/08_SECURITY_AUTH_SECRETS.md`, à ne pas confondre avec `DAT-08` = `data_privacy/08_CANONICAL_DATA_MODEL.md`.

## Ordre de lecture

**Socle produit et architecture**

1. `PRD-01` product/01_PRODUCT_CONTRACT.md
2. `PRD-02` product/02_MVP_P0.md
3. `ARC-03` architecture/03_CORE_MODULE_ARCHITECTURE.md
4. `ARC-04` architecture/04_CONTRACTS_AND_EVENTS.md
5. `ARC-17` architecture/17_CQE_CONTRACTS.md — _voir ADR-0006 pour l'enveloppe retenue_
6. `ARC-18` architecture/18_COMMAND_SCHEMA_EXAMPLE.json
7. `ARC-19` architecture/19_MODULE_MANIFEST_SCHEMA.json — **fait foi** sur les manifestes
8. `ARC-20` architecture/20_MODULE_EXAMPLE_HERMES.md
9. `ARC-21` architecture/21_OFFLINE_SYNC_SPEC.md
10. `ARC-22` architecture/22_AI_GATEWAY_SPEC.md

**Données et confidentialité** 11. `DAT-05` data_privacy/05_DATA_MODEL_AND_NORMALIZATION.md 12. `DAT-06` data_privacy/06_DATA_GOVERNANCE_REGISTRY.md 13. `DAT-07` data_privacy/07_PRIVACY_ANONYMIZATION_RETENTION.md 14. `DAT-08` data_privacy/08_CANONICAL_DATA_MODEL.md — _schémas fixés par ADR-0005_ 15. `DAT-09` data_privacy/09_DATA_CLASSIFICATION_MATRIX.csv + `_NOTES.md` 16. `DAT-10` data_privacy/10_NORMALIZATION_SPEC.md 17. `DAT-11` data_privacy/11_EXPORT_PORTABILITY_SPEC.md

**Sécurité et résilience** 18. `SEC-08` security_resilience/08_SECURITY_AUTH_SECRETS.md — _modèle de clés fixé par ADR-0008_ 19. `SEC-09` security_resilience/09_OFFLINE_SYNC_RESILIENCE.md 20. `SEC-23` security_resilience/23_SECURITY_CONTROL_MATRIX.md — **18 contrôles** 21. `SEC-28` security_resilience/28_INCIDENT_RESPONSE.md 22. `SEC-29` security_resilience/29_LEGAL_RISK_CHECKPOINTS.md

**Muses et IA** 23. `AI-10` muses_ai/10_MUSES_KNOWLEDGE_GOVERNANCE.md 24. `AI-11` muses_ai/11_AI_GATEWAY_POLICY.md — _renforcé par ADR-0012_

**Produit détaillé** 25. `PRD-12` product/12_HELIOS_CASE_PRIORITY_UX.md 26. `PRD-13` product/13_ANALYTICS_MONETIZATION.md 27. `PRD-14` product/14_UX_JOURNEY_BIBLE.md 28. `PRD-15` product/15_UI_COMPONENT_SPEC.md 29. `PRD-16` product/16_DESIGN_TOKENS.json — **fait foi** sur les couleurs 30. `PRD-17` product/17_PRODUCT_STRATEGY_PRELAUNCH.md

**Gouvernance Claude** 31. `GOV-14` claude_governance/14_CLAUDE_ENGINEERING_CONTRACT.md 32. `GOV-15` claude_governance/15_CLAUDE_STOP_PROTOCOL.md 33. `GOV-16` claude_governance/16_EVOLUTION_GIT_RELEASES.md

**Runbooks et gates** 34. `RUN-42` runbooks/RUN-42_GATE_MAP.md — **seule numérotation de gates valable (G0–G9)** 35. `RUN-17` runbooks/17_FOUNDER_GATES.md — gates thématiques et matrice d'autonomie 36. `RUN-18` runbooks/18_P0_BUILD_ORDER.md 37. `RUN-24` runbooks/24_P0_ACCEPTANCE_TESTS.md — 40 tests 38. `RUN-25` runbooks/25_SYNTHETIC_DATA_STRATEGY.md 39. `RUN-26` runbooks/26_FOUNDER_CLAUDE_RUNBOOK.md 40. `RUN-27` runbooks/27_RELEASE_GATE_CHECKLIST.md 41. `RUN-30` runbooks/30_DEFINITION_OF_DONE.md

**Cadre de gel** 42. `00_PRE_CLAUDE_FREEZE.md` 43. `00_OPEN_ITEMS.md`

## Invariant absolu

```
SOURCE → QUARANTINE → EXTRACTION → NORMALIZATION → MINIMIZATION
       → PSEUDONYMIZATION/ANONYMIZATION → DOMAIN DATA
```

L'IA intervient seulement après minimisation et n'est jamais la source de vérité.

**Deux invariants ajoutés le 2026-09-08** (voir `SEC-23`) :

- aucun paramètre d'action externe ne provient de contenu non fiable ;
- aucune identité de tiers n'est conservée durablement hors entité canonique résolue.

## Spécifications manquantes

Les documents suivants sont **exigés par la matrice de contrôle ou par le plan de concrétisation, et n'existent pas encore**. Ils ne doivent pas être improvisés au moment de coder :

| Code                              | Objet                                                     | Gate  |
| --------------------------------- | --------------------------------------------------------- | ----- |
| `SEC-31`                          | Gestion des clés et chiffrement L3                        | G2    |
| `SEC-32`                          | Safe Mode                                                 | G3    |
| `SEC-33`                          | Inventaire de suppression et vérification                 | G2    |
| `SEC-34`                          | Journalisation et rédaction                               | G1    |
| `SEC-35`                          | Cycle de vie appareil et session                          | G2    |
| `AI-36`                           | Contrat de contenu non fiable                             | G4    |
| `AI-37`                           | Seuils anti-abus Muses                                    | G5    |
| `PRD-38`                          | Consumer Rights Engine                                    | G5/G7 |
| `PRD-39`                          | Evidence Vault                                            | G7    |
| `PRD-40`                          | Scénarios Demo Mode                                       | G4    |
| `ARC-41`                          | Résolution des capacités                                  | G3    |
| `ARC-42`                          | Idempotence et outbox                                     | G8    |
| `DAT-43`                          | Données de tiers                                          | G2    |
| `DAT-44`                          | Identifiants canoniques                                   | G5    |
| `RUN-45`                          | Spécification des métriques                               | G4    |
| `governance/data_registry.yaml`   | Data Registry machine-lisible — **chemin critique de G2** | G2    |
| `governance/source_registry.yaml` | Source Registry et License Gate                           | G5    |

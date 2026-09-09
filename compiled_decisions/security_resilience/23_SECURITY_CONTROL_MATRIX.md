# 23 — Security Control Matrix

Mise à jour : 2026-09-08 (étape 0). Deux contrôles ajoutés, colonne « Spec » ajoutée.

**Règle** : un contrôle n'est vert que si sa preuve existe. Un contrôle dont la spécification manque ne peut pas être implémenté et ne doit pas être déclaré vert.

| Control                                                    | Required | Evidence                                 | Spec                                                                           | Gate        |
| ---------------------------------------------------------- | -------- | ---------------------------------------- | ------------------------------------------------------------------------------ | ----------- |
| RLS on exposed tables                                      | Yes      | automated test                           | ADR-0005, ADR-0009                                                             | G2          |
| No production secrets in repo                              | Yes      | secret scan                              | `SEC-34` ✅                                                                    | G1          |
| Dependency audit                                           | Yes      | CI                                       | —                                                                              | G1          |
| Least privilege                                            | Yes      | manifest + RLS tests                     | ADR-0005 (grants par schéma)                                                   | G2          |
| Device revocation                                          | Yes      | integration test                         | `SEC-35` ✅                                                                    | G2          |
| Permission revocation                                      | Yes      | integration test                         | —                                                                              | G2          |
| Command idempotence                                        | Yes      | contract test                            | `ARC-42` ✅                                                                    | G3          |
| Sensitive fields encrypted                                 | Yes      | architecture/test evidence               | `SEC-31` ✅ **implémenté** — ADR-0008, ADR-0017 ; contrainte en base, 45 tests | G2          |
| Audit for external actions                                 | Yes      | audit test                               | ADR-0006 (`actor_id`)                                                          | G3          |
| Safe Mode                                                  | Yes      | integration test                         | `SEC-32` ✅                                                                    | G3          |
| Backup restore test                                        | Yes      | runbook evidence                         | **runbook à écrire** (OPEN-06)                                                 | G9          |
| Deletion verification                                      | Yes      | test/audit evidence                      | `SEC-33` ✅ (inventaire des copies)                                            | G2          |
| Privacy leakage test                                       | Yes      | adversarial fixtures                     | fixtures à produire                                                            | G4          |
| AI data policy enforcement                                 | Yes      | gateway tests                            | ADR-0012, `AI-36` à écrire                                                     | G4          |
| No direct module access                                    | Yes      | architecture lint                        | ADR-0002 (frontières de paquets)                                               | G3          |
| No unsafe migrations                                       | Yes      | migration lint/review                    | ADR-0005                                                                       | G2          |
| **Untrusted content cannot parameterize external actions** | **Yes**  | **adversarial fixtures + contract test** | **`AI-36` à écrire**                                                           | **G4 / G7** |
| **No durable third-party identity**                        | **Yes**  | **privacy test + registry check**        | `DAT-43` ✅                                                                    | **G2**      |

## Les deux contrôles ajoutés

### Untrusted content cannot parameterize external actions

Un destinataire, une adresse, un IBAN, une URL ou une référence de dossier issus de contenu non fiable — email, document, pièce jointe, nom de fichier, résultat de recherche, contribution Muses — **ne peuvent jamais devenir le paramètre d'une action externe**. Ces valeurs proviennent exclusivement du référentiel canonique (marchand résolu via un référentiel officiel, coordonnées issues d'une source enregistrée) ou d'une saisie explicite de l'utilisateur.

Ce contrôle tient **même lorsque l'IA est désactivée** : l'extraction déterministe est vulnérable au même détournement. C'est une propriété de la chaîne d'action, pas du AI Gateway.

_Preuve attendue_ : une fixture adverse contenant une adresse de contact injectée ne doit produire aucune action préparée pointant vers cette adresse.

### No durable third-party identity

Hors entité canonique de type marchand ou organisation résolue via un référentiel officiel, aucune identité de tiers n'est conservée durablement. Les expéditeurs non résolus sont réduits à un pseudonyme stable local et à un domaine. Les tiers ne sont ni destinataires de l'export utilisateur, ni sujets d'une connaissance collective.

_Preuve attendue_ : après ingestion d'un lot d'emails synthétiques comportant des expéditeurs particuliers, aucune table durable ne contient leur identité.

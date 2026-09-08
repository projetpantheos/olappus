# Notes sur la matrice de classification

Mise à jour : 2026-09-08 (étape 0).

## Statut

Cette matrice est un **extrait**, pas le Data Registry. Le registre complet (`governance/data_registry.yaml`, une entrée par champ des ~40 entités canoniques) reste à écrire et conditionne G2 : c'est lui qui doit générer les politiques RLS, les jobs de rétention, le paquet d'export, le plan de suppression et les contrôles du AI Gateway.

## Modifications appliquées

| Champ                  | Avant                                 | Après                                                  | Origine                                     |
| ---------------------- | ------------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `email`                | L3, `AI_MINIMIZED_ONLY`               | L3, **`AI_FORBIDDEN`**                                 | ADR-0012                                    |
| `email_domain`         | absent                                | L2, `AI_MINIMIZED_ONLY`                                | ADR-0012                                    |
| `sender_pseudonym_id`  | absent                                | L2, `AI_MINIMIZED_ONLY`, provenance `derived`          | ADR-0012                                    |
| `document_raw`         | classification `RAW` (hors taxonomie) | **`L0_RAW_QUARANTINE`**                                | D8                                          |
| `email_body_raw`       | absent                                | `L0_RAW_QUARANTINE`                                    | D8                                          |
| `device_id`            | absent                                | L1, `AI_FORBIDDEN`                                     | modèle canonique                            |
| `oauth_refresh_token`  | absent                                | L4, `server_only`, **non exportable**                  | `docs/07`, `docs/15`                        |
| `deadline_date`        | absent                                | L2                                                     | ADR-0003                                    |
| `legal_rule_ref`       | absent                                | `PUBLIC` (connaissance collective, non personnelle)    | ADR-0003                                    |
| `third_party_identity` | absent                                | L3, `allowed_modules: none`, `retention: not_retained` | invariant `no_durable_third_party_identity` |

## Taxonomie des classifications

- **`L0_RAW_QUARANTINE`** — données brutes en quarantaine. Jamais exposées à une IA, jamais durables par défaut, rétention exprimée en jours.
- **L1 Preferences** — identifiants techniques et préférences.
- **L2 Business** — données métier normalisées.
- **L3 Sensitive** — données identifiantes ou sensibles.
- **L4 Secrets** — secrets et données financières directes. Jamais exportables en clair.
- **`PUBLIC`** — connaissance collective sans donnée personnelle (règles, sources, faits certifiés).

## Points à trancher lors de l'écriture du Data Registry

- `retention: days_to_define` pour les deux champs `L0_RAW_QUARANTINE` : une durée chiffrée est obligatoire, la mention « short » n'est pas testable.
- `retention: necessary` doit être remplacé partout par une durée ou une condition d'expiration explicite.
- La colonne `allowed_modules` doit être alignée sur les identifiants réels des manifestes de modules. Les mentions `Demeter` et `Amalthee` de la version précédente ont été retirées : ces modules n'existent dans aucune liste P0 ni post-P0 de la couche normative.
- `third_party_identity` est un champ de contrôle, pas un champ de stockage : il matérialise l'interdiction. Le registre doit préciser comment la règle est vérifiée en test.

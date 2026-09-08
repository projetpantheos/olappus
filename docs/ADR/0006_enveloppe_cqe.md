# ADR-0006 — Enveloppe Command/Event canonique

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D5
- **Approuvé par** : Fondateur
- **Réversible** : **non** sans migration de contrat

## Context

Deux enveloppes concurrentes coexistaient :

- `docs/05_ARCHITECTURE_CORE` : `{ id, type, version, occurredAt, actor, tenantId, correlationId, payload }` — camelCase, `tenantId`, `actor`, sans causation ;
- `compiled_decisions/architecture/17_CQE_CONTRACTS` : `{ event_id, aggregate_id, event_type, occurred_at, schema_version, causation_id, correlation_id, payload }` — snake_case, sans acteur.

Les Events étant déclarés immuables et versionnés, une erreur d'enveloppe coûte une migration de contrat sur l'ensemble du Core.

## Decision

Base `17_CQE_CONTRACTS`, enrichie d'`actor_id`, sans `tenantId`.

**Event**

```
event_id
aggregate_id
event_type
occurred_at
schema_version
causation_id
correlation_id
actor_id
payload
```

**Command**

```
command_id
actor_id
device_id
correlation_id
created_at
schema_version
payload
```

Règles :

- chaque contrat existe en **type TypeScript** et en **schéma de validation runtime** (Zod ou équivalent) ;
- les Events ne sont jamais modifiés en place ; une correction crée un nouvel Event ;
- toute Command à effet de bord est idempotente par `command_id` ;
- versionnage `ADD → MIGRATE → VERIFY → SWITCH → REMOVE`, retrait de v1 seulement après usage nul et plan de rollback disponible.

`docs/05_ARCHITECTURE_CORE` est rétrogradé en document historique pour la partie enveloppe.

## Rationale

Conserve la traçabilité causale (`causation_id`), aligne Commands et Events sur une convention unique, rend l'acteur lisible directement sur l'Event pour l'audit, et n'anticipe pas un multi-tenant qui n'est pas au programme produit.

## Alternatives

- **CQE strict sans `actor_id`** — rejetée : impose une jointure sur la Command d'origine pour toute lecture d'audit.
- **Enveloppe `docs/05`** — rejetée : perd `causation_id` et diverge du reste de la couche compilée.

## Consequences

**Irréversible sans migration de contrat** touchant le Core, tous les modules, l'audit et les projections. Le passage éventuel au multi-tenant exigera une v2 d'enveloppe et un ADR de remplacement.

## Affected systems

Core, module SDK, tous les modules, audit, projections, outbox.

## Security

Positif : `actor_id` et `device_id` présents nativement dans la chaîne d'audit.

## Privacy

Neutre. Le `payload` reste soumis au Data Registry ; aucune donnée sensible ne transite par l'enveloppe.

## Tests

- Test de contrat sur chaque Command et chaque Event.
- Test d'idempotence par rejeu de `command_id`.
- Test de non-modification d'un Event en place.

## Rollback

Migration de contrat complète, planifiée et versionnée. Pas de rollback simple.

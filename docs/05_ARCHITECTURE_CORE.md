# ARCHITECTURE CORE

<!-- AUTHORITY-BANNER -->
> **Statut : CHECKLIST** — l'enveloppe `DomainEvent` de ce document est **abrogée par ADR-0006** (enveloppe CQE snake_case + `actor_id`, sans `tenantId`). Restent utiles : l'interface `Connector` et les frontières de sécurité client/serveur. Voir `docs/DEPRECATION_MAP.md`.


## Architecture cible
```text
Mobile/Web
   ↓
Application API / Edge Functions
   ↓
Core
 ├─ Identity & Permissions
 ├─ Event Bus
 ├─ Connector Registry
 ├─ Knowledge Engine
 ├─ Rule Engine
 ├─ Priority/Risk Engine
 ├─ Case Engine
 ├─ Action Engine
 ├─ Notification Policy
 └─ Audit
   ↓
Postgres / Storage
```

## Principe
Le Core ne connaît pas les détails métier de chaque brique. Les modules connaissent les contrats Core, pas l'inverse.

## Event envelope
Chaque événement interne suit un contrat :
```ts
interface DomainEvent<T = unknown> {
  id: string;
  type: string;
  version: number;
  occurredAt: string;
  actor: 'user' | 'system' | 'connector' | 'validator';
  tenantId: string;
  correlationId: string;
  payload: T;
}
```

## Reliability
- idempotence obligatoire ;
- retries bornés ;
- dead-letter logique si nécessaire ;
- corrélation ;
- absence de doublons ;
- reprise après interruption ;
- timeouts.

## Connector abstraction
```ts
interface Connector {
  id: string;
  capabilities(): ConnectorCapability[];
  connect(input: ConnectInput): Promise<ConnectResult>;
  sync(cursor?: string): Promise<SyncResult>;
  disconnect(): Promise<void>;
  health(): Promise<ConnectorHealth>;
  purge(): Promise<PurgeResult>;
}
```

## Security boundaries
Le client mobile utilise une clé publique/publishable uniquement pour les opérations qui peuvent être autorisées par RLS. Les secrets et opérations admin restent côté serveur.

RLS doit être activé et testé pour toutes les tables exposées. Supabase confirme que sans RLS dans un schéma exposé les données peuvent être accessibles aux rôles autorisés, et que les clés secrètes contournent RLS. [réf. non résolue — à revérifier]

## Web future
Le métier ne doit pas vivre dans les composants React Native. Les contrats API et services métier doivent être consommables par un futur client Web.

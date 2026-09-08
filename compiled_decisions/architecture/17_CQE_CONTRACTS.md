# 17 — CQE Contracts

## Envelope
All Commands:
- command_id
- actor_id
- device_id
- correlation_id
- created_at
- schema_version
- payload

All Events:
- event_id
- aggregate_id
- event_type
- occurred_at
- schema_version
- causation_id
- correlation_id
- payload

## Commands
CreateCaseCommandV1
PrepareActionCommandV1
ConfirmActionCommandV1
DismissCaseCommandV1
SnoozeCaseCommandV1
ResolveCaseCommandV1
UpdatePermissionCommandV1
DisconnectConnectorCommandV1
DeleteDataCommandV1

## Query rules
Queries are read-only and side-effect free.

## Idempotence
All side-effecting commands are idempotent by `command_id`.

## Authorization
Core validates:
- actor;
- device;
- capability;
- permission;
- resource scope;
- conditions;
- current state;
- risk.

## Event immutability
Events are never edited in place.
Corrections use new events.

## Versioning
Breaking change:
v1 retained during migration.
v2 introduced.
Verification.
Migration.
v1 retirement only after usage is zero and rollback plan is available.

## Runtime schemas
Contracts must exist both as TypeScript types and runtime validation schemas (e.g. Zod or equivalent).

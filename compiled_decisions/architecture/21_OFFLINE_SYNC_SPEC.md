# 21 — Offline Sync Specification

## P0 target

Pragmatic local-first:

- local read;
- selected local writes;
- outbox;
- online reconciliation.

## Local database

SQLite.
Sensitive local objects are encrypted where required by classification.

## Outbox item

- outbox_id
- command_id
- object_type
- payload
- created_at
- retry_count
- status
- last_error_code

## Sync loop

LOCAL COMMAND
→ local validation
→ local transaction
→ outbox
→ server validation
→ server state change
→ event/ack
→ sync mark
→ projection refresh

## Conflict policies

Preferences: latest accepted write when low risk.
Critical Cases: explicit conflict.
Permissions: revocation wins.
External Actions: server authority; no silent execution.
Knowledge: versioned governance.

## Offline restrictions

If the action cannot be safely executed offline, the UI must say so.
A prepared external action can remain PREPARED without EXECUTING.

## Multi-device

Device identity is explicit.
Revocation invalidates future server synchronization for that device.
Local data deletion remains a separate security operation.

## Deleted data

Deletion tombstones/markers are retained only as long as necessary to prevent resurrection during synchronization.

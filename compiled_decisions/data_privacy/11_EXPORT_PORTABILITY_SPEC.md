# 11 — Export / Portability

## Goal
User can obtain a complete, structured representation of their durable data.

## Package
manifest.json
identity.json (only necessary user identity metadata)
cases.json
actions.json
subscriptions.json
documents/
evidence.json
preferences.json
provenance.json
knowledge_user_state.json where applicable
audit_summary.json where legally/operationally appropriate

## Formats
JSON canonical data.
CSV for tabular entities.
Original user documents when retained and exportable.

## Integrity
Include:
- schema_version;
- generated_at;
- checksums;
- data categories;
- source/provenance mapping.

## Do not export secrets
Credentials, server secrets or internal encryption material are never part of user data export.

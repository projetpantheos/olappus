# CLAUDE EVOLUTION PROTOCOL

## Goal

Ajouter des fonctionnalités sans fragiliser le Core.

## Before adding a module

1. classify feature/domain;
2. identify reusable Core capabilities;
3. check existing module contracts;
4. define events and permissions;
5. define data ownership;
6. define knowledge inputs;
7. define source/licenses;
8. define safety level;
9. define tests and feature flag.

## Evolution rule

Prefer extension points over edits to Core. If Core must change, propose a versioned contract first.

## Compatibility

Future modules must be independently testable, disable-able and removable.

## Migration rule

Schema migrations must be additive first when possible. Destructive change requires explicit migration plan and backup verification.

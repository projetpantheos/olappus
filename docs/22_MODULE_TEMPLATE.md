# MODULE CONTRACT TEMPLATE

<!-- AUTHORITY-BANNER -->

> **Statut : CHECKLIST** — ce gabarit diverge de `compiled_decisions/architecture/19_MODULE_MANIFEST_SCHEMA.json` (`safety_level` vs `risk_level`, `owned_tables` vs `data_access`, absence d'`ai_policy`). **Le schéma JSON fait foi** ; ce gabarit doit être réaligné. Voir `docs/DEPRECATION_MAP.md`.

```yaml
module:
  id: example
  name: Example
  version: 1.0.0
  theme: protection

purpose: ...

permissions: []
connectors: []
consumes_events: []
emits_events: []
commands: []
actions: []

owned_tables: []
knowledge_inputs: []
knowledge_outputs: []
source_registry_refs: []

safety_level: 1
retention_policy: ...

ui:
  routes: []
  entrypoints: []

tests:
  unit: []
  integration: []
  security: []
  e2e: []

kill_switch: true
feature_flag: ...
```

## Definition of Done

- contract reviewed ;
- data/license reviewed ;
- migrations tested ;
- RLS tests ;
- security gate ;
- UX states ;
- cost budget ;
- documentation.

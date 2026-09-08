# 24 — P0 Acceptance Tests

## Product
1. New user can enter Demo Mode without external permissions.
2. First meaningful insight appears rapidly and is understandable.
3. Hélios shows only high-value attention items.
4. No-problem state does not manufacture notifications.
5. Every important Case explains WHY and PROOF.
6. Low-confidence detections are not overstated.

## Privacy
7. Raw connector payload never bypasses quarantine.
8. Domain tables contain normalized values only.
9. Identity fields are absent from modules that do not need them.
10. External AI receives only minimized allowed fields.
11. Deletion removes copies/caches according to policy.
12. Disconnect flow is explicit about retained data.

## Security
13. RLS blocks unauthorized access.
14. Revoked device cannot synchronize.
15. Revoked permission blocks action.
16. Side-effecting command replay is idempotent.
17. Safe Mode prevents external execution.
18. No critical secret exists in client bundle.

## Data
19. Money has canonical representation.
20. Dates/timezones are canonical.
21. Merchant duplicates do not create uncontrolled duplicates.
22. Provenance is present for durable derived facts.

## Muses
23. AI proposal cannot become published knowledge without governance.
24. Critical rule requires quorum.
25. Contradictory knowledge creates a conflict object.
26. Temporal validity affects applicable rule selection.
27. Published rule can be suspended via controlled workflow.

## Offline
28. Read works offline for cached permitted data.
29. Allowed local write reaches server via outbox.
30. Conflict does not silently overwrite critical state.
31. Deleted data does not resurrect during sync.

## UX
32. Every screen defines loading/empty/error/offline states.
33. Action sheet states recipient, data, impact and permission.
34. Accessibility labels exist for interactive controls.
35. Colors are not the sole carrier of state.

## Release
36. typecheck/lint/tests/build pass.
37. security/privacy suites pass.
38. rollback plan exists.
39. PROJECT_STATE is updated.
40. No open RED decision remains.

## P0 PASS CONDITION
All mandatory tests pass and no unresolved RED issue exists.

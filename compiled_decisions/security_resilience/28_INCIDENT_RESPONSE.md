# 28 — Incident Response

## Severity
SEV-1 critical safety/privacy/security
SEV-2 important degradation
SEV-3 limited defect
SEV-4 cosmetic

## First response
1. contain;
2. stop risky external actions;
3. activate Safe Mode if needed;
4. preserve minimal forensic evidence;
5. revoke affected credentials/sessions;
6. identify scope;
7. patch;
8. verify;
9. communicate according to legal/incident procedure.

## Privacy incident
Assess:
- data classes;
- users;
- source;
- exposure duration;
- re-identification risk;
- third-party exposure.

Do not add unnecessary personal detail to incident logs.

## Postmortem
- root cause;
- why controls failed;
- corrective action;
- regression test;
- documentation update;
- decision/ADR update if needed.

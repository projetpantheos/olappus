# 12 — Hélios / Case / Priority

## Case = primitive universelle
CASE
├── DETECTION
├── EVIDENCE
├── RECOMMENDATION
├── ACTION
└── OUTCOME

## États
DETECTED → TRIAGED → EVIDENCE_READY → ACTION_PROPOSED → WAITING_CONFIRMATION → EXECUTING → WAITING_EXTERNAL → RESOLVED / DISMISSED / EXPIRED

## Case
case_id
user_id
module_id
type
status
priority
confidence
created_at
updated_at
resolved_at

## Detection
detection_id
case_id
rule_id/version
confidence
detected_at

## Action
action_id
case_id
type
risk_level
status
permission_level
prepared_payload
executed_at

## Outcome
outcome_id
action_id
result
observed_at

## Hélios
Hélios projette les Cases en items d'attention.
Il ne remplace pas le moteur métier.

## Attention Avoided
Conserver une mesure opérationnelle de la charge d'attention évitée.
Ne jamais gonfler artificiellement Hélios.

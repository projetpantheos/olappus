# Module Example — Hermès

## Responsibility
Ingest and classify user-authorized email-derived information.

## Does not own
- global identity;
- Cases source of truth;
- permissions;
- Muses certification;
- billing.

## Pipeline
Gmail connector
→ quarantine
→ extraction
→ normalization
→ minimization
→ canonical domain
→ Core event/case creation.

## Minimum data
Only fields required by the active capability are retained.

## Forbidden by default
- unrelated personal email content;
- complete mailbox retention;
- passwords;
- bank secrets;
- raw content sent to external AI.

## Example permissions
email.read.minimal
document.extract
case.create

## AI
AI_MINIMIZED_ONLY.

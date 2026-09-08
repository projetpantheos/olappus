# 22 — AI Gateway Specification

## Goal

Centralize model usage, privacy filtering, cost control and observability.

## API concept

request(task, sanitized_input, constraints, output_schema)

## Tasks

EXTRACT
CLASSIFY
SUMMARIZE
DRAFT
COMPARE
ASSIST_REASONING

## Routing

1. deterministic logic;
2. rules;
3. trusted knowledge;
4. AI only if remaining ambiguity/complexity justifies it.

## Data policies

AI_ALLOWED
AI_MINIMIZED_ONLY
AI_LOCAL_ONLY
AI_FORBIDDEN

## Output

AI never writes directly to:

- certified knowledge;
- published rules;
- critical permissions;
- auto-execution state.

It may produce:
AI_OUTPUT / AI_PROPOSAL.

## Cost controls

Track:

- task;
- model tier;
- tokens/units;
- latency;
- outcome quality signal;
- estimated cost.

Never expose provider-specific assumptions to modules.

## Privacy

Minimize BEFORE AI.
Do not use prompts as a permanent data store.
No raw user document by default.

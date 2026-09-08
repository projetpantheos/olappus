# 25 — Synthetic Data Strategy

## Default

All development and agent work uses synthetic data.

## Fixture categories

- user
- account
- device
- email
- invoice
- subscription
- merchant
- contract
- document
- case
- action
- evidence
- knowledge
- connector payload
- adversarial

## Adversarial cases

- malformed OCR;
- ambiguous dates;
- currencies;
- duplicate merchant;
- duplicate product;
- contradictory official sources;
- expired rule;
- jurisdiction mismatch;
- low-confidence extraction;
- prompt injection in email/document;
- poisoned community contribution;
- collusion attempt;
- sensitive data that should be filtered from AI;
- deleted data trying to reappear via sync.

## Never

Do not invent realistic third-party secrets, payment credentials or credentials that could be mistaken for live access.

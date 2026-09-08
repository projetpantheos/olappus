# 10 — Normalization Specification

## Money
Persist:
- amount_minor: integer
- currency: ISO-like canonical code
- amount_scale: optional metadata

Do not persist display strings such as "12,99 €" as the canonical amount.

## Date/time
Persist ISO-8601 timestamp with explicit timezone when time matters.
For calendar/business dates without a meaningful time, persist local_date + timezone/context if necessary.

## Units
Convert to a canonical unit per domain.
Keep original only in evidence/raw layer when needed.

## Merchant
Canonical:
merchant_id
canonical_name
country/jurisdiction when useful
aliases[]
external_identifiers[]

Deduplication:
1. exact external identifier;
2. normalized string;
3. probabilistic candidate match;
4. human review if critical.

## Product
Canonical product identity separated from SKU/barcode aliases and display name.

## Contract
Canonical contract id separated from provider identifiers and document copies.

## Address
Normalize components.
Store only precision needed by the use case.
Prefer municipality/region identifiers when exact street address is unnecessary.

## Language
Store language code + normalized content where content is durable.

## Null semantics
Do not confuse:
- missing;
- unknown;
- not applicable;
- deliberately withheld.

## Confidence
Every extracted/derived fact may carry:
CONFIRMED
HIGH_CONFIDENCE
PROBABLE
UNCERTAIN
INSUFFICIENT_DATA

## Provenance
Every durable derived fact retains source reference + rule/extractor version + observed_at.

## Rule
A raw value can remain only as evidence or user-selected document, not as a substitute for canonical domain data.

# 08 — Canonical Data Model

## Identity layer
identity.account
- account_id
- authentication metadata
- recovery metadata
- status

identity.device
- device_id
- account_id
- public_key/reference
- status
- created_at
- revoked_at

Le domaine métier utilise `user_id` / stable opaque identifiers, jamais l'email comme clé.

## Core
core.user
core.permission
core.module
core.capability
core.case
core.detection
core.evidence
core.action
core.outcome
core.notification
core.preference
core.feature_flag

## Source / extraction
source.connector
source.raw_quarantine
extraction.record
extraction.field

## Canonical domain
domain.merchant
domain.product
domain.subscription
domain.contract
domain.document
domain.transaction
domain.deadline
domain.travel_item

## Knowledge
knowledge.source
knowledge.fact
knowledge.evidence
knowledge.rule
knowledge.rule_version
knowledge.proposal
knowledge.review
knowledge.certification
knowledge.conflict

## Audit
audit.business_event
audit.security_event
audit.data_access
audit.action_log

## Ownership
Core owns lifecycle/state.
Modules contribute via Core contracts.
Knowledge owns collective knowledge governance.
Identity owns identity metadata.
Secrets are isolated from business tables.

## Stable IDs
Opaque IDs only.
Never expose semantic meaning such as email/date/merchant name in identifiers.

## Display vs canonical
Canonical values are stable and normalized.
Presentation labels are localized/display-only.

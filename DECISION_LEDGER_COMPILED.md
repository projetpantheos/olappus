# OLAPPUS — DECISION LEDGER COMPILED

<!-- AUTHORITY-BANNER -->
> **Vue condensée des invariants.** Les décisions tracées et leurs justifications vivent dans `docs/ADR/` — commencer par `docs/ADR/INDEX.md`. En cas de divergence entre ce résumé et un ADR, **l'ADR fait foi**.
>
> Mis à jour le 2026-09-08 : monorepo npm workspaces · schémas PostgreSQL · enveloppe CQE + `actor_id` · Thémis porte les règles juridiques datées · pas d'upload en P0 · `email` en AI_FORBIDDEN.


Ce fichier est la vue condensée des invariants décidés.

## Product
- Mental-load reduction + consumer protection.
- Hélios = attention inbox.
- Muses = trusted knowledge layer.
- Chatbot = secondaire.
- Few, relevant notifications.
- Prepare-first actions.
- Auto-execution future, granular permissions.
- Demo Mode native.
- Progressive onboarding.
- First value in <5 min.
- Success = Mental Load Removed / Attention Avoided.

## Architecture
- Supabase yes.
- Local-first hybrid.
- Mobile first, web secondary.
- Monorepo TypeScript.
- Core owns business state.
- Modules isolated; no direct module-to-module dependency.
- One physical Supabase DB for prototype, logical schemas.
- Declarative module manifests.
- Commands / Queries / immutable versioned Events.
- Projections are not source of truth.
- Typed contracts + runtime validation.
- Migrations only; no manual production schema edits.

## Data
- Raw ≠ domain.
- Identity ≠ domain.
- Normalize before durable business storage.
- Minimize before AI.
- Pseudonymize where identity is functionally needed.
- Anonymous only when re-identification risk is acceptably low.
- Data Registry / Data Governance as Code.
- Four classifications L1–L4.
- Category-specific minimum retention.
- Disconnect ≠ delete.
- Full structured export.
- Controlled verifiable deletion.

## Knowledge / Muses
- User data ≠ collective knowledge.
- Muses receives minimized facts.
- Official/certified/validated/community/AI hierarchy with context.
- Preserve contradictions.
- Critical rules: 2 independent human validations + 1 certified.
- AI may propose, never certify directly.
- Temporal validity mandatory.
- Published rules can be suspended under governed review.
- Muses not public at launch.

## Security / Resilience
- Passkey.
- Device identity and revocation.
- Recovery codes + verified email + optional trusted device.
- Auth ≠ automatic data decryption.
- Application-level encryption for sensitive data.
- Secrets outside code/client/business DB.
- CI security gates.
- Global Safe Mode.
- Local offline read/some writes in P0.
- Outbox + idempotent commands.
- Conflict handling by criticality.
- Backup restoration tests.
- Portable domain model.

## AI
- Deterministic first.
- AI only when useful.
- AI Gateway + model router.
- AI policy per data.
- No raw personal data to external AI by default.
- No AI as source of truth.
- No automatic training on user behavior.

## UX
- WHY → PROOF → OPTIONS → ACTION.
- CONFIRMED / HIGH_CONFIDENCE / PROBABLE / UNCERTAIN / INSUFFICIENT_DATA.
- SILENCE / INFO / ATTENTION / ACTION / URGENT.
- Capability states AVAILABLE / PARTIAL / BLOCKED / UNKNOWN.

## Monetization
- Freemium/premium but changeable.
- Billing separated from capabilities.
- Entitlements central.
- Modules know capabilities, not plans/prices.
- Privacy, export, delete, security and recovery controls not paywalled.
- No sale of personal data.

## Claude
- Claude can build; it cannot silently decide.
- Synthetic/anonymized data by default.
- Green/yellow/red approval matrix.
- Locked decision conflicts trigger STOP.
- No production secrets/data.
- No disabling safeguards.
- Regression creates permanent test.
- Decision Ledger is authoritative.
- Absence of instruction is never implicit authorization.

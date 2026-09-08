# GATES CHECKLIST

<!-- AUTHORITY-BANNER -->
> **Statut : CHECKLIST** — la **numérotation de gates de ce document est abrogée** par **ADR-0001**. La seule numérotation valable est `compiled_decisions/runbooks/RUN-42_GATE_MAP.md` (G0–G9). Le contenu des points de contrôle reste utile.


## G0 Secrets
[ ] .env ignoré
[ ] secret scan vert
[ ] aucun token dans logs

## G1 Architecture
[ ] Core séparé des modules
[ ] event contracts
[ ] module contract
[ ] threat model

## G2 Data security
[ ] RLS partout
[ ] cross-user tests
[ ] Storage private
[ ] purge testée
[ ] signed URLs

## G3 UX
[ ] Hélios synthétique utile
[ ] Why / Prove / Act
[ ] notifications regroupées
[ ] accessibilité de base

## G4 Google
[ ] OAuth state/PKCE
[ ] tokens server-only
[ ] scopes minimum
[ ] expiration/revocation gérées

## G5 Knowledge
[ ] source registry
[ ] license gate
[ ] provenance
[ ] versioning

## G6 Muses
[ ] candidate != fact
[ ] réputation
[ ] quorum
[ ] certification
[ ] révocation
[ ] anti-Sybil de base

## G7 Consumer
[ ] case state machine
[ ] evidence vault
[ ] action confirmation
[ ] aucune promesse juridique excessive

## G8 Cost
[ ] AI off by default
[ ] cache
[ ] query budgets
[ ] quotas surveillés

## G9 Pilot
[ ] crash/error monitoring
[ ] 5 testers
[ ] 7 days
[ ] feedback
[ ] KPI baseline

## G10 Release
[ ] security suite green
[ ] dependency audit
[ ] migration plan
[ ] rollback
[ ] privacy review

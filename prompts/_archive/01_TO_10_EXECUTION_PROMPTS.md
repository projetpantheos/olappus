# EXECUTION PROMPTS

## 01 — AUDIT
Lis tout le kit et inspecte le repo sans modifier. Retourne architecture, dettes, risques, conflits avec le kit, plan P0, dépendances et G1. Attends validation.

## 02 — BOOTSTRAP
Implémente uniquement G0/G1/G2. Crée app Expo TS, Supabase, migrations, RLS, storage privé, auth, CI, secret hygiene. Termine par tests d'isolation utilisateur.

## 03 — HÉLIOS
Avec fixtures synthétiques uniquement, implémente Event Bus, Rules Engine, Priority Engine, Insight model, Why/Prove/Act et navigation. Aucun fournisseur externe.

## 04 — HERMÈS
Implémente Gmail en lecture seule derrière Connector. OAuth séparé, PKCE/state, exchange serveur, tokens protégés, sync incrémentale, déduplication, minimisation, purge. Ne demande aucun scope supplémentaire sans gate.

## 05 — CHRONOS
Ajoute Calendar lecture seule. Fusionne dans événements normalisés. Tests quotas, pagination, conflits, échéances.

## 06 — MNÉMOSYNE
Ajoute documents/evidence. Bucket privé, limites, MIME, signed URLs, suppression, retention, recherche metadata.

## 07 — HADÈS ARGOS THÉMIS
Implémente moteurs déterministes. Aucun AI call. Chaque insight doit avoir reason codes + evidence.

## 08 — DATA + MUSES
Crée Source Registry, License Gate, ingestion versionnée, candidate/fact separation, reputation, quorum, certification, expiry et audit. Ingère une seule source approuvée au début.

## 09 — CASE/ACTIONS
Implémente consumer protection cases, evidence vault, action proposals, confirmation, verification. Aucun envoi réel sans confirmation.

## 10 — SECURITY GATE
Effectue un audit complet : RLS, OAuth, storage, uploads, SSRF, XSS, prompt injection, logs, secrets, dependency supply chain, rate limits, cost budgets. Retourne une liste P0/P1/P2 et n'effectue aucune correction silencieuse.

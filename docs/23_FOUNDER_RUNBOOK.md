# PAS A PAS FONDATEUR — CONSTRUCTION OLAPPUS

<!-- AUTHORITY-BANNER -->
> **Statut : CHECKLIST** — la **numérotation de gates de ce document est abrogée** par **ADR-0001**. La seule numérotation valable est `compiled_decisions/runbooks/RUN-42_GATE_MAP.md` (G0–G9). Le contenu des phases reste utile.


Ce runbook est fait pour être suivi avec Claude Code. Claude doit indiquer la sous-étape courante et te donner l'action concrète suivante. Tu ne passes pas à la gate suivante si la précédente est rouge.

## PHASE 0 — Préparation
### 0.1 Créer les comptes
- GitHub
- Supabase
- Expo
- Google Cloud

### 0.2 Créer les espaces
- repo Git privé
- projet Supabase DEV
- projet Google DEV
- coffre local de secrets

### 0.3 Contrôle
Claude vérifie : git ignore, secrets, environnement, README, branche initiale.
**GATE G0 : aucun secret commité.**

## PHASE 1 — Architecture
### 1.1 Audit repo
Claude inspecte sans coder.
### 1.2 Architecture proposal
Claude écrit architecture + ADR.
### 1.3 Validation humaine
Tu acceptes/refuses le plan.
**GATE G1 : architecture approuvée + threat model accepté.**

## PHASE 2 — Bootstrap sécurisé
### 2.1 Expo/TS
### 2.2 Supabase
### 2.3 Auth
### 2.4 RLS
### 2.5 Storage privé
### 2.6 Forteresse minimale
**GATE G2 : isolation A/B, secrets, upload et suppression passent.**

## PHASE 3 — Hélios synthétique
### 3.1 Events
### 3.2 Rules
### 3.3 Priority
### 3.4 UI
### 3.5 Pourquoi/Prouver
**GATE G3 : Hélios est utile sans aucune intégration externe.**

## PHASE 4 — Hermès
### 4.1 Google Cloud OAuth DEV
### 4.2 consent screen Testing
### 4.3 PKCE/state
### 4.4 token server-side
### 4.5 incremental sync
### 4.6 extraction déterministe
### 4.7 purge
**GATE G4 : aucun token/body brut dans logs ; isolation utilisateur validée.**

## PHASE 5 — Calendar
### 5.1 connecteur
### 5.2 sync incrémentale
### 5.3 échéances/conflits
**GATE G5 : reprise après quota/timeout.**

## PHASE 6 — Mnémosyne
### 6.1 upload sécurisé
### 6.2 evidence
### 6.3 metadata
### 6.4 suppression
**GATE G6 : un utilisateur ne peut jamais lire un fichier d'un autre.**

## PHASE 7 — Hadès / Argos / Thémis
### 7.1 récurrence
### 7.2 anomalies
### 7.3 échéances
### 7.4 explication/provenance
**GATE G7 : chaque alerte a une evidence et un reason code.**

## PHASE 8 — Open Data + Knowledge
### 8.1 Source Registry
### 8.2 License Gate
### 8.3 ingestion d'une première source
### 8.4 versionnement
### 8.5 Muses candidate
**GATE G8 : source bloquée = ingestion impossible.**

## PHASE 9 — Protection consommateur
### 9.1 Case Engine
### 9.2 Evidence Vault
### 9.3 Why/Prove/Act
### 9.4 règles de communication prudente
**GATE G9 : un cas peut être suivi jusqu'au résultat sans action risquée automatique.**

## PHASE 10 — Pilote
5 utilisateurs.
7 jours.
Mesurer utilité, faux positifs, notifications, compréhension, charge mentale évitée.
**GATE G10 : au moins un usage récurrent sans incitation manuelle.**

## PHASE 11 — P1
Mercure, Asclépios, Peithô, Déméter/Perséphone, Poséidon, Apollon selon données de test.

## PHASE 12 — Web
Ne démarrer qu'après validation mobile/core. Construire le Web sur les mêmes contrats API, événements et services métier.

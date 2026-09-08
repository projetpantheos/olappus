# PAS À PAS FONDATEUR — de G0 à G1

Établi le 2026-09-08, après le passage du G0. Environnement de référence : Windows 11, PowerShell.

Ce document ne remplace pas `docs/23_FOUNDER_RUNBOOK.md` (vision d'ensemble des phases) : il donne les gestes concrets, dans l'ordre, avec la commande de vérification de chaque étape.

---

## RÈGLE ZÉRO — les secrets

À lire avant tout le reste.

1. **Ne collez jamais un secret dans une conversation avec un assistant.** Mot de passe, clé API, `service_role` key, `client_secret`, token OAuth, mot de passe de base : aucun ne doit apparaître dans un chat, un ticket, un commit ou une capture d'écran.
2. Les secrets vivent dans **un gestionnaire de mots de passe**, et dans des fichiers `.env.local` **jamais suivis par git**.
3. Le dépôt ne contient que des `.env.example` avec des valeurs vides.
4. Activez la double authentification sur chaque compte créé.
5. Si un secret fuite : le révoquer d'abord, le remplacer ensuite. Jamais l'inverse.

Un agent peut écrire le code qui *lit* un secret. Il n'a jamais besoin d'en *connaître* la valeur.

---

## PRINCIPE DE SÉQUENCEMENT

Ne créez pas les comptes dont vous n'avez pas encore besoin. Chaque compte externe créé trop tôt est une surface d'exposition ouverte pour rien, et certains démarrent des compteurs (les tokens de test Google expirent, les quotas courent).

| Ce dont vous avez besoin | À quelle gate | Pourquoi pas avant |
|---|---|---|
| Git configuré, dépôt GitHub privé | **G1** | Le premier commit doit exister avant tout code |
| Docker Desktop | **G2** (installable dès maintenant) | Supabase tourne en local ; aucun projet distant nécessaire |
| Supabase CLI | **G2** | Installée comme dépendance du projet, pas globalement |
| Projet Supabase hébergé (DEV) | **G6** | Tant que tout tourne en local, un projet distant n'apporte rien |
| Compte Expo / EAS | **G9** | Nécessaire pour construire un binaire, pas pour développer |
| Projet Google Cloud + OAuth | **G6** | Le compteur des tokens de test démarre à la création |
| Comptes stores | après G9 | — |

**À faire maintenant : les étapes 1 à 5.** Le reste attendra sa gate.

---

## ÉTAPE 1 — Vérifier ce qui est déjà là

```powershell
node -v; npm -v; git --version
```

Attendu : Node v24.x, npm 11.x, git 2.x.

**Vous n'avez pas besoin d'installer Node.** Votre version (v24.20.0) est sur la ligne LTS active. Nous l'épinglerons au bootstrap via `.nvmrc` et `engines` pour que la CI et votre machine partagent exactement la même version.

*Si Expo signale une incompatibilité au bootstrap*, je le verrai immédiatement et nous épinglerons alors la version qu'il exige — c'est le seul cas où une installation de Node sera nécessaire.

---

## ÉTAPE 2 — Configurer votre identité git

```powershell
git config --global user.name "Votre Nom"
```

```powershell
git config --global user.email "votre.email@exemple.com"
```

Puis, pour éviter les surprises de fins de ligne sur Windows :

```powershell
git config --global core.autocrlf input
```

Et fixer le nom de la branche par défaut :

```powershell
git config --global init.defaultBranch main
```

**Vérification :**

```powershell
git config --global --list
```

---

## ÉTAPE 3 — Installer Docker Desktop

Nécessaire à partir de G2 pour exécuter Supabase en local : c'est ce qui permet de **prouver** que l'isolation entre utilisateurs fonctionne, au lieu de le déclarer (ADR-0009).

```powershell
winget install Docker.DockerDesktop
```

Si WSL2 n'est pas encore présent, Docker le demandera. Dans ce cas :

```powershell
wsl --install
```

Puis **redémarrez la machine**, lancez Docker Desktop une fois, et acceptez ses conditions d'utilisation vous-même.

**Vérification :**

```powershell
docker version
```

```powershell
docker run --rm hello-world
```

Si la seconde commande affiche un message de bienvenue, Docker est opérationnel.

> Docker Desktop est gratuit pour un usage individuel et pour les petites structures ; au-delà d'un certain seuil d'effectif et de chiffre d'affaires, une licence payante s'applique. Vérifiez les conditions en vigueur au moment de l'installation — le kit vise 0 € de coût récurrent.

---

## ÉTAPE 4 — Créer le dépôt GitHub privé

Dans le navigateur, sur votre compte GitHub :

1. **New repository**
2. Nom : `olappus`
3. Visibilité : **Private** — impératif
4. **N'ajoutez ni README, ni .gitignore, ni licence.** Le dépôt doit être vide : le premier commit viendra de votre machine, avec le `.gitignore` en place dès le départ.
5. Activez la double authentification sur le compte si ce n'est pas déjà fait.

Ne configurez rien d'autre pour l'instant : la protection de la branche `main` sera mise en place après le premier push, quand la branche existera.

**Vérification :** le dépôt s'ouvre et affiche « Quick setup ».

---

## ÉTAPE 5 — Préparer le coffre de secrets

Créez une entrée dans votre gestionnaire de mots de passe, nommée par exemple « Olappus — secrets techniques ». Elle recevra progressivement :

| Secret | Créé à quelle étape |
|---|---|
| Mot de passe de la base Supabase DEV | G6 |
| `service_role` key Supabase | G6 |
| `client_id` / `client_secret` Google | G6 |
| Clé d'API de la source juridique | G5 |

Rien à y mettre aujourd'hui : c'est la place qui est préparée, pas le contenu.

**Ne créez pas de dossier de secrets à l'intérieur du dépôt**, ni dans un dossier synchronisé automatiquement sans chiffrement.

---

## ÉTAPE 6 — Où vivra le dépôt

Le kit est aujourd'hui ici :

```
C:\Users\alexa\Documents\Ollapus\OLAPPUS_CLAUDE_CODE_COMPLETE_DEVKIT_2026-09-08\olappus_final_kit\
```

Il contient déjà `docs/`, `prompts/`, `compiled_decisions/`, `references/` : c'est la bonne forme pour la racine du dépôt. Le code viendra à côté (`apps/`, `packages/`, `supabase/`, `tooling/`).

**Recommandation** : initialiser le dépôt **directement dans ce dossier**, sans rien déplacer. Le dossier pourra être renommé plus tard sans conséquence.

Si vous préférez un chemin plus court — par exemple `C:\Users\alexa\Projets\olappus\` —, dites-le avant le bootstrap : le déplacement est trivial maintenant, coûteux après le premier commit.

---

## ÉTAPE 7 — Me redonner la main

Quand les étapes 1 à 5 sont faites, dites-le simplement. Vous n'avez **aucun secret à me communiquer**.

### Ce que je ferai en G1

1. `git init` sur la branche `main`
2. `.gitignore` **en tout premier fichier** — avant qu'un seul autre fichier ne soit créé
3. Un scan de secrets sur l'ensemble du kit, avant le premier commit
4. Premier commit : le kit tel qu'il est aujourd'hui, ADR compris
5. Monorepo npm workspaces (ADR-0002), version de Node épinglée
6. Application Expo + TypeScript strict
7. Séparation des environnements et fichiers `.env.example`
8. CI : typecheck, lint, tests unitaires, scan de secrets, audit de dépendances
9. Politique de journalisation `SEC-34` (interdiction de journaliser tokens, corps de mail, adresses)
10. Rapport de fin de gate au format `GATE / STATUS / EVIDENCE / RISKS / OPEN DECISIONS / ROLLBACK / NEXT GATE`

### Ce que je ne ferai jamais sans votre accord explicite

Pousser sur un dépôt distant · créer un compte · saisir un identifiant · toucher à une donnée de production · désactiver un contrôle de sécurité pour faire passer un test · ajouter une dépendance payante · élargir un périmètre de données.

---

## RITUEL DE FIN DE SESSION

À la fin de chaque session de travail avec un agent, exigez systématiquement :

1. les tests exécutés et leur résultat réel ;
2. `git status` et un résumé du diff ;
3. `PROJECT_STATE.md` mis à jour ;
4. les blocages ;
5. l'action suivante, côté agent et côté fondateur.

**Ne jugez pas une fonctionnalité au seul fait qu'elle marche.** Jugez : valeur produit, confidentialité, sécurité, provenance, exploitabilité, rollback, charge cognitive (`RUN-26`).

---

## APERÇU DES GATES SUIVANTES

| Gate | Ce que vous aurez à faire |
|---|---|
| **G1** Foundation | Rien, hors relecture du rapport de gate |
| **G2** Privacy/Security | Rien, hors validation des preuves d'isolation entre utilisateurs |
| **G3** Core contracts | Valider les contrats CQE et la portée du Safe Mode |
| **G4** Demo Mode + Hélios | **Juger vous-même la première valeur** : est-elle compréhensible en moins de 5 minutes ? |
| **G5** Muses + License Gate | Choisir et faire enregistrer la première source ; créer un compte d'API si la source l'exige |
| **G6** Connecteur Hermès | Créer le projet Google Cloud, l'écran de consentement en Testing, le projet Supabase DEV |
| **G7** Modules + protection | Valider la formulation prudente des affirmations juridiques |
| **G8** Offline | Rien |
| **G9** Release/Beta | Compte Expo/EAS, recrutement des premiers testeurs, revue juridique avant tout pilote public |

La numérotation complète et les conditions de sortie sont dans `compiled_decisions/runbooks/RUN-42_GATE_MAP.md`.

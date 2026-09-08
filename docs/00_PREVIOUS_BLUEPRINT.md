# OLAPPUS — Blueprint Knowledge & Consumer Protection

<!-- AUTHORITY-BANNER -->
> **Statut : À PROMOUVOIR** — ce document contient des schémas exécutables absents de la couche normative (Source Registry 26 champs, modèle de connaissance 18 champs, Consumer Protection Graph, Evidence Vault, Privacy Firewall, identifiants pivots, KPI). Ils doivent être remontés dans `compiled_decisions/`, pas réinventés. Voir `docs/DEPRECATION_MAP.md`.


## Document de référence — Prototype France / coût minimal / commercialisable

**Version :** 1.0
**Date :** 4 septembre 2026
**Statut :** Blueprint produit + data + gouvernance, préalable au kit Claude Code définitif

---

## 0. Décisions fondatrices

Les décisions déjà retenues pour le projet sont :

- Backend : **Supabase**.
- Traitement : **local-first / B1** autant que possible.
- Hébergement cible : **Europe / B2**.
- Les Muses : système de réputation (**C2**) + certification de certains validateurs (**C3**).
- IA : les **données personnelles brutes ne doivent pas être envoyées à des APIs IA gratuites tierces** (**D1**).
- Évolutivité : toute future brique doit se brancher au Core via un **contrat de module stable** (**E1**).
- Web : secondaire au départ ; l’architecture doit néanmoins être **headless/API-first** afin de permettre plus tard un client Web sans refonte du domaine métier.

---

# 1. Vision produit

Olappus ne doit pas être une collection d’outils ni un simple chatbot.

> **Olappus surveille, comprend et protège le quotidien de l’utilisateur.**

Le moteur produit cible est :

```text
DONNÉES
  ↓
NORMALISATION
  ↓
CONNAISSANCE
  ↓
DÉTECTION
  ↓
ÉVALUATION DU RISQUE
  ↓
RECOMMANDATION
  ↓
ACTION
  ↓
VÉRIFICATION
  ↓
APPRENTISSAGE STRUCTURÉ
```

L’objectif stratégique est qu’à mesure qu’Olappus grandit, **le nombre d’appels IA nécessaires diminue**.

---

# 2. Principe économique

## Règle absolue

Une fonctionnalité ne doit pas appeler une IA si une donnée structurée, une règle déterministe ou un résultat mis en cache permet de répondre correctement.

Ordre de décision :

```text
1. Réponse déjà présente dans une base Olappus fiable ?
2. Règle déterministe existante ?
3. Pattern/document déjà reconnu ?
4. Heuristique suffisamment fiable ?
5. Traitement local possible ?
6. Seulement alors : IA
```

## Coût cible du prototype

Le système doit fonctionner sans abonnement data payant et avec un budget logiciel proche de zéro pendant la phase de test.

Les seuls coûts éventuellement inevitables doivent être explicitement identifiés comme :

- domaine éventuel ;
- distribution store éventuelle ;
- éventuel hébergement dépassant les free tiers ;
- services Google nécessitant une validation/quotas particuliers.

Aucune architecture ne doit dépendre d’une API payante pour le fonctionnement de base.

---

# 3. Les trois mondes de données

Il faut séparer physiquement et logiquement :

## A — USER DATA

Données privées issues :

- email ;
- calendrier ;
- achats ;
- contrats ;
- documents ;
- données saisies par l’utilisateur.

**Jamais intégrées directement dans la Knowledge Base publique.**

## B — PUBLIC DATA

Données externes réutilisables :

- administrations ;
- organismes publics ;
- open data européen ;
- datasets avec licence compatible.

## C — OLAPPUS KNOWLEDGE

Connaissances structurées produites à partir de sources et d’observations validées.

Une connaissance doit conserver sa provenance et ses contraintes de licence.

---

# 4. Règle de licence

Olappus doit privilégier, pour le prototype, les licences permettant explicitement la réutilisation commerciale, idéalement :

1. **Licence Ouverte / Open Licence 2.0 (Etalab)** ;
2. licences permissives clairement compatibles avec un produit commercial ;
3. éventuellement ODbL uniquement lorsqu’une architecture de séparation et les obligations de partage/attribution ont été validées.

La Licence Ouverte 2.0 autorise la réutilisation gratuite à des fins commerciales ou non, y compris la transformation, la combinaison et l’intégration dans une application, sous réserve notamment de l’attribution de la source et de la date de mise à jour. [réf. non résolue — à revérifier]

**Règle produit :** le pipeline d’ingestion doit refuser par défaut toute source dont la licence commerciale n’est pas clairement documentée.

---

# 5. Source Registry

Toute source doit être enregistrée avant ingestion.

```text
source_id
name
publisher
country
jurisdiction
dataset_url
api_url
license_name
license_url
commercial_use_allowed
redistribution_allowed
attribution_required
share_alike_required
privacy_restrictions
update_frequency
last_checked_at
last_imported_at
source_hash
schema_version
quality_score
priority
status
notes
```

Statuts autorisés :

- `APPROVED`
- `APPROVED_WITH_CONDITIONS`
- `REVIEW_REQUIRED`
- `REJECTED`
- `DEPRECATED`

---

# 6. Pile de données prioritaire — France / MVP

## TIER S — à brancher en premier

### S1 — Légifrance

**Rôle :** droit, textes, codes, jurisprudence et référentiels juridiques exploitables par le moteur de protection consommateur.

L’API Légifrance est accessible gratuitement après inscription ; ses données sont soumises à la Licence Ouverte 2.0 et à des conditions/quota propres à l’API. [réf. non résolue — à revérifier]

**Briques alimentées :**

- Dikè ;
- Thémis ;
- Mercure ;
- Consumer Protection Engine ;
- Legal Knowledge Graph.

**Stratégie coût :** privilégier les téléchargements/open data et la mise en cache locale lorsque le volume et les conditions le permettent plutôt que des interrogations répétitives.

---

### S2 — RappelConso

**Rôle :** rappels de produits en France.

Le jeu RappelConso V2 est actuellement sous Licence Ouverte 2.0. La version publiée début septembre 2026 contient notamment l’identifiant produit, la date de publication et les distributeurs. [réf. non résolue — à revérifier]

**Briques :**

- Mercure ;
- protection achats ;
- alimentation ;
- produits ;
- alertes Hélios.

**Valeur :** très forte, car l’utilisation est directement liée à la protection du consommateur.

---

### S3 — SIRENE

**Rôle :** identité et référence des entreprises/établissements.

L’API Sirene est utilisable avec une recherche unitaire, multicritère et historisée ; la réutilisation est placée sous Licence Ouverte 2.0. [réf. non résolue — à revérifier]

**Briques :**

- Mercure ;
- Dikè ;
- achats ;
- contrats ;
- fournisseurs ;
- détection d’entreprise.

**Fonction centrale :** résoudre proprement une entreprise à partir d’un email, ticket, facture ou contrat.

---

### S4 — Base Adresse Nationale (BAN)

**Rôle :** normalisation et résolution d’adresses.

La BAN est publiée sous Licence Ouverte 2.0 et est conçue comme référentiel national des adresses. [réf. non résolue — à revérifier]

**Briques :**

- foyer ;
- contrats ;
- déménagement ;
- énergie ;
- fournisseurs ;
- mobilité.

**Important :** ne conserver côté utilisateur que la précision nécessaire au cas d’usage.

---

### S5 — Prix des carburants

**Rôle :** comparaison locale et historique des prix de carburants.

Le flux officiel est sous Licence Ouverte 2.0 et est annoncé comme mis à jour toutes les 10 minutes. [réf. non résolue — à revérifier]

**Briques :**

- voiture ;
- comparaison ;
- optimisation quotidienne ;
- consommation.

---

# 7. TIER A — très forte valeur, deuxième vague

### A1 — BODACC

**Rôle :** vie des entreprises, modifications, radiations, procédures collectives, dépôts de comptes, etc.

L’API BODACC est utilisable gratuitement et soumise à la Licence Ouverte 2.0. [réf. non résolue — à revérifier]

**Intérêt :** détecter des changements concernant un fournisseur ou une entreprise suivie.

---

### A2 — BALO

API gratuite et sous Licence Ouverte 2.0. [réf. non résolue — à revérifier]

**Intérêt :** moins prioritaire pour le grand public ; utile plus tard pour analyses d’entreprises et vérification documentaire.

---

### A3 — Open Food Facts

**Rôle :** alimentation, produits, ingrédients, nutrition, catégorisation.

**Licence :** ODbL ; les contraintes d’attribution et de partage à l’identique doivent être gérées explicitement.

**Stratégie prototype :** utiliser seulement les champs indispensables et maintenir une séparation claire entre les données sous ODbL et le reste de la base Olappus.

**Briques :**

- Déméter ;
- Amalthée ;
- courses ;
- rappels/produits.

**Important :** ODbL n’est pas à traiter comme équivalent à une Licence Ouverte 2.0. La documentation officielle d’Open Food Facts confirme ses conditions de réutilisation.

---

### A4 — Open Products Facts

Même logique qu’Open Food Facts pour une couverture plus large des produits non alimentaires.

**Décision préalable :** valider la licence et l’architecture d’isolation avant intégration dans le produit commercial.

---

### A5 — Safety Gate / alertes européennes

**Rôle :** alertes produits dangereux à l’échelle UE.

**Briques :** Mercure, protection des achats, Hélios.

**Règle :** ne pas intégrer le dataset tant que sa licence et les modalités de redistribution de la version actuellement disponible n’ont pas été vérifiées dans la source primaire européenne.

---

# 8. TIER B — excellent enrichissement open data

La plateforme data.gouv.fr permet d’identifier de nombreuses bases publiques supplémentaires. Le catalogue actuel contient notamment des référentiels et jeux tels que :

- Liste des juridictions compétentes ;
- Liste des CERFA ;
- Liste des centres et services publics pertinents ;
- Répertoire national des associations ;
- données mobilité ;
- données transport ;
- données logement ;
- données santé ;
- données environnement ;
- données culturelles.

Le catalogue public suit également les travaux d’ouverture de nouvelles données et les jeux disponibles. [réf. non résolue — à revérifier]

**Principe :** ne pas aspirer 50 bases dès le MVP. Construire un mécanisme d’ingestion générique, puis connecter les datasets ayant un ROI produit clair.

---

# 9. Architecture du Knowledge Engine

```text
                 SOURCE REGISTRY
                       ↓
                 INGESTION JOB
                       ↓
               RAW SOURCE STORE
                       ↓
            SCHEMA / LICENSE CHECK
                       ↓
               NORMALISATION
                       ↓
              ENTITY RESOLUTION
                       ↓
              DEDUPLICATION
                       ↓
              KNOWLEDGE CANDIDATE
                       ↓
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
     SOURCE         MUSES         SYSTEM RULE
    OFFICIELLE     CONSENSUS       / VALIDATION
        └──────────────┼──────────────┘
                       ↓
                CERTIFIED KNOWLEDGE
                       ↓
                  RULE ENGINE
                       ↓
                     HÉLIOS
```

---

# 10. Modèle de connaissance

Toute connaissance persistante doit comporter au minimum :

```text
knowledge_id
knowledge_type
subject_type
subject_id
predicate
object_value
jurisdiction
valid_from
valid_to
confidence_score
verification_level
source_refs
license_refs
created_at
updated_at
status
version
contradiction_group
```

Une connaissance ne doit jamais écraser silencieusement une précédente version.

---

# 11. Provenance

Chaque information affichée à l’utilisateur doit pouvoir répondre à :

> « Pourquoi Olappus pense cela ? »

Le système doit fournir :

- source ;
- date ;
- version ;
- méthode d’obtention ;
- règle ayant déclenché l’alerte ;
- niveau de confiance.

Exemple :

```text
Alerte : hausse inhabituelle détectée

Source : facture utilisateur
Référence externe : indice / historique
Règle : variation > seuil
Confiance : élevée
Dernière vérification : 04/09/2026
```

---

# 12. Les Muses — système de certification

Les Muses ne sont pas un espace où la majorité détermine mécaniquement la vérité.

### Hiérarchie de confiance

```text
SOURCE OFFICIELLE
      ↓
SOURCE INSTITUTIONNELLE
      ↓
VALIDATEUR CERTIFIÉ
      ↓
CONSENSUS DE VALIDATEURS
      ↓
CONSENSUS UTILISATEURS
      ↓
OBSERVATION UTILISATEUR
      ↓
HYPOTHÈSE IA
```

Une IA ne peut pas certifier seule une connaissance sensible.

---

# 13. Réputation des Muses

La réputation doit être multi-domaines.

Un utilisateur peut être :

- expert produit ;
- bon validateur de transport ;
- non reconnu en droit.

Le score doit considérer :

- historique de validations ;
- taux de correction ultérieure ;
- indépendance ;
- cohérence ;
- ancienneté ;
- participation ;
- conflits d’intérêts éventuels.

Ne jamais utiliser un simple compteur de votes comme système de réputation.

---

# 14. Certification des validateurs

Les niveaux recommandés :

### Niveau 0 — utilisateur

Peut proposer et signaler.

### Niveau 1 — contributeur fiable

Peut valider des éléments peu sensibles.

### Niveau 2 — validateur certifié

Certification manuelle ou procédure de vérification dédiée.

### Niveau 3 — expert de domaine

Certification renforcée, périmètre limité au domaine.

### Niveau 4 — source institutionnelle

Hors réputation communautaire.

**Important :** certification révocable.

---

# 15. Sécurité Muses

Prévoir dès le départ :

- anti-Sybil ;
- limitation des validations suspectes ;
- séparation des validations corrélées ;
- détection de collusion ;
- cooldown avant certification ;
- versionnement ;
- révocation ;
- journal d’audit ;
- conservation de la contradiction.

Une connaissance très utile économiquement doit avoir un niveau de protection supérieur contre la manipulation.

---

# 16. Consumer Protection Graph

Le modèle de données doit relier :

```text
UTILISATEUR
   │
   ├── ACHAT
   │      ├── PRODUIT
   │      ├── FOURNISSEUR
   │      ├── FACTURE
   │      └── GARANTIE
   │
   ├── CONTRAT
   │      ├── CONDITIONS
   │      ├── ÉCHÉANCES
   │      └── DROITS
   │
   └── LITIGE
          ├── PREUVES
          ├── DROITS
          ├── RÉCLAMATION
          ├── DÉLAI
          ├── MÉDIATEUR
          └── RÉSULTAT
```

Ce graphe doit permettre de passer de :

**événement → droit → preuve → action**.

---

# 17. Evidence Vault

Chaque réclamation ou alerte importante peut créer un dossier de preuve.

Exemple :

```text
CASE
├── documents
├── events
├── contracts
├── invoices
├── communications
├── extracted_facts
├── legal_rules
├── actions
├── deadlines
└── outcome
```

Les documents personnels restent privés.

Les connaissances générales produites à partir des dossiers sont détachées de toute identité.

---

# 18. Privacy Firewall

Architecture stricte :

```text
PRIVATE USER DATA
       │
       │  controlled extraction
       ↓
STRUCTURED EVENT
       │
       ├──────────→ PERSONAL DECISION
       │
       └──────────→ ANONYMIZED / AGGREGATED SIGNAL
                              ↓
                        KNOWLEDGE ENGINE
```

Aucun dataset public ne doit recevoir directement de données permettant d’identifier l’utilisateur.

---

# 19. IA : rôle exact

L’IA est un **outil de transition** vers une meilleure base de connaissances, pas la mémoire du produit.

Elle peut :

- extraire ;
- classifier ;
- résumer ;
- repérer une ambiguïté ;
- proposer une nouvelle règle ;
- proposer une correspondance avec un référentiel.

Elle ne doit pas :

- devenir la source de vérité ;
- certifier seule une règle juridique ;
- décider seule d’une action irréversible ;
- recevoir par défaut des emails/données personnelles brutes sur un endpoint gratuit tiers.

---

# 20. Auto-incrémentation des bases

## Pipeline

```text
NOUVEL ÉVÉNEMENT
      ↓
RECHERCHE DE CONNAISSANCE EXISTANTE
      ↓
┌─────┴─────┐
│           │
OUI         NON
│           │
↓           ↓
RÉUTILISER  PATTERN / EXTRACTION
            ↓
        CANDIDAT KNOWLEDGE
            ↓
       VALIDATION
            ↓
      CERTIFICATION
            ↓
        NOUVELLE RÈGLE
            ↓
        CACHE / INDEX
```

Chaque nouvelle connaissance doit idéalement réduire le coût futur.

---

# 21. Exemple concret — contrat inconnu

### Première occurrence

Olappus reçoit un document d’un nouveau fournisseur.

IA locale ou traitement assisté → extraction structurée.

### Après vérification

```text
supplier = X
contract_type = internet
billing_pattern = monthly
termination_window = known
price_change_signal = known
```

### Occurrences suivantes

Reconnaissance déterministe.

**Pas d’IA nécessaire.**

---

# 22. Open Data Ingestion Engine

Le système d’ingestion doit être générique.

Chaque connecteur déclare :

```text
source
fetch_strategy
schedule
schema
parser
normalizer
deduplicator
license_policy
entity_resolver
quality_checks
outputs
```

Ainsi une nouvelle base peut être ajoutée sans modifier le Core.

---

# 23. Politique de stockage

Pour réduire les coûts :

### RAW

Conserver seulement si juridiquement utile et si le volume est raisonnable.

### NORMALIZED

Conserver les données structurées nécessaires au produit.

### DERIVED KNOWLEDGE

Conserver uniquement les faits/règles utiles.

### CACHE

TTL selon volatilité.

### HISTORIQUE

Versionner les données dont l’évolution est importante pour la protection du consommateur.

---

# 24. Fréquence de mise à jour

Chaque source reçoit une stratégie :

- temps réel ;
- toutes les 10 minutes ;
- horaire ;
- quotidien ;
- hebdomadaire ;
- mensuel ;
- à la demande.

La fréquence dépend de l’impact produit, pas de la disponibilité technique.

Exemple : le flux officiel des prix carburants est annoncé toutes les 10 minutes ; inutile de le consulter à chaque ouverture de l’application si le cache local est récent. [réf. non résolue — à revérifier]

---

# 25. Identité des entités

Le système doit construire des IDs canoniques pour :

- entreprise ;
- produit ;
- fournisseur ;
- adresse ;
- contrat ;
- catégorie ;
- règle juridique.

Exemple :

```text
SIREN → canonical_company_id
EAN/GTIN → canonical_product_id
BAN address_id → canonical_address_id
```

**Ne jamais utiliser le nom libre comme identifiant maître.**

---

# 26. Sources prioritaires pour le prototype

| Priorité | Source | Licence / état | Fonction | Coût cible |
|---|---|---|---|---:|
| S | Légifrance | LO 2.0 | droit | 0 € |
| S | RappelConso | LO 2.0 | rappels | 0 € |
| S | SIRENE | LO 2.0 | entreprises | 0 € |
| S | BAN | LO 2.0 | adresses | 0 € |
| S | Prix carburants | LO 2.0 | prix | 0 € |
| A | BODACC | LO 2.0 | entreprises | 0 € |
| A | BALO | LO 2.0 | annonces | 0 € |
| A | Open Food Facts | ODbL | produits alimentaires | 0 € |
| A | Open Products Facts | à vérifier avant ingestion commerciale | produits | 0 € |
| A | Safety Gate | à vérifier sur source primaire | alertes UE | 0 € |

**Principe :** cette table est un backlog d’intégration, pas une autorisation juridique définitive. Toute licence doit être revérifiée dans la source primaire avant mise en production commerciale.

---

# 27. Sources à rechercher ensuite

Claude Code ne doit pas les intégrer automatiquement.

Il doit d’abord les inscrire dans `Source Registry` et lancer une validation licence.

Catégories :

- prix et consommation ;
- logement ;
- énergie ;
- mobilité ;
- garanties/rappels ;
- administration ;
- médiateurs ;
- tribunaux ;
- associations ;
- tourisme ;
- santé ;
- environnement ;
- produits ;
- fiscalité publique ;
- données européennes de protection du consommateur.

Le catalogue data.gouv.fr constitue le principal point de découverte pour les sources publiques françaises et permet de suivre l’état de nombreuses ouvertures de données. [réf. non résolue — à revérifier]

---

# 28. Consumer Protection Engine — règles produit

Toute alerte de protection consommateur devrait être traitée dans cet ordre :

```text
1. OBSERVER
2. IDENTIFIER
3. COMPARER
4. VÉRIFIER LA SOURCE
5. ÉVALUER LE RISQUE
6. DÉTERMINER LE DROIT / LA PROCÉDURE
7. CONSTRUIRE LA PREUVE
8. PROPOSER L’ACTION
9. DEMANDER CONFIRMATION SI NÉCESSAIRE
10. SUIVRE LE RÉSULTAT
```

---

# 29. Exemples d’automatisation sans IA

### Rappel produit

```text
RappelConso
→ correspondance produit utilisateur
→ alerte
→ aucun appel IA
```

### Entreprise

```text
nom fournisseur
→ SIRENE
→ SIREN canonique
→ données entreprise
```

### Adresse

```text
adresse email/document
→ parser
→ BAN
→ adresse normalisée
```

### Carburant

```text
position approximative
→ prix carburants local
→ tri
→ recommandation
```

### Droit

```text
type de situation
→ règle juridique déjà structurée
→ procédure
```

---

# 30. Exemple où l’IA reste utile

```text
Document totalement nouveau
→ extraction IA
→ facts structurés
→ validation
→ knowledge candidate
→ réutilisation future
```

L’objectif est de faire de l’IA **un investissement ponctuel** qui diminue le coût marginal futur.

---

# 31. API / module contract

Chaque future brique doit respecter :

```text
module_id
name
version
permissions
entities
events_in
events_out
connectors
rules
knowledge_types
actions
ui_routes
migrations
feature_flags
tests
```

Une brique doit pouvoir être activée/désactivée sans casser le Core.

---

# 32. Event Bus

Les modules communiquent via événements métier.

Exemples :

```text
email.received
invoice.detected
supplier.resolved
product.resolved
price.changed
contract.expiring
legal_rule.updated
consumer_case.created
knowledge.certified
knowledge.revoked
```

Le Core ne doit pas connaître la logique métier détaillée de chaque module.

---

# 33. Feature Flags

Chaque nouvelle brique doit être activable :

```text
module_enabled
knowledge_version
connector_enabled
ai_fallback_enabled
```

Cela permet de tester une brique sur quelques utilisateurs sans déployer tout le produit.

---

# 34. Versionnement

Tout ce qui peut changer doit être versionné :

- schéma ;
- connaissance ;
- règle ;
- connecteur ;
- source ;
- module ;
- migration.

Le rollback doit être prévu avant la mise en production.

---

# 35. Web futur

Ne pas développer maintenant une deuxième application métier.

Construire dès le départ :

```text
Mobile UI
    ↓
API / Domain Layer
    ↓
Core
    ↓
Modules
    ↓
Knowledge Engine
```

Le futur Web doit consommer les mêmes services et règles.

Aucune logique critique ne doit être enfermée dans React Native.

---

# 36. Sécurité minimale obligatoire avant MVP

- RLS sur les données utilisateur.
- Aucun secret dans le client.
- OAuth découplé de l’identité applicative.
- Tokens chiffrés au repos.
- Données minimisées.
- Journal d’audit.
- Suppression complète d’un compte.
- Expiration des données temporaires.
- Rate limiting.
- Validation stricte des entrées.
- Protection SSRF pour les fetchers.
- Pas d’action irréversible sans confirmation.
- Séparation User Data / Knowledge Data.
- Tests automatiques sur toutes les règles critiques.

---

# 37. Ce que le prototype NE DOIT PAS faire

- agréger 100 sources dès le premier mois ;
- envoyer automatiquement les emails complets à une IA gratuite ;
- faire confiance aux votes utilisateurs sans réputation ;
- mélanger les données ODbL avec une base propriétaire sans étude de licence ;
- stocker des documents indéfiniment ;
- développer la version Web en parallèle du mobile ;
- développer une brique sans son contrat de module ;
- ajouter une nouvelle table au hasard sans migration versionnée.

---

# 38. Roadmap Data / Knowledge

## Phase 0 — Fondations

- Source Registry
- License Registry
- Entity Registry
- Knowledge schema
- Event schema
- provenance

## Phase 1 — MVP

- Légifrance
- RappelConso
- SIRENE
- BAN
- prix carburants

## Phase 2

- BODACC
- Open Food Facts
- Safety Gate après validation licence

## Phase 3

- enrichissements consommation ;
- logement ;
- énergie ;
- mobilité ;
- médiation ;
- données européennes.

## Phase 4

- Muses certifiées
- Knowledge marketplace interne
- validation communautaire avancée
- auto-génération de règles.

---

# 39. KPI principaux

Ne pas mesurer uniquement le nombre de fonctions.

Mesurer :

### AI Dependency Rate

% des opérations nécessitant l’IA.

Objectif : baisse continue.

### Knowledge Reuse Rate

% des décisions prises à partir de connaissances déjà certifiées.

### False Alert Rate

% d’alertes jugées inutiles ou incorrectes.

### Action Completion Rate

% des alertes menant à une résolution.

### Consumer Value

€ économisés / récupérés / protégés.

### Mental Load Reduction

Nombre d’actions surveillées ou réalisées sans intervention de l’utilisateur.

### Knowledge Freshness

Age moyen des connaissances critiques.

---

# 40. Règle ultime de conception

Le produit doit devenir **plus autonome sans devenir moins contrôlable**.

Chaque automatisation doit donc répondre à trois questions :

1. **Quelle donnée la déclenche ?**
2. **Quelle connaissance ou règle la justifie ?**
3. **Comment l’utilisateur peut-il comprendre, contester ou annuler le résultat ?**

---

# 41. Prochaine étape

Ce blueprint doit précéder tout nouveau Master Prompt Claude Code.

La prochaine étape recommandée est :

## **Direction artistique + Design System Olappus**

Le Design System devra être défini comme une couche indépendante des briques et comprendre au minimum :

- identité visuelle ;
- palette ;
- typographies ;
- iconographie ;
- principes de densité ;
- composants ;
- états d’alerte ;
- visualisation de la confiance ;
- visualisation de la provenance ;
- langage émotionnel ;
- dark/light mode ;
- accessibilité ;
- règles de cohérence inter-briques.

Le design doit notamment matérialiser les valeurs :

> **sérénité · confiance · protection · intelligence discrète · transparence · simplicité**

---

# Sources vérifiées utilisées pour ce blueprint

- Légifrance — Open data et API : gratuité, API stable et Licence Ouverte 2.0. [réf. non résolue — à revérifier]
- Légifrance — texte relatif aux licences de réutilisation des informations publiques. [réf. non résolue — à revérifier]
- Licence Ouverte 2.0 — réutilisation commerciale, transformation et obligations d’attribution. [réf. non résolue — à revérifier]
- API Sirene — gratuité, recherche et Licence Ouverte 2.0. [réf. non résolue — à revérifier]
- Base Adresse Nationale — Licence Ouverte 2.0. [réf. non résolue — à revérifier]
- RappelConso V2 — Licence Ouverte 2.0 et contenu du dataset. [réf. non résolue — à revérifier]
- Prix des carburants — Licence Ouverte 2.0 et fréquence de mise à jour. [réf. non résolue — à revérifier]
- BODACC — API gratuite et Licence Ouverte 2.0. [réf. non résolue — à revérifier]
- BALO — API gratuite et Licence Ouverte 2.0. [réf. non résolue — à revérifier]
- Catalogue/feuille de route data.gouv.fr — découverte et suivi des données publiques. [réf. non résolue — à revérifier]

**Note juridique :** l’étiquette “commercialisable” dans ce document signifie “compatible en principe avec les conditions de réutilisation identifiées”. Une validation juridique/source primaire reste obligatoire avant mise en production et pour toute transformation substantielle ou combinaison de bases soumises à des licences différentes.

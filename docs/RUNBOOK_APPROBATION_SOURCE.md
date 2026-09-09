# RUNBOOK — Approuver une source officielle

Autorité : `governance/source_registry.yaml` (§ `approval_checklist`), `docs/11_OPEN_DATA_REGISTRY.md`, ADR-0007.
Première application : **Légifrance**, sans laquelle Thémis ne peut rien affirmer.

---

## Pourquoi ce n'est pas une action d'agent

Approuver une source, c'est engager la responsabilité juridique du produit sur une réutilisation de données. Cela demande de **lire un contrat de licence à la source primaire** et de juger s'il couvre l'usage prévu. Un agent peut préparer, vérifier la cohérence et écrire le code ; il ne peut pas porter cet engagement à votre place.

**Ne jamais approuver depuis les notes du kit.** `docs/11` et `docs/25` mentionnent une « Licence Ouverte 2.0 » pour Légifrance, mais ces mentions portent toutes le marqueur `[réf. non résolue — à revérifier]` : elles ont été écrites sans source vérifiable. Elles ne font pas foi, et c'est précisément pour cela que le registre est parti de `REVIEW_REQUIRED`.

## Ce que l'approbation débloque, et ce qu'elle verrouille

La base refuse aujourd'hui toute connaissance juridique. Le déclencheur `knowledge.enforce_license_gate()` interroge `knowledge.is_source_ingestible()`, qui répond `false` pour tout ce qui n'est ni `APPROVED` ni `APPROVED_WITH_CONDITIONS` — y compris pour une source inconnue.

Et la contrainte `source_approval_requires_verified_license` rend l'approbation **impossible** sans les trois valeurs ensemble :

```sql
status not in ('APPROVED', 'APPROVED_WITH_CONDITIONS')
or (license_verified = true and license_name is not null and last_checked_at is not null)
```

Autrement dit : on ne peut pas approuver « en attendant de vérifier ». Le schéma ne le permet pas.

---

## Les sept points, et ce qu'il faut réellement regarder

Pour chacun : ce que vous cherchez, et ce qui **bloque** si la réponse manque.

### 1. Licence lue à la source primaire

Où chercher — à confirmer, ces adresses peuvent avoir changé :

- la fiche du jeu de données sur **data.gouv.fr** ;
- les mentions légales et conditions de réutilisation sur **legifrance.gouv.fr** ;
- si l'accès se fait par API, le portail **PISTE** (`piste.gouv.fr`), qui porte ses propres conditions générales, distinctes de la licence des données ;
- le texte intégral de la licence invoquée, sur le site de son émetteur.

**Deux documents, pas un.** La licence des _données_ et les conditions d'_API_ sont deux contrats différents. Une licence permissive n'autorise pas à dépasser un quota, et des conditions d'API ne réécrivent pas la licence.

_Bloquant si_ : vous ne trouvez pas le texte de licence, ou il n'est identifiable que par un lien mort.

### 2. Réutilisation commerciale explicitement autorisée

Olappus est un produit commercial (`PRD-05`). « Gratuit » ne veut pas dire « réutilisable commercialement », et « open data » n'est pas une licence — c'est une famille.

_Bloquant si_ : le texte est muet sur l'usage commercial. Un silence n'est pas une autorisation.

### 3. Attribution et partage à l'identique

- **Attribution** : formulation exacte exigée, et où elle doit apparaître. Cela devient une exigence d'écran, pas une ligne de documentation.
- **Partage à l'identique** : si la licence l'impose, tout ce qui dérive de ces données doit être republié sous la même licence. Cela peut atteindre le cœur du produit.

_Bloquant si_ : le partage à l'identique est exigé et son périmètre n'est pas délimité. C'est la clause qui coûte le plus cher à découvrir tard.

### 4. Conditions d'API, quotas, fréquence de mise à jour

Notez : quotas (par seconde, par jour), authentification requise, délai de mise à jour des données, engagement de disponibilité s'il existe.

Le quota détermine ce que le produit peut promettre. Une règle juridique rafraîchie une fois par mois interdit d'annoncer une information « à jour ».

_Bloquant si_ : les quotas sont inconnus. On ne peut pas concevoir un cache pour une limite qu'on ignore (point 6).

### 5. Données personnelles

Une source juridique n'est pas censée en contenir, mais la jurisprudence publiée peut nommer des personnes. Si c'est le cas, cela relève du RGPD et de `docs/13`, indépendamment de la licence.

_Bloquant si_ : des données personnelles sont présentes sans restriction d'usage écrite.

### 6. Stratégie de cache (OPEN-07)

Le budget cible est **0 € récurrent**. Décidez : que met-on en cache, pour combien de temps, et que se passe-t-il quand la source est indisponible ? Le produit doit se taire plutôt qu'afficher une règle périmée (`ADR-0003`, `ADR-0007`).

_Bloquant si_ : non décidé. Sans cache défini, la première montée en charge fait dépasser le quota.

### 7. Date de vérification

`last_checked_at` porte la date **du jour où vous avez lu le texte**. Ce n'est pas une formalité : une licence vérifiée il y a deux ans n'est pas une licence vérifiée.

---

## Les trois issues possibles

| Issue                      | Quand                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `APPROVED`                 | Les sept points sont satisfaits, sans réserve.                                     |
| `APPROVED_WITH_CONDITIONS` | Utilisable, mais une obligation demeure (attribution à afficher, périmètre borné). |
| `REJECTED`                 | Un point bloquant ne se lève pas. Le motif est consigné, la source reste inerte.   |

`APPROVED_WITH_CONDITIONS` n'est pas un demi-échec : c'est le statut honnête quand la licence impose quelque chose au produit. La condition est alors une exigence de développement, pas une note.

---

## Ce que vous me rapportez

Recopiez et complétez. Une valeur inconnue reste `null` — ne rien inventer est le seul comportement acceptable ici.

```yaml
source_id: legifrance
license_name: # nom exact tel qu'écrit dans le texte
license_url: # lien vers le texte lu, pas vers une page qui en parle
license_verified: true
commercial_use_allowed: # true / false
redistribution_allowed: # true / false
attribution_required: # true / false — si true, la formulation exacte exigée
share_alike_required: # true / false
privacy_restrictions: # null, ou ce qui a été constaté
api_url:
dataset_url:
update_frequency: # ce que la source annonce
quotas: # ce que les conditions d'API imposent
last_checked_at: # la date du jour où vous avez lu
statut_vise: APPROVED # ou APPROVED_WITH_CONDITIONS, ou REJECTED
conditions: # si APPROVED_WITH_CONDITIONS : ce que le produit doit faire
```

## Ce que j'en fais

1. Mise à jour de `governance/source_registry.yaml` avec vos valeurs.
2. Migration mettant `knowledge.source` en accord — le YAML et la base doivent coïncider, et quatre tests le vérifient.
3. L'écran Protection cesse d'afficher « Aucune connaissance juridique disponible » : la source y apparaît **Vérifiée**, avec son attribution si elle est exigée.
4. Si `APPROVED_WITH_CONDITIONS` : la condition devient une ligne de travail, pas une note de bas de page.
5. Un test de non-régression : la source ne peut pas repasser `APPROVED` si `license_verified` retombe à `false`.

**Rien de tout cela n'ingère quoi que ce soit.** L'ingestion réelle relève de G6, et elle sera un pas séparé.

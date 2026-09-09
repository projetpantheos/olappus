# ADR-0018 — Stratégie de cache et de fréquence sous plafond inconnu

- **Statut** : ACCEPTED
- **Date** : 2026-09-09
- **Décision d'origine** : OPEN-07, bloquante avant toute ingestion
- **Approuvé par** : Fondateur
- **Réversible** : oui — les paramètres sont des valeurs, pas une architecture

## Context

`OPEN-07` exige une stratégie de fréquence, de cache et de quota **par source**, avant la première ingestion. Le budget cible est de 0 € récurrent.

Les CGU de l'API Légifrance (art. IV.3) annoncent des quotas « par seconde, minute ou jour », consultables sur PISTE. **Ils ne le sont pas** : le portail n'affiche aucune valeur au 2026-09-09. Ils sont par ailleurs modifiables à tout moment par la DILA, sans autre préavis qu'un courriel.

Trois autres faits, relevés dans les mêmes CGU, comptent autant :

- **aucun engagement de disponibilité** (art. IV.1), cible de 95 % par jour, coupure possible sans information préalable ;
- **aucune garantie de fraîcheur ni de complétude** (art. VI.1) ;
- **suspension possible sans préavis** en cas d'usage jugé non conforme (art. VII.1).

Attendre le nombre serait attendre indéfiniment. Le supposer serait pire : une valeur inventée devient un plafond auquel on se croit autorisé.

## Decision

**Le plafond est inconnu. On ne le suppose pas — on conçoit pour qu'il ne soit jamais approché, et on l'apprend quand la source le dit.**

### 1. Aucune requête sur le chemin de l'utilisateur

L'ingestion est planifiée et asynchrone. L'application lit la connaissance **déjà ingérée**, jamais la source.

C'est la décision structurante : elle rend le quota, la latence et l'indisponibilité de la source invisibles pour l'utilisateur. Un quota dépassé ne casse plus une session, il retarde une mise à jour.

### 2. Une vérification par jour et par fonds, au maximum

Le jeu LEGI est publié quotidiennement. Les trois droits du périmètre P0 (`ADR-0007`) — garantie légale de conformité, rétractation, résiliation — évoluent à l'échelle du législateur, pas de la minute.

Un rafraîchissement quotidien est donc **au-dessus** du besoin réel, et vraisemblablement de plusieurs ordres de grandeur sous n'importe quel plafond plausible. Aucune requête n'est déclenchée par une action utilisateur, ni par un démarrage d'application.

### 3. Le cache expire par obsolescence juridique, pas par minuterie

`knowledge.fact` porte déjà `valid_from` et `valid_to`. Une règle est servie tant qu'elle est valide, non suspendue et non contredite. Il n'y a pas de TTL arbitraire à régler.

La vérification quotidienne ne sert donc pas à « rafraîchir le cache » : elle sert à **capter une abrogation**. Nuance qui change le dimensionnement — on cherche un changement rare, pas une donnée volatile.

### 4. Le plafond s'apprend de la source, et se consigne

Un code 429, ou tout en-tête de limitation, fait foi contre toute valeur écrite ici. À la première rencontre :

- attente exponentielle avec gigue, nombre d'essais borné ;
- la valeur observée est consignée dans `governance/source_registry.yaml` sous `observed_rate_limit`, avec sa date.

Le registre passe alors d'« inconnu » à « mesuré ». Un plafond mesuré vaut mieux qu'un plafond annoncé, et infiniment mieux qu'un plafond supposé.

### 5. Jamais de rafale de reprise

Un échec ne redéclenche pas immédiatement. C'est ce qui distingue un client discipliné d'un client que la DILA suspend sans préavis (art. VII.1).

### 6. Ce que l'utilisateur voit quand la mise à jour n'a pas eu lieu

Le produit **dit** la date de dernière vérification, et se tait sur ce qu'il n'a pas pu revérifier. Il ne sert pas une règle en laissant croire qu'elle vient d'être confirmée.

C'est la conséquence directe de l'art. VI.1 : la source elle-même ne garantit pas sa fraîcheur. Le produit ne peut pas garantir davantage que sa source.

### 7. Budget

Zéro euro récurrent : le stockage est celui de la base déjà en place, aucune requête n'est facturée, aucun CDN n'est introduit.

## Consequences

**OPEN-07 cesse d'être bloquant pour Légifrance.** La stratégie ne dépend d'aucune valeur que nous n'avons pas.

**Le connecteur devra être écrit sous ces contraintes**, pas adapté après coup : ordonnanceur, backoff, plafond d'essais, et interdiction d'appel synchrone depuis l'application. C'est un travail de G6.

**La date de dernière vérification devient une donnée de produit**, affichée, pas un détail d'exploitation. Elle doit exister dans le modèle avant le premier affichage d'une règle.

**Si la DILA publie un jour ses quotas**, ils entrent dans le registre et cette ADR n'a pas à changer : elle est écrite pour que le nombre soit une information, jamais un prérequis.

## Alternatives écartées

**Attendre la publication des quotas.** Écarté : ils ne sont pas publiés, ils sont modifiables sans préavis, et le blocage n'a pas de terme connu.

**Demander les quotas à la DILA avant de décider.** Utile, non bloquant. L'adresse existe (`retours-legifrance-modernise@dila.gouv.fr`) et la question mérite d'être posée — mais faire dépendre l'architecture d'une réponse qu'on ne maîtrise pas reproduirait le problème qu'on vient de résoudre.

**Choisir un quota prudent supposé, par exemple 1 000 requêtes par jour.** Écarté, et c'est l'écart le plus tentant. Un nombre inventé prend valeur de norme : quelqu'un s'y autorisera. Ne pas avoir de plafond écrit oblige à concevoir pour n'en approcher aucun.

**Rafraîchir à la demande de l'utilisateur.** Écarté. Cela lierait la charge sur la source au nombre d'utilisateurs — exactement ce qui fait dépasser un quota inconnu le jour où le produit marche.

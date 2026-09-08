# KNOWLEDGE ENGINE

## Objectif

Faire diminuer avec le temps la dépendance à l'IA et aux appels externes.

## Pipeline

```text
Raw input
 → sanitize
 → normalize
 → exact rules
 → known knowledge
 → heuristics
 → ambiguity check
 → optional minimized AI
 → structured candidate
 → validation
 → certified fact
 → deterministic rule/cache
```

## Hiérarchie de confiance

1. source officielle vérifiée ;
2. règle interne versionnée issue d'une source ;
3. connaissance certifiée ;
4. consensus indépendant ;
5. observation unique ;
6. hypothèse IA.

## No auto-trust

Une sortie IA ne devient jamais directement une connaissance globale. Une contribution utilisateur non plus.

## Auto-incrémentation

Un cas nouveau peut générer une `knowledge_candidate` si :

- aucun fait identique n'existe ;
- la valeur est généralisable ;
- elle n'est pas personnelle ;
- son utilité future est supérieure à son coût de maintenance.

## Réutilisation

Avant tout appel IA :

1. exact lookup ;
2. canonicalization ;
3. fuzzy matching contrôlé ;
4. knowledge graph ;
5. règle ;
6. IA si ambigu.

## Quality metrics

- IA calls / 1000 événements ;
- known-hit rate ;
- candidate acceptance rate ;
- contradiction rate ;
- regression rate ;
- knowledge freshness.

## Anti-leakage

Aucune connaissance collective ne doit permettre de réidentifier un utilisateur ou de reconstituer ses documents.

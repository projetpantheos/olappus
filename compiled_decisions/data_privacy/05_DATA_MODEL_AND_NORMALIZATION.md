# 05 — Modèle de données et normalisation

## Principe
RAW DATA IS NOT DOMAIN DATA.
IDENTITY IS NOT DOMAIN DATA.

## Pipeline canonique
SOURCE
→ QUARANTINE
→ EXTRACTION
→ NORMALIZATION
→ MINIMIZATION
→ PSEUDONYMIZATION / ANONYMIZATION
→ DOMAIN DATA
→ suppression du raw si inutile

## Objets
### Source
source_id, source_type, connector_id, external_reference, observed_at, content_hash

### Extraction
extraction_id, source_id, extractor_version, extracted_fields, confidence, created_at

### Normalized Fact
fact_id, subject_type, subject_id, attribute, value, unit, valid_from, valid_until, confidence

### Evidence
evidence_id, fact_id, source_id, source_version, content_hash, captured_at

## Normalisation
Canonique pour :
- montants/devises ;
- dates/heures/fuseaux ;
- unités ;
- marchands ;
- produits ;
- contrats ;
- adresses ;
- identifiants externes.

Les noms d'affichage sont séparés des valeurs canoniques.

## Identifiants
Utiliser des IDs opaques et stables, sans signification personnelle ou métier.

## Géographie
Stocker la précision minimale nécessaire. Exemple : municipality_id plutôt qu'adresse complète si l'adresse n'est pas nécessaire.

## Déduplication
1. déterministe ;
2. probabiliste avec seuil prudent ;
3. revue humaine pour les cas critiques/ambigus.

## Corrections
Versionnées et traçables, jamais silencieusement écrasées.

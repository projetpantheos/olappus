# 14 — Claude Engineering Contract

## Lecture obligatoire avant changement important
Claude lit :
- README_FIRST ;
- DECISIONS_LOCKED ;
- DECISION LEDGER ;
- architecture ;
- Data Registry ;
- manifests ;
- runbooks ;
- état courant.

## Autonomie
Claude peut seul :
- créer/modifier code ;
- refactorer ;
- écrire/exécuter tests ;
- améliorer UI ;
- documenter ;
- travailler sur fixtures synthétiques.

## Validation nécessaire
Claude ne peut pas seul :
- accéder aux secrets/data production ;
- désactiver RLS/tests ;
- modifier une décision verrouillée ;
- modifier confidentialité/sécurité critiques ;
- déployer production ;
- ajouter un fournisseur sensible ;
- introduire une nouvelle catégorie de données ;
- activer une auto-exécution à fort impact.

## Contrôle des imports
Les modules ne s'importent pas mutuellement.
Les violations doivent être détectables automatiquement.

## CI minimale
typecheck
lint
unit
integration
contract
privacy
security
RLS
migration
dependency audit
secret scan
build

Selon risque : E2E, accessibilité, performance.

## Definition of Done
Une fonctionnalité est terminée seulement si :
FUNCTION + ARCHITECTURE + PRIVACY + SECURITY + DATA GOVERNANCE + TESTS + OBSERVABILITY + UX + DOCUMENTATION + ROLLBACK sont conformes.

## Priorité des invariants
1. sécurité
2. confidentialité/minimisation
3. intégrité des données
4. contrats Core
5. fiabilité
6. UX
7. performance
8. coût
9. vitesse de développement

# CASE + ACTION ENGINE

## Case
Un case est un objet transversal qui permet de suivre un problème ou une opportunité jusqu'au résultat.

## State machine
`DETECTED → TRIAGED → EVIDENCE_READY → ACTION_PROPOSED → WAITING_CONFIRMATION → EXECUTING → WAITING_EXTERNAL → RESOLVED / DISMISSED / EXPIRED`

## Action proposal
```ts
interface ActionProposal {
  id: string;
  caseId: string;
  type: string;
  impact: 'low'|'medium'|'high';
  reversibility: 'reversible'|'partially_reversible'|'irreversible';
  requiresConfirmation: boolean;
  recipient?: string;
  payloadPreview: unknown;
  evidenceIds: string[];
}
```

## Confirmation UI
Avant exécution : quoi, pourquoi, pour qui, quelles données, coût/impact, possibilité d'annuler.

## External side effects
Jamais d'envoi/résiliation/achat/paiement automatique dans le prototype sans confirmation.

## Verification
Toute action exécutée doit avoir une vérification post-action lorsque possible : statut, accusé, changement de document, preuve de réception.

## Rollback
Préciser si rollback réel, compensating action ou impossible. Ne jamais afficher “annulable” si ce n'est pas garanti.

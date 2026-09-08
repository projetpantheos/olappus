# 15 — UI Component Specification

## Principes

- mobile-first ;
- 95% produit moderne / 5% héritage grec ;
- ivoire chaud en light ;
- design sobre, premium, calme ;
- couleur de module utilisée comme signal sémantique, pas comme décoration omniprésente.

## Composants minimum

AppShell
BottomNavigation
TopBar
CaseCard
CaseHeader
ConfidenceBadge
EvidenceList
EvidenceItem
PriorityBadge
ActionCard
ActionSheet
PermissionRow
SourceChip
StatusBadge
SyncStatus
EmptyState
ErrorState
Skeleton
Toast
Dialog
ConfirmationSheet
DocumentRow
SubscriptionRow
Timeline
FilterBar
SearchField
SectionHeader

## Variants

Chaque composant définit :

- variant ;
- size ;
- state ;
- semantic color role ;
- interaction ;
- disabled ;
- loading ;
- accessibility label.

## CaseCard

Doit afficher en priorité :

1. problème/situation ;
2. impact ;
3. confiance ;
4. prochaine action.

Ne pas transformer la carte en mini-rapport.

## ActionSheet

Affiche :

- action ;
- destinataire ;
- données envoyées ;
- impact ;
- réversibilité ;
- permission ;
- confirmation nécessaire.

## States

Les composants doivent être compatibles avec AVAILABLE / PARTIAL / BLOCKED / UNKNOWN.

## Interdits

- couleur seule pour représenter un état ;
- icônes ambiguës sans label accessible ;
- animations qui augmentent artificiellement l'attention ;
- dark patterns ;
- boutons d'action ambiguës.

## Component DoD

TypeScript strict + tests + accessibility + snapshot/visual check si utile + documentation d'usage.

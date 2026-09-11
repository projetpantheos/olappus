import { ScreenState } from '../../components/screen-state';
import { Page } from '../../components/layout';

/**
 * Onglet « Mémoire » — navigation primaire de PRD-14 §2.
 *
 * L'onglet existe et déclare son état vide plutôt que d'afficher une page
 * blanche : PRD-14 §15 exige que chaque écran définisse ses états.
 */
export default function MemoireScreen() {
  return (
    <Page testID="memoire-screen">
      <ScreenState
        kind="empty"
        reason="Vos documents et evidences apparaîtront ici, en lecture seule (ADR-0004)."
      />
    </Page>
  );
}

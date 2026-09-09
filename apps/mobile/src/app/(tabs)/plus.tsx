import { StyleSheet, View } from 'react-native';

import { ScreenState } from '../../components/screen-state';
import { color, spacing } from '../../theme/tokens';

/**
 * Onglet « Plus » — navigation primaire de PRD-14 §2.
 *
 * En G4, l'onglet existe et déclare son état vide plutôt que d'afficher une
 * page blanche : PRD-14 §15 exige que chaque écran définisse ses états.
 */
export default function PlusScreen() {
  return (
    <View style={styles.screen} testID="plus-screen">
      <ScreenState
        kind="empty"
        reason="Connexions, permissions, données et contrôles de confidentialité."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: color.surface.ivory,
    flex: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
});

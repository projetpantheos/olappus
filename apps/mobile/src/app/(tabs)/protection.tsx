import { StyleSheet, Text, View } from 'react-native';

import { ScreenState } from '../../components/screen-state';
import { color, fontSize, spacing } from '../../theme/tokens';

/**
 * Onglet « Protection » — navigation primaire de PRD-14 §2.
 *
 * En G4, l'onglet existe et déclare son état vide plutôt que d'afficher une
 * page blanche : PRD-14 §15 exige que chaque écran définisse ses états.
 */
export default function ProtectionScreen() {
  return (
    <View style={styles.screen} testID="protection-screen">
      <Text style={styles.title}>Protection</Text>
      <ScreenState
        kind="empty"
        reason="Vos dossiers, alertes consommateur et preuves apparaîtront ici."
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
  title: { color: color.text.primary, fontSize: fontSize.display, fontWeight: '600' },
});

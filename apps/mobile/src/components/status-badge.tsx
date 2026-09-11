import type { CapabilityState } from '@olappus/core';
import { StyleSheet, Text, View } from 'react-native';

import { color, fontFamily, fontSize, radius, spacing } from '../theme/tokens';

/**
 * `StatusBadge` — `PRD-15`.
 *
 * Porte les quatre états du moteur de capacités : AVAILABLE, PARTIAL, BLOCKED,
 * UNKNOWN. `PRD-15` l'exige de tous les composants, et c'est le seul endroit
 * où cette correspondance est écrite.
 *
 * **Le libellé est le porteur de l'état ; la couleur ne fait que l'appuyer.**
 * `PRD-15` interdit « la couleur seule pour représenter un état », et ce n'est
 * pas une préférence de style : un daltonien, un écran en plein soleil ou une
 * capture en noir et blanc font disparaître la couleur. Le mot reste.
 *
 * `UNKNOWN` ne se replie pas sur « indisponible ». Annoncer une certitude
 * qu'on n'a pas, dans un sens comme dans l'autre, est un mensonge — et le
 * moteur de capacités distingue déjà les deux.
 */

export const ETATS: Readonly<Record<CapabilityState, { label: string; teinte: string }>> = {
  AVAILABLE: { label: 'Disponible', teinte: color.semantic.success },
  PARTIAL: { label: 'Partiellement disponible', teinte: color.semantic.warning },
  BLOCKED: { label: 'Indisponible', teinte: color.semantic.critical },
  UNKNOWN: { label: 'État inconnu', teinte: color.semantic.neutral },
};

export interface StatusBadgeProps {
  readonly state: CapabilityState;
  /** Ce qui explique l'état, en langage compréhensible. Jamais un code. */
  readonly reason?: string;
  readonly testID?: string;
}

export function StatusBadge({ state, reason, testID }: StatusBadgeProps) {
  const { label, teinte } = ETATS[state];

  return (
    <View
      style={styles.badge}
      accessibilityRole="summary"
      accessibilityLabel={reason === undefined ? label : `${label}. ${reason}`}
      testID={testID}
    >
      {/* Pastille purement décorative : elle double le mot, ne le remplace pas. */}
      <View style={[styles.pastille, { backgroundColor: teinte }]} accessibilityElementsHidden />
      <Text style={[styles.label, { color: teinte }]}>{label}</Text>
      {reason !== undefined && <Text style={styles.reason}>{reason}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pastille: { borderRadius: radius.sm, height: 8, width: 8 },
  label: { fontFamily: fontFamily.bodyStrong, fontSize: fontSize.caption },
  reason: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    width: '100%',
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AttentionItem } from '../demo/attention';
import {
  attentionStyle,
  color,
  confidenceLabel,
  fontFamily,
  fontSize,
  radius,
  spacing,
} from '../theme/tokens';

/**
 * Carte d'attention — `PRD-15`.
 *
 * Doit afficher, dans cet ordre : la situation, l'impact, la confiance, la
 * prochaine action. Et ne pas devenir un mini-rapport : le détail vit dans
 * l'écran de Case.
 *
 * Deux règles d'accessibilité, vérifiées par test :
 * - le niveau d'attention porte un **libellé textuel**, jamais la couleur seule ;
 * - la carte expose un libellé accessible complet, pour qu'un lecteur d'écran
 *   restitue la situation sans avoir à parcourir les enfants.
 */
interface CaseCardProps {
  readonly item: AttentionItem;
  readonly onPress?: () => void;
}

export function CaseCard({ item, onPress }: CaseCardProps) {
  const style = attentionStyle[item.level];
  const confidence = confidenceLabel[item.detection.confidence];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${style.label}. ${item.title}. Confiance : ${confidence}.`}
      accessibilityHint="Ouvre le détail de la situation"
      testID={`case-card-${item.id}`}
      style={styles.card}
    >
      <View style={styles.header}>
        {/* Pastille colorée ET libellé : la couleur ne porte jamais seule
            l'information (PRD-15). */}
        <View style={[styles.dot, { backgroundColor: style.color }]} />
        <Text style={[styles.level, { color: style.color }]}>{style.label}</Text>
      </View>

      <Text style={styles.title}>{item.title}</Text>

      <View style={styles.footer}>
        <Text style={styles.confidence}>{confidence}</Text>
        <Text style={styles.evidence}>
          {item.detection.evidence_refs.length} preuve
          {item.detection.evidence_refs.length > 1 ? 's' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  dot: { borderRadius: radius.sm, height: 10, width: 10 },
  level: { fontFamily: fontFamily.bodyStrong, fontSize: fontSize.caption },
  title: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  footer: { flexDirection: 'row', gap: spacing.md },
  confidence: { color: color.text.secondary, fontSize: fontSize.caption },
  evidence: { color: color.text.secondary, fontSize: fontSize.caption },
});

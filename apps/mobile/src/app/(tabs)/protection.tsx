import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  KNOWLEDGE_SOURCES,
  isIngestible,
  legalKnowledgeAvailable,
  type KnowledgeSourceState,
} from '../../demo/knowledge';
import { color, fontFamily, fontSize, radius, spacing } from '../../theme/tokens';

/**
 * Protection — provenance de la connaissance (`PRD-14` Journey J).
 *
 * En l'état, aucune source n'est approuvée : Olappus ne peut donc rien affirmer
 * en matière de droits. L'écran l'explique au lieu de se taire.
 *
 * C'est une exigence, pas une concession : `PRD-14` Journey E impose
 * d'expliquer la limite plutôt que de surinterpréter, et `docs/10` interdit de
 * présenter une analyse comme une affirmation juridique.
 */
export default function ProtectionScreen() {
  const available = legalKnowledgeAvailable();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="protection-screen"
    >
      <View style={styles.notice} accessibilityRole="summary">
        <Text style={styles.noticeTitle}>
          {available
            ? 'Connaissances juridiques disponibles'
            : 'Aucune connaissance juridique disponible'}
        </Text>
        <Text style={styles.body}>
          {available
            ? 'Olappus s’appuie sur des sources officielles vérifiées.'
            : 'Olappus ne vous dira rien sur vos droits tant qu’aucune source officielle n’a été vérifiée. Il préfère se taire qu’affirmer une chose incertaine.'}
        </Text>
      </View>

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Sources
      </Text>

      {KNOWLEDGE_SOURCES.map((source) => (
        <SourceRow key={source.id} source={source} />
      ))}

      <Text style={styles.footnote}>
        Une source n’est utilisée qu’après vérification de sa licence et de ses conditions. Tant que
        ce n’est pas fait, elle reste inactive.
      </Text>
    </ScrollView>
  );
}

function SourceRow({ source }: { source: KnowledgeSourceState }) {
  const usable = isIngestible(source);
  // Le statut est écrit, pas seulement coloré (`PRD-15`).
  const label = usable ? 'Vérifiée' : 'Non vérifiée';

  return (
    <View
      style={styles.source}
      accessibilityRole="summary"
      accessibilityLabel={`${source.name}. ${label}.`}
      testID={`source-${source.id}`}
    >
      <View style={styles.sourceHeader}>
        <Text style={styles.sourceName}>{source.name}</Text>
        <Text style={[styles.sourceStatus, usable ? styles.statusOk : styles.statusPending]}>
          {label}
        </Text>
      </View>
      {source.blocking.map((reason) => (
        <Text key={reason} style={styles.blocking}>
          • {reason}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: color.surface.ivory, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg },
  notice: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  noticeTitle: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  sectionTitle: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  source: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  sourceHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sourceName: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  sourceStatus: { fontFamily: fontFamily.body, fontSize: fontSize.caption },
  statusOk: { color: color.semantic.success },
  statusPending: { color: color.semantic.warning },
  blocking: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
  },
  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
  footnote: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
});

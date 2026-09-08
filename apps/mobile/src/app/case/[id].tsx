import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenState } from '../../components/screen-state';
import { explain, findAttentionItem } from '../../demo/attention';
import {
  attentionStyle,
  color,
  confidenceLabel,
  fontSize,
  radius,
  spacing,
} from '../../theme/tokens';

/**
 * Détail d'une situation — parcours `WHY → PROOF → OPTIONS → ACTION`
 * (`PRD-01`, `PRD-14` §6 et §14).
 *
 * Quatre exigences tenues ici :
 * 1. **WHY** : l'explication est chiffrée et provient de la règle, pas d'une
 *    formule décorative.
 * 2. **PROOF** : les preuves utilisées sont listées, avec la règle et sa
 *    version — sans elles, l'explication n'est pas reproductible.
 * 3. **CONFIDENCE** : affichée en langage humain, jamais en pourcentage inventé.
 * 4. **ACTION** : préparée, jamais exécutée. `PRD-01` : READ → SUGGEST →
 *    PREPARE → EXECUTE_WITH_CONFIRMATION, et aucune auto-exécution en P0.
 */
export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const item = useMemo(
    () =>
      id ? findAttentionItem(new Date('2026-09-08T00:00:00Z'), decodeURIComponent(id)) : undefined,
    [id],
  );

  if (!item) {
    return (
      <ScreenState kind="unknown" reason="Cette situation n’existe pas ou n’est plus disponible." />
    );
  }

  const style = attentionStyle[item.level];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="case-screen">
      <View style={styles.header}>
        <Text style={[styles.level, { color: style.color }]}>{style.label}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.confidence}>
          Confiance : {confidenceLabel[item.detection.confidence]}
        </Text>
      </View>

      <Section title="Pourquoi">
        <Text style={styles.body}>{explain(item.detection)}</Text>
      </Section>

      <Section title="Preuves">
        {item.detection.evidence_refs.map((ref) => (
          <Text key={ref} style={styles.body} testID={`evidence-${ref}`}>
            • {ref}
          </Text>
        ))}
        <Text style={styles.provenance}>
          Règle {item.detection.rule_id} (version {item.detection.rule_version})
        </Text>
      </Section>

      <Section title="Ce que cela implique">
        <Text style={styles.body}>{item.scenario.what_the_user_should_understand}</Text>
      </Section>

      <Section title="Options">
        <Text style={styles.body}>• Préparer une démarche</Text>
        <Text style={styles.body}>• Reporter à plus tard</Text>
        <Text style={styles.body}>• Ignorer cette situation</Text>
      </Section>

      {/* PRD-15 : ne jamais présenter une action comme exécutable si elle ne
          l'est pas. En G4, aucune action externe n'existe : le dire est plus
          honnête que d'afficher un bouton inerte. */}
      <View style={styles.actionNotice} accessibilityRole="summary">
        <Text style={styles.actionTitle}>Aucune action n’est exécutée à ce stade</Text>
        <Text style={styles.body}>
          Olappus prépare, vous confirmez. En mode démonstration, aucune démarche n’est réellement
          engagée.
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: color.surface.ivory, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg },
  header: { gap: spacing.xs },
  level: { fontSize: fontSize.caption, fontWeight: '600' },
  title: { color: color.text.primary, fontSize: fontSize.title, fontWeight: '600' },
  confidence: { color: color.text.secondary, fontSize: fontSize.caption },
  section: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  sectionTitle: { color: color.text.primary, fontSize: fontSize.subtitle, fontWeight: '600' },
  body: { color: color.text.primary, fontSize: fontSize.body },
  provenance: { color: color.text.secondary, fontSize: fontSize.caption },
  actionNotice: {
    borderColor: color.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  actionTitle: { color: color.text.primary, fontSize: fontSize.body, fontWeight: '600' },
});

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CaseCard } from '../../components/case-card';
import { ScreenState } from '../../components/screen-state';
import { demoAttentionItems } from '../../demo/attention';
import { color, fontSize, spacing } from '../../theme/tokens';

/**
 * Hélios — « Aujourd'hui ».
 *
 * `PRD-01` : l'inbox d'attention répond à « qu'est-ce qui mérite mon attention
 * maintenant ? ». Ce n'est ni un tableau de bord de modules, ni un chatbot.
 *
 * `PRD-01` encore : **si rien d'important n'est détecté, Olappus reste
 * silencieux**. L'écran vide n'est donc pas un échec à masquer, c'est le
 * comportement attendu — et il dit qu'Olappus a bien regardé.
 *
 * En G4, la source est le Demo Mode : mêmes objets métier, mêmes moteurs
 * déterministes, aucun appel externe.
 */
export default function TodayScreen() {
  const router = useRouter();

  // L'horloge est figée par scénario en G4 : l'écran doit être reproductible,
  // sinon son contenu changerait sans explication d'un jour à l'autre.
  const items = useMemo(() => demoAttentionItems(new Date('2026-09-08T00:00:00Z')), []);

  if (items.length === 0) {
    return <ScreenState kind="empty" />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="today-screen">
      <View style={styles.header}>
        <Text style={styles.greeting}>Aujourd’hui</Text>
        <Text style={styles.summary} accessibilityRole="summary">
          {items.length} situation{items.length > 1 ? 's' : ''} méritent votre attention.
        </Text>
      </View>

      {items.map((item) => (
        <CaseCard
          key={item.id}
          item={item}
          onPress={() => router.push(`/case/${encodeURIComponent(item.id)}`)}
        />
      ))}

      <Text style={styles.demoNotice}>
        Mode démonstration : ces situations reposent sur des données synthétiques.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: color.surface.ivory, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg },
  header: { gap: spacing.xs },
  greeting: { color: color.text.primary, fontSize: fontSize.display, fontWeight: '600' },
  summary: { color: color.text.secondary, fontSize: fontSize.body },
  demoNotice: {
    color: color.text.secondary,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

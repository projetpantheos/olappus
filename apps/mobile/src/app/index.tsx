import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { color, fontFamily, fontSize, radius, spacing } from '../theme/tokens';

/**
 * Première valeur — `PRD-14` Journey A.
 *
 * « Comprendre la valeur avant de demander beaucoup de données. » Cet écran ne
 * demande **aucune permission**, ne propose **aucune connexion**, et mène
 * directement à un cas concret.
 *
 * `docs/03_UX_SPEC` : ne pas demander huit permissions d'un coup. Ici, zéro.
 *
 * La proposition de connecter une source viendra **au moment où elle devient
 * utile**, pas au démarrage — c'est l'étape 5 du parcours, et elle n'existe pas
 * encore : aucun connecteur n'est implémenté avant G6.
 */
export default function AccueilScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.content} testID="bienvenue-screen">
      <View style={styles.hero}>
        <Text style={styles.wordmark} accessibilityRole="header">
          OLAPPUS
        </Text>
        <Text style={styles.promise}>Et si les dieux étaient avec vous ?</Text>
      </View>

      <Text style={styles.subtitle}>
        Olappus surveille, comprend et protège votre quotidien — et ne vous sollicite que lorsque
        c’est nécessaire.
      </Text>

      <View style={styles.principles}>
        <Principle
          title="Peu de sollicitations"
          body="S’il n’y a rien d’important, Olappus se tait. Le silence est un comportement, pas une panne."
        />
        <Principle
          title="Toujours des preuves"
          body="Chaque situation dit pourquoi, sur quoi elle se fonde, et avec quel niveau de certitude."
        />
        <Principle
          title="Vous décidez"
          body="Olappus prépare les démarches. Il n’en engage aucune sans votre confirmation."
        />
      </View>

      <Pressable
        onPress={() => router.replace('/aujourdhui')}
        accessibilityRole="button"
        accessibilityLabel="Voir un exemple concret"
        accessibilityHint="Ouvre le mode démonstration, sans connexion ni permission"
        style={styles.cta}
        testID="cta-demo"
      >
        <Text style={styles.ctaLabel}>Voir un exemple concret</Text>
      </Pressable>

      <Text style={styles.reassurance}>
        Aucune connexion, aucune permission, aucune donnée personnelle à ce stade.
      </Text>
    </ScrollView>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.principle}>
      <Text style={styles.principleTitle}>{title}</Text>
      <Text style={styles.principleBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: color.surface.ivory,
    flexGrow: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  hero: { alignItems: 'center', gap: spacing.sm },
  wordmark: {
    color: color.text.primary,
    fontFamily: fontFamily.display,
    fontSize: fontSize.display,
    letterSpacing: 4,
  },
  promise: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.subtitle,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  subtitle: {
    color: color.text.primary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  principles: { gap: spacing.lg },
  principle: { gap: spacing.xs },
  principleTitle: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  principleBody: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: color.semantic.attention,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ctaLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  reassurance: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
});

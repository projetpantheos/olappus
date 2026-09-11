import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { color, fontFamily, fontSize, radius, spacing } from '../../theme/tokens';

/**
 * « Plus » — point d'entrée de « Mon contrôle » (`PRD-14` Journeys G, H, I).
 *
 * Ces trois parcours ne sont pas des réglages avancés à enterrer sous deux
 * niveaux de menu. Ce sont **les écrans qui décident de la confiance**, et
 * `docs/UX_DESIGN_PLAN` §6 le dit sans détour. Ils sont donc au premier niveau,
 * chacun accompagné de ce qu'il permet réellement de faire — pas d'un intitulé
 * abstrait dont on ne sait pas s'il vaut la peine d'être ouvert.
 */

const ENTREES = [
  {
    href: '/controle/connecter',
    titre: 'Connecter un service',
    description:
      'Ce qui sera demandé, ce qui restera impossible, et pourquoi votre secret de récupération doit exister avant.',
    testID: 'entree-connecter',
  },
  {
    href: '/controle/connexions',
    titre: 'Services connectés',
    description:
      'Voir ce que chaque accès permet, et le retirer. Se déconnecter n’est pas supprimer : l’écran l’explique avant que vous choisissiez.',
    testID: 'entree-connexions',
  },
  {
    href: '/controle/donnees',
    titre: 'Mes données',
    description:
      'Supprimer par catégorie, en sachant ce que chaque disparition change. La suppression est ensuite vérifiée, emplacement par emplacement.',
    testID: 'entree-donnees',
  },
  {
    href: '/controle/permissions',
    titre: 'Ce qu’Olappus peut faire',
    description:
      'Choisir jusqu’où il va, action par action. L’exécution automatique n’est pas proposée.',
    testID: 'entree-permissions',
  },
  {
    href: '/recuperation',
    titre: 'Secret de récupération',
    description:
      'La clé de vos données chiffrées. Sans elle, personne ne peut les ouvrir — nous non plus.',
    testID: 'entree-recuperation',
  },
] as const;

export default function PlusScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="plus-screen">
      <View style={styles.notice} accessibilityRole="summary">
        <Text style={styles.noticeTitre}>Mon contrôle</Text>
        <Text style={styles.body}>
          Ce qu’Olappus sait, ce qu’il peut faire, et comment le lui retirer.
        </Text>
      </View>

      {ENTREES.map((entree) => (
        <Link key={entree.href} href={entree.href} asChild>
          <Pressable
            style={styles.entree}
            accessibilityRole="link"
            accessibilityLabel={`${entree.titre}. ${entree.description}`}
            testID={entree.testID}
          >
            <Text style={styles.titre}>{entree.titre}</Text>
            <Text style={styles.body}>{entree.description}</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
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
  noticeTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  entree: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  titre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
});

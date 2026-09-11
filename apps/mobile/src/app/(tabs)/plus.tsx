import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Body, Card, Page, Strong, Title } from '../../components/layout';
import { color, radius, spacing } from '../../theme/tokens';

/**
 * « Plus » — point d'entrée de « Mon contrôle » (`PRD-14` Journeys B, G, H, I).
 *
 * Ces parcours ne sont pas des réglages avancés à enterrer sous deux niveaux
 * de menu. Ce sont **les écrans qui décident de la confiance**, et
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
    <Page testID="plus-screen">
      <Card>
        <Title>Mon contrôle</Title>
        <Body>Ce qu’Olappus sait, ce qu’il peut faire, et comment le lui retirer.</Body>
      </Card>

      {ENTREES.map((entree) => (
        <Link key={entree.href} href={entree.href} asChild>
          <Pressable
            style={styles.entree}
            accessibilityRole="link"
            accessibilityLabel={`${entree.titre}. ${entree.description}`}
            testID={entree.testID}
          >
            <Strong>{entree.titre}</Strong>
            <Body>{entree.description}</Body>
          </Pressable>
        </Link>
      ))}
    </Page>
  );
}

/** Une entrée de menu est cliquable : `Card` ne l'est pas, et ne doit pas l'être. */
const styles = StyleSheet.create({
  entree: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
});

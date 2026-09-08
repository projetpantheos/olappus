import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { color, fontSize, spacing } from '../theme/tokens';

/**
 * États d'écran — `PRD-14` §15.
 *
 * Chaque écran doit définir ses états. Les regrouper ici évite que chacun
 * invente les siens, et rend le contrat vérifiable par un test.
 *
 * `blocked` et `unknown` portent **toujours** une raison : `PRD-15` interdit
 * d'afficher un état sans explication, et `ARC-41` produit précisément ce
 * code de raison.
 */
export type ScreenStateKind =
  'loading' | 'empty' | 'error' | 'degraded' | 'offline' | 'blocked' | 'unknown';

interface ScreenStateProps {
  readonly kind: ScreenStateKind;
  /** Obligatoire pour `blocked` et `unknown` : un état sans raison est inutile. */
  readonly reason?: string;
}

const CONTENT: Record<ScreenStateKind, { title: string; body: string }> = {
  loading: { title: 'Chargement', body: 'Olappus rassemble vos informations.' },
  empty: {
    title: 'Rien à signaler',
    body: 'Olappus a regardé et n’a rien trouvé qui mérite votre attention.',
  },
  error: {
    title: 'Une erreur est survenue',
    body: 'Vos données sont intactes. Vous pouvez réessayer.',
  },
  degraded: {
    title: 'Connexion limitée',
    body: 'Certaines informations peuvent ne pas être à jour.',
  },
  offline: {
    title: 'Hors ligne',
    body: 'Vous pouvez consulter ce qui est déjà là. Les actions attendront la reconnexion.',
  },
  blocked: { title: 'Indisponible', body: '' },
  unknown: { title: 'Information indisponible', body: '' },
};

export function ScreenState({ kind, reason }: ScreenStateProps) {
  const content = CONTENT[kind];
  // Le libellé d'état est textuel : la couleur ne porte jamais seule le sens
  // (`PRD-15`).
  const body = reason ?? content.body;

  return (
    <View style={styles.container} accessibilityRole="summary" testID={`screen-state-${kind}`}>
      {kind === 'loading' ? (
        <ActivityIndicator accessibilityLabel="Chargement en cours" color={color.text.secondary} />
      ) : null}
      <Text style={styles.title}>{content.title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  title: {
    color: color.text.primary,
    fontSize: fontSize.subtitle,
    fontWeight: '600',
    textAlign: 'center',
  },
  body: {
    color: color.text.secondary,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
});

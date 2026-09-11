import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { color, elevation, fontFamily, fontSize, radius, spacing } from '../theme/tokens';

/**
 * Primitives de mise en page — la couche qui manquait.
 *
 * Avant le 2026-09-11, **dix-huit fichiers** déclaraient chacun leur propre
 * `StyleSheet` avec des définitions quasi identiques de carte, de titre, de
 * texte et de bouton. Ce n'était pas seulement de la duplication : c'était le
 * mécanisme par lequel l'incohérence visuelle allait s'installer, un écran
 * après l'autre, sans que personne ne le voie.
 *
 * Ces primitives ne sont pas un cadre d'interface. Elles sont l'endroit unique
 * où « à quoi ressemble une carte » est écrit. Un écran qui a besoin d'autre
 * chose doit d'abord se demander pourquoi lui seul en a besoin.
 *
 * Les jetons de `PRD-16` restent la source des valeurs ; ce module n'invente
 * aucune couleur, aucune taille, aucun espacement.
 */

// =============================================================================
// Tons
// =============================================================================

/**
 * Le ton d'une surface — jamais son seul porteur de sens.
 *
 * `PRD-15` interdit « la couleur seule pour représenter un état ». Un ton
 * **appuie** un propos que le texte porte déjà ; il ne le remplace jamais. Un
 * bloc `critique` sans phrase qui dit le danger est un bloc mal écrit.
 */
export type Tone = 'neutral' | 'attention' | 'warning' | 'critical' | 'success';

const TONE_BORDER: Readonly<Record<Tone, string>> = {
  neutral: color.border.default,
  attention: color.semantic.attention,
  warning: color.semantic.warning,
  critical: color.semantic.critical,
  success: color.semantic.success,
};

// =============================================================================
// Page
// =============================================================================

export interface PageProps {
  readonly children: ReactNode;
  readonly testID?: string;
}

/** Enveloppe de tout écran : fond, rythme vertical, marges. */
export function Page({ children, testID }: PageProps) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} testID={testID}>
      {children}
    </ScrollView>
  );
}

// =============================================================================
// Card
// =============================================================================

export interface CardProps {
  readonly children: ReactNode;
  readonly tone?: Tone;
  /** Épaissit la bordure. Réservé au bloc qui porte la décision de l'écran. */
  readonly emphasis?: boolean;
  readonly style?: ViewStyle;
  readonly accessibilityRole?: 'summary' | 'alert';
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}

export function Card({
  children,
  tone = 'neutral',
  emphasis = false,
  style,
  accessibilityRole = 'summary',
  accessibilityLabel,
  testID,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { borderColor: TONE_BORDER[tone], borderWidth: emphasis ? 2 : 1 },
        style,
      ]}
      accessibilityRole={accessibilityRole}
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      testID={testID}
    >
      {children}
    </View>
  );
}

// =============================================================================
// Typographie
// =============================================================================

/**
 * Quatre paliers, et pas un de plus.
 *
 * `page` ouvre l'écran, `section` sépare, `card` nomme un bloc, `corps` porte
 * le propos. Cinzel est réservée au palier `page` : `docs/04` prévient que
 * « les titres ne doivent pas devenir théâtraux », et une serif d'affichage
 * répétée dix fois par écran l'est.
 */
export type TitleLevel = 'page' | 'section' | 'card';

export interface TitleProps {
  readonly children: ReactNode;
  readonly level?: TitleLevel;
  readonly testID?: string;
}

export function Title({ children, level = 'card', testID }: TitleProps) {
  return (
    <Text style={styles[`title_${level}`]} accessibilityRole="header" testID={testID}>
      {children}
    </Text>
  );
}

export function Body({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <Text style={styles.body} testID={testID}>
      {children}
    </Text>
  );
}

/** Texte fort dans le flux : une conséquence, une perte, un chiffre qui pèse. */
export function Strong({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <Text style={[styles.strong, tone === 'neutral' ? null : { color: TONE_BORDER[tone] }]}>
      {children}
    </Text>
  );
}

/** Sur-titre d'une liste de valeurs. Court, en capitales, jamais une phrase. */
export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** Précision de second plan : une limite, une date, une réserve. */
export function Caption({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <Text style={styles.caption} testID={testID}>
      {children}
    </Text>
  );
}

/** Élément d'énumération. Le point est décoratif ; le texte porte tout. */
export function Bullet({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>• {children}</Text>;
}

// =============================================================================
// Button
// =============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
  /** Le libellé **est** l'action. `PRD-15` interdit « Continuer » et « OK ». */
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly disabled?: boolean;
  readonly busy?: boolean;
  /** Complète le libellé quand l'action mérite d'être dite plus longuement. */
  readonly accessibilityLabel?: string;
  readonly accessibilityHint?: string;
  readonly testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const inerte = disabled || busy;
  return (
    <Pressable
      style={[styles[`button_${variant}`], inerte && styles.button_inert]}
      onPress={onPress}
      disabled={inerte}
      accessibilityRole="button"
      accessibilityState={{ disabled: inerte, busy }}
      accessibilityLabel={accessibilityLabel ?? label}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      testID={testID}
    >
      <Text style={variant === 'secondary' ? styles.buttonLabelDark : styles.buttonLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

// =============================================================================

const styles = StyleSheet.create({
  page: { backgroundColor: color.surface.ivory, flex: 1 },
  pageContent: { gap: spacing.lg, padding: spacing.lg },

  card: {
    backgroundColor: color.surface.white,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.lg,
    ...elevation.card,
  },

  title_page: {
    color: color.text.primary,
    fontFamily: fontFamily.display,
    fontSize: fontSize.title,
  },
  title_section: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.section,
    marginTop: spacing.sm,
  },
  title_card: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },

  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
  strong: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  label: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  caption: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
  },

  button_primary: {
    alignItems: 'center',
    backgroundColor: color.semantic.attention,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  button_secondary: {
    alignItems: 'center',
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  button_danger: {
    alignItems: 'center',
    backgroundColor: color.semantic.critical,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  button_inert: { backgroundColor: color.semantic.neutral, borderColor: color.semantic.neutral },
  buttonLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  buttonLabelDark: {
    color: color.text.primary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
  },
});

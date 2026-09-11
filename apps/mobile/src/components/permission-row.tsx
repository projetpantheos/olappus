import type { PermissionLevel } from '@olappus/core';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { color, fontFamily, fontSize, radius, spacing } from '../theme/tokens';

/**
 * `PermissionRow` — `PRD-15`, `PRD-14` Journey G.
 *
 * Journey G impose de **demander le niveau exact**, pas un accord global. Cette
 * ligne présente donc un niveau, ce qu'il permet, ce qu'il ne permet pas, et
 * son état actuel.
 *
 * **« Ce qui reste impossible » est affiché autant que ce qui devient
 * possible.** Une demande de permission qui n'énumère que des gains est une
 * demande à laquelle on ne peut pas répondre en connaissance de cause.
 *
 * Aucune valeur par défaut n'est cochée : `PRD-15` interdit les dark patterns,
 * et une case pré-cochée est un consentement qu'on n'a pas donné.
 */

export interface PermissionRowProps {
  readonly level: PermissionLevel;
  readonly title: string;
  /** Ce que ce niveau permet. */
  readonly allows: readonly string[];
  /** Ce qu'il ne permet pas — la moitié qu'on oublie d'écrire. */
  readonly forbids: readonly string[];
  readonly granted: boolean;
  readonly onToggle: (level: PermissionLevel) => void;
  readonly testID?: string;
}

export function PermissionRow({
  level,
  title,
  allows,
  forbids,
  granted,
  onToggle,
  testID,
}: PermissionRowProps) {
  const etat = granted ? 'Accordée' : 'Non accordée';

  return (
    <Pressable
      style={[styles.row, granted && styles.rowAccordee]}
      onPress={() => {
        onToggle(level);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: granted }}
      accessibilityLabel={`${title}. ${etat}.`}
      testID={testID}
    >
      <View style={styles.entete}>
        <Text style={styles.titre}>{title}</Text>
        {/* L'état est écrit, jamais seulement coloré (`PRD-15`). */}
        <Text style={[styles.etat, granted ? styles.etatAccordee : styles.etatRefusee]}>
          {etat}
        </Text>
      </View>

      <Text style={styles.libelle}>Ce que cela permet</Text>
      {allows.map((element) => (
        <Text key={element} style={styles.detail}>
          • {element}
        </Text>
      ))}

      <Text style={styles.libelle}>Ce qui reste impossible</Text>
      {forbids.map((element) => (
        <Text key={element} style={styles.detail}>
          • {element}
        </Text>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  rowAccordee: { borderColor: color.semantic.success, borderWidth: 2 },
  entete: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  titre: {
    color: color.text.primary,
    flexShrink: 1,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  etat: { fontFamily: fontFamily.bodyStrong, fontSize: fontSize.caption },
  etatAccordee: { color: color.semantic.success },
  etatRefusee: { color: color.text.secondary },
  libelle: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  detail: { color: color.text.primary, fontFamily: fontFamily.body, fontSize: fontSize.body },
});

import type { PermissionLevel } from '@olappus/core';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { color, fontFamily, fontSize, radius, spacing } from '../theme/tokens';

/**
 * `ActionSheet` — `PRD-15`, `PRD-14` Journey G.
 *
 * `PRD-15` énumère **sept** éléments obligatoires : action, destinataire,
 * données envoyées, impact, réversibilité, permission, confirmation. Ils sont
 * ici des propriétés **requises**, pas des options — un ActionSheet à qui il
 * manquerait l'impact ou la réversibilité ne compilerait pas.
 *
 * C'est délibéré. Cet écran est le dernier moment où quelqu'un peut dire non,
 * et c'est exactement celui qu'on abrège quand on veut faire monter un taux de
 * conversion. Le rendre impossible à abréger est plus solide qu'une consigne.
 *
 * `PRD-15` interdit par ailleurs les « boutons d'action ambiguës » : le bouton
 * de confirmation porte le verbe de l'action, jamais « Continuer » ou « OK ».
 */

const NIVEAUX: Readonly<Record<PermissionLevel, string>> = {
  READ: 'Lecture seule',
  SUGGEST: 'Proposition, sans exécution',
  PREPARE: 'Préparation, sans envoi',
  EXECUTE_WITH_CONFIRMATION: 'Exécution après votre confirmation',
  AUTO_EXECUTE: 'Exécution automatique',
};

export interface ActionSheetProps {
  /** Ce qui sera fait, formulé par un verbe. */
  readonly action: string;
  /** Qui le recevra. Jamais une adresse extraite d'un contenu non fiable. */
  readonly recipient: string;
  /** Ce qui sera transmis, énuméré. « Vos données » n'est pas une réponse. */
  readonly data: readonly string[];
  /** Ce que cela change pour la personne. */
  readonly impact: string;
  /** Peut-on revenir en arrière, et comment. */
  readonly reversibility: string;
  readonly permission: PermissionLevel;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly testID?: string;
}

export function ActionSheet({
  action,
  recipient,
  data,
  impact,
  reversibility,
  permission,
  onConfirm,
  onCancel,
  testID,
}: ActionSheetProps) {
  return (
    <View style={styles.sheet} accessibilityRole="summary" testID={testID}>
      <Text style={styles.titre}>{action}</Text>

      <Ligne libelle="Destinataire" valeur={recipient} testID="action-destinataire" />

      <View style={styles.ligne} testID="action-donnees">
        <Text style={styles.libelle}>Données envoyées</Text>
        {data.length === 0 ? (
          <Text style={styles.valeur}>Aucune donnée ne sort de votre appareil.</Text>
        ) : (
          data.map((element) => (
            <Text key={element} style={styles.valeur}>
              • {element}
            </Text>
          ))
        )}
      </View>

      <Ligne libelle="Ce que cela change" valeur={impact} testID="action-impact" />
      <Ligne libelle="Retour en arrière" valeur={reversibility} testID="action-reversibilite" />
      <Ligne libelle="Permission" valeur={NIVEAUX[permission]} testID="action-permission" />

      <View style={styles.boutons}>
        <Pressable
          style={styles.annuler}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Ne rien faire"
          testID="action-annuler"
        >
          <Text style={styles.annulerLabel}>Ne rien faire</Text>
        </Pressable>

        <Pressable
          style={styles.confirmer}
          onPress={onConfirm}
          accessibilityRole="button"
          // Le libellé reprend l'action : « Continuer » ou « OK » laisseraient
          // quelqu'un confirmer sans savoir quoi (`PRD-15`, interdits).
          accessibilityLabel={action}
          testID="action-confirmer"
        >
          <Text style={styles.confirmerLabel}>{action}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Ligne({ libelle, valeur, testID }: { libelle: string; valeur: string; testID: string }) {
  return (
    <View style={styles.ligne} accessibilityLabel={`${libelle} : ${valeur}`} testID={testID}>
      <Text style={styles.libelle}>{libelle}</Text>
      <Text style={styles.valeur}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  titre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  ligne: { gap: spacing.xs },
  libelle: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    textTransform: 'uppercase',
  },
  valeur: { color: color.text.primary, fontFamily: fontFamily.body, fontSize: fontSize.body },
  boutons: { flexDirection: 'row', gap: spacing.md },
  annuler: {
    alignItems: 'center',
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    padding: spacing.lg,
  },
  annulerLabel: {
    color: color.text.primary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
  },
  confirmer: {
    alignItems: 'center',
    backgroundColor: color.semantic.attention,
    borderRadius: radius.md,
    flex: 1,
    padding: spacing.lg,
  },
  confirmerLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
});

import type { PermissionLevel } from '@olappus/core';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionSheet } from '../../components/action-sheet';
import { PermissionRow } from '../../components/permission-row';
import { NIVEAUX_PROPOSES } from '../../demo/controle';
import { color, fontFamily, fontSize, radius, spacing } from '../../theme/tokens';

/**
 * Permission — `PRD-14` Journey G.
 *
 * Le parcours commence par une action **bloquée**, et c'est le bon ordre : on
 * ne demande pas une permission « pour plus tard », on la demande au moment où
 * elle sert, pour une chose précise. Une demande hors contexte n'est pas une
 * demande, c'est une collecte.
 *
 * Le niveau exact est demandé, pas un accord global. Et `AUTO_EXECUTE`
 * n'est pas proposé : `docs/10` veut qu'aucune action externe ne parte sans
 * confirmation, et offrir le niveau reviendrait à inviter à s'en passer.
 */
export default function PermissionsScreen() {
  const [accorde, setAccorde] = useState<PermissionLevel | null>(null);
  const [execute, setExecute] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="permissions">
      <View style={styles.blocage} accessibilityRole="alert" testID="action-bloquee">
        <Text style={styles.blocageTitre}>Cette action est bloquée</Text>
        <Text style={styles.body}>
          Olappus a repéré un abonnement dont le prix a augmenté, et sait rédiger la demande de
          résiliation. Il ne peut rien faire de plus sans votre accord.
        </Text>
      </View>

      <View style={styles.pourquoi} accessibilityRole="summary" testID="pourquoi">
        <Text style={styles.sectionTitre}>Pourquoi cet accord est nécessaire</Text>
        <Text style={styles.body}>
          Envoyer une demande engage quelque chose en votre nom. Nous ne le ferons jamais sans que
          vous ayez dit jusqu’où vous allez.
        </Text>
      </View>

      <Text style={styles.sectionTitre} accessibilityRole="header">
        Jusqu’où Olappus peut aller
      </Text>

      {NIVEAUX_PROPOSES.map((option) => (
        <PermissionRow
          key={option.niveau}
          level={option.niveau}
          title={option.titre}
          allows={option.permet}
          forbids={option.interdit}
          granted={accorde === option.niveau}
          onToggle={(niveau) => {
            setAccorde(accorde === niveau ? null : niveau);
            setExecute(false);
          }}
          testID={`niveau-${option.niveau}`}
        />
      ))}

      <Text style={styles.footnote} testID="auto-execute-absent">
        L’exécution automatique, sans confirmation, n’est pas proposée. Olappus n’engage jamais une
        démarche que vous n’avez pas vue partir.
      </Text>

      {accorde !== null && !execute && (
        <ActionSheet
          action="Envoyer la demande de résiliation"
          recipient="Service client — Marchand de démonstration"
          data={['Votre numéro de contrat', 'La date de la hausse constatée']}
          impact="Le marchand disposera du délai légal pour répondre."
          reversibility="Vous pouvez annuler tant que le message n’est pas parti."
          permission={accorde}
          onConfirm={() => {
            setExecute(true);
          }}
          onCancel={() => {
            setAccorde(null);
          }}
          testID="feuille-action"
        />
      )}

      {execute && (
        <View style={styles.journal} accessibilityRole="summary" testID="journal-audit">
          <Text style={styles.sectionTitre}>Inscrit au journal</Text>
          <Text style={styles.body}>
            La demande est partie, et la trace en est conservée : quoi, quand, sur quelle
            autorisation. Ce journal est anonymisé à la clôture et ne peut pas être réécrit — il
            existe pour vous, pas pour nous.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: color.surface.ivory, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg },
  blocage: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.warning,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  blocageTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  pourquoi: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  sectionTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  footnote: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
  },
  journal: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.success,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
});

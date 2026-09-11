import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES, VERIFICATION_SUPPRESSION } from '../../demo/controle';
import { color, fontFamily, fontSize, radius, spacing } from '../../theme/tokens';

/**
 * Suppression — `PRD-14` Journey H.
 *
 * Le parcours se termine par une étape que presque personne n'implémente :
 * **la vérification**. Supprimer sans montrer ce qui a été supprimé, c'est
 * demander qu'on vous croie sur parole, au moment précis où l'on n'a plus
 * aucune raison de le faire.
 *
 * L'écran énumère donc les emplacements réellement purgés, **et ceux qu'il ne
 * peut pas encore vérifier**. `SEC-33` en recense douze ; six existent. Les six
 * autres ne sont pas « en cours » : ils n'existent pas, et le dire vaut mieux
 * que de laisser croire à une purge complète.
 */
export default function DonneesScreen() {
  const [choisies, setChoisies] = useState<readonly string[]>([]);
  const [confirme, setConfirme] = useState(false);
  const [supprime, setSupprime] = useState(false);

  const bascule = (id: string): void => {
    setChoisies((avant) => (avant.includes(id) ? avant.filter((x) => x !== id) : [...avant, id]));
    setConfirme(false);
  };

  const selection = CATEGORIES.filter((c) => choisies.includes(c.id));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="donnees">
      <View style={styles.notice} accessibilityRole="summary">
        <Text style={styles.noticeTitre}>Vos données, catégorie par catégorie</Text>
        <Text style={styles.body}>
          Choisissez ce que vous voulez supprimer. Chaque catégorie dit ce qu’elle contient et ce
          que sa disparition change.
        </Text>
      </View>

      {CATEGORIES.map((categorie) => (
        <Pressable
          key={categorie.id}
          style={[styles.carte, choisies.includes(categorie.id) && styles.carteChoisie]}
          onPress={() => {
            bascule(categorie.id);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: choisies.includes(categorie.id) }}
          accessibilityLabel={`${categorie.titre}. ${choisies.includes(categorie.id) ? 'Sélectionnée' : 'Non sélectionnée'}.`}
          testID={`categorie-${categorie.id}`}
        >
          <Text style={styles.titre}>{categorie.titre}</Text>
          <Text style={styles.body}>{categorie.contenu}</Text>
          <Text style={styles.libelle}>Ce que la suppression change</Text>
          <Text style={styles.impact}>{categorie.impactSuppression}</Text>
          <Text style={styles.export}>
            {categorie.exportable
              ? 'Exportable avant suppression.'
              : 'Non exportable : il n’y a rien de lisible à emporter.'}
          </Text>
        </Pressable>
      ))}

      {selection.length > 0 && !supprime && (
        <View style={styles.confirmation} testID="confirmation">
          <Text style={styles.titre}>Avant de supprimer</Text>
          <Text style={styles.body}>
            {selection.length === 1
              ? 'Une catégorie sera supprimée :'
              : `${String(selection.length)} catégories seront supprimées :`}
          </Text>
          {selection.map((categorie) => (
            <Text key={categorie.id} style={styles.impact}>
              • {categorie.impactSuppression}
            </Text>
          ))}

          <Pressable
            style={styles.secondaire}
            onPress={() => undefined}
            accessibilityRole="button"
            accessibilityLabel="Exporter d’abord"
            accessibilityHint="Emporter une copie lisible avant de supprimer"
            testID="cta-exporter"
          >
            <Text style={styles.secondaireLabel}>Exporter d’abord</Text>
          </Pressable>

          <Pressable
            style={[styles.cta, confirme && styles.ctaDanger]}
            onPress={() => {
              if (confirme) {
                setSupprime(true);
              } else {
                // Deux gestes, délibérément. La suppression est sans retour, et
                // un geste unique se déclenche par inadvertance.
                setConfirme(true);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={
              confirme ? 'Supprimer définitivement, sans retour possible' : 'Supprimer'
            }
            testID="cta-supprimer"
          >
            <Text style={styles.ctaLabel}>
              {confirme ? 'Confirmer : c’est sans retour' : 'Supprimer'}
            </Text>
          </Pressable>
        </View>
      )}

      {supprime && (
        <View style={styles.verification} accessibilityRole="summary" testID="verification">
          <Text style={styles.titre}>Ce qui a été vérifié</Text>
          <Text style={styles.body}>
            La suppression n’est pas annoncée, elle est constatée. Voici où nous avons vérifié qu’il
            ne reste rien.
          </Text>
          {VERIFICATION_SUPPRESSION.verifies.map((emplacement) => (
            <Text key={emplacement} style={styles.verifie}>
              ✓ {emplacement}
            </Text>
          ))}

          <Text style={styles.titre}>Ce que nous ne pouvons pas encore vérifier</Text>
          {VERIFICATION_SUPPRESSION.nonVerifiables.map((element) => (
            <View key={element.emplacement} style={styles.nonVerifie}>
              <Text style={styles.nonVerifieTitre}>{element.emplacement}</Text>
              <Text style={styles.body}>{element.pourquoi}</Text>
            </View>
          ))}
        </View>
      )}
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
  carte: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  carteChoisie: { borderColor: color.semantic.critical, borderWidth: 2 },
  titre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
    marginTop: spacing.sm,
  },
  libelle: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  impact: { color: color.text.primary, fontFamily: fontFamily.body, fontSize: fontSize.body },
  export: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
  },
  confirmation: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.critical,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  secondaire: {
    alignItems: 'center',
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  secondaireLabel: {
    color: color.text.primary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: color.semantic.neutral,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ctaDanger: { backgroundColor: color.semantic.critical },
  ctaLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  verification: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  verifie: { color: color.semantic.success, fontFamily: fontFamily.body, fontSize: fontSize.body },
  nonVerifie: { gap: spacing.xs, marginTop: spacing.sm },
  nonVerifieTitre: {
    color: color.semantic.warning,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
});

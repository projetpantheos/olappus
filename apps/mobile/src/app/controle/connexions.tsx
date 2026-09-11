import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '../../components/status-badge';
import { CONNEXIONS, DECONNEXION_CHOIX, type ChoixDeconnexion } from '../../demo/controle';
import { color, fontFamily, fontSize, radius, spacing } from '../../theme/tokens';

/**
 * Déconnexion — `PRD-14` Journey I.
 *
 * Le parcours impose une chose que la plupart des produits escamotent :
 * **expliquer que se déconnecter n'est pas supprimer.** Beaucoup de gens
 * croient que retirer un accès efface ce qui en a été tiré. Laisser cette
 * croyance en place, c'est laisser quelqu'un penser qu'il a effacé ses données
 * alors qu'elles sont toujours là.
 *
 * Les deux issues sont donc présentées côte à côte, **aucune préselectionnée**.
 * Une option cochée d'avance oriente une décision qui n'appartient qu'à
 * l'utilisateur.
 */
export default function ConnexionsScreen() {
  const [choix, setChoix] = useState<ChoixDeconnexion | null>(null);
  const [fait, setFait] = useState<ChoixDeconnexion | null>(null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="connexions">
      {CONNEXIONS.map((connexion) => (
        <View key={connexion.id} style={styles.carte} accessibilityRole="summary">
          <Text style={styles.titre}>{connexion.fournisseur}</Text>
          <StatusBadge
            state="AVAILABLE"
            reason={`Connecté depuis le ${connexion.connecteLe}.`}
            testID="etat-connexion"
          />

          <Text style={styles.libelle}>Ce que cet accès permet aujourd’hui</Text>
          {connexion.scopes.map((scope) => (
            <View key={scope.intitule} style={styles.scope}>
              <Text style={styles.scopeTitre}>{scope.intitule}</Text>
              <Text style={styles.body}>{scope.permet}</Text>
            </View>
          ))}
        </View>
      ))}

      <View
        style={styles.avertissement}
        accessibilityRole="summary"
        testID="disconnect-nest-pas-delete"
      >
        <Text style={styles.avertissementTitre}>Se déconnecter n’est pas supprimer</Text>
        <Text style={styles.body}>
          Retirer l’accès empêche Olappus d’aller chercher quoi que ce soit de nouveau. Ce qu’il a
          déjà compris ne disparaît pas pour autant — sauf si vous le demandez ci-dessous.
        </Text>
      </View>

      <Text style={styles.sectionTitre} accessibilityRole="header">
        Que faire de ce qui a déjà été compris ?
      </Text>

      {DECONNEXION_CHOIX.map((option) => (
        <Pressable
          key={option.id}
          style={[styles.option, choix === option.id && styles.optionChoisie]}
          onPress={() => {
            setChoix(option.id);
          }}
          accessibilityRole="radio"
          accessibilityState={{ checked: choix === option.id }}
          accessibilityLabel={`${option.titre}. ${option.consequence} ${option.perte}`}
          testID={`choix-${option.id}`}
        >
          <Text style={styles.optionTitre}>{option.titre}</Text>
          <Text style={styles.body}>{option.consequence}</Text>
          <Text style={styles.perte}>{option.perte}</Text>
        </Pressable>
      ))}

      <Pressable
        style={[styles.cta, choix === null && styles.ctaInactif]}
        disabled={choix === null}
        onPress={() => {
          setFait(choix);
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled: choix === null }}
        accessibilityLabel={
          choix === null ? 'Choisissez d’abord ce que deviennent vos données' : 'Déconnecter'
        }
        testID="cta-deconnecter"
      >
        <Text style={styles.ctaLabel}>
          {choix === null ? 'Choisissez d’abord une option' : 'Déconnecter'}
        </Text>
      </Pressable>

      {fait !== null && (
        <View style={styles.resultat} accessibilityRole="summary" testID="resultat">
          <Text style={styles.optionTitre}>Déconnecté</Text>
          <Text style={styles.body}>
            {fait === 'supprimer'
              ? 'L’accès est retiré et les situations qui en venaient sont supprimées.'
              : 'L’accès est retiré. Ce qui avait été compris reste lisible.'}
          </Text>
          <Text style={styles.body}>
            Les jetons d’accès ont été effacés. Ce n’est pas une promesse : la base refuse
            d’enregistrer une connexion fermée qui en détiendrait encore.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: color.surface.ivory, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg },
  carte: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  titre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  libelle: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  scope: { gap: spacing.xs },
  scopeTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  avertissement: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.attention,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  avertissementTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  sectionTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  option: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  optionChoisie: { borderColor: color.semantic.attention, borderWidth: 2 },
  optionTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  perte: {
    color: color.semantic.critical,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.caption,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: color.semantic.attention,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ctaInactif: { backgroundColor: color.semantic.neutral },
  ctaLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  resultat: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.success,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
});

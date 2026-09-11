import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Label, Page, Strong, Title } from '../../components/layout';
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
 * Les deux issues sont donc présentées côte à côte, **aucune présélectionnée**.
 * Une option cochée d'avance oriente une décision qui n'appartient qu'à
 * l'utilisateur.
 */
export default function ConnexionsScreen() {
  const [choix, setChoix] = useState<ChoixDeconnexion | null>(null);
  const [fait, setFait] = useState<ChoixDeconnexion | null>(null);

  return (
    <Page testID="connexions">
      {CONNEXIONS.map((connexion) => (
        <Card key={connexion.id}>
          <Title>{connexion.fournisseur}</Title>
          <StatusBadge
            state="AVAILABLE"
            reason={`Connecté depuis le ${connexion.connecteLe}.`}
            testID="etat-connexion"
          />
          <Label>Ce que cet accès permet aujourd’hui</Label>
          {connexion.scopes.map((scope) => (
            <View key={scope.intitule}>
              <Strong>{scope.intitule}</Strong>
              <Body>{scope.permet}</Body>
            </View>
          ))}
        </Card>
      ))}

      <Card tone="attention" emphasis testID="disconnect-nest-pas-delete">
        <Title>Se déconnecter n’est pas supprimer</Title>
        <Body>
          Retirer l’accès empêche Olappus d’aller chercher quoi que ce soit de nouveau. Ce qu’il a
          déjà compris ne disparaît pas pour autant — sauf si vous le demandez ci-dessous.
        </Body>
      </Card>

      <Title level="section">Que faire de ce qui a déjà été compris ?</Title>

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
          <Strong>{option.titre}</Strong>
          <Body>{option.consequence}</Body>
          <Text style={styles.perte}>{option.perte}</Text>
        </Pressable>
      ))}

      <Button
        label={choix === null ? 'Choisissez d’abord une option' : 'Déconnecter'}
        onPress={() => {
          setFait(choix);
        }}
        disabled={choix === null}
        accessibilityLabel={
          choix === null ? 'Choisissez d’abord ce que deviennent vos données' : 'Déconnecter'
        }
        testID="cta-deconnecter"
      />

      {fait !== null && (
        <Card tone="success" testID="resultat">
          <Title>Déconnecté</Title>
          <Body>
            {fait === 'supprimer'
              ? 'L’accès est retiré et les situations qui en venaient sont supprimées.'
              : 'L’accès est retiré. Ce qui avait été compris reste lisible.'}
          </Body>
          <Body>
            Les jetons d’accès ont été effacés. Ce n’est pas une promesse : la base refuse
            d’enregistrer une connexion fermée qui en détiendrait encore.
          </Body>
        </Card>
      )}
    </Page>
  );
}

/**
 * Seuls les styles propres à cet écran subsistent : le choix exclusif entre
 * deux issues n'existe nulle part ailleurs. Tout le reste vient des primitives.
 */
const styles = StyleSheet.create({
  option: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  optionChoisie: { borderColor: color.semantic.attention, borderWidth: 2 },
  perte: {
    color: color.semantic.critical,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.caption,
  },
});

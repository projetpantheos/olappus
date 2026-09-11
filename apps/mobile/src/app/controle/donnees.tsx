import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Body,
  Bullet,
  Button,
  Caption,
  Card,
  Label,
  Page,
  Strong,
  Title,
} from '../../components/layout';
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
    <Page testID="donnees">
      <Card>
        <Title>Vos données, catégorie par catégorie</Title>
        <Body>
          Choisissez ce que vous voulez supprimer. Chaque catégorie dit ce qu’elle contient et ce
          que sa disparition change.
        </Body>
      </Card>

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
          <Strong>{categorie.titre}</Strong>
          <Body>{categorie.contenu}</Body>
          <Label>Ce que la suppression change</Label>
          <Text style={styles.impact}>{categorie.impactSuppression}</Text>
          <Caption>
            {categorie.exportable
              ? 'Exportable avant suppression.'
              : 'Non exportable : il n’y a rien de lisible à emporter.'}
          </Caption>
        </Pressable>
      ))}

      {selection.length > 0 && !supprime && (
        <Card tone="critical" emphasis testID="confirmation">
          <Title>Avant de supprimer</Title>
          <Body>
            {selection.length === 1
              ? 'Une catégorie sera supprimée :'
              : `${String(selection.length)} catégories seront supprimées :`}
          </Body>
          {selection.map((categorie) => (
            <Bullet key={categorie.id}>{categorie.impactSuppression}</Bullet>
          ))}

          <Button
            label="Exporter d’abord"
            variant="secondary"
            onPress={() => undefined}
            accessibilityHint="Emporter une copie lisible avant de supprimer"
            testID="cta-exporter"
          />

          <Button
            label={confirme ? 'Confirmer : c’est sans retour' : 'Supprimer'}
            variant={confirme ? 'danger' : 'secondary'}
            onPress={() => {
              if (confirme) {
                setSupprime(true);
              } else {
                // Deux gestes, délibérément. La suppression est sans retour, et
                // un geste unique se déclenche par inadvertance.
                setConfirme(true);
              }
            }}
            accessibilityLabel={
              confirme ? 'Supprimer définitivement, sans retour possible' : 'Supprimer'
            }
            testID="cta-supprimer"
          />
        </Card>
      )}

      {supprime && (
        <Card testID="verification">
          <Title>Ce qui a été vérifié</Title>
          <Body>
            La suppression n’est pas annoncée, elle est constatée. Voici où nous avons vérifié qu’il
            ne reste rien.
          </Body>
          {VERIFICATION_SUPPRESSION.verifies.map((emplacement) => (
            <Text key={emplacement} style={styles.verifie}>
              ✓ {emplacement}
            </Text>
          ))}

          <Title>Ce que nous ne pouvons pas encore vérifier</Title>
          {VERIFICATION_SUPPRESSION.nonVerifiables.map((element) => (
            <View key={element.emplacement}>
              <Text style={styles.nonVerifie}>{element.emplacement}</Text>
              <Body>{element.pourquoi}</Body>
            </View>
          ))}
        </Card>
      )}
    </Page>
  );
}

/**
 * Ne subsistent ici que la carte sélectionnable — un composant à part entière
 * le jour où un second écran en aura besoin — et les deux marques de
 * vérification, propres à ce parcours.
 */
const styles = StyleSheet.create({
  carte: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  carteChoisie: { borderColor: color.semantic.critical, borderWidth: 2 },
  impact: { color: color.text.primary, fontFamily: fontFamily.body, fontSize: fontSize.body },
  verifie: { color: color.semantic.success, fontFamily: fontFamily.body, fontSize: fontSize.body },
  nonVerifie: {
    color: color.semantic.warning,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
});

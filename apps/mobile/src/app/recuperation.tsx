import {
  RECOVERY_GROUPS,
  canCollectSensitiveData,
  generateRecoverySecret,
  platformRandom,
} from '@olappus/core';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Body, Button, Caption, Card, Page, Strong, Title } from '../components/layout';
import { color, fontFamily, fontSize, spacing } from '../theme/tokens';

/**
 * Création du secret de récupération — `SEC-31`, ADR-0008.
 *
 * `SEC-31` en fait « un moment produit à part entière, avec confirmation de
 * mise en sécurité ». Ce n'est donc pas un réglage caché : c'est un écran qui
 * précède toute connexion, et qui demande une action délibérée.
 *
 * Trois choses y sont dites avant que le secret n'apparaisse, parce qu'après
 * il est trop tard pour les entendre : ce que le secret protège, ce qui arrive
 * si on le perd, et pourquoi nous ne pouvons pas aider.
 */
export default function RecuperationScreen() {
  const [secret, setSecret] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const pret = canCollectSensitiveData({
    generated_at: generatedAt,
    acknowledged_at: acknowledgedAt,
  });

  function creer(): void {
    try {
      setSecret(generateRecoverySecret(platformRandom()));
      setGeneratedAt(new Date().toISOString());
    } catch {
      // Aucun repli sur un aléa non cryptographique : un secret faible
      // donnerait l'apparence d'une protection (ADR-0017).
      setUnavailable(
        'Cet appareil ne fournit pas le générateur nécessaire. Olappus préfère ne rien créer plutôt que de créer un secret faible.',
      );
    }
  }

  return (
    <Page testID="recuperation-screen">
      <Card>
        <Title>Votre secret de récupération</Title>
        <Body>
          Vos données sensibles sont chiffrées avec une clé dérivée de ce secret. Il n’en existe
          aucune copie chez nous, même chiffrée.
        </Body>
        <Body>
          Si vous le perdez, ces données sont définitivement perdues. Nous ne pouvons pas les
          restaurer — c’est précisément ce qui empêche quiconque d’y accéder sans vous.
        </Body>
      </Card>

      {unavailable !== null && (
        <Card tone="critical" accessibilityRole="alert">
          <Body>{unavailable}</Body>
        </Card>
      )}

      {secret === null ? (
        <Button
          label="Créer mon secret de récupération"
          onPress={creer}
          accessibilityHint="Affiche un secret à noter et à conserver hors de l’appareil"
          testID="cta-creer"
        />
      ) : (
        <>
          <Card tone="attention" emphasis testID="secret">
            <Caption>Notez ces {RECOVERY_GROUPS} groupes, dans l’ordre</Caption>
            {secret.split('-').map((groupe, index) => (
              <Text key={groupe} style={styles.groupe}>
                {`${String(index + 1)}. ${groupe}`}
              </Text>
            ))}
          </Card>

          <Caption>
            Sur papier, ou dans un gestionnaire de mots de passe. Pas dans une capture d’écran, pas
            dans un message : ces endroits ne sont pas faits pour ça.
          </Caption>

          <Button
            label={acknowledgedAt !== null ? 'Confirmé' : 'J’ai mis mon secret en sécurité'}
            variant={acknowledgedAt !== null ? 'secondary' : 'primary'}
            onPress={() => {
              setAcknowledgedAt(new Date().toISOString());
            }}
            accessibilityLabel="J’ai mis mon secret en sécurité"
            testID="cta-confirmer"
          />
        </>
      )}

      <Card tone={pret ? 'success' : 'neutral'} testID="statut-collecte">
        <Strong>
          {pret ? 'Vous pouvez connecter un service' : 'Aucun service ne peut être connecté'}
        </Strong>
        <Body>
          {pret
            ? 'Vos données sensibles seront chiffrées dès leur arrivée.'
            : 'Olappus ne collecte aucune donnée sensible tant que votre secret n’est pas créé et mis en sécurité. L’ordre compte : être prévenu après la perte ne sert à rien.'}
        </Body>
      </Card>
    </Page>
  );
}

/** Les groupes du secret : espacés pour être recopiés à la main sans erreur. */
const styles = StyleSheet.create({
  groupe: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
});

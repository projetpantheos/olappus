import { checkRecoverySecret, recoveryOutcome } from '@olappus/core';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Body, Button, Card, Page, Strong, Title } from '../../components/layout';
import { color, fontFamily, fontSize, radius, spacing } from '../../theme/tokens';

/**
 * Récupération d'un compte — `SEC-31`, ADR-0008.
 *
 * `SEC-31` impose que ce parcours distingue explicitement **retrouver son
 * compte** et **retrouver ses données**. Le premier est possible, le second
 * non.
 *
 * L'écran le dit d'emblée, avant toute saisie : quelqu'un qui a perdu son
 * secret doit l'apprendre ici, pas après avoir espéré pendant trois écrans.
 */

/** Ce qui ne va pas dans la saisie, en langage compréhensible. */
const RAISONS: Readonly<Record<string, string>> = {
  length: 'Il manque des caractères, ou il y en a trop. Le secret en compte 40, en 8 groupes.',
  alphabet: 'Un caractère n’appartient pas au secret. Vérifiez votre recopie.',
  checksum:
    'Un caractère semble faux ou deux ont été intervertis. Ce n’est pas votre secret qui est perdu : c’est la saisie qui ne correspond pas.',
};

export default function PerteScreen() {
  const [saisie, setSaisie] = useState('');
  const [resultat, setResultat] = useState<ReturnType<typeof recoveryOutcome> | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  function verifier(): void {
    const controle = checkRecoverySecret(saisie);
    if (!controle.ok) {
      // Distinguer « saisie fautive » de « secret perdu » est tout l'intérêt du
      // caractère de contrôle : sans lui, les deux donneraient le même message
      // et la personne conclurait à tort que ses données sont détruites.
      setErreur(RAISONS[controle.reason] ?? 'Saisie non reconnue.');
      setResultat(null);
      return;
    }
    setErreur(null);
    setResultat(recoveryOutcome(true));
  }

  return (
    <Page testID="perte-screen">
      <Card>
        <Title>Retrouver son compte, retrouver ses données</Title>
        <Body>
          Ce sont deux choses différentes. Vous pouvez toujours retrouver votre compte. Vos données
          chiffrées, elles, n’existent que par votre secret de récupération.
        </Body>
      </Card>

      <Title level="section">Si vous avez votre secret</Title>

      <TextInput
        style={styles.champ}
        value={saisie}
        onChangeText={setSaisie}
        placeholder="ABCDE-FGHJK-…"
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel="Votre secret de récupération"
        accessibilityHint="Les tirets, les espaces et la casse sont sans importance"
        testID="champ-secret"
      />

      {erreur !== null && (
        <Card tone="warning" accessibilityRole="alert" testID="erreur-saisie">
          <Body>{erreur}</Body>
        </Card>
      )}

      <Button label="Vérifier mon secret" onPress={verifier} testID="cta-verifier" />

      <Title level="section">Si vous l’avez perdu</Title>

      <Button
        label="Continuer sans mon secret"
        variant="secondary"
        onPress={() => {
          setErreur(null);
          setResultat(recoveryOutcome(false));
        }}
        accessibilityHint="Vous retrouverez votre compte, mais pas vos données chiffrées"
        testID="cta-sans-secret"
      />

      {resultat !== null && (
        <Card testID="resultat">
          <Strong>Compte : {resultat.account_recovered ? 'récupéré' : 'non récupéré'}</Strong>
          <Strong tone={resultat.data_recovered ? 'neutral' : 'critical'}>
            Données chiffrées : {resultat.data_recovered ? 'récupérées' : 'définitivement perdues'}
          </Strong>
          <Body>{resultat.message}</Body>
        </Card>
      )}
    </Page>
  );
}

/** La saisie du secret : espacée, sans correction automatique, sans casse. */
const styles = StyleSheet.create({
  champ: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
    letterSpacing: 2,
    padding: spacing.lg,
  },
});

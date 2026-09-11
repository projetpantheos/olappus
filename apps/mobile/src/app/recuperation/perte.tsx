import { checkRecoverySecret, recoveryOutcome } from '@olappus/core';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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

  function sansSecret(): void {
    setErreur(null);
    setResultat(recoveryOutcome(false));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="perte-screen">
      <View style={styles.notice} accessibilityRole="summary">
        <Text style={styles.noticeTitle}>Retrouver son compte, retrouver ses données</Text>
        <Text style={styles.body}>
          Ce sont deux choses différentes. Vous pouvez toujours retrouver votre compte. Vos données
          chiffrées, elles, n’existent que par votre secret de récupération.
        </Text>
      </View>

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Si vous avez votre secret
      </Text>

      <TextInput
        style={styles.input}
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
        <View style={styles.erreur} accessibilityRole="alert" testID="erreur-saisie">
          <Text style={styles.body}>{erreur}</Text>
        </View>
      )}

      <Pressable
        style={styles.cta}
        onPress={verifier}
        accessibilityRole="button"
        accessibilityLabel="Vérifier mon secret"
        testID="cta-verifier"
      >
        <Text style={styles.ctaLabel}>Vérifier mon secret</Text>
      </Pressable>

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Si vous l’avez perdu
      </Text>

      <Pressable
        style={styles.secondary}
        onPress={sansSecret}
        accessibilityRole="button"
        accessibilityLabel="Continuer sans mon secret"
        accessibilityHint="Vous retrouverez votre compte, mais pas vos données chiffrées"
        testID="cta-sans-secret"
      >
        <Text style={styles.secondaryLabel}>Continuer sans mon secret</Text>
      </Pressable>

      {resultat !== null && (
        <View style={styles.resultat} accessibilityRole="summary" testID="resultat">
          <Text style={styles.statusLine}>
            Compte : {resultat.account_recovered ? 'récupéré' : 'non récupéré'}
          </Text>
          <Text style={styles.statusLine}>
            Données chiffrées : {resultat.data_recovered ? 'récupérées' : 'définitivement perdues'}
          </Text>
          <Text style={styles.body}>{resultat.message}</Text>
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
  noticeTitle: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  sectionTitle: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  input: {
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
  erreur: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.warning,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: color.semantic.attention,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ctaLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  secondary: {
    alignItems: 'center',
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  secondaryLabel: {
    color: color.text.primary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
  },
  resultat: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  statusLine: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
});
